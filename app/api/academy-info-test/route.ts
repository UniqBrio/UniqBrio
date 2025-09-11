import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log('[academy-info-test] GET request received');
    
    // For testing, let's try to fetch a sample academy
    const academies = await prisma.academy.findMany({
      take: 5,
      select: {
        academyId: true,
        name: true
      }
    });
    
    console.log('[academy-info-test] Found academies:', academies);
    
    return NextResponse.json({
      success: true,
      academies,
      testAcademyName: academies[0]?.name || "No academy found"
    });
  } catch (err) {
    console.error('[academy-info-test] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
