import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";

// Cached connections for performance
let cachedMongoose: typeof mongoose | null = null;
let cachedClient: MongoClient | null = null;
let cachedDbs: { [dbName: string]: Db } = {};

// MongoDB URI without database specified
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://course:course1@cluster0.1gqwk5m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Connect to MongoDB using Mongoose with specific database name
 * Routes specify which database to use: "uniqbrio" for dashboard, "uniqbrio-admin" for auth
 */
export async function dbConnect(dbName: string): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MongoDB connection string (MONGODB_URI) not found.");
  }

  // Return cached connection if available and connected to the same database
  if (cachedMongoose && mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
    return cachedMongoose;
  }

  // If connected to different database, disconnect first
  if (cachedMongoose && mongoose.connection.readyState === 1 && mongoose.connection.name !== dbName) {
    await mongoose.disconnect();
    cachedMongoose = null;
  }

  // Connect to MongoDB with specified database
  await mongoose.connect(MONGODB_URI, {
    dbName: dbName,
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
 * Routes specify which database to use: "uniqbrio" for dashboard, "uniqbrio-admin" for auth
 */
export async function getMongoClient(dbName: string): Promise<{ client: MongoClient; db: Db }> {
  if (!MONGODB_URI) {
    throw new Error("MongoDB connection string (MONGODB_URI) not found.");
  }

  // Return cached client and db if available
  if (cachedClient && cachedDbs[dbName]) {
    try {
      await cachedDbs[dbName].admin().ping();
      return { client: cachedClient, db: cachedDbs[dbName] };
    } catch (error) {
      // Connection lost, will reconnect
    }
  }

  // Create new connection if needed
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }

  // Get database instance
  const db = cachedClient.db(dbName);
  cachedDbs[dbName] = db;

  return { client: cachedClient, db };
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
    cachedDbs = {};
  }
}

// Legacy functions for backward compatibility - defaults to uniqbrio database
export async function connectToDatabase(uri?: string) {
  return dbConnect("uniqbrio");
}

export const connectDB = (dbName: string = "uniqbrio") => dbConnect(dbName);
export const connectMongo = (dbName: string = "uniqbrio") => dbConnect(dbName);

// Default export
export default dbConnect;
