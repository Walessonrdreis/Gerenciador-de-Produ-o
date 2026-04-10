import { MongoClient } from 'mongodb';

// Define the global variable for caching the MongoDB connection in a serverless environment
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not configured in the environment variables. Running in in-memory fallback mode.');
    return null;
  }

  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect().catch(err => {
        console.error('❌ Failed to connect to MongoDB. Running in in-memory fallback mode.', err.message);
        global._mongoClientPromise = undefined;
        return null as any;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode (Serverless Functions), it's best to not use a global variable.
    const client = new MongoClient(uri);
    clientPromise = client.connect().catch(err => {
      console.error('❌ Failed to connect to MongoDB. Running in in-memory fallback mode.', err.message);
      clientPromise = null;
      return null as any;
    });
  }

  return clientPromise;
}

export async function getMongoDb(dbName?: string) {
  const defaultDb = process.env.MONGODB_DB || 'gerenciador_producao';
  const c = await getMongoClient();
  if (!c) return null;
  return c.db(dbName || defaultDb);
}
