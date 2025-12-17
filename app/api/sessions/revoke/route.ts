/**
 * Revoke Session API
 * 
 * Revokes a specific session by jwtId.
 * Users can revoke their own sessions.
 * Admins can revoke any session within their tenant.
 * Tenant-isolated and audit-logged.
 * 
 * POST /api/sessions/revoke
 * Body: { jwtId: string, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getSessionCookie, verifyToken } from '@/lib/auth';
import Session from '@/models/Session';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function POST(request: NextRequest) {
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
    
    const currentUserId = payload.userId as string;
    const tenantId = payload.tenantId as string;
    const role = payload.role as string;
    const currentJwtId = payload.jti as string;
    
    // Parse request body
    const body = await request.json();
    const { jwtId, reason = 'user_revoke' } = body;
    
    if (!jwtId) {
      return NextResponse.json({ error: 'jwtId is required' }, { status: 400 });
    }
    
    // Prevent revoking current session
    if (jwtId === currentJwtId) {
      return NextResponse.json({ 
        error: 'Cannot revoke current session. Please use logout instead.' 
      }, { status: 400 });
    }
    
    // Find the session to revoke (tenant-isolated)
    const sessionToRevoke = await runWithTenantContext({ tenantId }, async () => {
      return await Session.findOne({ 
        jwtId, 
        tenantId, 
        isRevoked: false 
      });
    });
    
    if (!sessionToRevoke) {
      return NextResponse.json({ 
        error: 'Session not found or already revoked' 
      }, { status: 404 });
    }
    
    // Authorization check
    const isAdmin = role === 'super_admin' || role === 'admin';
    const isOwnSession = sessionToRevoke.userId === currentUserId;
    
    if (!isOwnSession && !isAdmin) {
      console.warn(`[RevokeSession API] Unauthorized revoke attempt by user ${currentUserId} for session ${jwtId}`);
      return NextResponse.json({ 
        error: 'Cannot revoke another user\'s session' 
      }, { status: 403 });
    }
    
    // Revoke the session
    await runWithTenantContext({ tenantId }, async () => {
      await sessionToRevoke.revoke(
        isAdmin ? 'admin_revoke' : reason,
        isAdmin ? currentUserId : undefined
      );
    });
    
    console.log(`[RevokeSession API] Session ${jwtId} revoked by ${currentUserId} (${isAdmin ? 'admin' : 'user'})`);
    
    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
      jwtId,
    });
  } catch (error) {
    console.error('[RevokeSession API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}

/**
 * Revoke ALL user sessions (except current)
 * POST /api/sessions/revoke-all
 */
export async function DELETE(request: NextRequest) {
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
    
    // Revoke all sessions except current
    const result = await runWithTenantContext({ tenantId }, async () => {
      return await Session.updateMany(
        { 
          userId, 
          tenantId, 
          isRevoked: false,
          jwtId: { $ne: currentJwtId } // Don't revoke current session
        },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'logout_all',
          }
        }
      );
    });
    
    console.log(`[RevokeSession API] Revoked ${result.modifiedCount} sessions for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} session(s) revoked`,
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('[RevokeSession API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke sessions' },
      { status: 500 }
    );
  }
}
