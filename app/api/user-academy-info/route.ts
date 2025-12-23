import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { getSessionCookie, verifyToken } from "@/lib/auth";

// Cache for 5 minutes (user info changes infrequently)
export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token and get user info
    const payload = await verifyToken(sessionToken);
    if (!payload?.email || typeof payload.email !== 'string') {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userEmail = payload.email;

    // Get user details from User collection
    await dbConnect();
    const user = await UserModel.findOne({ email: userEmail })
      .select('userId academyId name email')
      .lean();
    if (!user) {
      console.log(`[user-academy-info] User not found for email: ${userEmail}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[user-academy-info] Found user: ${user.id}, email: ${user.email}, userId: ${user.userId}, academyId: ${user.academyId}`);

    // Get userName directly from User collection
    const userName = user.name || "";

    // Initialize variables
    let userId = user.userId || "";
    let academyId = user.academyId || "";
    let academyName = "";
    let businessLogoUrl = "";
    let profilePictureUrl = "";
    let businessNameUploadUrl = "";
    let tagline = "";

    console.log(`[user-academy-info] Initial IDs - userId: ${userId}, academyId: ${academyId}`);

    // PRIMARY SEARCH: Look for registration by email in adminInfo
    console.log(`[user-academy-info] Searching registrations by email: ${userEmail}...`);
    
    let matchingRegistration = await RegistrationModel.findOne({
      'adminInfo.email': userEmail
    }).lean();

    console.log(`[user-academy-info] Found ${matchingRegistration ? 1 : 0} matching registrations`);
    
    if (matchingRegistration) {
      userId = matchingRegistration.userId;
      academyId = matchingRegistration.academyId;
      const businessInfo = matchingRegistration.businessInfo as any;
      academyName = businessInfo?.businessName || "";
      // Support both new and old field names for backward compatibility
      businessLogoUrl = businessInfo?.businessLogoUrl || businessInfo?.logo || "";
      profilePictureUrl = businessInfo?.profilePictureUrl || businessInfo?.profilePicture || "";
      businessNameUploadUrl = businessInfo?.businessNameUploadUrl || businessInfo?.businessNameFile || "";
      tagline = businessInfo?.tagline || "";
      
      console.log(`[user-academy-info] Found matching registration by email!`, {
        userId,
        academyId,
        academyName,
        businessLogoUrl,
        profilePictureUrl,
        businessNameUploadUrl,
        regId: matchingRegistration._id
      });
    }

    // FALLBACK: If User record has IDs but no email match, use those IDs to find registration
    if (!matchingRegistration && (user.userId || user.academyId)) {
      console.log(`[user-academy-info] Trying fallback with User.userId: ${user.userId}, User.academyId: ${user.academyId}`);
      
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const reg = await RegistrationModel.findOne({ 
        $or: whereConditions
      });
      
      if (reg) {
        matchingRegistration = reg;
        userId = reg.userId;
        academyId = reg.academyId;
        const businessInfo = reg.businessInfo as any;
        academyName = businessInfo?.businessName || "";
        // Support both new and old field names for backward compatibility
        businessLogoUrl = businessInfo?.businessLogoUrl || businessInfo?.logo || "";
        profilePictureUrl = businessInfo?.profilePictureUrl || businessInfo?.profilePicture || "";
        businessNameUploadUrl = businessInfo?.businessNameUploadUrl || businessInfo?.businessNameFile || "";
        tagline = businessInfo?.tagline || "";
        console.log(`[user-academy-info] Found registration via User IDs:`, { userId, academyId, academyName, businessLogoUrl, profilePictureUrl, businessNameUploadUrl });
      }
    }

    // If we found a registration, also update the User record with the IDs for future efficiency
    if (matchingRegistration && (!user.userId || !user.academyId)) {
      console.log(`[user-academy-info] Updating User record with IDs for future use...`);
      try {
        await UserModel.findByIdAndUpdate(user._id, {
          $set: {
            userId: userId,
            academyId: academyId
          }
        });
        console.log(`[user-academy-info] User record updated with userId: ${userId}, academyId: ${academyId}`);
      } catch (updateError) {
        console.error(`[user-academy-info] Failed to update User record:`, updateError);
      }
    }

    // Academy name comes from registration businessInfo only (no separate Academy collection)

    return NextResponse.json({
      userId,
      academyId,
      academyName,
      userName,
      userEmail: userEmail,
      businessLogoUrl,
      businessNameUploadUrl,
      profilePictureUrl,
      tagline,
      // Debug info to verify data sources
      debug: {
        userSource: "User collection",
        academyNameSource: matchingRegistration?.businessInfo ? "Registration.businessInfo.businessName" : "Academy.name",
        userIdFromUser: user.userId,
        academyIdFromUser: user.academyId
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
