/**
 * Session Context Utilities for Server Components and API Routes
 * 
 * These utilities extract session information that was injected by middleware
 * into request headers, providing easy access to user context throughout the app.
 */

import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export interface MiddlewareSessionContext {
  userId: string;
  tenantId: string;
  role: string;
  email?: string;
  jwtId?: string;
  sessionId?: string;
}

/**
 * Extract session context from middleware headers in App Router server components
 * Use this in server components and server actions
 */
export async function getSessionFromHeaders(): Promise<MiddlewareSessionContext | null> {
  try {
    const headersList = await headers();
    
    const userId = headersList.get('x-session-user-id');
    const tenantId = headersList.get('x-session-tenant-id');
    const role = headersList.get('x-session-role');
    const email = headersList.get('x-session-email');
    const jwtId = headersList.get('x-session-jwt-id');
    const sessionId = headersList.get('x-session-id');

    if (!userId || !tenantId || !role) {
      return null;
    }

    return {
      userId,
      tenantId,
      role,
      email: email || undefined,
      jwtId: jwtId || undefined,
      sessionId: sessionId || undefined,
    };
  } catch (error) {
    console.error('[getSessionFromHeaders] Error:', error);
    return null;
  }
}

/**
 * Extract session context from middleware headers in API routes
 * Use this in API route handlers
 */
export function getSessionFromRequest(request: NextRequest): MiddlewareSessionContext | null {
  try {
    const userId = request.headers.get('x-session-user-id');
    const tenantId = request.headers.get('x-session-tenant-id');
    const role = request.headers.get('x-session-role');
    const email = request.headers.get('x-session-email');
    const jwtId = request.headers.get('x-session-jwt-id');
    const sessionId = request.headers.get('x-session-id');

    if (!userId || !tenantId || !role) {
      return null;
    }

    return {
      userId,
      tenantId,
      role,
      email: email || undefined,
      jwtId: jwtId || undefined,
      sessionId: sessionId || undefined,
    };
  } catch (error) {
    console.error('[getSessionFromRequest] Error:', error);
    return null;
  }
}

/**
 * Ensure session context exists, throw error if not authenticated
 * Use this for protected API routes that require authentication
 */
export async function requireSessionFromHeaders(): Promise<MiddlewareSessionContext> {
  const session = await getSessionFromHeaders();
  if (!session) {
    throw new Error('Authentication required - no session context found');
  }
  return session;
}

/**
 * Ensure session context exists in API request, throw error if not authenticated
 * Use this for protected API routes that require authentication
 */
export function requireSessionFromRequest(request: NextRequest): MiddlewareSessionContext {
  const session = getSessionFromRequest(request);
  if (!session) {
    throw new Error('Authentication required - no session context found');
  }
  return session;
}

/**
 * Check if user has required role
 */
export function hasRole(session: MiddlewareSessionContext, requiredRoles: string | string[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(session.role);
}

/**
 * Check if user is admin (admin or super_admin)
 */
export function isAdmin(session: MiddlewareSessionContext): boolean {
  return hasRole(session, ['admin', 'super_admin']);
}

/**
 * Ensure user has required role, throw error if not authorized
 */
export function requireRole(session: MiddlewareSessionContext, requiredRoles: string | string[]): void {
  if (!hasRole(session, requiredRoles)) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles;
    throw new Error(`Authorization failed - requires one of: ${roles}, got: ${session.role}`);
  }
}

/**
 * Ensure user is admin, throw error if not authorized
 */
export function requireAdmin(session: MiddlewareSessionContext): void {
  requireRole(session, ['admin', 'super_admin']);
}