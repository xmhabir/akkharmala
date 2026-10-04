import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import Book from '../../../../models/Book';
import Chapter from '../../../../models/Chapter';

export const dynamic = 'force-dynamic';

function bengaliToEnglishDigits(str) {
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (match) => bengaliNumerals.indexOf(match));
}

function extractChapterNumber(filename) {
  const normalized = bengaliToEnglishDigits(filename);
  const match = normalized.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug) {
    return NextResponse.json(
      { success: false, message: 'বইয়ের স্লাগ প্রদান করা হয়নি।' },
      { status: 400 }
    );
  }

  const decodedSlug = decodeURIComponent(rawSlug);

  // 1. Try fetching from MongoDB
  try {
    await connectToDatabase();
    const book = await Book.findOne({
      $or: [{ slug: rawSlug }, { slug: decodedSlug }, { title: decodedSlug }],
    }).lean();

    if (book) {
      const chapters = await Chapter.find({
        $or: [{ bookId: book._id }, { bookSlug: book.slug }, { bookSlug: rawSlug }],
      })
        .sort({ chapterNumber: 1 })
        .lean();

      if (chapters && chapters.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'database',
          data: {
            book,
            chapters,
          },
        });
      }
    }
  } catch (error) {
    console.warn('MongoDB query failed in /api/books/[slug], falling back to files:', error.message);
  }

  // 2. Fallback: Read from books/ folder
  const bookDirectory = path.join(process.cwd(), 'books', decodedSlug);

  if (!fs.existsSync(bookDirectory)) {
    return NextResponse.json(
      { success: false, message: 'বইটি খুঁজে পাওয়া যায়নি।' },
      { status: 404 }
    );
  }

  const files = fs.readdirSync(bookDirectory).filter((f) => f.endsWith('.txt'));

  files.sort((a, b) => {
    const numA = extractChapterNumber(a);
    const numB = extractChapterNumber(b);
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, 'bn', { numeric: true });
  });

  const chapters = files.map((file, index) => {
    const filePath = path.join(bookDirectory, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const extractedNum = extractChapterNumber(file);
    const chapterNumber = extractedNum > 0 ? extractedNum : index + 1;
    const chapterTitle = path.parse(file).name;

    return {
      chapterNumber,
      chapterTitle,
      content,
    };
  });

  return NextResponse.json({
    success: true,
    source: 'filesystem',
    data: {
      book: {
        title: decodedSlug,
        slug: rawSlug,
        chaptersCount: chapters.length,
      },
      chapters,
    },
  });
}
