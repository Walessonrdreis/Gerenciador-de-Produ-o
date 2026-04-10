import { getMongoDb } from './mongo.js';

export interface AppStatePayload {
  products: unknown[];
  materials: unknown[];
  orders: unknown[];
  config: Record<string, unknown>;
  sectors?: unknown[];
  sectorCapacities?: unknown[];
}

interface AppStateDoc {
  _id: string;
  data: AppStatePayload;
  updatedAt: Date;
}

const COLLECTION = 'app_state';
const DEFAULT_ID = 'default';

let inMemoryFallback: AppStatePayload | null = null;

export async function loadAppState(): Promise<AppStatePayload | null> {
  const db = await getMongoDb();
  if (!db) {
    return inMemoryFallback;
  }
  const doc = await db.collection<AppStateDoc>(COLLECTION).findOne({ _id: DEFAULT_ID });
  return doc?.data || null;
}

export async function saveAppState(payload: AppStatePayload): Promise<void> {
  const db = await getMongoDb();
  if (!db) {
    inMemoryFallback = payload;
    return;
  }
  await db.collection<AppStateDoc>(COLLECTION).updateOne(
    { _id: DEFAULT_ID },
    { $set: { data: payload, updatedAt: new Date() } },
    { upsert: true }
  );
}
