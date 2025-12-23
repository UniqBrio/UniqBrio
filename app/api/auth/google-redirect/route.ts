import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";
import { createToken, setSessionCookie } from "@/lib/auth";
import { COOKIE_NAMES, COOKIE_EXPIRY } from "@/lib/cookies";
import { cookies } from "next/headers";

// This endpoint is called after NextAuth Google OAuth completes
// It converts the NextAuth session to our custom session format
export async function GET(request: NextRequest) {
  console.log("[Google Redirect] Processing Google OAuth callback");

  try {
    // Get the NextAuth JWT token which contains user information
    const jwtToken = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log("[Google Redirect] NextAuth token found:", !!jwtToken);
    console.log("[Google Redirect] Token email:", jwtToken?.email);
    
    if (!jwtToken?.email) {
      console.error("[Google Redirect] No email in NextAuth token");
      return NextResponse.redirect(new URL("/login?error=no_session", request.url));
    }

    const email = jwtToken.email.toLowerCase().trim();
    console.log("[Google Redirect] Extracted email from token:", email);

    // Fetch user from database
    await dbConnect();
    const dbUser = await UserModel.findOne({ email });

    if (!dbUser) {
      console.error("[Google Redirect] User not found in database:", email);
      return NextResponse.redirect(new URL("/login?error=user_not_found", request.url));
    }

    console.log("[Google Redirect] User found:", dbUser.id, "registrationComplete:", dbUser.registrationComplete);

    // Create our custom session token with proper structure
    const sessionData = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role ?? "super_admin",
      verified: dbUser.verified,
      registrationComplete: dbUser.registrationComplete, // Added for performance optimization
      name: dbUser.name,
      lastActivity: Date.now(),
      tenantId: dbUser.academyId || dbUser.tenantId, // Will be undefined until registration
      userId: dbUser.userId, // Include userId in session
      academyId: dbUser.academyId, // Include academyId in session
    };

    console.log("[Google Redirect] Creating custom session token with data:", {
      id: sessionData.id,
      email: sessionData.email,
      role: sessionData.role,
      registrationComplete: dbUser.registrationComplete
    });
    
    // Get request metadata for session tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || request.headers.get('x-forwarded-host') || 'unknown';
    
    console.log("[Google Redirect] User-Agent:", userAgent);
    console.log("[Google Redirect] IP Address:", ipAddress);
    
    const sessionToken = await createToken(sessionData, '30d', {
      userAgent,
      ipAddress,
    });
    console.log("[Google Redirect] Custom session token created successfully");

    // Set cookies BEFORE creating redirect response using the cookies() API
    // This ensures they persist through the redirect
    console.log("[Google Redirect] Setting cookies via cookies() API...");
    const cookieStore = await cookies();
    
    cookieStore.set(COOKIE_NAMES.SESSION, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_EXPIRY.SESSION * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    
    cookieStore.set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_EXPIRY.LAST_ACTIVITY * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    
    // Verify cookies were set
    const verifySession = cookieStore.get(COOKIE_NAMES.SESSION);
    const verifyActivity = cookieStore.get(COOKIE_NAMES.LAST_ACTIVITY);
    console.log("[Google Redirect] Cookies set via API - Session:", !!verifySession, "Activity:", !!verifyActivity);

    // Update last login timestamp
    await UserModel.updateOne(
      { _id: dbUser._id },
      { $set: { lastLoginAt: new Date() } }
    );

    // Check registration status and redirect appropriately
    const redirectUrl = !dbUser.registrationComplete ? "/register" : "/dashboard";
    console.log("[Google Redirect] User registration status:", {
      registrationComplete: dbUser.registrationComplete,
      redirectingTo: redirectUrl,
      userId: dbUser.userId,
      academyId: dbUser.academyId
    });
    
    // Create redirect response - cookies are already set above
    console.log("[Google Redirect] ========== CREATING REDIRECT RESPONSE ==========");
    const response = NextResponse.redirect(new URL(redirectUrl, request.url), { status: 307 });
    
    console.log("[Google Redirect] Redirect details:", {
      status: 307,
      location: redirectUrl,
      registrationComplete: dbUser.registrationComplete
    });
    console.log("[Google Redirect] ========== RETURNING REDIRECT RESPONSE ==========");
    return response;

  } catch (error) {
    console.error("[Google Redirect] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=authentication_failed", request.url),
      { status: 307 }
    );
  }
}
