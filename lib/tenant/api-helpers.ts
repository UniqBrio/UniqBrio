import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { runWithTenantContext, TenantContext } from './tenant-context';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get tenant ID from session token
 */
export async function getTenantIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const decoded = await verifyToken(token);
    
    // Try to get tenantId from token, fallback to academyId
    const tenantId = (decoded && typeof decoded === 'object' && 'tenantId' in decoded) 
      ? decoded.tenantId 
      : (decoded && typeof decoded === 'object' && 'academyId' in decoded)
        ? decoded.academyId
        : null;
    
    return typeof tenantId === 'string' ? tenantId : null;
  } catch (error) {
    console.error('[getTenantIdFromSession] Error:', error);
    return null;
  }
}

/**
 * Get tenant ID from request (headers or session)
 */
export async function getTenantIdFromRequest(request: NextRequest | Request): Promise<string | null> {
  // Try to get from header first (for API calls)
  if (request instanceof NextRequest) {
    const headerTenantId = request.headers.get('x-tenant-id');
    if (headerTenantId) {
      return headerTenantId;
    }
  }

  // Fallback to session
  return getTenantIdFromSession();
}

/**
 * Wrapper for API route handlers that automatically sets tenant context
 * Usage:
 * export const GET = withTenantContext(async (request, tenantId) => {
 *   // Your handler code here
 *   // tenantId is automatically available
 * });
 */
export function withTenantContext<T = any>(
  handler: (request: Request, tenantId: string | null, context?: T) => Promise<NextResponse>
) {
  return async (request: Request, context?: T): Promise<NextResponse> => {
    try {
      // Get tenant ID from session or headers
      const tenantId = await getTenantIdFromRequest(request);

      if (!tenantId) {
        console.warn('[withTenantContext] No tenantId found in session/headers');
      }

      // Create tenant context
      const tenantContext: TenantContext = {
        tenantId: tenantId || 'default',
      };

      // Run handler with tenant context set in AsyncLocalStorage
      return await runWithTenantContext(tenantContext, () =>
        handler(request, tenantId, context)
      );
    } catch (error) {
      console.error('[withTenantContext] Error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Get user session data including tenantId/academyId
 */
export async function getUserSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const decoded = await verifyToken(token);
    
    return {
      email: decoded?.email as string,
      userId: (decoded?.userId || decoded?.id) as string, // Prefer userId (AD000003), fallback to id for old sessions
      role: decoded?.role as string,
      academyId: decoded?.academyId as string,
      tenantId: (decoded?.tenantId || decoded?.academyId) as string,
    };
  } catch (error) {
    console.error('[getUserSession] Error:', error);
    return null;
  }
}
