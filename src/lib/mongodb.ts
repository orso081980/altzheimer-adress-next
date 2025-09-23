import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// For production (Vercel), use a completely different approach for SSL
let finalUri: string;
let options: Record<string, unknown>;

if (process.env.NODE_ENV === 'production') {
  // Production: Let MongoDB Atlas handle SSL entirely through connection string
  finalUri = uri!;
  options = {
    // Minimal options for Vercel serverless
    maxPoolSize: 1, // Very small pool for serverless
    serverSelectionTimeoutMS: 30000, // Longer timeout
    socketTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    // Aggressive SSL bypass for Vercel compatibility
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    checkServerIdentity: false,
  };
} else {
  // Development: Keep existing approach
  finalUri = uri!;
  options = {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 0,
    maxIdleTimeMS: 30000,
  };
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(finalUri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(finalUri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;