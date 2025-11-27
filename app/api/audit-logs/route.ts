import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import AuditLogModel from '@/models/AuditLog';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: No tenant context', data: [] },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        // Verify user is authenticated and is a super admin
        const sessionToken = await getSessionCookie();
        if (!sessionToken) {
          console.log('[Audit Logs API] No session token found');
          return NextResponse.json(
            { success: false, error: 'Not authenticated', data: [] },
            { status: 401 }
          );
        }

        const payload = await verifyToken(sessionToken) as any;
        if (!payload || !payload.role) {
          console.log('[Audit Logs API] Invalid payload or no role');
          return NextResponse.json(
            { success: false, error: 'Invalid session', data: [] },
            { status: 401 }
          );
        }

        // Check if user is super admin
        if (payload.role !== 'super_admin') {
          console.log('[Audit Logs API] Access denied for role:', payload.role);
          return NextResponse.json(
            { success: false, error: 'Access denied. Super admin role required.', data: [] },
            { status: 403 }
          );
        }

        console.log('[Audit Logs API] Super admin access granted');
    
    try {
      await dbConnect();
    } catch (dbError) {
      console.error('[Audit Logs API] Database connection failed:', dbError);
      return NextResponse.json(
        { success: true, data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const action = searchParams.get('action');
    const role = searchParams.get('role');
    const module = searchParams.get('module');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {
      tenantId: session.tenantId,
    };

    if (action && action !== 'all') {
      query.action = action;
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (module && module !== 'all') {
      query.module = module;
    }

    if (search) {
      query.$or = [
        { changedBy: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Execute query
    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(query).exec(),
    ]);

    console.log('[Audit Logs API] Successfully fetched', logs.length, 'logs');

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
      } catch (error) {
        console.error('[Audit Logs API] Error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch audit logs', data: [] },
          { status: 500 }
        );
      }
    }
  );
}
