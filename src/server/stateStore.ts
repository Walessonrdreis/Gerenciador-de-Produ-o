import type { FactoryConfig, Product, ProductionOrder, RawMaterial } from '../types';
import { getMongoDb } from './mongo';

export interface AppStatePayload {
  products: Product[];
  materials: RawMaterial[];
  orders: ProductionOrder[];
  config: FactoryConfig;
}

interface AppStateDoc {
  _id: string;
  data: AppStatePayload;
  updatedAt: Date;
}

const DEFAULT_DB = process.env.MONGODB_DB || 'gerenciador_producao';
const COLLECTION = 'app_state';
const DEFAULT_ID = 'default';

export async function loadAppState(): Promise<AppStatePayload | null> {
  const db = await getMongoDb(DEFAULT_DB);
  const doc = await db.collection<AppStateDoc>(COLLECTION).findOne({ _id: DEFAULT_ID });
  const payload = doc?.data;
  return payload || null;
}

export async function saveAppState(payload: AppStatePayload): Promise<void> {
  const db = await getMongoDb(DEFAULT_DB);
  await db.collection<AppStateDoc>(COLLECTION).updateOne(
    { _id: DEFAULT_ID },
    { $set: { data: payload, updatedAt: new Date() } },
    { upsert: true }
  );
}
