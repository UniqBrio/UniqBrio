/**
 * Tenant-aware localStorage utilities for notifications
 * Ensures notification read status is isolated per tenant
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
      // Clear all tenant-specific data when tenant changes
      clearAllTenantData();
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
 * Clear all tenant-specific localStorage data
 * Called when tenant switch is detected
 */
function clearAllTenantData(): void {
  try {
    // Find and remove all tenant-specific notification keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('readNotifications_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keysToRemove.length} tenant-specific notification keys`);
  } catch (error) {
    console.error('Error clearing tenant data:', error);
  }
}

/**
 * Get tenant-specific key for localStorage
 */
function getTenantKey(key: string, tenantId: string): string {
  return `${key}_${tenantId}`;
}

/**
 * Get read notifications for the current tenant
 */
export async function getReadNotifications(): Promise<string[]> {
  const tenantId = await getTenantId();
  const key = getTenantKey('readNotifications', tenantId);
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (error) {
    console.error('Error reading tenant notifications:', error);
    return [];
  }
}

/**
 * Save read notifications for the current tenant
 */
export async function saveReadNotifications(readIds: string[]): Promise<void> {
  const tenantId = await getTenantId();
  const key = getTenantKey('readNotifications', tenantId);
  try {
    localStorage.setItem(key, JSON.stringify(readIds));
  } catch (error) {
    console.error('Error saving tenant notifications:', error);
  }
}

/**
 * Mark a single notification as read for the current tenant
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const readNotifications = await getReadNotifications();
  if (!readNotifications.includes(notificationId)) {
    readNotifications.push(notificationId);
    await saveReadNotifications(readNotifications);
  }
}

/**
 * Mark multiple notifications as read for the current tenant
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  const readNotifications = await getReadNotifications();
  const newReadIds = notificationIds.filter(id => !readNotifications.includes(id));
  if (newReadIds.length > 0) {
    await saveReadNotifications([...readNotifications, ...newReadIds]);
  }
}

/**
 * Clear all read notification IDs for the current tenant
 */
export async function clearReadNotifications(): Promise<void> {
  const tenantId = await getTenantId();
  const key = getTenantKey('readNotifications', tenantId);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing tenant notifications:', error);
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
