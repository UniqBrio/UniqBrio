import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import CookiePreference, { hashIP } from '@/models/CookiePreference';
import { COOKIE_NAMES } from '@/lib/cookies';

/**
 * Cookie Preferences API
 * 
 * GET    - Get user's cookie preferences
 * POST   - Set/update cookie preferences
 * 
 * SECURITY:
 * - Requires authentication (JWT)
 * - tenantId ALWAYS from JWT, never from client
 * - All queries include { tenantId }
 */

/**
 * GET /api/cookie-preferences
 * Fetch user's cookie preferences
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

    // Extract tenantId and userId from JWT (NEVER from client)
    const tenantId = jwtPayload.tenantId as string || jwtPayload.academyId as string;
    const userId = jwtPayload.userId as string || jwtPayload.id as string;

    if (!tenantId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing tenant or user ID in token' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch preferences with tenant isolation
    const preferences = await CookiePreference.getUserPreferences(userId, tenantId);

    if (!preferences) {
      // User hasn't set preferences yet - return defaults
      return NextResponse.json({
        success: true,
        preferences: {
          essential: true,
          analytics: false,
          marketing: false,
          policyVersion: '1.0',
        },
        hasSetPreferences: false,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        essential: preferences.essential,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        policyVersion: preferences.policyVersion,
        acceptedAt: preferences.acceptedAt,
        updatedAt: preferences.updatedAt,
      },
      hasSetPreferences: true,
    });

  } catch (error) {
    console.error('[Cookie Preferences API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cookie-preferences
 * Set or update user's cookie preferences
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
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Preferences required' },
        { status: 400 }
      );
    }

    // Validate preferences
    if (typeof preferences.analytics !== 'boolean' || 
        typeof preferences.marketing !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get IP and User-Agent for audit trail
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Set preferences with tenant isolation
    await CookiePreference.setUserPreferences(
      userId,
      tenantId,
      {
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        policyVersion: preferences.policyVersion || '1.0',
        ipHash: hashIP(ip),
        userAgent,
      }
    );

    // Fetch updated preferences
    const updated = await CookiePreference.getUserPreferences(userId, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updated ? {
        essential: updated.essential,
        analytics: updated.analytics,
        marketing: updated.marketing,
        policyVersion: updated.policyVersion,
      } : undefined,
    });

  } catch (error) {
    console.error('[Cookie Preferences API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
