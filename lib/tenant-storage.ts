/**
 * Tenant-aware localStorage utilities
 * Ensures all localStorage data is isolated per tenant
 */

/**
 * Get the current tenant ID from session
 * This should match the tenantId from the JWT session
 */
let cachedTenantId: string | null = null;
let lastSessionCheck = 0;
const SESSION_CHECK_INTERVAL = 60000; // Re-check session every 60 seconds

async function getTenantId(): Promise<string> {
  const now = Date.now();
  
  // Force re-check if enough time has passed (detect tenant switches)
  if (cachedTenantId && now - lastSessionCheck < SESSION_CHECK_INTERVAL) {
    return cachedTenantId;
  }

  try {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store', // Always fetch fresh session
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to get session for tenant ID');
      // Clear cache on auth failure
      cachedTenantId = null;
      return 'default';
    }
    
    const session = await response.json();
    const tenantId = session?.tenantId || 'default';
    
    // Detect tenant change and clear cache
    if (cachedTenantId && cachedTenantId !== tenantId) {
      console.warn(`🔄 Tenant change detected: ${cachedTenantId} → ${tenantId}`);
    }
    
    cachedTenantId = tenantId;
    lastSessionCheck = now;
    return tenantId;
  } catch (error) {
    console.error('Error getting tenant ID:', error);
    cachedTenantId = null;
    return 'default';
  }
}

/**
 * Get tenant-specific key for localStorage
 */
function getTenantKey(key: string, tenantId: string): string {
  return `${key}_${tenantId}`;
}

/**
 * Get item from tenant-specific localStorage
 */
export async function getTenantLocalStorage(key: string): Promise<string | null> {
  const tenantId = await getTenantId();
  const tenantKey = getTenantKey(key, tenantId);
  try {
    return localStorage.getItem(tenantKey);
  } catch (error) {
    console.error('Error reading tenant localStorage:', error);
    return null;
  }
}

/**
 * Set item in tenant-specific localStorage
 */
export async function setTenantLocalStorage(key: string, value: string): Promise<void> {
  const tenantId = await getTenantId();
  const tenantKey = getTenantKey(key, tenantId);
  try {
    localStorage.setItem(tenantKey, value);
  } catch (error) {
    console.error('Error saving tenant localStorage:', error);
  }
}

/**
 * Remove item from tenant-specific localStorage
 */
export async function removeTenantLocalStorage(key: string): Promise<void> {
  const tenantId = await getTenantId();
  const tenantKey = getTenantKey(key, tenantId);
  try {
    localStorage.removeItem(tenantKey);
  } catch (error) {
    console.error('Error removing tenant localStorage:', error);
  }
}

/**
 * Reset the cached tenant ID (useful after logout or tenant switch)
 */
export function resetTenantCache(): void {
  cachedTenantId = null;
  lastSessionCheck = 0;
}

/**
 * Force refresh of tenant ID on next call
 * Useful when you suspect tenant context has changed
 */
export function invalidateTenantCache(): void {
  lastSessionCheck = 0;
}
