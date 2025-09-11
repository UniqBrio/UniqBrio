import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("[auth-debug] Starting auth debug...");
    
    // Check session cookie
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({
        status: "No session cookie found",
        authenticated: false,
        step: "session_cookie_missing"
      });
    }

    console.log("[auth-debug] Session cookie found, verifying token...");
    
    // Verify token
    const payload = await verifyToken(sessionToken);
    if (!payload) {
      return NextResponse.json({
        status: "Token verification failed",
        authenticated: false,
        step: "token_verification_failed"
      });
    }

    console.log("[auth-debug] Token verified, payload:", payload);

    return NextResponse.json({
      status: "Authenticated",
      authenticated: true,
      userEmail: payload.email,
      payload: payload,
      step: "complete"
    });

  } catch (error) {
    console.error("[auth-debug] Error:", error);
    return NextResponse.json({
      status: "Error during authentication check",
      authenticated: false,
      error: error instanceof Error ? error.message : String(error),
      step: "error"
    }, { status: 500 });
  }
}
