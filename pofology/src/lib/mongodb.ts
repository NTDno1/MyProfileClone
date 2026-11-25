import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://datt19112001_db_user:1@mongodbdatnt.bc8xywz.mongodb.net/?retryWrites=true&w=majority';
const dbName = process.env.MONGODB_DB || 'signalr_chat';
const collectionName = 'analytics';

const options: MongoClientOptions = {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 8000,
};

let cachedClient: MongoClient | null = null;
let connectingPromise: Promise<MongoClient> | null = null;

async function getConnectedClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  const newClient = new MongoClient(uri, options);
  connectingPromise = newClient
    .connect()
    .then((connected) => {
      cachedClient = connected;
      connectingPromise = null;
      console.log('[MongoDB] ✅ Connected successfully to cluster, db:', dbName);
      connected.on('close', () => {
        cachedClient = null;
      });
      return connected;
    })
    .catch((err) => {
      // Reset cached promise on failure so the next request automatically retries!
      cachedClient = null;
      connectingPromise = null;
      newClient.close().catch(() => {});
      console.error('[MongoDB] ❌ Connection error:', err?.message || err);
      throw err;
    });

  return connectingPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getConnectedClient();
  return client.db(dbName);
}

export async function getAnalyticsCollection() {
  const db = await getDatabase();
  return db.collection(collectionName);
}

export default getConnectedClient;
