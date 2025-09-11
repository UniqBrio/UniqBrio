import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[list-collections] Checking available MongoDB collections...");
    
    // Get all collection names
    const result = await prisma.$runCommandRaw({
      listCollections: 1
    }) as any;

    const collections = result.cursor.firstBatch.map((collection: any) => ({
      name: collection.name,
      type: collection.type
    }));

    console.log("[list-collections] Collections found:", collections);

    // Also count documents in each collection
    const collectionCounts: any = {};
    
    for (const collection of collections) {
      try {
        const count = await prisma.$runCommandRaw({
          count: collection.name
        }) as any;
        collectionCounts[collection.name] = count.n || 0;
      } catch (e) {
        collectionCounts[collection.name] = "Error counting";
      }
    }

    console.log("[list-collections] Collection counts:", collectionCounts);

    return NextResponse.json({
      success: true,
      collections,
      collectionCounts,
      databaseInfo: {
        url: process.env.DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") || "Not set"
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
