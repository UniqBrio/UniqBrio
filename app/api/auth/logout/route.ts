"use server"

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { logAuthEvent, getClientIp, getUserAgent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    // Get user info before deleting session for audit log
    let userInfo = null;
    try {
      const sessionToken = await getSessionCookie();
      if (sessionToken) {
        const payload = await verifyToken(sessionToken) as any;
        if (payload && payload.id && payload.email) {
          userInfo = {
            id: String(payload.id),
            name: String(payload.name || payload.email),
            email: String(payload.email),
            role: String(payload.role || 'unknown'),
            tenantId: String(payload.tenantId || 'default'),
          };
        }
      }
    } catch (error) {
      console.error('[Logout API] Error getting user info for audit:', error);
    }

    const response = NextResponse.json({ success: true });
    
    // Clear authentication cookies
    response.cookies.set('token', '', { maxAge: 0 });
    response.cookies.set('next-auth.session-token', '', { maxAge: 0 });
    response.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0 });
    response.cookies.set('next-auth.csrf-token', '', { maxAge: 0 });

    // Create audit log for logout if we have user info
    if (userInfo) {
      try {
        const ipAddress = getClientIp(request.headers);
        const userAgent = getUserAgent(request.headers);
        
        await logAuthEvent(
          'Logout',
          userInfo.id,
          userInfo.name,
          userInfo.email,
          userInfo.role,
          userInfo.tenantId,
          ipAddress,
          userAgent
        );
      } catch (auditError) {
        console.error('[Logout API] Failed to create audit log:', auditError);
      }
    }
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
