import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Session from '@/models/Session';
import { COOKIE_NAMES } from '@/lib/cookies';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * Update Session with PWA Status
 * 
 * POST /api/session/pwa-status
 * Called client-side after login to update session with PWA detection
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[PWA Status API] Request received');
    
    // Extract and verify JWT
    const token = request.cookies.get(COOKIE_NAMES.SESSION)?.value;
    if (!token) {
      console.log('[PWA Status API] No session token found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const jwtPayload = await verifyToken(token);
    if (!jwtPayload) {
      console.log('[PWA Status API] Invalid token');
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const tenantId = jwtPayload.tenantId as string || jwtPayload.academyId as string;
    const jwtId = jwtPayload.jti as string;

    console.log('[PWA Status API] Token verified:', { tenantId, jwtId: jwtId?.substring(0, 8) + '...' });

    if (!tenantId || !jwtId) {
      console.log('[PWA Status API] Missing tenant or session ID');
      return NextResponse.json(
        { success: false, error: 'Missing tenant or session ID', tenantId: !!tenantId, jwtId: !!jwtId },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isPWA } = body;

    console.log('[PWA Status API] Received isPWA:', isPWA);

    if (typeof isPWA !== 'boolean') {
      console.log('[PWA Status API] Invalid isPWA value type:', typeof isPWA);
      return NextResponse.json(
        { success: false, error: 'Invalid isPWA value - must be boolean' },
        { status: 400 }
      );
    }

    await dbConnect();

    console.log('[PWA Status API] Updating session:', { jwtId, tenantId, isPWA });

    // Update session with PWA status
    const result = await runWithTenantContext({ tenantId }, async () => {
      return await Session.findOneAndUpdate(
        { jwtId, tenantId },
        { $set: { isPWA } },
        { new: true }
      );
    });

    console.log('[PWA Status API] Update result:', result ? 'Session found and updated' : 'Session not found');

    return NextResponse.json({
      success: true,
      message: 'PWA status updated',
      updated: !!result,
    });

  } catch (error) {
    console.error('[Session PWA Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
