import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, deleteSessionCookie } from '@/lib/auth';
import { revokeAllUserSessions, extractSessionFromJWT } from '@/lib/session-store';
import { logAuthEvent, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * POST /api/auth/logout-all
 * Logout all sessions for the current user within their tenant
 * Revokes all active sessions and clears current session cookie
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Logout All API] Processing logout all sessions request');

    // Get current session info
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionToken) {
      console.log('[Logout All API] No session cookie found');
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    // Extract session information
    const { jwtPayload, sessionContext } = await extractSessionFromJWT(sessionToken);

    if (!jwtPayload || !sessionContext) {
      console.log('[Logout All API] Could not extract session context');
      return NextResponse.json({
        success: false,
        message: 'Invalid session'
      }, { status: 401 });
    }

    const userInfo = {
      id: String(jwtPayload.id || jwtPayload.userId),
      name: String(jwtPayload.name || jwtPayload.email),
      email: String(jwtPayload.email),
      role: String(jwtPayload.role || 'unknown'),
      tenantId: String(sessionContext.tenantId),
    };

    // Revoke all sessions for this user within their tenant
    const revokedCount = await revokeAllUserSessions(
      sessionContext.userId,
      sessionContext.tenantId,
      'logout_all'
    );

    console.log(`[Logout All API] Revoked ${revokedCount} sessions for user:`, jwtPayload.email);

    // Clear current session cookies
    await deleteSessionCookie();
    cookieStore.delete(COOKIE_NAMES.LAST_ACTIVITY);
    
    // Also clear NextAuth cookies for compatibility
    cookieStore.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
    cookieStore.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' });
    cookieStore.set('next-auth.csrf-token', '', { maxAge: 0, path: '/' });

    // Create audit log
    try {
      const ipAddress = getClientIp(request.headers);
      const userAgent = getUserAgent(request.headers);
      
      await logAuthEvent(
        'LogoutAll',
        userInfo.id,
        userInfo.name,
        userInfo.email,
        userInfo.role,
        userInfo.tenantId,
        ipAddress,
        userAgent,
        `logout-all-${Date.now()}` // Use unique session ID for logout all event
      );
    } catch (auditError) {
      console.error('[Logout All API] Failed to create audit log:', auditError);
    }

    console.log('[Logout All API] Logout all completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `Logged out from ${revokedCount} sessions`,
      revokedSessions: revokedCount
    });

  } catch (error) {
    console.error('[Logout All API] Error during logout all:', error);

    // Still clear current session cookies even if database operations fail
    try {
      await deleteSessionCookie();
      const cookieStore = await cookies();
      cookieStore.delete(COOKIE_NAMES.LAST_ACTIVITY);
    } catch (cookieError) {
      console.error('[Logout All API] Error clearing cookies:', cookieError);
    }

    return NextResponse.json({
      success: false,
      message: 'Logout all failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}