import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const defaultDb = process.env.MONGODB_DB || 'gerenciador_producao';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (client) return client;

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect().then((connected) => {
      client = connected;
      return connected;
    });
  }

  return clientPromise;
}

export async function getMongoDb(dbName?: string) {
  const c = await getMongoClient();
  return c.db(dbName || defaultDb);
}
