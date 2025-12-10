
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { COOKIE_NAMES } from "@/lib/cookies";
import mongoose from "mongoose";

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await dbConnect();
    
    // Enforce authenticated, verified user and derive identity from session
    console.log("[Registration API] ========== STARTING REGISTRATION REQUEST ==========");
    console.log("[Registration API] Request URL:", req.url);
    console.log("[Registration API] Request method:", req.method);
    
    // Log all headers for debugging
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = key.toLowerCase() === 'cookie' ? value : '[hidden]';
    });
    console.log("[Registration API] Request headers:", allHeaders);
    
    // Try to get cookie from both the cookies() function and request headers
    console.log("[Registration API] Attempting to get session cookie via cookies()...");
    let sessionToken = await getSessionCookie();
    console.log("[Registration API] Session token from cookies():", sessionToken ? 'FOUND' : 'NOT FOUND');
    
    // If not found via cookies(), try to parse from request headers
    if (!sessionToken) {
      console.log("[Registration API] Trying to parse from request headers...");
      const cookieHeader = req.headers.get('cookie');
      console.log("[Registration API] Raw cookie header:", cookieHeader || 'NONE');
      
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        console.log("[Registration API] Parsed cookies:", cookies.map(c => {
          const parts = c.split('=');
          return parts[0];
        }));
        
        const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAMES.SESSION}=`));
        if (sessionCookie) {
          sessionToken = sessionCookie.split('=')[1];
          console.log("[Registration API] Session token found in header cookie");
        } else {
          console.log("[Registration API] Session cookie name we're looking for:", COOKIE_NAMES.SESSION);
        }
      } else {
        console.log("[Registration API] No cookie header present in request!");
      }
    }
    
    console.log("[Registration API] Final session token status:", !!sessionToken);
    
    if (!sessionToken) {
      console.error("[Registration API] No session token found - user not authenticated");
      await session.abortTransaction();
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    console.log("[Registration API] Verifying session token...");
    const payload = await verifyToken(sessionToken);
    console.log("[Registration API] Token payload:", payload ? { email: payload.email, id: payload.id } : null);
    
    if (!payload?.email || typeof payload.email !== "string") {
      console.error("[Registration API] Invalid session payload:", payload);
      await session.abortTransaction();
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    
    console.log("[Registration API] Session verified for email:", payload.email);

    const body = await req.json();
    const email = payload.email as string;

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

    // Validate required fields from request body
    if (!body?.adminInfo?.fullName) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    
    if (!body?.businessInfo?.businessName) {
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
    await UserModel.updateOne(
      { email },
      {
        $set: {
          name: body.adminInfo.fullName,
          phone: body?.adminInfo?.phone || existingUser.phone,
          userId: finalUserId,
          academyId: finalAcademyId,
          tenantId: finalAcademyId, // Set tenantId = academyId for multi-tenant isolation
        }
      },
      { session }
    );

    // Create or update Registration record
    await RegistrationModel.findOneAndUpdate(
      { academyId: finalAcademyId },
      {
        $set: {
          userId: finalUserId!,
          tenantId: finalAcademyId!,
          businessInfo: body?.businessInfo || {},
          adminInfo: body?.adminInfo || {},
          preferences: body?.preferences || {},
        }
      },
      { 
        upsert: true, 
        session,
        new: true 
      }
    );

    // Mark registration as complete
    await UserModel.updateOne(
      { email },
      { $set: { registrationComplete: true } },
      { session }
    );

    await session.commitTransaction();
    
    // CRITICAL: Update session token with new IDs after registration
    // This ensures subsequent API calls have proper tenant isolation
    console.log("[Registration API] Updating session token with new IDs...");
    const { createToken, setSessionCookie } = await import("@/lib/auth");
    
    // Get fresh user data with updated IDs
    const updatedUser = await UserModel.findOne({ email });
    
    if (updatedUser) {
      const newSessionData = {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role ?? "super_admin",
        verified: updatedUser.verified,
        name: updatedUser.name,
        lastActivity: Date.now(),
        tenantId: updatedUser.academyId || updatedUser.tenantId,
        userId: updatedUser.userId,
        academyId: updatedUser.academyId,
      };
      
      console.log("[Registration API] Creating new session with IDs:", {
        userId: newSessionData.userId,
        academyId: newSessionData.academyId,
        tenantId: newSessionData.tenantId
      });
      
      const newSessionToken = await createToken(newSessionData);
      await setSessionCookie(newSessionToken);
      
      console.log("[Registration API] Session token updated successfully");
    }
    
    return NextResponse.json({ 
      success: true, 
      userId: finalUserId, 
      academyId: finalAcademyId 
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  } finally {
    session.endSession();
  }
}