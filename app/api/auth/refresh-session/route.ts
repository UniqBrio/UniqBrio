import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyToken, createToken, setSessionCookie, getSessionCookie } from '@/lib/auth';
import { getClientIp, getUserAgent } from '@/lib/audit-logger';

/**
 * Refresh session endpoint - Updates old session tokens to include tenantId
 * This endpoint can be called to fix sessions that are missing tenant context
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RefreshSession] Starting session refresh...');
    
    // Get current session token
    const currentToken = await getSessionCookie();
    
    if (!currentToken) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      );
    }
    
    // Verify current token
    const decoded = await verifyToken(currentToken);
    
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    console.log('[RefreshSession] Current session:', {
      email: decoded.email,
      hasTenantId: !!decoded.tenantId,
      hasAcademyId: !!decoded.academyId,
    });
    
    // If session already has tenantId, no need to refresh
    if (decoded.tenantId) {
      return NextResponse.json({
        success: true,
        message: 'Session already has tenant context',
        session: {
          email: decoded.email,
          tenantId: decoded.tenantId,
          role: decoded.role,
        }
      });
    }
    
    // Get user from database to fetch latest data
    await dbConnect();
    const user = await UserModel.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('[RefreshSession] User data:', {
      email: user.email,
      academyId: user.academyId,
      tenantId: user.tenantId,
      registrationComplete: user.registrationComplete,
    });
    
    // Create new session with updated data
    const sessionData = {
      id: user.id,
      email: user.email,
      role: user.role ?? '',
      verified: user.verified,
      registrationComplete: user.registrationComplete,
      name: user.name,
      lastActivity: Date.now(),
      // Always include tenant data
      tenantId: user.academyId || user.tenantId || 'default',
      userId: user.userId,
      academyId: user.academyId,
    };
    
    // Get request metadata
    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);
    
    // Create new token
    const newToken = await createToken(sessionData, '30d', {
      userAgent,
      ipAddress,
    });
    
    // Set new session cookie
    await setSessionCookie(newToken);
    
    console.log('[RefreshSession] Session refreshed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      session: {
        email: user.email,
        tenantId: sessionData.tenantId,
        role: user.role,
      }
    });
    
  } catch (error) {
    console.error('[RefreshSession] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
