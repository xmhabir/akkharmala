import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import Series from '../../../models/Series';
import Book from '../../../models/Book';
import Chapter from '../../../models/Chapter';
import { bengaliToEnglishDigits, extractChapterNumber } from '../../../lib/bengaliUtils';

// ISR: Public book list cached for 60s. Invalidated on next.js revalidate or admin action.
export const revalidate = 60;

export async function GET() {
  let isDbConnected = false;

  // 1. Try querying from MongoDB
  try {
    await connectToDatabase();
    isDbConnected = true;

    const [dbSeries, dbBooks, allChapters] = await Promise.all([
      Series.find({}).sort({ order: 1, createdAt: 1 }).lean(),
      Book.find({}).sort({ createdAt: 1 }).lean(),
      Chapter.find({})
        .select('bookId bookSlug chapterNumber chapterTitle')
        .sort({ chapterNumber: 1 })
        .lean(),
    ]);

    if (dbBooks && dbBooks.length > 0) {
      // Map chapters to books efficiently in memory
      const chaptersByBookId = new Map();
      const chaptersBySlug = new Map();

      for (const ch of allChapters) {
        if (ch.bookId) {
          const idStr = ch.bookId.toString();
          if (!chaptersByBookId.has(idStr)) chaptersByBookId.set(idStr, []);
          chaptersByBookId.get(idStr).push({
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.chapterTitle,
          });
        }
        if (ch.bookSlug) {
          if (!chaptersBySlug.has(ch.bookSlug)) chaptersBySlug.set(ch.bookSlug, []);
          chaptersBySlug.get(ch.bookSlug).push({
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.chapterTitle,
          });
        }
      }

      const booksWithChapters = dbBooks.map((b) => {
        const idStr = b._id?.toString();
        const chaps =
          (idStr && chaptersByBookId.get(idStr)) ||
          chaptersBySlug.get(b.slug) ||
          chaptersBySlug.get(encodeURIComponent(b.title)) ||
          [];

        return {
          id: idStr,
          title: b.title,
          slug: b.slug,
          series: b.series || 'সাধারণ সংকলন',
          author: b.author && b.author.trim() ? b.author.trim() : 'অজানা',
          description: b.description || '',
          image: b.image || '',
          chaptersCount: Math.max(b.chaptersCount || 0, chaps.length),
          chapters: chaps,
        };
      });

      // Read diskMeta for fallback/syncing metadata (images, authors)
      const metaPath = path.join(process.cwd(), 'books', '_series.json');
      let diskMeta = {};
      if (fs.existsSync(metaPath)) {
        try { diskMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch {}
      }

      // Group books by series
      const seriesMap = new Map();

      // Seed series from DB Series collection
      for (const s of dbSeries) {
        seriesMap.set(s.name, {
          name: s.name,
          author: s.author || diskMeta[s.name]?.author || '',
          description: s.description || diskMeta[s.name]?.description || '',
          image: s.image || diskMeta[s.name]?.image || '',
          books: [],
        });
      }

      // Seed any series from diskMeta not yet in seriesMap
      for (const [sName, sInfo] of Object.entries(diskMeta)) {
        if (!seriesMap.has(sName)) {
          seriesMap.set(sName, {
            name: sName,
            author: sInfo.author || '',
            description: sInfo.description || '',
            image: sInfo.image || '',
            books: [],
          });
        } else {
          if (!seriesMap.get(sName).image && sInfo.image) {
            seriesMap.get(sName).image = sInfo.image;
          }
          if (!seriesMap.get(sName).author && sInfo.author) {
            seriesMap.get(sName).author = sInfo.author;
          }
        }
      }

      const unassigned = [];
      const authorSet = new Set();

      for (const b of booksWithChapters) {
        if (b.author && b.author !== 'অজানা') {
          authorSet.add(b.author);
        }

        const sName = b.series;
        if (sName && sName !== 'সাধারণ সংকলন') {
          if (!seriesMap.has(sName)) {
            seriesMap.set(sName, {
              name: sName,
              author: b.author || diskMeta[sName]?.author || '',
              description: diskMeta[sName]?.description || '',
              image: diskMeta[sName]?.image || '',
              books: [],
            });
          }
          seriesMap.get(sName).books.push(b);
          // If series has no author yet, infer from book
          if (!seriesMap.get(sName).author && b.author && b.author !== 'অজানা') {
            seriesMap.get(sName).author = b.author;
          }
          if (!seriesMap.get(sName).image && diskMeta[sName]?.image) {
            seriesMap.get(sName).image = diskMeta[sName].image;
          }
        } else {
          unassigned.push(b);
        }
      }

      const seriesList = Array.from(seriesMap.values());
      const authorsList = Array.from(authorSet);

      return NextResponse.json({
        success: true,
        source: 'database',
        count: booksWithChapters.length,
        data: booksWithChapters,
        series: seriesList,
        unassigned,
        authors: authorsList,
      });
    }
  } catch (error) {
    console.warn('MongoDB connection failed in /api/books, falling back to files:', error.message);
  }

  // 2. Fallback: Read from books/ directory
  try {
    const booksDir = path.join(process.cwd(), 'books');
    let books = [];
    const metaFile = path.join(booksDir, '_series.json');
    let diskMeta = {};
    if (fs.existsSync(metaFile)) {
      try {
        diskMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      } catch {}
    }

    if (fs.existsSync(booksDir)) {
      const entries = fs.readdirSync(booksDir, { withFileTypes: true });
      books = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const bookPath = path.join(booksDir, entry.name);
          const files = fs.readdirSync(bookPath).filter((f) => f.endsWith('.txt'));

          files.sort((a, b) => {
            const numA = extractChapterNumber(a);
            const numB = extractChapterNumber(b);
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b, 'bn', { numeric: true });
          });

          const chapters = files.map((file, idx) => {
            const extractedNum = extractChapterNumber(file);
            return {
              chapterNumber: extractedNum > 0 ? extractedNum : idx + 1,
              chapterTitle: path.parse(file).name,
            };
          });

          // Find series from diskMeta
          let foundSeries = 'সাধারণ সংকলন';
          for (const [sName, sInfo] of Object.entries(diskMeta)) {
            if ((sInfo.books || []).includes(entry.name)) {
              foundSeries = sName;
              break;
            }
          }

          if (foundSeries === 'সাধারণ সংকলন' && entry.name.includes('হ্যারি পটার')) {
            foundSeries = 'হ্যারি পটার সিরিজ (Harry Potter Series)';
          }

          const author = entry.name.includes('হ্যারি পটার') ? 'জে. কে. রাউলিং' : 'অজানা';

          return {
            title: entry.name,
            slug: encodeURIComponent(entry.name),
            chaptersCount: files.length,
            chapters,
            series: foundSeries,
            author,
            image: '',
          };
        });
    }

    // Group filesystem books
    const seriesMap = new Map();
    const unassigned = [];
    const authorSet = new Set();

    for (const b of books) {
      if (b.author && b.author !== 'অজানা') authorSet.add(b.author);
      if (b.series && b.series !== 'সাধারণ সংকলন') {
        if (!seriesMap.has(b.series)) {
          seriesMap.set(b.series, {
            name: b.series,
            author: b.author || '',
            description: diskMeta[b.series]?.description || '',
            image: diskMeta[b.series]?.image || '',
            books: [],
          });
        }
        seriesMap.get(b.series).books.push(b);
      } else {
        unassigned.push(b);
      }
    }

    return NextResponse.json({
      success: true,
      source: 'filesystem',
      count: books.length,
      data: books,
      series: Array.from(seriesMap.values()),
      unassigned,
      authors: Array.from(authorSet),
    });
  } catch (fsError) {
    return NextResponse.json(
      {
        success: false,
        message: 'বইয়ের তালিকা লোড করা যায়নি।',
        error: fsError.message,
      },
      { status: 500 }
    );
  }
}
