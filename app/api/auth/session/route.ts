import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { COOKIE_NAMES } from "@/lib/cookies"

// GET - Check current session status
export async function GET(request: NextRequest) {
  try {
    // Use Next.js cookies() API for better App Router compatibility
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION)?.value;
    
    // Fallback to request.cookies if needed
    const sessionValue = sessionCookie || request.cookies.get(COOKIE_NAMES.SESSION)?.value;
    
    console.log("[API] /api/auth/session - Cookie present:", !!sessionValue);

    if (!sessionValue) {
      return NextResponse.json({
        authenticated: false,
        session: null,
      })
    }

    const payload = await verifyToken(sessionValue)

    if (!payload) {
      return NextResponse.json({
        authenticated: false,
        session: null,
      })
    }

    // Return session data (excluding sensitive info)
    return NextResponse.json({
      authenticated: true,
      session: {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string,
        tenantId: payload.tenantId as string | undefined,
        name: payload.name as string | undefined,
      },
    })
  } catch (error) {
    console.error("[API] /api/auth/session error:", error)
    return NextResponse.json({
      authenticated: false,
      session: null,
      error: "Failed to verify session",
    })
  }
}
