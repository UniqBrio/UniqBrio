/**
 * Dashboard Tenant Helper Functions
 * 
 * These functions help extract the correct tenantId from the user's session
 * to ensure data isolation per academy in the dashboard.
 */

import { getServerSession } from "next-auth";

/**
 * Get tenant ID from the current user's session
 * Returns the user's academyId which serves as the tenantId for data isolation
 * 
 * @returns tenantId (academyId) or 'default' if not found
 */
export async function getTenantIdFromSession(): Promise<string> {
  try {
    const session = await getServerSession();
    
    // Extract academyId from session user
    const academyId = (session?.user as any)?.academyId;
    
    if (academyId) {
      return academyId; // e.g., 'AC000001', 'AC000002'
    }
    
    // Fallback to default for unauthenticated or incomplete registrations
    return 'default';
  } catch (error) {
    console.error('[getTenantIdFromSession] Error:', error);
    return 'default';
  }
}

/**
 * Get user context including tenantId and user details
 * Useful for dashboard routes that need both user info and tenant isolation
 * 
 * @returns Object containing email, academyId (tenantId), userId, and name
 */
export async function getUserContext() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return {
        email: null,
        tenantId: 'default',
        academyId: null,
        userId: null,
        name: null,
      };
    }
    
    const user = session.user as any;
    
    return {
      email: user.email || null,
      tenantId: user.academyId || 'default', // Use academyId as tenantId
      academyId: user.academyId || null,
      userId: user.userId || null,
      name: user.name || null,
    };
  } catch (error) {
    console.error('[getUserContext] Error:', error);
    return {
      email: null,
      tenantId: 'default',
      academyId: null,
      userId: null,
      name: null,
    };
  }
}

/**
 * Build query filter with tenant isolation
 * Ensures all queries are scoped to the user's academy
 * 
 * @param additionalFilters - Additional MongoDB query filters
 * @returns Query object with tenantId filter
 */
export async function buildTenantQuery(additionalFilters: Record<string, any> = {}) {
  const tenantId = await getTenantIdFromSession();
  
  return {
    tenantId,
    ...additionalFilters,
  };
}
