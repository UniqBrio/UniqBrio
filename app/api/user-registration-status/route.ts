import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const sessionCookie = request.cookies.get("session")?.value || 
                          request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!sessionCookie) {
      console.log("[user-registration-status] No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionCookie);
    if (!payload?.email) {
      console.log("[user-registration-status] Invalid token payload");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[user-registration-status] Checking for user:", payload.email);

    // Get user registration status
    await dbConnect();
    const user = await UserModel.findOne({ email: payload.email }).select(
      'registrationComplete verified kycStatus createdAt'
    );

    if (!user) {
      console.log("[user-registration-status] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      registrationComplete: user.registrationComplete,
      verified: user.verified,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error("[user-registration-status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}