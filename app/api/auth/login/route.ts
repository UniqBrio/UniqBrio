import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/app/actions/auth-actions';
import { getClientIp, getUserAgent, logAuthEvent } from '@/lib/audit-logger';
import { verifyToken, getSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrPhone, password } = body;

    // Create FormData for the login action
    const formData = new FormData();
    formData.append('emailOrPhone', emailOrPhone);
    formData.append('password', password);

    // Call the login action
    const result = await login(formData);

    // If login was successful, create an audit log
    if (result.success) {
      try {
        // Get the session cookie to extract user info
        const sessionToken = await getSessionCookie();
        if (sessionToken) {
          const payload = await verifyToken(sessionToken) as any;
          if (payload && payload.id && payload.email) {
            const ipAddress = getClientIp(request.headers);
            const userAgent = getUserAgent(request.headers);
            
            // Create audit log for successful login
            await logAuthEvent(
              'Login',
              String(payload.id),
              String(payload.name || payload.email),
              String(payload.email),
              String(payload.role || 'unknown'),
              String(payload.tenantId || 'default'),
              ipAddress,
              userAgent,
              sessionToken.substring(0, 16) // Use first 16 chars as session ID
            );
          }
        }
      } catch (auditError) {
        // Don't fail the login if audit log fails
        console.error('[Login API] Failed to create audit log:', auditError);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
