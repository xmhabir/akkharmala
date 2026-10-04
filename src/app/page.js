import fs from 'fs';
import path from 'path';
import connectToDatabase from '../lib/mongodb';
import Series from '../models/Series';
import Book from '../models/Book';
import Chapter from '../models/Chapter';
import HomeLibrary from './HomeLibrary';

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

export default async function HomePage() {
  let books = [];
  let seriesList = [];
  let authorsList = [];
  let isDatabaseConnected = false;

  // 1. Try querying from MongoDB Backend
  try {
    await connectToDatabase();
    isDatabaseConnected = true;

    const [dbSeries, dbBooks, allChapters] = await Promise.all([
      Series.find({}).sort({ order: 1, createdAt: 1 }).lean(),
      Book.find({}).sort({ createdAt: 1 }).lean(),
      Chapter.find({})
        .select('bookId bookSlug chapterNumber chapterTitle')
        .sort({ chapterNumber: 1 })
        .lean(),
    ]);

    if (dbBooks && dbBooks.length > 0) {
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

      books = dbBooks.map((b) => {
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
          author: b.author || 'অজানা',
          series: b.series || 'সাধারণ সংকলন',
          description: b.description || '',
          image: b.image || '',
          chaptersCount: Math.max(b.chaptersCount || 0, chaps.length),
          chapters: chaps,
          source: 'database',
        };
      });

      // Read diskMeta for metadata (image, author, description)
      const metaPath = path.join(process.cwd(), 'books', '_series.json');
      let diskMeta = {};
      if (fs.existsSync(metaPath)) {
        try { diskMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch { }
      }

      const seriesMap = new Map();
      for (const s of dbSeries) {
        seriesMap.set(s.name, {
          name: s.name,
          author: s.author || diskMeta[s.name]?.author || '',
          description: s.description || diskMeta[s.name]?.description || '',
          image: s.image || diskMeta[s.name]?.image || '',
          books: [],
        });
      }

      // Merge any series from diskMeta
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

      const authorSet = new Set();
      for (const b of books) {
        if (b.author && b.author !== 'অজানা') authorSet.add(b.author);
        if (b.series && b.series !== 'সাধারণ সংকলন') {
          if (!seriesMap.has(b.series)) {
            seriesMap.set(b.series, {
              name: b.series,
              author: b.author || diskMeta[b.series]?.author || '',
              description: diskMeta[b.series]?.description || '',
              image: diskMeta[b.series]?.image || '',
              books: [],
            });
          }
          seriesMap.get(b.series).books.push(b);
          if (!seriesMap.get(b.series).author && b.author && b.author !== 'অজানা') {
            seriesMap.get(b.series).author = b.author;
          }
          if (!seriesMap.get(b.series).image && diskMeta[b.series]?.image) {
            seriesMap.get(b.series).image = diskMeta[b.series].image;
          }
        }
      }

      seriesList = Array.from(seriesMap.values());
      authorsList = Array.from(authorSet);
    }
  } catch (dbError) {
    console.warn('MongoDB query warning in HomePage:', dbError.message);
  }

  // 2. Resilient Fallback: If database is empty or not yet migrated, read from books/ directory
  if (books.length === 0) {
    const booksDir = path.join(process.cwd(), 'books');
    const metaFile = path.join(booksDir, '_series.json');
    let diskMeta = {};
    if (fs.existsSync(metaFile)) {
      try {
        diskMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      } catch { }
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

          const chaps = files.map((file, idx) => {
            const extractedNum = extractChapterNumber(file);
            return {
              chapterNumber: extractedNum > 0 ? extractedNum : idx + 1,
              chapterTitle: path.parse(file).name,
            };
          });

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
            chaptersCount: files.length,
            slug: encodeURIComponent(entry.name),
            series: foundSeries,
            author,
            image: '',
            source: 'filesystem',
            chapters: chaps,
          };
        });

      const seriesMap = new Map();
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
        }
      }
      seriesList = Array.from(seriesMap.values());
      authorsList = Array.from(authorSet);
    }
  }

  return (
    <HomeLibrary
      diskBooks={books}
      initialSeries={seriesList}
      initialAuthors={authorsList}
      isDatabaseConnected={isDatabaseConnected}
    />
  );
}
