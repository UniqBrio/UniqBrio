import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("[test-user-academy] Testing user-academy-info API logic...");
    
    await dbConnect();
    
    // Simulate the specific user we know exists: shaziafarheen74@gmail.com
    const testEmail = "shaziafarheen74@gmail.com";
    
    // Find user by email
    const user = await UserModel.findOne({ email: testEmail }).lean();

    if (!user) {
      return NextResponse.json({ error: "Test user not found" }, { status: 404 });
    }

    console.log(`[test-user-academy] Found user: ${user.id}, email: ${user.email}, userId: ${user.userId}, academyId: ${user.academyId}`);

    // Get userName directly from User collection
    const userName = user.name || "";

    // Initialize variables
    let userId = user.userId || "";
    let academyId = user.academyId || "";
    let academyName = "";

    console.log(`[test-user-academy] Initial IDs - userId: ${userId}, academyId: ${academyId}`);

    // PRIMARY SEARCH: Look for registration by email in adminInfo
    console.log(`[test-user-academy] Searching registrations by email: ${testEmail}...`);
    
    const matchingDocs = await RegistrationModel.find({ 'adminInfo.email': testEmail }).lean();
    console.log(`[test-user-academy] Found ${matchingDocs.length} matching registrations`);
    
    let matchingRegistration = null;
    
    if (matchingDocs.length > 0) {
      const reg = matchingDocs[0]; // Take the first match
      matchingRegistration = reg;
      userId = reg.userId;
      academyId = reg.academyId;
      academyName = reg.businessInfo?.businessName || "";
      
      console.log(`[test-user-academy] Found matching registration by email!`, {
        userId,
        academyId,
        academyName,
        regId: reg._id
      });
    }

    if (!matchingRegistration) {
      console.log(`[test-user-academy] No registration found for email: ${testEmail}`);
      
      // Get all registrations for debugging
      const allDocs = await RegistrationModel.find({}).lean();
      
      return NextResponse.json({ 
        error: "No registration found",
        debugInfo: {
          userFound: true,
          totalRegistrations: allDocs.length,
          searchEmail: testEmail,
          registrationEmails: allDocs.map((r: any) => r.adminInfo?.email || "no email")
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId,
      academyId,
      academyName,
      userName,
      userEmail: testEmail,
      debugInfo: {
        userSource: "User collection",
        academyNameSource: "Registration.businessInfo.businessName",
        userIdFromUser: user.userId,
        academyIdFromUser: user.academyId,
        foundRegistrationId: (matchingRegistration as any)._id
      }
    });

  } catch (err) {
    console.error("[test-user-academy] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
