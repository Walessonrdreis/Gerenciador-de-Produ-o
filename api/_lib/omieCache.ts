import crypto from 'crypto';
import { getMongoDb } from './mongo.js';

interface CacheDoc {
  _id: string;
  createdAt: Date;
  expiresAt: Date;
  status: number;
  data: unknown;
}

const COLLECTION = 'omie_cache';
let ensurePromise: Promise<void> | null = null;

// In-memory fallback if MongoDB is not available
const inMemoryCache = new Map<string, { status: number; data: unknown; expiresAt: number }>();

async function ensureIndexes() {
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    const db = await getMongoDb();
    if (db) {
      await db.collection<CacheDoc>(COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }
  })();
  return ensurePromise;
}

export function buildCacheKey(input: unknown): string {
  const raw = JSON.stringify(input);
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function getCachedResponse(key: string): Promise<{ status: number; data: unknown } | null> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();
  
  if (!db) {
    const cached = inMemoryCache.get(key);
    if (cached && cached.expiresAt > now.getTime()) {
      return { status: cached.status, data: cached.data };
    }
    if (cached) {
      inMemoryCache.delete(key);
    }
    return null;
  }

  const doc = await db.collection<CacheDoc>(COLLECTION).findOne({ _id: key, expiresAt: { $gt: now } });
  if (!doc) return null;
  return { status: doc.status, data: doc.data };
}

export async function setCachedResponse(key: string, status: number, data: unknown, ttlSeconds: number): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  
  if (!db) {
    inMemoryCache.set(key, { status, data, expiresAt: expiresAt.getTime() });
    return;
  }

  await db.collection<CacheDoc>(COLLECTION).updateOne(
    { _id: key },
    { $set: { status, data, createdAt: now, expiresAt } },
    { upsert: true }
  );
}
