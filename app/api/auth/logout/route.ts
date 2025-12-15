import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionCookie, verifyToken, deleteSessionCookie } from '@/lib/auth';
import { revokeSession, extractSessionFromJWT } from '@/lib/session-store';
import { logAuthEvent, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * POST /api/auth/logout
 * Enhanced logout with session store revocation and audit logging
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Logout API] Processing logout request');

    // Get user info before deleting session for audit log
    let userInfo = null;
    let sessionRevoked = false;

    try {
      const sessionToken = await getSessionCookie();
      if (sessionToken) {
        // Extract session information for revocation
        const { jwtPayload, sessionContext } = await extractSessionFromJWT(sessionToken);

        if (jwtPayload && sessionContext) {
          userInfo = {
            id: String(jwtPayload.id || jwtPayload.userId),
            name: String(jwtPayload.name || jwtPayload.email),
            email: String(jwtPayload.email),
            role: String(jwtPayload.role || 'unknown'),
            tenantId: String(sessionContext.tenantId),
          };

          // Revoke the session in the database
          sessionRevoked = await revokeSession(
            sessionContext.jwtId,
            sessionContext.tenantId,
            'logout'
          );

          console.log('[Logout API] Session revoked:', sessionRevoked, 'for user:', jwtPayload.email);
        } else {
          // Fallback to basic JWT verification if session store fails
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
      }
    } catch (error) {
      console.error('[Logout API] Error processing session:', error);
    }

    // Clear authentication cookies
    await deleteSessionCookie();
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAMES.LAST_ACTIVITY);
    
    // Also clear NextAuth cookies for compatibility
    cookieStore.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
    cookieStore.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' });
    cookieStore.set('next-auth.csrf-token', '', { maxAge: 0, path: '/' });

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

    console.log('[Logout API] Logout completed successfully');
    
    return NextResponse.json({ 
      success: true,
      sessionRevoked: sessionRevoked
    });

  } catch (error) {
    console.error('[Logout API] Error during logout:', error);
    
    // Still clear cookies even if other operations fail
    try {
      await deleteSessionCookie();
      const cookieStore = await cookies();
      cookieStore.delete(COOKIE_NAMES.LAST_ACTIVITY);
    } catch (cookieError) {
      console.error('[Logout API] Error clearing cookies:', cookieError);
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out (with errors)'
    });
  }
}
