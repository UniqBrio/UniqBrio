/**
 * Admin Sessions API
 * 
 * Returns all active sessions within the admin's tenant.
 * Only accessible by admins/super_admins.
 * Tenant-isolated and audit-logged.
 * 
 * GET /api/sessions/admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getSessionCookie, verifyToken } from '@/lib/auth';
import Session from '@/models/Session';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import UserModel from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get and verify session
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const payload = await verifyToken(sessionToken);
    if (!payload?.userId || !payload?.tenantId || !payload?.role) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const role = payload.role as string;
    const tenantId = payload.tenantId as string;
    
    // Only allow super_admin and admin roles
    if (role !== 'super_admin' && role !== 'admin') {
      console.warn(`[AdminSessions API] Unauthorized access attempt by role: ${role}`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Optional filters
    const deviceType = searchParams.get('deviceType');
    const userId = searchParams.get('userId');
    
    // Build query (always tenant-isolated)
    const query: any = {
      tenantId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    };
    
    if (deviceType && deviceType !== 'all') {
      query.deviceType = deviceType;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    // Fetch sessions with pagination (tenant-isolated)
    const [sessions, total] = await runWithTenantContext({ tenantId }, async () => {
      return await Promise.all([
        Session.find(query)
          .sort({ lastActiveAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Session.countDocuments(query)
      ]);
    });
    
    // Get user info for each session
    const userIdSet = new Set(sessions.map((s: any) => s.userId));
    const userIds: string[] = [];
    userIdSet.forEach(id => userIds.push(id));
    const users = await runWithTenantContext({ tenantId }, async () => {
      return await UserModel.find({ 
        userId: { $in: userIds },
        tenantId 
      }).select('userId name email').lean();
    });
    
    const userMap = new Map(users.map((u: any) => [u.userId, u]));
    
    // Transform sessions for client
    const sessionsData = sessions.map((session: any) => {
      const user = userMap.get(session.userId);
      return {
        sessionId: session._id.toString(),
        jwtId: session.jwtId,
        userId: session.userId,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || 'N/A',
        deviceType: session.deviceType || 'unknown',
        browser: session.browser || 'Unknown Browser',
        os: session.os || 'Unknown OS',
        country: session.country,
        lastActiveAt: session.lastActiveAt,
        issuedAt: session.issuedAt,
        // For admins, show partial IP hash (last 8 chars) for security auditing
        ipHashPartial: session.ipHash ? `...${session.ipHash.slice(-8)}` : undefined,
      };
    });
    
    return NextResponse.json({
      success: true,
      sessions: sessionsData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[AdminSessions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin sessions' },
      { status: 500 }
    );
  }
}
