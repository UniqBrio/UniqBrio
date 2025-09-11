import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[raw-registrations] Fetching raw registration documents...");
    
    // Use raw MongoDB query to get the actual documents
    const rawDocs = await prisma.$runCommandRaw({
      find: "registrations",
      limit: 10
    }) as any;

    console.log("[raw-registrations] Raw documents found:", rawDocs.cursor.firstBatch.length);
    
    const documents = rawDocs.cursor.firstBatch;
    
    // Log each document structure
    documents.forEach((doc: any, index: number) => {
      console.log(`[raw-registrations] Document ${index + 1}:`, {
        _id: doc._id,
        keys: Object.keys(doc),
        hasAdminInfo: !!doc.adminInfo,
        hasBusinessInfo: !!doc.businessInfo,
        adminInfoKeys: doc.adminInfo ? Object.keys(doc.adminInfo) : [],
        businessInfoKeys: doc.businessInfo ? Object.keys(doc.businessInfo) : [],
        adminEmail: doc.adminInfo?.email,
        businessName: doc.businessInfo?.businessName
      });
    });

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents: documents.map((doc: any) => ({
        id: doc._id,
        structure: Object.keys(doc),
        adminInfo: doc.adminInfo,
        businessInfo: doc.businessInfo,
        allFields: doc
      }))
    });

  } catch (err) {
    console.error("[raw-registrations] Error:", err);
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
