import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import Book from '../../../../models/Book';
import Chapter from '../../../../models/Chapter';

export const dynamic = 'force-dynamic';

const BOOKS_DIR = () => path.join(process.cwd(), 'books');

function bengaliToEnglishDigits(str) {
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (match) => bengaliNumerals.indexOf(match));
}

function extractChapterNumber(filename) {
  const normalized = bengaliToEnglishDigits(filename);
  const match = normalized.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ── GET /api/admin/chapters?book=BOOK_TITLE&chapter=FILENAME ──────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const bookTitle = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');
    const chapterNumParam = searchParams.get('chapterNumber');

    if (!bookTitle) {
      return NextResponse.json({ success: false, message: 'Book title required' }, { status: 400 });
    }

    let isDbConnected = false;
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch (e) {
      console.warn('MongoDB connection unavailable in GET chapter:', e.message);
    }

    const decodedBookTitle = decodeURIComponent(bookTitle).trim();
    const slug = encodeURIComponent(decodedBookTitle);

    // 1. Try DB first
    if (isDbConnected) {
      try {
        const book = await Book.findOne({
          $or: [{ slug }, { title: decodedBookTitle }],
        });

        let chapNum = chapterNumParam ? parseInt(chapterNumParam, 10) : 0;
        if (!chapNum && chapterParam) {
          chapNum = extractChapterNumber(chapterParam);
        }

        const matchConditions = [{ bookSlug: slug }, { bookSlug: decodedBookTitle }];
        if (book) {
          matchConditions.unshift({ bookId: book._id });
          if (book.slug && book.slug !== slug) {
            matchConditions.push({ bookSlug: book.slug });
          }
        }

        let chapterDoc = null;
        if (chapNum > 0) {
          chapterDoc = await Chapter.findOne({
            $or: matchConditions,
            chapterNumber: chapNum,
          }).lean();
        }

        if (!chapterDoc && chapterParam) {
          const rawTitle = path.parse(chapterParam).name.replace(/^\d+\.\s*/, '').trim();
          chapterDoc = await Chapter.findOne({
            $or: matchConditions,
            $or: [
              { chapterTitle: rawTitle },
              { chapterTitle: path.parse(chapterParam).name },
            ],
          }).lean();
        }

        if (chapterDoc) {
          return NextResponse.json({
            success: true,
            content: chapterDoc.content,
            chapterNumber: chapterDoc.chapterNumber,
            chapterTitle: chapterDoc.chapterTitle,
            source: 'database',
          });
        }
      } catch (dbErr) {
        console.warn('DB query error in GET /api/admin/chapters:', dbErr.message);
      }
    }

    // 2. Fallback to filesystem
    try {
      const bookPath = path.join(BOOKS_DIR(), decodedBookTitle);
      if (fs.existsSync(bookPath) && chapterParam) {
        const filePath = path.join(bookPath, chapterParam);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          return NextResponse.json({ success: true, content, source: 'filesystem' });
        }
      }
    } catch (e) {
      console.warn('Local file read error in GET chapter:', e.message);
    }

    return NextResponse.json({ success: false, message: 'অধ্যায়টি পাওয়া যায়নি' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST /api/admin/chapters — save/update chapter in DB & disk ───────────────
export async function POST(req) {
  try {
    const { bookTitle, chapterNumber, chapterTitle, content, oldFileName } = await req.json();

    const bTitle = bookTitle?.trim();
    const cTitle = chapterTitle?.trim();

    if (!bTitle || !cTitle) {
      return NextResponse.json(
        { success: false, message: 'বই ও অধ্যায়ের নাম আবশ্যক' },
        { status: 400 }
      );
    }

    let isDbConnected = false;
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch (e) {
      console.warn('MongoDB connection unavailable in POST chapter:', e.message);
    }

    const num = Number(chapterNumber) || 1;
    const slug = encodeURIComponent(bTitle);

    // 1. Save to MongoDB
    if (isDbConnected) {
      try {
        let book = await Book.findOne({
          $or: [{ slug }, { title: bTitle }],
        });

        if (!book) {
          book = await Book.create({
            title: bTitle,
            slug,
            series: 'সাধারণ সংকলন',
            chaptersCount: 0,
          });
        }

        // Upsert Chapter
        await Chapter.findOneAndUpdate(
          {
            $or: [
              { bookId: book._id, chapterNumber: num },
              { bookSlug: slug, chapterNumber: num },
              { bookSlug: book.slug, chapterNumber: num },
            ],
          },
          {
            bookId: book._id,
            bookSlug: book.slug || slug,
            chapterNumber: num,
            chapterTitle: cTitle,
            content: content || '',
          },
          { upsert: true, new: true }
        );

        // Update Book's chaptersCount
        const count = await Chapter.countDocuments({
          $or: [{ bookId: book._id }, { bookSlug: book.slug }, { bookSlug: slug }],
        });
        book.chaptersCount = count;
        await book.save();
      } catch (dbErr) {
        console.error('Failed saving chapter to DB:', dbErr);
      }
    }

    // 2. Save to filesystem (optional local backup, ignore on read-only environments like Vercel)
    const newFileName = `${num}. ${cTitle}.txt`;
    try {
      const bookPath = path.join(BOOKS_DIR(), bTitle);
      if (!fs.existsSync(bookPath)) fs.mkdirSync(bookPath, { recursive: true });

      const newFilePath = path.join(bookPath, newFileName);

      // If renaming file on disk, remove old one
      if (oldFileName && oldFileName !== newFileName) {
        const oldFilePath = path.join(bookPath, oldFileName);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }

      fs.writeFileSync(newFilePath, content || '', 'utf-8');
    } catch (fsErr) {
      console.warn('Local filesystem write skipped:', fsErr.message);
    }

    return NextResponse.json({
      success: true,
      message: isDbConnected
        ? 'অধ্যায় সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে! ✓'
        : 'অধ্যায় ফাইলে সংরক্ষিত হয়েছে (ডাটাবেজ সংযোগ বিচ্ছিন্ন)',
      fileName: newFileName,
      dbSaved: isDbConnected,
    });
  } catch (err) {
    console.error('Error in POST /api/admin/chapters:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── DELETE /api/admin/chapters — delete chapter from DB & disk ─────────────────
export async function DELETE(req) {
  try {
    const { bookTitle, fileName, chapterNumber } = await req.json();
    const bTitle = bookTitle?.trim();

    if (!bTitle || (!fileName && !chapterNumber)) {
      return NextResponse.json({ success: false, message: 'Book title and chapter required' }, { status: 400 });
    }

    let isDbConnected = false;
    try {
      await connectToDatabase();
      isDbConnected = true;
    } catch {}

    const slug = encodeURIComponent(bTitle);
    const num = chapterNumber || (fileName ? extractChapterNumber(fileName) : 0);

    // 1. Delete from MongoDB
    if (isDbConnected) {
      try {
        const book = await Book.findOne({
          $or: [{ slug }, { title: bTitle }],
        });

        if (book) {
          const filter = {
            $or: [{ bookId: book._id }, { bookSlug: book.slug }, { bookSlug: slug }],
          };
          if (num > 0) {
            filter.chapterNumber = num;
          } else if (fileName) {
            filter.chapterTitle = path.parse(fileName).name;
          }

          await Chapter.deleteOne(filter);

          const count = await Chapter.countDocuments({
            $or: [{ bookId: book._id }, { bookSlug: book.slug }, { bookSlug: slug }],
          });
          book.chaptersCount = count;
          await book.save();
        }
      } catch (dbErr) {
        console.warn('DB delete chapter error:', dbErr.message);
      }
    }

    // 2. Delete from filesystem (optional local backup)
    if (fileName) {
      try {
        const filePath = path.join(BOOKS_DIR(), bTitle, fileName.trim());
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {}
    }

    return NextResponse.json({
      success: true,
      message: 'অধ্যায় সফলভাবে মুছে ফেলা হয়েছে',
      dbSaved: isDbConnected,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
