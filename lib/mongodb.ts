import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";

// Cached connections for performance
let cachedMongoose: typeof mongoose | null = null;
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB using Mongoose (for Prisma/ORM operations)
 * Uses connection pooling and caching for optimal performance
 */
export async function dbConnect(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error("MongoDB connection string (MONGODB_URI) not found.");
  }

  // Return cached connection if available and connected
  if (cachedMongoose && mongoose.connection.readyState === 1) {
    return cachedMongoose;
  }

  // Connect to MongoDB
  await mongoose.connect(mongoUri, {
    dbName: undefined, // Use default from URI
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  cachedMongoose = mongoose;
  return mongoose;
}

/**
 * Get native MongoDB client and database instance
 * Useful for raw MongoDB operations and scripts
 */
export async function getMongoClient(uri?: string): Promise<{ client: MongoClient; db: Db }> {
  const mongoUri = uri || process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error("MongoDB connection string (MONGODB_URI) not found.");
  }

  // Return cached client if available and connected
  if (cachedClient && cachedDb) {
    try {
      // Ping to check if connection is alive
      await cachedDb.admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      // Connection lost, reconnect
      cachedClient = null;
      cachedDb = null;
    }
  }

  // Create new connection
  const client = new MongoClient(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

/**
 * Close MongoDB connections
 * Call this when shutting down the application
 */
export async function closeConnections() {
  if (cachedMongoose) {
    await mongoose.disconnect();
    cachedMongoose = null;
  }
  
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

// Legacy function for backward compatibility
export async function connectToDatabase(uri?: string) {
  return dbConnect(uri);
}
