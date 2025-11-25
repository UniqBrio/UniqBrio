import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  createTenantContextFromRequest,
  runWithTenantContext,
} from '@/lib/tenant/tenant-context';

/**
 * Tenant middleware wrapper for API routes
 * Extracts tenant context and makes it available to the request handler
 */
export function withTenant(
  handler: (
    request: NextRequest,
    context?: { params?: any }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    request: NextRequest,
    context?: { params?: any }
  ): Promise<NextResponse> => {
    try {
      // Extract tenant context from request
      const tenantContext = await createTenantContextFromRequest(request);

      // Run handler with tenant context
      return await runWithTenantContext(tenantContext, () =>
        handler(request, context)
      );
    } catch (error) {
      console.error('[TenantMiddleware] Error:', error);
      return NextResponse.json(
        {
          error: 'Tenant context error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Tenant middleware for page routes
 * Injects tenant context into the request
 */
export async function tenantMiddleware(request: NextRequest) {
  try {
    // Create tenant context
    const tenantContext = await createTenantContextFromRequest(request);

    // Add tenant context to request headers for downstream access
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenantContext.tenantId);
    if (tenantContext.subdomain) {
      requestHeaders.set('x-tenant-subdomain', tenantContext.subdomain);
    }

    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('[TenantMiddleware] Error in tenant middleware:', error);
    // Continue without tenant context in case of error
    return NextResponse.next();
  }
}
