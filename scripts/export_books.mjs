import fs from 'fs';
import path from 'path';
import dns from 'dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = 'mongodb+srv://abir:123@cluster0.sl3pmaf.mongodb.net/bengali_ebooks?retryWrites=true&w=majority&appName=Cluster0';

async function exportBooks() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const books = await mongoose.connection.db.collection('books').find({}).toArray();
  console.log(`Found ${books.length} book(s) in MongoDB.`);

  for (const b of books) {
    const bookDir = path.join(process.cwd(), 'books', b.title);
    fs.mkdirSync(bookDir, { recursive: true });

    const chapters = await mongoose.connection.db.collection('chapters')
      .find({
        $or: [{ bookId: b._id }, { bookSlug: b.slug }]
      })
      .sort({ chapterNumber: 1 })
      .toArray();

    for (const chap of chapters) {
      const fileName = (chap.chapterTitle || `Chapter ${chap.chapterNumber}`) + '.txt';
      const safeName = fileName.replace(/[<>:"/\\|?*]/g, '');
      fs.writeFileSync(path.join(bookDir, safeName), chap.content || '', 'utf-8');
    }

    console.log(`✅ Saved ${chapters.length} chapters to: ${bookDir}`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

exportBooks().catch((err) => {
  console.error('Export error:', err);
  process.exit(1);
});
