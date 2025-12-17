/**
 * User Active Sessions API
 * 
 * Returns active sessions for the currently authenticated user.
 * Tenant-isolated and privacy-compliant.
 * 
 * GET /api/sessions/active
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getSessionCookie, verifyToken } from '@/lib/auth';
import Session from '@/models/Session';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get and verify session
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const payload = await verifyToken(sessionToken);
    if (!payload?.userId || !payload?.tenantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const userId = payload.userId as string;
    const tenantId = payload.tenantId as string;
    const currentJwtId = payload.jti as string;
    
    // Fetch all active sessions for this user (tenant-isolated)
    const sessions = await runWithTenantContext({ tenantId }, async () => {
      return await Session.getActiveSessions(userId, tenantId);
    });
    
    // Transform sessions for client
    const sessionsData = sessions.map((session: any) => ({
      sessionId: session._id.toString(),
      jwtId: session.jwtId,
      deviceType: session.deviceType || 'unknown',
      browser: session.browser || 'Unknown Browser',
      os: session.os || 'Unknown OS',
      country: session.country,
      lastActiveAt: session.lastActiveAt,
      issuedAt: session.issuedAt,
      isCurrent: session.jwtId === currentJwtId,
      // Do NOT expose: ipHash, ipAddress, userAgent (privacy)
    }));
    
    return NextResponse.json({
      success: true,
      sessions: sessionsData,
      total: sessionsData.length,
    });
  } catch (error) {
    console.error('[ActiveSessions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active sessions' },
      { status: 500 }
    );
  }
}
