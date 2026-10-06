import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import connectToDatabase from '../../../lib/mongodb';
import Book from '../../../models/Book';
import Chapter from '../../../models/Chapter';
import ReaderUI from './ReaderUI';
import { extractChapterNumber } from '../../../lib/bengaliUtils';

// Reader page is always dynamic: personalised URL params (?chapter=N).
// We keep force-dynamic here because every user's starting chapter differs.
export const dynamic = 'force-dynamic';

export default async function ReadPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawBookName = resolvedParams?.bookName;
  const targetChapter = resolvedSearchParams?.chapter ? parseInt(resolvedSearchParams.chapter, 10) : 1;

  if (!rawBookName) notFound();

  const bookName = decodeURIComponent(rawBookName);

  // chapterMeta: lightweight array { chapterNumber, chapterTitle } — NO content
  // initialContent: content string for the FIRST chapter the user sees
  let chapterMeta = [];
  let initialContent = '';
  let displayTitle = bookName;
  let bookSlug = rawBookName;

  // ── 1. MongoDB (primary source) ──────────────────────────────────────────
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
      bookSlug = book.slug || rawBookName;

      const bookQuery = {
        $or: [
          { bookId: book._id },
          { bookSlug: book.slug },
          { bookSlug: rawBookName },
          { bookSlug: bookName },
          { bookSlug: encodeURIComponent(bookName) },
        ],
      };

      // Task 9: Fetch METADATA only — no content field. Dramatically reduces payload.
      const meta = await Chapter.find(bookQuery)
        .sort({ chapterNumber: 1 })
        .select('chapterNumber chapterTitle -_id')
        .lean();

      if (meta && meta.length > 0) {
        chapterMeta = meta.map((c) => ({
          chapterNumber: c.chapterNumber,
          chapterTitle: c.chapterTitle,
        }));

        // Task 3: Only fetch the ONE chapter the user wants to read right now
        const startNum = chapterMeta.find((c) => c.chapterNumber === targetChapter)
          ? targetChapter
          : chapterMeta[0].chapterNumber;

        const startChapter = await Chapter.findOne({
          ...bookQuery,
          chapterNumber: startNum,
        })
          .select('content -_id')
          .lean();

        initialContent = startChapter?.content || '';
      }
    }
  } catch (dbError) {
    console.warn('MongoDB query failed, falling back to local files:', dbError.message);
  }

  // ── 2. Filesystem fallback ────────────────────────────────────────────────
  if (chapterMeta.length === 0) {
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

        chapterMeta = txtFiles.map((file, index) => {
          const extractedNum = extractChapterNumber(file);
          return {
            chapterNumber: extractedNum > 0 ? extractedNum : index + 1,
            chapterTitle: path.parse(file).name,
          };
        });

        // Task 3: Read only the starting chapter for filesystem books too
        const startMeta = chapterMeta.find((c) => c.chapterNumber === targetChapter) || chapterMeta[0];
        const startFile = txtFiles.find((file, index) => {
          const n = extractChapterNumber(file) || index + 1;
          return n === startMeta.chapterNumber;
        });
        if (startFile) {
          initialContent = fs.readFileSync(path.join(bookDirectory, startFile), 'utf-8');
        }
      }
    }
  }

  if (chapterMeta.length === 0) notFound();

  const progressSlug = bookSlug || encodeURIComponent(bookName);

  return (
    <ReaderUI
      bookTitle={displayTitle}
      chapterMeta={chapterMeta}
      initialContent={initialContent}
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
