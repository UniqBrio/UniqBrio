import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { syncLocalToMongoDB } from '@/lib/cookie-consent';
import type { CookiePreferences } from '@/lib/cookie-consent';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * Cookie Preferences Sync API
 * 
 * POST /api/cookie-preferences/sync
 * Sync localStorage preferences to MongoDB after login
 * 
 * SECURITY:
 * - Requires authentication (JWT)
 * - tenantId from JWT only
 * - Only syncs if user doesn't have existing preferences
 */
export async function POST(request: NextRequest) {
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

    // Extract tenantId and userId from JWT (NEVER from client)
    const tenantId = jwtPayload.tenantId as string || jwtPayload.academyId as string;
    const userId = jwtPayload.userId as string || jwtPayload.id as string;

    if (!tenantId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing tenant or user ID in token' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { preferences } = body as { preferences: CookiePreferences };

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Preferences required' },
        { status: 400 }
      );
    }

    // Get IP and User-Agent for audit trail
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Sync localStorage → MongoDB
    const synced = await syncLocalToMongoDB(
      userId,
      tenantId,
      preferences,
      {
        ipAddress: ip,
        userAgent,
      }
    );

    if (!synced) {
      return NextResponse.json(
        { success: false, error: 'Failed to sync preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences synced successfully',
    });

  } catch (error) {
    console.error('[Cookie Preferences Sync API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
