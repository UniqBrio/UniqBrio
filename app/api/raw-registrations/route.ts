import { NextRequest, NextResponse } from "next/server";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("[raw-registrations] Fetching raw registration documents...");
    
    await dbConnect();
    
    // Use Mongoose to get the actual documents
    const documents = await RegistrationModel.find({}).limit(10).lean();

    console.log("[raw-registrations] Raw documents found:", documents.length);
    
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
