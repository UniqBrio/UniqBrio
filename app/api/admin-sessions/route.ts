import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Session from '@/models/Session';
import UserModel from '@/models/User';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * Admin Sessions API
 * Provides session management capabilities for UBAdmin
 * SECURITY: Only accessible to ubadmin and super_admin users
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT
    const token = request.cookies.get(COOKIE_NAMES.SESSION)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jwtPayload = await verifyToken(token);
    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify admin role (accept both ubadmin and super_admin)
    if (jwtPayload.role !== 'ubadmin' && jwtPayload.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');

    if (action === 'list') {
      // Build query with system marker to bypass tenant isolation
      const query: any = { __allowSystemQuery: true };
      
      if (tenantId) {
        query.tenantId = tenantId;
      }
      
      if (userId) {
        query.userId = userId;
      }

      // Get sessions with pagination
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const [rawSessions, total] = await Promise.all([
        Session.find(query)
          .sort({ lastActiveAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Session.countDocuments({ ...query })
      ]);

      // Fetch user emails for each session
      const userIdSet = new Set(rawSessions.map(session => session.userId));
      const userIds = Array.from(userIdSet);
      const users = await UserModel.find(
        { userId: { $in: userIds } },
        { userId: 1, email: 1, name: 1 }
      ).lean();

      // Create a map for quick lookup
      const userMap = new Map(users.map(user => [user.userId, user]));

      // Enhance sessions with user information
      const sessions = rawSessions.map(session => ({
        ...session,
        userEmail: userMap.get(session.userId)?.email || 'Unknown',
        userName: userMap.get(session.userId)?.name || 'Unknown'
      }));

      return NextResponse.json({
        success: true,
        data: {
          sessions,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        }
      });
    }

    if (action === 'stats') {
      // Get session statistics (bypass tenant isolation for admin)
      const now = new Date();
      
      const [
        totalSessions,
        activeSessions,
        revokedSessions,
        pwaUsers,
        sessionsByTenant
      ] = await Promise.all([
        Session.countDocuments({ __allowSystemQuery: true }),
        Session.countDocuments({
          __allowSystemQuery: true,
          isRevoked: false,
          expiresAt: { $gt: now }
        }),
        Session.countDocuments({ __allowSystemQuery: true, isRevoked: true }),
        Session.countDocuments({
          __allowSystemQuery: true,
          isRevoked: false,
          expiresAt: { $gt: now },
          isPWA: true
        }),
        Session.aggregate([
          {
            $group: {
              _id: '$tenantId',
              total: { $sum: 1 },
              active: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$isRevoked', false] },
                        { $gt: ['$expiresAt', now] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          { $sort: { total: -1 } },
          { $limit: 10 }
        ])
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalSessions,
          activeSessions,
          revokedSessions,
          pwaUsers,
          sessionsByTenant
        }
      });
    }

    if (action === 'revoke') {
      const sessionId = searchParams.get('sessionId');
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'Session ID required' },
          { status: 400 }
        );
      }

      const session = await Session.findOne({ _id: sessionId, __allowSystemQuery: true });
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      await session.revoke('admin_revoke', jwtPayload.userId as string);

      return NextResponse.json({
        success: true,
        message: 'Session revoked successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Admin Sessions API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Extract and verify JWT
    const token = request.cookies.get(COOKIE_NAMES.SESSION)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jwtPayload = await verifyToken(token);
    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify admin role (accept both ubadmin and super_admin)
    if (jwtPayload.role !== 'ubadmin' && jwtPayload.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await Session.findOne({ _id: sessionId, __allowSystemQuery: true });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    await session.revoke('admin_revoke', jwtPayload.userId as string);

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('[Admin Sessions DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
