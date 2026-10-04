import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import Series from '../../../../models/Series';
import Book from '../../../../models/Book';
import Chapter from '../../../../models/Chapter';

export const dynamic = 'force-dynamic';

const BOOKS_DIR = () => path.join(process.cwd(), 'books');
const META_FILE = () => path.join(BOOKS_DIR(), '_series.json');

// ── Read / write series metadata on disk (redundant backup) ───────────────────
function readDiskMeta() {
  try {
    if (!fs.existsSync(META_FILE())) return {};
    return JSON.parse(fs.readFileSync(META_FILE(), 'utf-8'));
  } catch {
    return {};
  }
}

function writeDiskMeta(data) {
  try {
    const dir = BOOKS_DIR();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(META_FILE(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write _series.json:', err);
  }
}

function extractChapterNumber(filename) {
  const norm = filename.replace(/[০-৯]/g, (m) => '০১২৩৪৫৬৭৮৯'.indexOf(m));
  const match = norm.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getDiskChapters(bookTitle) {
  try {
    const bookPath = path.join(BOOKS_DIR(), bookTitle);
    if (!fs.existsSync(bookPath)) return [];
    const files = fs.readdirSync(bookPath).filter((f) => f.endsWith('.txt'));
    files.sort((a, b) => {
      const na = extractChapterNumber(a),
        nb = extractChapterNumber(b);
      return na !== nb ? na - nb : a.localeCompare(b, 'bn', { numeric: true });
    });
    return files.map((file, idx) => ({
      chapterNumber: extractChapterNumber(file) || idx + 1,
      chapterTitle: path.parse(file).name,
      fileName: file,
    }));
  } catch {
    return [];
  }
}

// ── GET — full library: series + unassigned books from DB & disk ──────────────
export async function GET() {
  let isDbConnected = false;
  try {
    await connectToDatabase();
    isDbConnected = true;
  } catch (err) {
    console.warn('MongoDB connection failed in GET /api/admin/books:', err.message);
  }

  try {
    const dir = BOOKS_DIR();
    const diskMeta = readDiskMeta(); // { "SeriesName": { description, books: [...] } }

    // If DB is connected and diskMeta has entries (local dev only), sync disk meta to DB
    if (isDbConnected && Object.keys(diskMeta).length > 0) {
      try {
        for (const [seriesName, info] of Object.entries(diskMeta)) {
          await Series.findOneAndUpdate(
            { name: seriesName.trim() },
            { $setOnInsert: { name: seriesName.trim(), description: info.description || '' } },
            { upsert: true }
          );

          for (const bTitle of info.books || []) {
            const slug = encodeURIComponent(bTitle.trim());
            const existingBook = await Book.findOne({
              $or: [{ slug }, { title: bTitle.trim() }],
            });

            const diskChaps = getDiskChapters(bTitle.trim());

            if (!existingBook) {
              const newBook = await Book.create({
                title: bTitle.trim(),
                slug,
                series: seriesName.trim(),
                chaptersCount: diskChaps.length,
              });

              for (const ch of diskChaps) {
                const filePath = path.join(dir, bTitle.trim(), ch.fileName);
                if (fs.existsSync(filePath)) {
                  const content = fs.readFileSync(filePath, 'utf-8');
                  await Chapter.findOneAndUpdate(
                    { bookSlug: slug, chapterNumber: ch.chapterNumber },
                    {
                      bookId: newBook._id,
                      bookSlug: slug,
                      chapterNumber: ch.chapterNumber,
                      chapterTitle: ch.chapterTitle,
                      content,
                    },
                    { upsert: true }
                  );
                }
              }
            } else {
              if (existingBook.series !== seriesName.trim()) {
                existingBook.series = seriesName.trim();
                await existingBook.save();
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('Auto-sync disk to DB warning:', syncErr.message);
      }
    }

    // Now query DB collections efficiently in parallel
    let dbSeries = [];
    let dbBooks = [];
    let allChapters = [];
    if (isDbConnected) {
      try {
        [dbSeries, dbBooks, allChapters] = await Promise.all([
          Series.find({}).sort({ order: 1, createdAt: 1 }).lean(),
          Book.find({}).sort({ createdAt: 1 }).lean(),
          Chapter.find({})
            .select('bookId bookSlug chapterNumber chapterTitle')
            .sort({ chapterNumber: 1 })
            .lean(),
        ]);
      } catch (e) {
        console.warn('Failed querying DB collections:', e.message);
      }
    }

    // Group chapters by bookId and bookSlug
    const chaptersByBookId = new Map();
    const chaptersBySlug = new Map();

    for (const ch of allChapters) {
      const chapObj = {
        chapterNumber: ch.chapterNumber,
        chapterTitle: ch.chapterTitle,
        fileName: `${ch.chapterNumber}. ${ch.chapterTitle}.txt`,
      };
      if (ch.bookId) {
        const idStr = ch.bookId.toString();
        if (!chaptersByBookId.has(idStr)) chaptersByBookId.set(idStr, []);
        chaptersByBookId.get(idStr).push(chapObj);
      }
      if (ch.bookSlug) {
        if (!chaptersBySlug.has(ch.bookSlug)) chaptersBySlug.set(ch.bookSlug, []);
        chaptersBySlug.get(ch.bookSlug).push(chapObj);
      }
    }

    // Gather all series names (from DB + disk)
    const allSeriesMap = new Map();

    // From DB Series collection
    dbSeries.forEach((s) => {
      allSeriesMap.set(s.name, {
        name: s.name,
        author: s.author || diskMeta[s.name]?.author || '',
        description: s.description || diskMeta[s.name]?.description || '',
        image: s.image || diskMeta[s.name]?.image || '',
        books: [],
      });
    });

    // Also look at series field in DB Books
    dbBooks.forEach((b) => {
      if (b.series && b.series.trim() && b.series !== 'সাধারণ সংকলন') {
        if (!allSeriesMap.has(b.series)) {
          allSeriesMap.set(b.series, {
            name: b.series,
            author: b.author || '',
            description: '',
            image: '',
            books: [],
          });
        } else if (!allSeriesMap.get(b.series).author && b.author) {
          allSeriesMap.get(b.series).author = b.author;
        }
      }
    });

    // From disk meta
    Object.entries(diskMeta).forEach(([name, info]) => {
      if (!allSeriesMap.has(name)) {
        allSeriesMap.set(name, {
          name,
          author: info.author || '',
          description: info.description || '',
          image: info.image || '',
          books: [],
        });
      } else if (!allSeriesMap.get(name).image && info.image) {
        allSeriesMap.get(name).image = info.image;
      }
    });

    // Gather all books
    const booksMap = new Map();

    // 1. From DB
    for (const b of dbBooks) {
      const idStr = b._id?.toString();
      const dbChaps =
        (idStr && chaptersByBookId.get(idStr)) ||
        chaptersBySlug.get(b.slug) ||
        chaptersBySlug.get(encodeURIComponent(b.title)) ||
        [];

      let diskChaps = [];
      try {
        diskChaps = getDiskChapters(b.title);
      } catch {}

      const chaptersList = dbChaps.length > 0 ? dbChaps : diskChaps;

      booksMap.set(b.title, {
        id: idStr,
        title: b.title,
        slug: b.slug || encodeURIComponent(b.title),
        series: b.series || '',
        author: b.author || 'অজানা',
        description: b.description || '',
        image: b.image || '',
        chaptersCount: Math.max(b.chaptersCount || 0, chaptersList.length),
        chapters: chaptersList,
        exists: true,
        inDb: true,
      });
    }

    // 2. From disk folders (if any are not yet in DB and folder exists)
    if (fs.existsSync(dir)) {
      try {
        const diskFolders = fs.readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);

        for (const folder of diskFolders) {
          if (!booksMap.has(folder)) {
            const diskChaps = getDiskChapters(folder);
            let foundSeries = '';
            for (const [sName, sInfo] of Object.entries(diskMeta)) {
              if ((sInfo.books || []).includes(folder)) {
                foundSeries = sName;
                break;
              }
            }

            booksMap.set(folder, {
              title: folder,
              slug: encodeURIComponent(folder),
              series: foundSeries,
              author: 'অজানা',
              description: '',
              chaptersCount: diskChaps.length,
              chapters: diskChaps,
              exists: true,
              inDb: false,
            });
          }
        }
      } catch (e) {
        console.warn('Could not read disk folders:', e.message);
      }
    }

    // Assign books to series
    const assignedBookTitles = new Set();

    allSeriesMap.forEach((seriesObj) => {
      const matchingBooks = [];
      booksMap.forEach((b) => {
        const inDiskMetaList = (diskMeta[seriesObj.name]?.books || []).includes(b.title);
        const matchesSeriesName = b.series === seriesObj.name;
        if (matchesSeriesName || inDiskMetaList) {
          matchingBooks.push(b);
          assignedBookTitles.add(b.title);
        }
      });
      seriesObj.books = matchingBooks;
    });

    const seriesResult = Array.from(allSeriesMap.values());

    // Unassigned books
    const unassignedResult = [];
    booksMap.forEach((b) => {
      if (!assignedBookTitles.has(b.title)) {
        unassignedResult.push(b);
      }
    });

    return NextResponse.json({
      success: true,
      dbConnected: isDbConnected,
      source: isDbConnected ? 'database' : 'filesystem',
      data: {
        series: seriesResult,
        unassigned: unassignedResult,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/admin/books:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST — create series OR add book to series (saves to DB and disk) ───────────
export async function POST(req) {
  try {
    const body = await req.json();
    let isDbConnected = false;
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch (e) {
      console.warn('MongoDB connection unavailable in POST /api/admin/books:', e.message);
    }

    const diskMeta = readDiskMeta();

    // ── 1. Create a new series ──
    if (body.action === 'create-series') {
      const { name, author, description, image } = body;
      const sName = name?.trim();
      if (!sName) {
        return NextResponse.json({ success: false, message: 'সিরিজের নাম আবশ্যক' }, { status: 400 });
      }

      // Save to MongoDB
      if (isDbConnected) {
        await Series.findOneAndUpdate(
          { name: sName },
          {
            name: sName,
            author: author?.trim() || '',
            description: description?.trim() || '',
            image: image?.trim() || '',
          },
          { upsert: true, new: true }
        );
      }

      // Save to disk backup
      if (!diskMeta[sName]) {
        diskMeta[sName] = {
          author: author?.trim() || '',
          description: description?.trim() || '',
          image: image?.trim() || '',
          books: [],
        };
      } else {
        if (author) diskMeta[sName].author = author.trim();
        if (image !== undefined) diskMeta[sName].image = image.trim();
        diskMeta[sName].description = description?.trim() || diskMeta[sName].description;
      }
      writeDiskMeta(diskMeta);

      return NextResponse.json({
        success: true,
        message: 'সিরিজ সফলভাবে ডাটাবেজে তৈরি হয়েছে!',
        dbSaved: isDbConnected,
      });
    }

    // ── 2. Create a new book under a series ──
    if (body.action === 'create-book') {
      const { seriesName, bookTitle, author, description, image } = body;
      const sName = seriesName?.trim();
      const bTitle = bookTitle?.trim();

      if (!sName || !bTitle) {
        return NextResponse.json({ success: false, message: 'সিরিজ এবং বইয়ের নাম আবশ্যক' }, { status: 400 });
      }

      const slug = encodeURIComponent(bTitle);

      // Save to MongoDB
      let bookDoc = null;
      if (isDbConnected) {
        // Ensure series exists in DB
        await Series.findOneAndUpdate(
          { name: sName },
          { $setOnInsert: { name: sName, description: '' } },
          { upsert: true }
        );

        bookDoc = await Book.findOne({
          $or: [{ slug }, { title: bTitle }],
        });

        if (!bookDoc) {
          bookDoc = await Book.create({
            title: bTitle,
            slug,
            series: sName,
            author: author?.trim() || (sName.includes('হ্যারি পটার') ? 'জে. কে. রাউলিং' : 'অজানা'),
            description: description?.trim() || '',
            image: image?.trim() || '',
            chaptersCount: 0,
          });
        } else {
          bookDoc.series = sName;
          if (author) bookDoc.author = author.trim();
          if (description) bookDoc.description = description.trim();
          if (image !== undefined) bookDoc.image = image.trim();
          await bookDoc.save();
        }
      }

      // Disk folder (optional local backup, ignore on read-only environments like Vercel)
      try {
        const bookPath = path.join(BOOKS_DIR(), bTitle);
        if (!fs.existsSync(bookPath)) fs.mkdirSync(bookPath, { recursive: true });
      } catch (fsErr) {
        console.warn('Local disk folder creation skipped:', fsErr.message);
      }

      // Update diskMeta
      if (!diskMeta[sName]) {
        diskMeta[sName] = { description: '', books: [] };
      }
      if (!diskMeta[sName].books.includes(bTitle)) {
        diskMeta[sName].books.push(bTitle);
      }
      writeDiskMeta(diskMeta);

      return NextResponse.json({
        success: true,
        message: 'বই ডাটাবেজ ও ফোল্ডারে সফলভাবে যুক্ত হয়েছে!',
        slug,
        dbSaved: isDbConnected,
      });
    }

    // ── 3. Assign an existing book to a series ──
    if (body.action === 'assign-book') {
      const { seriesName, bookTitle } = body;
      const sName = seriesName?.trim();
      const bTitle = bookTitle?.trim();

      if (!sName || !bTitle) {
        return NextResponse.json({ success: false, message: 'সিরিজ ও বইয়ের নাম প্রয়োজন' }, { status: 400 });
      }

      if (isDbConnected) {
        await Series.findOneAndUpdate(
          { name: sName },
          { $setOnInsert: { name: sName } },
          { upsert: true }
        );
        await Book.findOneAndUpdate(
          { $or: [{ title: bTitle }, { slug: encodeURIComponent(bTitle) }] },
          { series: sName }
        );
      }

      if (!diskMeta[sName]) diskMeta[sName] = { description: '', books: [] };
      if (!diskMeta[sName].books.includes(bTitle)) {
        diskMeta[sName].books.push(bTitle);
        writeDiskMeta(diskMeta);
      }

      return NextResponse.json({
        success: true,
        message: 'বই সিরিজে যুক্ত হয়েছে',
        dbSaved: isDbConnected,
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Error in POST /api/admin/books:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── DELETE — delete series OR book from DB and disk ────────────────────────────
export async function DELETE(req) {
  try {
    const body = await req.json();
    let isDbConnected = false;
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch {}

    const diskMeta = readDiskMeta();

    // ── 1. Delete entire series ──
    if (body.action === 'delete-series') {
      const { name, deleteBooks } = body;
      const sName = name?.trim();
      if (!sName) return NextResponse.json({ success: false, message: 'Series name required' }, { status: 400 });

      if (isDbConnected) {
        await Series.deleteOne({ name: sName });
        if (deleteBooks) {
          const booksToDelete = await Book.find({ series: sName });
          for (const b of booksToDelete) {
            await Chapter.deleteMany({ $or: [{ bookId: b._id }, { bookSlug: b.slug }] });
          }
          await Book.deleteMany({ series: sName });
        } else {
          await Book.updateMany({ series: sName }, { series: 'সাধারণ সংকলন' });
        }
      }

      if (deleteBooks && diskMeta[sName]?.books) {
        for (const bookTitle of diskMeta[sName].books) {
          try {
            const bookPath = path.join(BOOKS_DIR(), bookTitle);
            if (fs.existsSync(bookPath)) fs.rmSync(bookPath, { recursive: true, force: true });
          } catch {}
        }
      }

      delete diskMeta[sName];
      writeDiskMeta(diskMeta);

      return NextResponse.json({ success: true, message: 'সিরিজ মুছে ফেলা হয়েছে', dbSaved: isDbConnected });
    }

    // ── 2. Delete a book ──
    if (body.action === 'delete-book') {
      const { seriesName, bookTitle, deleteFiles } = body;
      const bTitle = bookTitle?.trim();

      if (!bTitle) return NextResponse.json({ success: false, message: 'বইয়ের শিরোনাম প্রয়োজন' }, { status: 400 });

      if (isDbConnected) {
        const book = await Book.findOne({
          $or: [{ title: bTitle }, { slug: encodeURIComponent(bTitle) }],
        });
        if (book) {
          await Chapter.deleteMany({ $or: [{ bookId: book._id }, { bookSlug: book.slug }] });
          await Book.deleteOne({ _id: book._id });
        }
      }

      if (seriesName && diskMeta[seriesName]) {
        diskMeta[seriesName].books = (diskMeta[seriesName].books || []).filter((b) => b !== bTitle);
        writeDiskMeta(diskMeta);
      }

      if (deleteFiles) {
        try {
          const bookPath = path.join(BOOKS_DIR(), bTitle);
          if (fs.existsSync(bookPath)) fs.rmSync(bookPath, { recursive: true, force: true });
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'বই মুছে ফেলা হয়েছে', dbSaved: isDbConnected });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Error in DELETE /api/admin/books:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── PATCH — rename series or update description ──────────────────────────────
export async function PATCH(req) {
  try {
    const body = await req.json();
    let isDbConnected = false;
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch {}

    const diskMeta = readDiskMeta();

    if (body.action === 'rename-series') {
      const { oldName, newName } = body;
      const o = oldName?.trim();
      const n = newName?.trim();

      if (isDbConnected) {
        await Series.findOneAndUpdate({ name: o }, { name: n });
        await Book.updateMany({ series: o }, { series: n });
      }

      if (diskMeta[o]) {
        diskMeta[n] = { ...diskMeta[o] };
        delete diskMeta[o];
        writeDiskMeta(diskMeta);
      }
      return NextResponse.json({ success: true, dbSaved: isDbConnected });
    }

    if (body.action === 'update-series') {
      const { name, description, author, image } = body;
      const sName = name?.trim();

      const updateData = {};
      if (description !== undefined) updateData.description = description || '';
      if (author !== undefined) updateData.author = author || '';
      if (image !== undefined) updateData.image = image || '';

      if (isDbConnected) {
        await Series.findOneAndUpdate({ name: sName }, updateData, { upsert: true });
      }

      if (!diskMeta[sName]) {
        diskMeta[sName] = { description: '', author: '', image: '', books: [] };
      }
      if (description !== undefined) diskMeta[sName].description = description || '';
      if (author !== undefined) diskMeta[sName].author = author || '';
      if (image !== undefined) diskMeta[sName].image = image || '';
      writeDiskMeta(diskMeta);

      return NextResponse.json({ success: true, dbSaved: isDbConnected });
    }

    // ── update-book — update book image / metadata ──
    if (body.action === 'update-book') {
      const { bookTitle, author, description, image } = body;
      const bTitle = bookTitle?.trim();
      if (!bTitle) {
        return NextResponse.json({ success: false, message: 'বইয়ের শিরোনাম প্রয়োজন' }, { status: 400 });
      }

      if (isDbConnected) {
        const updateData = {};
        if (author !== undefined) updateData.author = author?.trim() || '';
        if (description !== undefined) updateData.description = description?.trim() || '';
        if (image !== undefined) updateData.image = image?.trim() || '';
        await Book.findOneAndUpdate(
          { $or: [{ title: bTitle }, { slug: encodeURIComponent(bTitle) }] },
          updateData
        );
      }

      return NextResponse.json({ success: true, dbSaved: isDbConnected });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
