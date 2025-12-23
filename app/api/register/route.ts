
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { COOKIE_NAMES } from "@/lib/cookies";
import mongoose from "mongoose";

const businessInfoFields = [
  "businessName",
  "legalEntityName",
  "businessEmail",
  "phoneNumber",
  "industryType",
  "servicesOffered",
  "studentSize",
  "staffCount",
  "country",
  "state",
  "city",
  "address",
  "website",
  "preferredLanguage",
  "pincode",
  "taxId",
  "businessLogoUrl",
  "businessNameUploadUrl",
  "profilePictureUrl",
] as const;

const adminInfoFields = ["fullName", "email", "phone"] as const;

const preferencesFields = ["referralSource", "otherReferral", "featuresOfInterest"] as const;

const pickAllowed = (source: unknown, keys: readonly string[]) => {
  if (!source || typeof source !== "object") return {} as Record<string, unknown>;
  return keys.reduce<Record<string, unknown>>((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      acc[key] = (source as Record<string, unknown>)[key];
    }
    return acc;
  }, {});
};

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await dbConnect();
    
    console.log("[Registration API] ========== STARTING REGISTRATION REQUEST ==========");
    console.log("[Registration API] Request URL:", req.url);
    console.log("[Registration API] Request method:", req.method);
    
    const body = await req.json();
    let email: string;
    let isAuthenticatedSession = false;
    
    // Try to get session token (for logged-in users)
    console.log("[Registration API] Attempting to get session cookie via cookies()...");
    let sessionToken = await getSessionCookie();
    console.log("[Registration API] Session token from cookies():", sessionToken ? 'FOUND' : 'NOT FOUND');
    
    // If not found via cookies(), try to parse from request headers
    if (!sessionToken) {
      console.log("[Registration API] Trying to parse from request headers...");
      const cookieHeader = req.headers.get('cookie');
      
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAMES.SESSION}=`));
        if (sessionCookie) {
          sessionToken = sessionCookie.split('=')[1];
          console.log("[Registration API] Session token found in header cookie");
        }
      }
    }
    
    // If we have a session token, verify it and use email from session
    if (sessionToken) {
      console.log("[Registration API] Verifying session token...");
      const payload = await verifyToken(sessionToken);
      console.log("[Registration API] Token payload:", payload ? { email: payload.email, id: payload.id } : null);
      
      if (payload?.email && typeof payload.email === "string") {
        email = payload.email as string;
        isAuthenticatedSession = true;
        console.log("[Registration API] Using email from authenticated session:", email);
      } else {
        console.log("[Registration API] Invalid session payload, will check for email in body");
        // Don't return error yet, check if we can get email from body
        email = body?.adminInfo?.email as string;
      }
    } else {
      // No session token - this is a first-time user who verified email but hasn't logged in
      // Get email from the request body (should be provided by the form)
      console.log("[Registration API] No session token - checking for email in request body");
      email = body?.adminInfo?.email as string;
      
      if (!email) {
        console.error("[Registration API] No email found in session or request body");
        await session.abortTransaction();
        return NextResponse.json({ error: "Email is required for registration" }, { status: 400 });
      }
      console.log("[Registration API] Using email from request body:", email);
    }

    // Find user by email (Mongoose)
    const existingUser = await UserModel.findOne({ email }).session(session);
    if (!existingUser) {
      await session.abortTransaction();
      return NextResponse.json({ error: "No user found for this session." }, { status: 404 });
    }

    if (!existingUser.verified) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Email not verified." }, { status: 403 });
    }

    if (existingUser.registrationComplete) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Registration already completed." }, { status: 400 });
    }

    const sanitizedBusinessInfo = pickAllowed(body?.businessInfo, businessInfoFields);
    const sanitizedAdminInfo = pickAllowed(body?.adminInfo, adminInfoFields);
    const sanitizedPreferences = pickAllowed(body?.preferences, preferencesFields);

    console.log("[Registration API] Sanitized business info keys:", Object.keys(sanitizedBusinessInfo));
    console.log("[Registration API] Sanitized admin info:", sanitizedAdminInfo);
    console.log("[Registration API] Sanitized preferences keys:", Object.keys(sanitizedPreferences));

    const servicesOffered = sanitizedBusinessInfo["servicesOffered"];
    if (servicesOffered !== undefined && !Array.isArray(servicesOffered)) {
      delete sanitizedBusinessInfo["servicesOffered"];
    }

    const featuresOfInterest = sanitizedPreferences["featuresOfInterest"];
    if (featuresOfInterest !== undefined && !Array.isArray(featuresOfInterest)) {
      delete sanitizedPreferences["featuresOfInterest"];
    }

    // Validate required fields from sanitized payload
    if (!sanitizedAdminInfo["fullName"]) {
      console.error("[Registration API] Validation failed: missing fullName", sanitizedAdminInfo);
      await session.abortTransaction();
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    
    if (!sanitizedBusinessInfo["businessName"]) {
      console.error("[Registration API] Validation failed: missing businessName", sanitizedBusinessInfo);
      await session.abortTransaction();
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    // Check if user already has a valid registration with proper IDs
    const existingRegistration = await RegistrationModel.findOne({
      $or: [
        { userId: existingUser.userId || undefined },
        { academyId: existingUser.academyId || undefined }
      ]
    }).session(session);

    let finalAcademyId: string;
    let finalUserId: string;
    let sequenceNumber: number;

    // If user has valid IDs already, use them
    if (existingUser.academyId && existingUser.userId && 
        /^AC\d+$/.test(existingUser.academyId) && /^AD\d+$/.test(existingUser.userId)) {
      finalAcademyId = existingUser.academyId;
      finalUserId = existingUser.userId;
    } 
    // If existing registration found, use its IDs
    else if (existingRegistration) {
      finalAcademyId = existingRegistration.academyId;
      finalUserId = existingRegistration.userId;
    } 
    // Generate new synchronized sequential IDs
    else {
      // Get the highest sequence number from both collections to ensure sync
      const allRegistrations = await RegistrationModel.find({
        academyId: { $regex: /^AC\d+$/ }
      }).select('academyId').session(session);
      
      const allUsers = await UserModel.find({
        userId: { $regex: /^AD\d+$/ }
      }).select('userId').session(session);

      // Extract numeric IDs from academyIds
      const academyNumbers = allRegistrations
        .map((reg: any) => parseInt(reg.academyId.replace('AC', '')))
        .filter((num: number) => !isNaN(num));

      // Extract numeric IDs from userIds
      const userNumbers = allUsers
        .map((user: any) => user.userId ? parseInt(user.userId.replace('AD', '')) : 0)
        .filter((num: number) => !isNaN(num) && num > 0);

      // Get the maximum sequence number from both collections
      const maxAcademyNum = academyNumbers.length > 0 ? Math.max(...academyNumbers) : 0;
      const maxUserNum = userNumbers.length > 0 ? Math.max(...userNumbers) : 0;
      
      // Use the higher of the two to ensure synchronization
      sequenceNumber = Math.max(maxAcademyNum, maxUserNum) + 1;
      
      // Generate synchronized IDs with the same sequence number
      finalAcademyId = `AC${sequenceNumber.toString().padStart(6, "0")}`;
      finalUserId = `AD${sequenceNumber.toString().padStart(6, "0")}`;
      
      console.log(`[Register] Generated synchronized IDs: userId=${finalUserId}, academyId=${finalAcademyId}, sequence=${sequenceNumber}`);
    }

    // Update basic user info and persist IDs
    console.log("[Registration API] Updating user with IDs:", { email, finalUserId, finalAcademyId });
    try {
      await UserModel.updateOne(
        { email },
        {
          $set: {
            name: sanitizedAdminInfo["fullName"] as string,
            phone: (sanitizedAdminInfo["phone"] as string | undefined) || existingUser.phone,
            userId: finalUserId,
            academyId: finalAcademyId,
            tenantId: finalAcademyId, // Set tenantId = academyId for multi-tenant isolation
          }
        },
        { session }
      );
      console.log("[Registration API] User updated successfully");
    } catch (updateError) {
      console.error("[Registration API] Failed to update user:", updateError);
      throw updateError;
    }

    // Create or update Registration record
    console.log("[Registration API] Creating/updating registration record for academyId:", finalAcademyId);
    try {
      await RegistrationModel.findOneAndUpdate(
        { academyId: finalAcademyId },
        {
          $set: {
            userId: finalUserId!,
            tenantId: finalAcademyId!,
            businessInfo: sanitizedBusinessInfo,
            adminInfo: sanitizedAdminInfo,
            preferences: sanitizedPreferences,
          }
        },
        { 
          upsert: true, 
          session,
          new: true 
        }
      );
      console.log("[Registration API] Registration record saved successfully");
    } catch (regError) {
      console.error("[Registration API] Failed to save registration:", regError);
      throw regError;
    }

    // Mark registration as complete
    console.log("[Registration API] Marking registration as complete for:", email);
    try {
      await UserModel.updateOne(
        { email },
        { $set: { registrationComplete: true } },
        { session }
      );
      console.log("[Registration API] Registration marked complete");
    } catch (completeError) {
      console.error("[Registration API] Failed to mark registration complete:", completeError);
      throw completeError;
    }

    console.log("[Registration API] Committing transaction...");
    await session.commitTransaction();
    console.log("[Registration API] Transaction committed successfully");
    
    // CRITICAL: Create or update session token with new IDs after registration
    // This ensures subsequent API calls have proper tenant isolation
    // For first-time users (no existing session), this creates their first session
    console.log("[Registration API] Creating/updating session token with new IDs...");
    const { createToken, setSessionCookie } = await import("@/lib/auth");
    
    // Get fresh user data with updated IDs
    const updatedUser = await UserModel.findOne({ email });
    
    if (updatedUser) {
      const newSessionData = {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role ?? "super_admin",
        verified: updatedUser.verified,
        registrationComplete: true, // Added for performance optimization
        name: updatedUser.name,
        lastActivity: Date.now(),
        tenantId: updatedUser.academyId || updatedUser.tenantId,
        userId: updatedUser.userId,
        academyId: updatedUser.academyId,
      };
      
      console.log("[Registration API] Creating session with IDs:", {
        userId: newSessionData.userId,
        academyId: newSessionData.academyId,
        tenantId: newSessionData.tenantId,
        isFirstTimeUser: !isAuthenticatedSession
      });
      
      // Get request metadata for session tracking
      const userAgent = req.headers.get('user-agent') || undefined;
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      const ipAddress = forwardedFor?.split(',')[0] || realIp || req.headers.get('x-forwarded-host') || 'unknown';
      
      const newSessionToken = await createToken(newSessionData, '30d', {
        userAgent,
        ipAddress,
      });
      await setSessionCookie(newSessionToken);
      
      // Also set last activity cookie
      const cookieStore = await import("next/headers").then(m => m.cookies());
      const { COOKIE_EXPIRY } = await import("@/lib/cookies");
      (await cookieStore).set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIE_EXPIRY.LAST_ACTIVITY * 24 * 60 * 60,
        path: "/",
      });
      
      console.log("[Registration API] Session token updated successfully");
      
      // Send registration completion notification to admin
      try {
        console.log("[Registration API] Sending registration completion notification to admin");
        const { generateRegistrationCompleteNotification, sendEmail } = await import("@/lib/email");
        
        const notificationData = generateRegistrationCompleteNotification({
          businessName: (sanitizedBusinessInfo["businessName"] as string) || 'N/A',
          name: updatedUser.name || (sanitizedAdminInfo["fullName"] as string) || 'N/A',
          email: updatedUser.email,
          phone: updatedUser.phone || (sanitizedAdminInfo["phone"] as string) || 'N/A',
          planChoosed: updatedUser.planChoosed || 'free',
          registrationDate: new Date(),
          academyId: finalAcademyId,
          userId: finalUserId,
        });
        
        await sendEmail(notificationData);
        console.log("[Registration API] Admin notification sent successfully");
      } catch (notificationError) {
        // Don't fail registration if notification fails - just log it
        console.error("[Registration API] Failed to send admin notification:", notificationError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      userId: finalUserId, 
      academyId: finalAcademyId 
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error("[Registration API] Registration error:", error);
    console.error("[Registration API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("[Registration API] Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ 
      error: "Registration failed.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    session.endSession();
  }
}