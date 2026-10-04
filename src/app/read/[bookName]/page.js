import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import connectToDatabase from '../../../lib/mongodb';
import Book from '../../../models/Book';
import Chapter from '../../../models/Chapter';
import ReaderUI from './ReaderUI';

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

export default async function ReadPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawBookName = resolvedParams?.bookName;
  const targetChapter = resolvedSearchParams?.chapter ? parseInt(resolvedSearchParams.chapter, 10) : 1;

  if (!rawBookName) {
    notFound();
  }

  const bookName = decodeURIComponent(rawBookName);
  let chapters = [];
  let displayTitle = bookName;

  // 1. Try querying from MongoDB Backend
  try {
    await connectToDatabase();
    const book = await Book.findOne({
      $or: [
        { slug: rawBookName },
        { slug: bookName },
        { title: bookName },
        { slug: encodeURIComponent(bookName) },
        { slug: encodeURIComponent(rawBookName) },
      ],
    }).lean();

    if (book) {
      displayTitle = book.title;
      const dbChapters = await Chapter.find({
        $or: [
          { bookId: book._id },
          { bookSlug: book.slug },
          { bookSlug: rawBookName },
          { bookSlug: bookName },
          { bookSlug: encodeURIComponent(bookName) },
        ],
      })
        .sort({ chapterNumber: 1 })
        .lean();

      if (dbChapters && dbChapters.length > 0) {
        chapters = dbChapters.map((c) => ({
          chapterNumber: c.chapterNumber,
          chapterTitle: c.chapterTitle,
          content: c.content,
        }));
      }
    }
  } catch (dbError) {
    console.warn('MongoDB query failed, falling back to local files:', dbError.message);
  }

  // 2. Resilient Fallback: If not found in DB or DB offline, read from /books directory
  if (chapters.length === 0) {
    const booksDir = path.join(process.cwd(), 'books');
    let bookDirectory = path.join(booksDir, bookName);

    if (!fs.existsSync(bookDirectory) && fs.existsSync(booksDir)) {
      const entries = fs.readdirSync(booksDir, { withFileTypes: true });
      const matched = entries.find(
        (e) =>
          e.isDirectory() &&
          (e.name === bookName ||
            e.name === rawBookName ||
            decodeURIComponent(rawBookName) === e.name ||
            e.name.toLowerCase().includes(bookName.toLowerCase()) ||
            bookName.toLowerCase().includes(e.name.toLowerCase()))
      );
      if (matched) {
        bookDirectory = path.join(booksDir, matched.name);
        displayTitle = matched.name;
      }
    }

    if (fs.existsSync(bookDirectory)) {
      const files = fs.readdirSync(bookDirectory);
      const txtFiles = files.filter((file) => file.endsWith('.txt'));

      if (txtFiles.length > 0) {
        txtFiles.sort((a, b) => {
          const numA = extractChapterNumber(a);
          const numB = extractChapterNumber(b);
          if (numA !== numB) return numA - numB;
          return a.localeCompare(b, 'bn', { numeric: true });
        });

        chapters = txtFiles.map((file, index) => {
          const filePath = path.join(bookDirectory, file);
          const rawContent = fs.readFileSync(filePath, 'utf-8');
          const extractedNum = extractChapterNumber(file);
          const chapterNumber = extractedNum > 0 ? extractedNum : index + 1;
          const chapterTitle = path.parse(file).name;

          return {
            chapterNumber,
            chapterTitle,
            content: rawContent,
          };
        });
      }
    }
  }

  if (chapters.length === 0) {
    notFound();
  }

  // Determine the slug to use for progress storage (prefer URL slug, falls back to title-encoded)
  const progressSlug = rawBookName || encodeURIComponent(bookName);

  return (
    <ReaderUI
      bookTitle={displayTitle}
      chapters={chapters}
      initialChapterNumber={targetChapter}
      bookSlug={progressSlug}
    />
  );
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const bookName = resolvedParams?.bookName
    ? decodeURIComponent(resolvedParams.bookName)
    : 'ই-বুক রিডার';

  return {
    title: `${bookName} | বাংলা ই-বুক রিডার`,
    description: `${bookName} বইটি অনলাইনে আরামদায়ক অভিজ্ঞতায় পড়ুন।`,
  };
}
