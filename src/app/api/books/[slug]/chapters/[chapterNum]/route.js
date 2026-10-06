/**
 * GET /api/books/[slug]/chapters/[chapterNum]
 *
 * Returns the content of a single chapter.
 * Used by ReaderUI for on-demand chapter loading (Task 3).
 *
 * Response: { content: string, chapterNumber: number, chapterTitle: string }
 */
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../../../lib/mongodb';
import Book from '../../../../../../models/Book';
import Chapter from '../../../../../../models/Chapter';
import { extractChapterNumber } from '../../../../../../lib/bengaliUtils';

// Chapter content is relatively stable; cache for 5 minutes on the CDN edge.
// Admin edits will be reflected after the next revalidation or deploy.
export const revalidate = 300;

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;
  const chapterNum = parseInt(resolvedParams?.chapterNum, 10);

  if (!rawSlug || isNaN(chapterNum)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  let bookSlug = rawSlug;
  try {
    bookSlug = decodeURIComponent(rawSlug);
  } catch {
    bookSlug = rawSlug;
  }

  // ── 1. MongoDB ─────────────────────────────────────────────────────────────
  try {
    await connectToDatabase();

    const book = await Book.findOne({
      $or: [
        { slug: rawSlug },
        { slug: bookSlug },
        { title: bookSlug },
        { slug: encodeURIComponent(bookSlug) },
      ],
    }).lean();

    if (book) {
      const chapter = await Chapter.findOne({
        $or: [
          { bookSlug: book.slug, chapterNumber: chapterNum },
          { bookId: book._id, chapterNumber: chapterNum },
          { bookSlug: rawSlug, chapterNumber: chapterNum },
          { bookSlug: bookSlug, chapterNumber: chapterNum },
        ],
      })
        .select('content chapterNumber chapterTitle -_id')
        .lean();

      if (chapter) {
        return NextResponse.json({
          content: chapter.content || '',
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle || '',
        });
      }
    }
  } catch (dbErr) {
    console.warn('MongoDB error in chapter API, trying filesystem:', dbErr.message);
  }

  // ── 2. Filesystem fallback ─────────────────────────────────────────────────
  try {
    const booksDir = path.join(process.cwd(), 'books');
    let bookDirectory = path.join(booksDir, bookSlug);

    if (!fs.existsSync(bookDirectory) && fs.existsSync(booksDir)) {
      const entries = fs.readdirSync(booksDir, { withFileTypes: true });
      const matched = entries.find(
        (e) =>
          e.isDirectory() &&
          (e.name === bookSlug ||
            e.name === rawSlug ||
            e.name.toLowerCase().includes(bookSlug.toLowerCase()))
      );
      if (matched) bookDirectory = path.join(booksDir, matched.name);
    }

    if (fs.existsSync(bookDirectory)) {
      const files = fs.readdirSync(bookDirectory);
      const txtFiles = files.filter((f) => f.endsWith('.txt'));

      txtFiles.sort((a, b) => {
        const nA = extractChapterNumber(a);
        const nB = extractChapterNumber(b);
        return nA !== nB ? nA - nB : a.localeCompare(b, 'bn', { numeric: true });
      });

      // Match by number or by position in the sorted list
      const match = txtFiles.find((file, idx) => {
        const n = extractChapterNumber(file);
        return n === chapterNum || (!n && idx + 1 === chapterNum);
      });

      if (match) {
        const content = fs.readFileSync(path.join(bookDirectory, match), 'utf-8');
        return NextResponse.json({
          content,
          chapterNumber: chapterNum,
          chapterTitle: path.parse(match).name,
        });
      }
    }
  } catch (fsErr) {
    console.warn('Filesystem error in chapter API:', fsErr.message);
  }

  return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
}
