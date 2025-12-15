import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import CookiePreference from '@/models/CookiePreference';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * Admin Cookie Compliance API
 * 
 * Provides cookie compliance management for UBAdmin
 * SECURITY: Only accessible to ubadmin and super_admin users
 * Shows tenant-scoped data only
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
    const action = searchParams.get('action') || 'stats';
    const tenantId = searchParams.get('tenantId');

    if (action === 'stats') {
      // Get global statistics across all tenants (bypass tenant isolation)
      // Use collection directly to bypass tenant plugin
      const collection = CookiePreference.collection;
      const allTenants = await collection.distinct('tenantId');
      
      const globalStats = {
        totalTenants: allTenants.length,
        totalUsers: await CookiePreference.countDocuments({ __allowSystemQuery: true }),
        globalAnalyticsConsent: await CookiePreference.countDocuments({ __allowSystemQuery: true, analytics: true }),
        globalMarketingConsent: await CookiePreference.countDocuments({ __allowSystemQuery: true, marketing: true }),
      };

      // Get per-tenant statistics
      const tenantStats = await CookiePreference.aggregate([
        {
          $group: {
            _id: '$tenantId',
            totalUsers: { $sum: 1 },
            analyticsConsent: {
              $sum: { $cond: ['$analytics', 1, 0] }
            },
            marketingConsent: {
              $sum: { $cond: ['$marketing', 1, 0] }
            },
            lastUpdated: { $max: '$updatedAt' }
          }
        },
        { $sort: { totalUsers: -1 } },
        { $limit: 20 }
      ]);

      return NextResponse.json({
        success: true,
        data: {
          global: globalStats,
          byTenant: tenantStats
        }
      });
    }

    if (action === 'tenant-report') {
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'Tenant ID required' },
          { status: 400 }
        );
      }

      // Get detailed report for specific tenant
      const report = await CookiePreference.getComplianceReport(tenantId);

      return NextResponse.json({
        success: true,
        data: report
      });
    }

    if (action === 'list') {
      // List all preferences with filtering
      const query: any = {};
      
      if (tenantId) {
        query.tenantId = tenantId;
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const [preferences, total] = await Promise.all([
        CookiePreference.find(query)
          .sort({ updatedAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        CookiePreference.countDocuments(query)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          preferences,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Admin Cookie Compliance API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
