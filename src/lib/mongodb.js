import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

function ensureDns() {
  try {
    dns.setDefaultResultOrder?.('ipv4first');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if setServers is restricted
  }
}
ensureDns();

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('MONGODB_URI=')) {
          MONGODB_URI = trimmed.replace('MONGODB_URI=', '').trim();
          break;
        }
      }
    }
  } catch (err) {
    // Ignore error
  }
}

MONGODB_URI = MONGODB_URI || 'mongodb://localhost:27017/bengali_ebooks';

/**
 * Global is used here to maintain a cached connection across hot-reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  ensureDns();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10s timeout to allow cloud cluster handshakes
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
