import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const uri = 'mongodb+srv://datt19112001_db_user:1@mongodbdatnt.bc8xywz.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'signalr_chat';
const collectionName = 'analytics';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// MongoDB connection options
const options: MongoClientOptions = {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 10000, // Timeout after 10s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 0, // Start with 0 connections, build up as needed
  maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10s
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err) => {
    console.error('MongoDB connection error:', err);
    throw err;
  });
}

export async function getDatabase(): Promise<Db> {
  try {
    console.log('[MongoDB] 🔌 Attempting to connect to database...');
    const client = await clientPromise;
    console.log('[MongoDB] ✅ Connected to MongoDB');
    const db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('[MongoDB] ❌ Error getting database:', error);
    // Re-throw with more context
    if (error instanceof Error) {
      if (error.message.includes('SSL') || error.message.includes('TLS')) {
        const customError = new Error('MongoDB SSL connection error. Please check: 1) IP whitelist on MongoDB Atlas, 2) Connection string is correct');
        console.error('[MongoDB] 💡 Solution: Go to MongoDB Atlas → Network Access → Add IP Address (0.0.0.0/0)');
        throw customError;
      }
    }
    throw error;
  }
}

export async function getAnalyticsCollection() {
  try {
    console.log('[MongoDB] 📦 Getting analytics collection...');
    const db = await getDatabase();
    const collection = db.collection(collectionName);
    console.log('[MongoDB] ✅ Collection ready:', collectionName);
    return collection;
  } catch (error) {
    console.error('[MongoDB] ❌ Error getting analytics collection:', error);
    throw error;
  }
}

export default clientPromise;

