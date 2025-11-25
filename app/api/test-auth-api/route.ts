import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("[test-auth-api] Testing authenticated user-academy-info...");
    
    await dbConnect();
    
    // Mock a session for the test user
    const mockEmail = "shaziafarheen74@gmail.com";
    
    console.log(`[test-auth-api] Testing with email: ${mockEmail}`);

    // Get user from database
    const user = await UserModel.findOne({ email: mockEmail }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[test-auth-api] Found user: ${user.id}, email: ${user.email}, userId: ${user.userId}, academyId: ${user.academyId}`);

    // Get userName directly from User collection
    const userName = user.name || "";

    // Initialize variables
    let userId = user.userId || "";
    let academyId = user.academyId || "";
    let academyName = "";

    console.log(`[test-auth-api] Initial IDs - userId: ${userId}, academyId: ${academyId}`);

    // PRIMARY SEARCH: Look for registration by email in adminInfo
    console.log(`[test-auth-api] Searching registrations by email: ${mockEmail}...`);
    
    const matchingDocs = await RegistrationModel.find({ 'adminInfo.email': mockEmail }).lean();
    console.log(`[test-auth-api] Found ${matchingDocs.length} matching registrations`);
    
    let matchingRegistration = null;
    
    if (matchingDocs.length > 0) {
      const reg = matchingDocs[0]; // Take the first match
      matchingRegistration = reg;
      userId = reg.userId;
      academyId = reg.academyId;
      academyName = reg.businessInfo?.businessName || "";
      
      console.log(`[test-auth-api] Found matching registration by email!`, {
        userId,
        academyId,
        academyName,
        regId: reg._id
      });
    }

    // FALLBACK: If User record has IDs but no email match, use those IDs to find registration
    if (!matchingRegistration && (user.userId || user.academyId)) {
      console.log(`[test-auth-api] Trying fallback with User.userId: ${user.userId}, User.academyId: ${user.academyId}`);
      
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const reg = await RegistrationModel.findOne({
        $or: whereConditions
      }).lean();
      
      if (reg) {
        matchingRegistration = reg;
        userId = reg.userId;
        academyId = reg.academyId;
        const businessInfo = reg.businessInfo as any;
        academyName = businessInfo?.businessName || "";
        console.log(`[test-auth-api] Found registration via User IDs:`, { userId, academyId, academyName });
      }
    }

    // If we found a registration, also update the User record with the IDs for future efficiency
    if (matchingRegistration && (!user.userId || !user.academyId)) {
      console.log(`[test-auth-api] Updating User record with IDs for future use...`);
      try {
        await UserModel.updateOne(
          { _id: (user as any)._id },
          { $set: {
            userId: userId,
            academyId: academyId
          }}
        );
        console.log(`[test-auth-api] User record updated with userId: ${userId}, academyId: ${academyId}`);
      } catch (updateError) {
        console.error(`[test-auth-api] Failed to update User record:`, updateError);
      }
    }

    // No academy collection anymore, academy name comes from registration

    return NextResponse.json({
      userId,
      academyId,
      academyName,
      userName,
      userEmail: mockEmail,
      // Debug info to verify data sources
      debug: {
        userSource: "User collection",
        academyNameSource: matchingRegistration?.businessInfo ? "Registration.businessInfo.businessName" : "Academy.name",
        userIdFromUser: user.userId,
        academyIdFromUser: user.academyId,
        foundRegistrationId: matchingRegistration?._id
      }
    });
  } catch (err) {
    console.error("[test-auth-api] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
