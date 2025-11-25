import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Test database connections
    const tests = [];
    
    await dbConnect();

    // Test 1: User collection connection
    try {
      const userCount = await UserModel.countDocuments();
      const sampleUser = await UserModel.findOne({})
        .select('_id name email userId academyId')
        .lean();
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
      const regCount = await RegistrationModel.countDocuments();
      const sampleReg = await RegistrationModel.findOne({})
        .select('_id userId academyId businessInfo adminInfo')
        .lean();
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

    // Test 3: Academy info from registrations
    try {
      const academyCount = await RegistrationModel.countDocuments();
      const sampleAcademy = await RegistrationModel.findOne({})
        .select('_id academyId businessInfo.businessName')
        .lean();
      tests.push({
        test: "Academy Info",
        status: "✅ Connected",
        count: academyCount, 
        sample: {
          _id: sampleAcademy?._id,
          academyId: sampleAcademy?.academyId,
          name: (sampleAcademy?.businessInfo as any)?.businessName
        }
      });
    } catch (err) {
      tests.push({
        test: "Academy Info",
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
