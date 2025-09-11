import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[debug-registrations] Starting comprehensive registration debug...");
    
    // First, let's check database connectivity
    console.log("[debug-registrations] Testing database connection...");
    await prisma.$connect();
    console.log("[debug-registrations] Database connected successfully");

    // Check total counts in different ways
    console.log("[debug-registrations] Checking collection counts...");
    
    // Method 1: Using Prisma's count
    const regCount = await prisma.registration.count();
    console.log(`[debug-registrations] Prisma Registration count: ${regCount}`);

    // Method 2: Find all registrations with detailed logging
    console.log("[debug-registrations] Fetching all registrations...");
    const allRegistrations = await prisma.registration.findMany();
    console.log(`[debug-registrations] Found ${allRegistrations.length} registrations via findMany`);

    // Log details of each registration
    allRegistrations.forEach((reg, index) => {
      const adminInfo = reg.adminInfo as any;
      const businessInfo = reg.businessInfo as any;
      
      console.log(`[debug-registrations] Registration ${index + 1}:`, {
        id: reg.id,
        academyId: reg.academyId,
        userId: reg.userId,
        adminEmail: adminInfo?.email || "NO EMAIL",
        businessName: businessInfo?.businessName || "NO BUSINESS NAME",
        createdAt: reg.createdAt
      });
    });

    // Method 3: Check if there are any collections that might contain our data
    // This uses raw MongoDB queries through Prisma
    console.log("[debug-registrations] Checking raw MongoDB collections...");
    
    const result = await prisma.$runCommandRaw({
      listCollections: 1
    });
    
    console.log("[debug-registrations] Available collections:", result);

    // Method 4: Try to find the specific user email in any registration
    const targetEmail = "shaziafarheen74@gmail.com";
    console.log(`[debug-registrations] Searching for email: ${targetEmail}`);
    
    const emailFound = allRegistrations.find(reg => {
      const adminInfo = reg.adminInfo as any;
      return adminInfo?.email === targetEmail;
    });

    console.log(`[debug-registrations] Email match found:`, emailFound ? "YES" : "NO");
    if (emailFound) {
      console.log(`[debug-registrations] Matching registration details:`, emailFound);
    }

    return NextResponse.json({
      success: true,
      prismaCount: regCount,
      findManyCount: allRegistrations.length,
      targetEmailFound: !!emailFound,
      collections: result,
      registrations: allRegistrations.map(reg => {
        const adminInfo = reg.adminInfo as any;
        const businessInfo = reg.businessInfo as any;
        return {
          id: reg.id,
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
