import mongoose from "mongoose";

export async function connectToDatabase(uri?: string) {
  const mongoUri = uri || process.env.DATABASE_URL;
  if (!mongoUri) throw new Error("MongoDB connection string (DATABASE_URL) not found.");
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoUri, {
    dbName: undefined, // Use default from URI
  });
}
