import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("[debug-registrations] Starting comprehensive registration debug...");
    
    // Connect to MongoDB directly
    console.log("[debug-registrations] Testing database connection...");
    await connectToDatabase();
    const mongoose = require('mongoose');
    console.log("[debug-registrations] Database connected successfully");

    // Check total counts in different ways
    console.log("[debug-registrations] Checking collection counts...");
    
    // Method 1: Using direct MongoDB query on "registrations" collection
    const regCount = await mongoose.connection.db.collection('registrations').countDocuments();
    console.log(`[debug-registrations] registrations collection count: ${regCount}`);

    // Method 2: Find all registrations with detailed logging
    console.log("[debug-registrations] Fetching all registrations...");
    const allRegistrations = await mongoose.connection.db.collection('registrations').find({}).toArray();
    console.log(`[debug-registrations] Found ${allRegistrations.length} registrations via direct query`);

    // Log details of each registration
    allRegistrations.forEach((reg: any, index: number) => {
      const adminInfo = reg.adminInfo as any;
      const businessInfo = reg.businessInfo as any;
      
      console.log(`[debug-registrations] Registration ${index + 1}:`, {
        id: reg._id,
        academyId: reg.academyId,
        userId: reg.userId,
        adminEmail: adminInfo?.email || "NO EMAIL",
        businessName: businessInfo?.businessName || "NO BUSINESS NAME",
        createdAt: reg.createdAt
      });
    });

    // Method 3: Check if there are any collections that might contain our data
    console.log("[debug-registrations] Checking raw MongoDB collections...");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c: any) => c.name);
    
    console.log("[debug-registrations] Available collections:", collectionNames);

    // Method 4: Try to find the specific user email in any registration
    const targetEmail = "shaziafarheen74@gmail.com";
    console.log(`[debug-registrations] Searching for email: ${targetEmail}`);
    
    const emailFound = allRegistrations.find((reg: any) => {
      const adminInfo = reg.adminInfo as any;
      return adminInfo?.email === targetEmail;
    });

    console.log(`[debug-registrations] Email match found:`, emailFound ? "YES" : "NO");
    if (emailFound) {
      console.log(`[debug-registrations] Matching registration details:`, emailFound);
    }

    return NextResponse.json({
      success: true,
      directCount: regCount,
      findManyCount: allRegistrations.length,
      targetEmailFound: !!emailFound,
      collections: collectionNames,
      registrations: allRegistrations.map((reg: any) => {
        const adminInfo = reg.adminInfo as any;
        const businessInfo = reg.businessInfo as any;
        return {
          id: reg._id,
          academyId: reg.academyId,
          userId: reg.userId,
          adminEmail: adminInfo?.email,
          businessName: businessInfo?.businessName,
          createdAt: reg.createdAt
        };
      })
    });

  } catch (err) {
    console.error("[debug-registrations] Error:", err);
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
