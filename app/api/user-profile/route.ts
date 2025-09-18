import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session token
    const decoded = await verifyToken(sessionToken);
    
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Find user by email from the token
    const user = await prisma.user.findFirst({
      where: { 
        email: decoded.email as string
      },
      select: {
        userId: true,
        academyId: true,
        name: true,
        email: true,
        kycStatus: true,
        registrationComplete: true,
        createdAt: true,
        updatedAt: true,
        verified: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error("[user-profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}