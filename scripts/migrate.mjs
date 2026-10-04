import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to convert Bengali digits (০-৯) to standard English digits (0-9)
function bengaliToEnglishDigits(str) {
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (match) => bengaliNumerals.indexOf(match));
}

// Extracts the starting number from chapter filenames
function extractChapterNumber(filename) {
  const normalized = bengaliToEnglishDigits(filename);
  const match = normalized.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Load .env.local if present
const envPath = path.join(rootDir, '.env.local');
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      if (key.trim() === 'MONGODB_URI') {
        MONGODB_URI = rest.join('=').trim();
      }
    }
  }
}

MONGODB_URI = MONGODB_URI || 'mongodb://localhost:27017/bengali_ebooks';

// Define Schemas
const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    series: { type: String, default: 'সাধারণ সংকলন' },
    author: { type: String, default: 'অজানা' },
    description: { type: String, default: '' },
    chaptersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ChapterSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    bookSlug: { type: String, required: true, index: true },
    chapterNumber: { type: Number, required: true },
    chapterTitle: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

ChapterSchema.index({ bookSlug: 1, chapterNumber: 1 }, { unique: true });

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);

async function runMigration() {
  console.log('🔄 Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB successfully.');

  const booksDir = path.join(rootDir, 'books');
  if (!fs.existsSync(booksDir)) {
    console.error('❌ books/ folder not found at:', booksDir);
    process.exit(1);
  }

  const entries = fs.readdirSync(booksDir, { withFileTypes: true });
  const bookDirs = entries.filter((e) => e.isDirectory());

  console.log(`📚 Found ${bookDirs.length} book(s) in books/ folder.`);

  let totalMigratedChapters = 0;

  for (const dir of bookDirs) {
    const bookTitle = dir.name;
    const bookPath = path.join(booksDir, bookTitle);
    const slug = encodeURIComponent(bookTitle);

    let series = 'সাধারণ সংকলন';
    let author = 'অজানা লেখক';

    if (bookTitle.includes('হ্যারি পটার') || bookTitle.toLowerCase().includes('harry potter')) {
      series = 'হ্যারি পটার সিরিজ (Harry Potter Series)';
      author = 'জে. কে. রাউলিং (J.K. Rowling)';
    }

    const files = fs.readdirSync(bookPath).filter((f) => f.endsWith('.txt'));

    // Sort chapters sequentially
    files.sort((a, b) => {
      const numA = extractChapterNumber(a);
      const numB = extractChapterNumber(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b, 'bn', { numeric: true });
    });

    console.log(`\n📖 Processing book: "${bookTitle}" (${files.length} chapters)...`);

    // Upsert Book document
    const bookDoc = await Book.findOneAndUpdate(
      { slug },
      {
        title: bookTitle,
        slug,
        series,
        author,
        chaptersCount: files.length,
        description: `${bookTitle} - বাংলা সংস্করণ।`,
      },
      { upsert: true, new: true }
    );

    // Upsert each chapter
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filePath = path.join(bookPath, filename);
      const content = fs.readFileSync(filePath, 'utf-8');

      const extractedNum = extractChapterNumber(filename);
      const chapterNumber = extractedNum > 0 ? extractedNum : i + 1;
      const chapterTitle = path.parse(filename).name;

      await Chapter.findOneAndUpdate(
        { bookSlug: slug, chapterNumber },
        {
          bookId: bookDoc._id,
          bookSlug: slug,
          chapterNumber,
          chapterTitle,
          content,
        },
        { upsert: true }
      );

      totalMigratedChapters++;
    }

    console.log(`  ✓ Successfully migrated "${bookTitle}" with ${files.length} chapters.`);
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Summary: ${bookDirs.length} book(s), ${totalMigratedChapters} chapter(s) saved in MongoDB.`);
  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
