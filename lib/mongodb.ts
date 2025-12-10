import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";
import { getTenantContext } from "./tenant/tenant-context";

// Cached connections for performance
let cachedMongoose: typeof mongoose | null = null;
let cachedClient: MongoClient | null = null;
let cachedDbs: { [dbName: string]: Db } = {};

// MongoDB URI without database specified
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://course:course1@cluster0.1gqwk5m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Single consolidated database name
export const DB_NAME = "uniqbrio";

/**
 * Connect to MongoDB using Mongoose
 * Uses single consolidated database: "uniqbrio"
 * Supports tenant isolation through tenantId in queries (handled by tenant plugin)
 */
export async function dbConnect(dbName: string = DB_NAME): Promise<typeof mongoose> {
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

  // Connect to MongoDB with retry logic
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      await mongoose.connect(MONGODB_URI, {
        dbName: dbName,
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true,
        heartbeatFrequencyMS: 10000,
        maxIdleTimeMS: 30000,
      });

      cachedMongoose = mongoose;
      return mongoose;
    } catch (error: any) {
      lastError = error;
      retries--;
      
      console.error('❌ MongoDB connection error (retries left:', retries + '):', {
        message: error.message,
        code: error.code,
        name: error.name,
        uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') // Hide password in logs
      });
      
      if (retries > 0) {
        console.log('⏳ Retrying connection in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // All retries failed
  if (lastError) {
    console.error('❌ All connection retries failed');
    
    // Provide more helpful error messages
    if (lastError.message.includes('ECONNREFUSED') || lastError.message.includes('querySrv')) {
      throw new Error('Database connection failed. Please check your internet connection and try again.');
    } else if (lastError.message.includes('authentication')) {
      throw new Error('Database authentication failed. Please contact support.');
    } else if (lastError.message.includes('timeout')) {
      throw new Error('Database connection timeout. Please try again.');
    }
    
    throw lastError;
  }

  throw new Error('Unknown database connection error');
}

/**
 * Get native MongoDB client and database instance
 * Uses single consolidated database: "uniqbrio"
 */
export async function getMongoClient(dbName: string = DB_NAME): Promise<{ client: MongoClient; db: Db }> {
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
      console.warn('⚠️ MongoDB connection lost, reconnecting...');
    }
  }

  // Create new connection if needed
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      if (!cachedClient) {
        cachedClient = new MongoClient(MONGODB_URI, {
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
          socketTimeoutMS: 60000,
          connectTimeoutMS: 30000,
          retryWrites: true,
          retryReads: true,
        });
        await cachedClient.connect();
      }

      // Get database instance
      const db = cachedClient.db(dbName);
      cachedDbs[dbName] = db;

      return { client: cachedClient, db };
    } catch (error: any) {
      lastError = error;
      retries--;
      
      console.error('❌ MongoDB client connection error (retries left:', retries + '):', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      // Clean up failed client
      if (cachedClient) {
        try {
          await cachedClient.close();
        } catch (closeError) {
          console.warn('Warning: Error closing failed client:', closeError);
        }
        cachedClient = null;
      }
      
      if (retries > 0) {
        console.log('⏳ Retrying client connection in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // All retries failed
  if (lastError) {
    console.error('❌ All client connection retries failed');
    
    // Provide more helpful error messages
    if (lastError.message.includes('ECONNREFUSED') || lastError.message.includes('querySrv')) {
      throw new Error('Database connection failed. Please check your internet connection and try again.');
    } else if (lastError.message.includes('authentication')) {
      throw new Error('Database authentication failed. Please contact support.');
    } else if (lastError.message.includes('timeout')) {
      throw new Error('Database connection timeout. Please try again.');
    }
    
    throw lastError;
  }

  throw new Error('Unknown database connection error');
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

// Legacy functions for backward compatibility - defaults to consolidated database
export async function connectToDatabase(uri?: string) {
  return dbConnect(DB_NAME);
}

export const connectDB = (dbName: string = DB_NAME) => dbConnect(dbName);
export const connectMongo = (dbName: string = DB_NAME) => dbConnect(dbName);

// Default export
export default dbConnect;
