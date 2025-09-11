import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionCookie, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get current session info
    const sessionToken = await getSessionCookie();
    let sessionInfo = "No session";
    let userEmail = "unknown";
    
    if (sessionToken) {
      try {
        const payload = await verifyToken(sessionToken);
        userEmail = (payload?.email && typeof payload.email === 'string') ? payload.email : "unknown";
        sessionInfo = `Session found for: ${userEmail}`;
      } catch (err) {
        sessionInfo = "Invalid session token";
      }
    }

    // Get all users (for debugging)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        academyId: true,
        verified: true,
        registrationComplete: true
      }
    });

    // Get all registrations (for debugging)
    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        userId: true,
        academyId: true,
        businessInfo: true,
        adminInfo: true
      }
    });

    return NextResponse.json({
      sessionInfo,
      currentUserEmail: userEmail,
      users: users,
      registrations: registrations,
      totalUsers: users.length,
      totalRegistrations: registrations.length
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
