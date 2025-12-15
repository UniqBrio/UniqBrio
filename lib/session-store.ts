/**
 * Server-side Session Store Management
 * 
 * This module provides utilities to work with JWT-based sessions
 * alongside a MongoDB session store for server-side session management.
 * Enables logout, revocation, and tenant isolation.
 */

import { randomBytes, createHash } from 'crypto';
import * as jose from 'jose';
import Session, { ISession, ISessionModel } from '@/models/Session';
import { dbConnect } from '@/lib/mongodb';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import type { HydratedDocument } from 'mongoose';

export interface SessionCreationData {
  userId: string;
  tenantId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresIn?: string | number; // JWT expiration (e.g., '1d', 3600)
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: HydratedDocument<ISession>;
  error?: string;
}

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: string;
  jwtId: string;
  sessionId: string;
}

/**
 * Generate a unique JWT ID (jti claim) for session tracking
 */
export function generateJwtId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Extract JWT ID from a JWT payload
 */
export function extractJwtId(jwtPayload: jose.JWTPayload): string {
  if (jwtPayload.jti && typeof jwtPayload.jti === 'string') {
    return jwtPayload.jti;
  }
  
  // Fallback: Generate hash from JWT content for existing tokens without jti
  const contentToHash = JSON.stringify({
    sub: jwtPayload.sub,
    email: jwtPayload.email,
    iat: jwtPayload.iat,
  });
  return createHash('sha256').update(contentToHash).digest('hex').substring(0, 32);
}

/**
 * Create a session record in MongoDB
 * Called when creating new JWTs (login, registration, OAuth, refresh)
 */
export async function createSessionRecord(
  jwtId: string,
  data: SessionCreationData
): Promise<ISession> {
  await dbConnect();
  
  const expirationMs = calculateExpirationMs(data.expiresIn || '1d');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMs);

  return runWithTenantContext({ tenantId: data.tenantId }, async () => {
    const session = new Session({
      tenantId: data.tenantId,
      userId: data.userId,
      jwtId,
      issuedAt: now,
      expiresAt,
      lastActiveAt: now,
      isRevoked: false,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });

    await session.save();
    return session;
  });
}

/**
 * Validate a session against the MongoDB store
 * Called on every authenticated request alongside JWT validation
 */
export async function validateSession(
  jwtPayload: jose.JWTPayload
): Promise<SessionValidationResult> {
  try {
    await dbConnect();
    
    const jwtId = extractJwtId(jwtPayload);
    const tenantId = extractTenantId(jwtPayload);
    const userId = extractUserId(jwtPayload);

    if (!tenantId) {
      return { isValid: false, error: 'Missing tenant ID in JWT' };
    }

    if (!userId) {
      return { isValid: false, error: 'Missing user ID in JWT' };
    }

    const session = await runWithTenantContext({ tenantId }, async () => {
      return await Session.findByJwtId(jwtId, tenantId);
    }) as HydratedDocument<ISession> | null;

    if (!session) {
      return { isValid: false, error: 'Session not found' };
    }

    if (!session.isValid()) {
      return { isValid: false, error: 'Session expired or revoked' };
    }

    // Update last activity
    await runWithTenantContext({ tenantId }, async () => {
      await session.updateActivity();
    });

    return { isValid: true, session };
  } catch (error) {
    console.error('[validateSession] Error:', error);
    return { isValid: false, error: 'Session validation failed' };
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
  jwtId: string,
  tenantId: string,
  reason: string = 'logout',
  revokedBy?: string
): Promise<boolean> {
  try {
    await dbConnect();
    
    return runWithTenantContext({ tenantId }, async () => {
      const session = await Session.findByJwtId(jwtId, tenantId) as HydratedDocument<ISession> | null;
      if (session && !session.isRevoked) {
        await session.revoke(reason, revokedBy);
        return true;
      }
      return false;
    });
  } catch (error) {
    console.error('[revokeSession] Error:', error);
    return false;
  }
}

/**
 * Revoke all sessions for a user within a tenant
 */
export async function revokeAllUserSessions(
  userId: string,
  tenantId: string,
  reason: string = 'logout_all',
  revokedBy?: string
): Promise<number> {
  try {
    await dbConnect();
    
    return runWithTenantContext({ tenantId }, async () => {
      const result = await Session.revokeAllUserSessions(userId, tenantId, reason, revokedBy);
      return result.modifiedCount || 0;
    });
  } catch (error) {
    console.error('[revokeAllUserSessions] Error:', error);
    return 0;
  }
}

/**
 * Get active sessions for a user within a tenant
 */
export async function getUserActiveSessions(
  userId: string,
  tenantId: string
): Promise<HydratedDocument<ISession>[]> {
  try {
    await dbConnect();
    
    return runWithTenantContext({ tenantId }, async () => {
      return await Session.getActiveSessions(userId, tenantId) as unknown as HydratedDocument<ISession>[];
    });
  } catch (error) {
    console.error('[getUserActiveSessions] Error:', error);
    return [];
  }
}

/**
 * Admin function to revoke any session within the same tenant
 * SECURITY: Only accessible to admin users within the same tenant
 */
export async function adminRevokeSession(
  targetJwtId: string,
  adminTenantId: string,
  adminUserId: string,
  reason: string = 'admin_revoke'
): Promise<boolean> {
  try {
    await dbConnect();
    
    return runWithTenantContext({ tenantId: adminTenantId }, async () => {
      // Find the session to revoke
      const session = await Session.findOne({
        jwtId: targetJwtId,
        tenantId: adminTenantId, // Ensure admin can only revoke within their tenant
        isRevoked: false
      }) as HydratedDocument<ISession> | null;

      if (session) {
        await session.revoke(reason, adminUserId);
        return true;
      }
      return false;
    });
  } catch (error) {
    console.error('[adminRevokeSession] Error:', error);
    return false;
  }
}

/**
 * Cleanup expired sessions
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    await dbConnect();
    const result = await Session.cleanupExpiredSessions();
    return result.deletedCount || 0;
  } catch (error) {
    console.error('[cleanupExpiredSessions] Error:', error);
    return 0;
  }
}

/**
 * Extract tenant ID from JWT payload
 */
function extractTenantId(jwtPayload: jose.JWTPayload): string | null {
  // Priority: tenantId -> academyId -> null
  if (jwtPayload.tenantId && typeof jwtPayload.tenantId === 'string') {
    return jwtPayload.tenantId;
  }
  if (jwtPayload.academyId && typeof jwtPayload.academyId === 'string') {
    return jwtPayload.academyId;
  }
  return null;
}

/**
 * Extract user ID from JWT payload
 */
function extractUserId(jwtPayload: jose.JWTPayload): string | null {
  // Priority: userId -> id -> sub -> null
  if (jwtPayload.userId && typeof jwtPayload.userId === 'string') {
    return jwtPayload.userId;
  }
  if (jwtPayload.id && typeof jwtPayload.id === 'string') {
    return jwtPayload.id;
  }
  if (jwtPayload.sub && typeof jwtPayload.sub === 'string') {
    return jwtPayload.sub;
  }
  return null;
}

/**
 * Calculate expiration time in milliseconds
 */
function calculateExpirationMs(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    return expiresIn * 1000; // Convert seconds to milliseconds
  }

  // Parse string format like '1d', '7d', '24h', '60m'
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 24 * 60 * 60 * 1000; // Default to 1 day
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

/**
 * Create session context from validated session and JWT payload
 */
export function createSessionContext(
  session: HydratedDocument<ISession>,
  jwtPayload: jose.JWTPayload
): SessionContext {
  return {
    userId: session.userId,
    tenantId: session.tenantId,
    role: (jwtPayload.role as string) || '',
    jwtId: session.jwtId,
    sessionId: session._id.toString(),
  };
}

/**
 * Middleware helper to extract session context from request
 */
export async function extractSessionFromJWT(token: string): Promise<{
  jwtPayload: jose.JWTPayload | null;
  sessionContext: SessionContext | null;
  error?: string;
}> {
  try {
    // This should use your existing JWT verification logic
    const { verifyToken } = await import('@/lib/auth');
    const jwtPayload = await verifyToken(token);
    
    if (!jwtPayload) {
      return { jwtPayload: null, sessionContext: null, error: 'Invalid JWT' };
    }

    // Validate against session store
    const sessionValidation = await validateSession(jwtPayload);
    
    if (!sessionValidation.isValid || !sessionValidation.session) {
      return { 
        jwtPayload, 
        sessionContext: null, 
        error: sessionValidation.error || 'Session invalid' 
      };
    }

    const sessionContext = createSessionContext(sessionValidation.session, jwtPayload);
    
    return { jwtPayload, sessionContext };
  } catch (error) {
    console.error('[extractSessionFromJWT] Error:', error);
    return { jwtPayload: null, sessionContext: null, error: 'Session extraction failed' };
  }
}