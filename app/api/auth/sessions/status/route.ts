import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { extractSessionFromJWT, getUserActiveSessions } from '@/lib/session-store';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * GET /api/auth/sessions/status
 * Get current session status and user's active sessions count
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Session Status API] Processing session status request');

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionToken) {
      return NextResponse.json({
        authenticated: false,
        session: null,
        activeSessions: 0
      });
    }

    // Extract and validate session
    const { jwtPayload, sessionContext, error } = await extractSessionFromJWT(sessionToken);

    if (!jwtPayload || !sessionContext) {
      return NextResponse.json({
        authenticated: false,
        session: null,
        activeSessions: 0,
        error: error || 'Invalid session'
      });
    }

    // Get count of active sessions for this user
    let activeSessionsCount = 0;
    try {
      const activeSessions = await getUserActiveSessions(
        sessionContext.userId,
        sessionContext.tenantId
      );
      activeSessionsCount = activeSessions.length;
    } catch (error) {
      console.error('[Session Status API] Error getting active sessions count:', error);
    }

    const sessionInfo = {
      id: sessionContext.sessionId,
      userId: sessionContext.userId,
      email: String(jwtPayload.email),
      role: sessionContext.role,
      name: String(jwtPayload.name),
      tenantId: sessionContext.tenantId,
      academyId: String(jwtPayload.academyId),
      verified: Boolean(jwtPayload.verified),
      lastActivity: jwtPayload.lastActivity,
    };

    console.log('[Session Status API] Session status retrieved for user:', jwtPayload.email);

    return NextResponse.json({
      authenticated: true,
      session: sessionInfo,
      activeSessions: activeSessionsCount
    });

  } catch (error) {
    console.error('[Session Status API] Error getting session status:', error);
    
    return NextResponse.json({
      authenticated: false,
      session: null,
      activeSessions: 0,
      error: 'Session status check failed'
    });
  }
}