import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { 
  adminRevokeSession, 
  getUserActiveSessions, 
  revokeAllUserSessions,
  extractSessionFromJWT 
} from '@/lib/session-store';
import { logAuthEvent, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * GET /api/auth/admin/sessions
 * Get active sessions for a user (admin only, same tenant)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Admin Sessions API] Processing get sessions request');

    // Verify admin authentication
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.success) {
      return NextResponse.json({
        success: false,
        message: adminAuth.message
      }, { status: adminAuth.status });
    }

    const { adminUser } = adminAuth;
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        message: 'userId parameter is required'
      }, { status: 400 });
    }

    // Get active sessions for the target user (within same tenant)
    const sessions = await getUserActiveSessions(targetUserId, adminUser.tenantId);

    // Remove sensitive information from session data
    const sessionSummary = sessions.map(session => ({
      id: session._id,
      jwtId: session.jwtId,
      issuedAt: session.issuedAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
    }));

    console.log(`[Admin Sessions API] Found ${sessions.length} active sessions for user: ${targetUserId}`);

    return NextResponse.json({
      success: true,
      sessions: sessionSummary,
      totalSessions: sessionSummary.length
    });

  } catch (error) {
    console.error('[Admin Sessions API] Error getting sessions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve sessions'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/admin/sessions
 * Revoke sessions (admin only, same tenant)
 * Body: { action: 'revoke-session', jwtId: string } or { action: 'revoke-all-user', userId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('[Admin Sessions API] Processing revoke sessions request');

    // Verify admin authentication
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.success) {
      return NextResponse.json({
        success: false,
        message: adminAuth.message
      }, { status: adminAuth.status });
    }

    const { adminUser } = adminAuth;
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found'
      }, { status: 500 });
    }

    const body = await request.json();
    const { action, jwtId, userId: targetUserId } = body;

    let revokedCount = 0;
    let auditMessage = '';

    if (action === 'revoke-session') {
      if (!jwtId) {
        return NextResponse.json({
          success: false,
          message: 'jwtId is required for revoke-session action'
        }, { status: 400 });
      }

      // Revoke specific session
      const revoked = await adminRevokeSession(
        jwtId,
        adminUser.tenantId,
        adminUser.userId,
        'admin_revoke'
      );

      revokedCount = revoked ? 1 : 0;
      auditMessage = `Admin revoked session ${jwtId}`;

    } else if (action === 'revoke-all-user') {
      if (!targetUserId) {
        return NextResponse.json({
          success: false,
          message: 'userId is required for revoke-all-user action'
        }, { status: 400 });
      }

      // Revoke all sessions for target user
      revokedCount = await revokeAllUserSessions(
        targetUserId,
        adminUser.tenantId,
        'admin_revoke_all',
        adminUser.userId
      );

      auditMessage = `Admin revoked all sessions for user ${targetUserId}`;

    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Must be revoke-session or revoke-all-user'
      }, { status: 400 });
    }

    // Create audit log
    try {
      const ipAddress = getClientIp(request.headers);
      const userAgent = getUserAgent(request.headers);
      
      await logAuthEvent(
        'AdminSessionRevoke',
        adminUser.userId,
        adminUser.name,
        adminUser.email,
        adminUser.role,
        adminUser.tenantId,
        ipAddress,
        userAgent,
        auditMessage
      );
    } catch (auditError) {
      console.error('[Admin Sessions API] Failed to create audit log:', auditError);
    }

    console.log(`[Admin Sessions API] ${auditMessage}, revoked count: ${revokedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully revoked ${revokedCount} session(s)`,
      revokedCount
    });

  } catch (error) {
    console.error('[Admin Sessions API] Error revoking sessions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to revoke sessions'
    }, { status: 500 });
  }
}

/**
 * Helper function to verify admin authentication and authorization
 */
async function verifyAdminAuth(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionToken) {
      return {
        success: false,
        message: 'Not authenticated',
        status: 401,
        adminUser: undefined
      };
    }

    // Extract and validate session
    const { jwtPayload, sessionContext } = await extractSessionFromJWT(sessionToken);

    if (!jwtPayload || !sessionContext) {
      return {
        success: false,
        message: 'Invalid session',
        status: 401,
        adminUser: undefined
      };
    }

    // Check if user has admin privileges
    const userRole = jwtPayload.role as string;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);

    if (!isAdmin) {
      return {
        success: false,
        message: 'Admin privileges required',
        status: 403,
        adminUser: undefined
      };
    }

    const adminUser = {
      userId: sessionContext.userId,
      email: String(jwtPayload.email),
      name: String(jwtPayload.name || jwtPayload.email),
      role: userRole,
      tenantId: sessionContext.tenantId,
    };

    return {
      success: true,
      adminUser
    };

  } catch (error) {
    console.error('[verifyAdminAuth] Error:', error);
    return {
      success: false,
      message: 'Authentication verification failed',
      status: 500
    };
  }
}