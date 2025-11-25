import { AsyncLocalStorage } from 'async_hooks';
import { NextRequest } from 'next/server';

export interface TenantContext {
  tenantId: string;
  tenantName?: string;
  subdomain?: string;
}

// AsyncLocalStorage for managing tenant context across async operations
const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Get current tenant context from AsyncLocalStorage
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

/**
 * Get current tenant ID, throws error if not found
 */
export function requireTenantId(): string {
  const context = getTenantContext();
  if (!context?.tenantId) {
    throw new Error('Tenant context is required but not found. Ensure tenant middleware is properly configured.');
  }
  return context.tenantId;
}

/**
 * Run a function with tenant context
 */
export function runWithTenantContext<T>(
  context: TenantContext,
  fn: () => T
): T {
  return tenantStorage.run(context, fn);
}

/**
 * Extract tenant ID from subdomain
 * Examples:
 * - academy1.uniqbrio.com -> academy1
 * - localhost:3000 -> default
 * - uniqbrio.com -> default
 */
export function extractTenantFromSubdomain(request: NextRequest): string {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0]; // Remove port if present
  
  // Check for local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.DEFAULT_TENANT_ID || 'default';
  }

  // Extract subdomain
  const parts = hostname.split('.');
  
  // If it's a subdomain (more than 2 parts), use the first part as tenant
  if (parts.length > 2) {
    const subdomain = parts[0];
    // Ignore common subdomains
    if (subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
  }

  // Default tenant for main domain
  return process.env.DEFAULT_TENANT_ID || 'default';
}

/**
 * Extract tenant ID from session user data
 * Uses academyId from the user session as the tenantId for data isolation
 */
export function extractTenantFromSession(session: any): string | null {
  // Priority 1: Use academyId as tenantId (primary identifier for tenant isolation)
  if (session?.user?.academyId) {
    return session.user.academyId;
  }
  // Priority 2: Fallback to explicit tenantId
  if (session?.user?.tenantId) {
    return session.user.tenantId;
  }
  // Priority 3: Legacy session.tenantId
  if (session?.tenantId) {
    return session.tenantId;
  }
  return null;
}

/**
 * Create tenant context from request
 */
export async function createTenantContextFromRequest(
  request: NextRequest,
  session?: any
): Promise<TenantContext> {
  // Priority 1: Tenant ID from session
  let tenantId = session ? extractTenantFromSession(session) : null;

  // Priority 2: Tenant ID from subdomain
  if (!tenantId) {
    tenantId = extractTenantFromSubdomain(request);
  }

  // Priority 3: Tenant ID from header (for API calls)
  if (!tenantId) {
    tenantId = request.headers.get('x-tenant-id') || null;
  }

  // Priority 4: Default tenant
  if (!tenantId) {
    tenantId = process.env.DEFAULT_TENANT_ID || 'default';
  }

  return {
    tenantId,
    subdomain: extractTenantFromSubdomain(request),
  };
}
