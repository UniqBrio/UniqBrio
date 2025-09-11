import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Test database connections
    const tests = [];
    
    // Test 1: User collection connection
    try {
      const userCount = await prisma.user.count();
      const sampleUser = await prisma.user.findFirst({
        select: { id: true, name: true, email: true, userId: true, academyId: true }
      });
      tests.push({
        test: "User Collection",
        status: "✅ Connected",
        count: userCount,
        sample: sampleUser
      });
    } catch (err) {
      tests.push({
        test: "User Collection",
        status: "❌ Failed",
        error: err instanceof Error ? err.message : String(err)
      });
    }

    // Test 2: Registration collection connection  
    try {
      const regCount = await prisma.registration.count();
      const sampleReg = await prisma.registration.findFirst({
        select: { id: true, userId: true, academyId: true, businessInfo: true, adminInfo: true }
      });
      tests.push({
        test: "Registration Collection", 
        status: "✅ Connected",
        count: regCount,
        sample: sampleReg
      });
    } catch (err) {
      tests.push({
        test: "Registration Collection",
        status: "❌ Failed", 
        error: err instanceof Error ? err.message : String(err)
      });
    }

    // Test 3: Academy collection connection
    try {
      const academyCount = await prisma.academy.count();
      const sampleAcademy = await prisma.academy.findFirst({
        select: { id: true, academyId: true, name: true }
      });
      tests.push({
        test: "Academy Collection",
        status: "✅ Connected",
        count: academyCount, 
        sample: sampleAcademy
      });
    } catch (err) {
      tests.push({
        test: "Academy Collection",
        status: "❌ Failed",
        error: err instanceof Error ? err.message : String(err)
      });
    }

    return NextResponse.json({ 
      message: "Database connection test results",
      timestamp: new Date().toISOString(),
      tests
    });
  } catch (error) {
    return NextResponse.json({
      message: "Database test failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
