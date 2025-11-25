import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";
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

    await dbConnect();

    // Get all users (for debugging)
    const users = await UserModel.find({})
      .select('_id name email userId academyId verified registrationComplete')
      .lean();

    // Get all registrations (for debugging)
    const registrations = await RegistrationModel.find({})
      .select('_id userId academyId businessInfo adminInfo')
      .lean();

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
