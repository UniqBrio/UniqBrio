import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log('[academy-info-test] GET request received');
    await dbConnect();
    
    // For testing, let's try to fetch a sample academy from registrations
    const registrations = await RegistrationModel.find({})
      .limit(5)
      .select('academyId businessInfo.businessName')
      .lean();
    
    const academies = registrations.map(reg => ({
      academyId: reg.academyId,
      name: (reg.businessInfo as any)?.businessName || 'Unknown'
    }));
    
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
