import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("[list-collections] Checking available MongoDB collections...");
    
    const { db } = await getMongoClient();
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionInfo = collections.map(c => ({
      name: c.name,
      type: c.type
    }));

    console.log("[list-collections] Collections found:", collectionInfo);

    // Also count documents in each collection
    const collectionCounts: any = {};
    
    for (const collection of collectionInfo) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        collectionCounts[collection.name] = count;
      } catch (e) {
        collectionCounts[collection.name] = "Error counting";
      }
    }

    console.log("[list-collections] Collection counts:", collectionCounts);

    return NextResponse.json({
      success: true,
      collections: collectionInfo,
      collectionCounts,
      databaseInfo: {
        url: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") || "Not set"
      }
    });

  } catch (err) {
    console.error("[list-collections] Error:", err);
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
