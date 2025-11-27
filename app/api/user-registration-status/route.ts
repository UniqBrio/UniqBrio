import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";

// Route segment config for optimal performance
export const dynamic = 'force-dynamic'; // Always check fresh data for auth status
export const runtime = 'nodejs'; // Use Node.js runtime for DB access

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Verify authentication
    const sessionCookie = request.cookies.get("session")?.value || 
                          request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!sessionCookie) {
      console.log("[user-registration-status] No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenStartTime = Date.now();
    const payload = await verifyToken(sessionCookie);
    console.log(`[user-registration-status] Token verification took ${Date.now() - tokenStartTime}ms`);
    
    if (!payload?.email) {
      console.log("[user-registration-status] Invalid token payload");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[user-registration-status] Checking for user:", payload.email);

    // Get user registration status with performance monitoring
    const dbStartTime = Date.now();
    await dbConnect("uniqbrio");
    console.log(`[user-registration-status] DB connection took ${Date.now() - dbStartTime}ms`);
    
    const queryStartTime = Date.now();
    const user = await UserModel.findOne({ email: payload.email })
      .select('registrationComplete verified kycStatus createdAt')
      .lean()
      .maxTimeMS(2000); // Set MongoDB query timeout to 2 seconds
    console.log(`[user-registration-status] Query took ${Date.now() - queryStartTime}ms`);

    if (!user) {
      console.log("[user-registration-status] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[user-registration-status] Total request took ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      registrationComplete: user.registrationComplete,
      verified: user.verified,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error(`[user-registration-status] Error after ${Date.now() - startTime}ms:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}