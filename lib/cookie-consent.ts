/**
 * Cookie Consent Enforcement Library
 * 
 * Provides utilities for:
 * - Checking consent status
 * - Syncing localStorage → MongoDB after login
 * - Enforcing consent for analytics/marketing scripts
 * - GDPR/DPDP compliance helpers
 * 
 * SECURITY RULES:
 * - Never trust tenantId from client
 * - Always derive tenantId from JWT
 * - All MongoDB queries include { tenantId }
 */

import CookiePreference from '@/models/CookiePreference';
import { dbConnect } from '@/lib/mongodb';
import { hashIP } from '@/models/CookiePreference';

// localStorage key for anonymous users
const STORAGE_KEY = 'ub_cookie_preferences';
const POLICY_VERSION = '1.0';

/**
 * Cookie Preferences Interface
 */
export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  policyVersion: string;
  timestamp?: number;
}

/**
 * Default preferences (no consent except essential)
 */
export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  policyVersion: POLICY_VERSION,
};

/**
 * CLIENT-SIDE: Get preferences from localStorage
 * Used for anonymous users or before authentication check
 */
export function getLocalPreferences(): CookiePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);
    return {
      essential: true, // Always true
      analytics: parsed.analytics ?? false,
      marketing: parsed.marketing ?? false,
      policyVersion: parsed.policyVersion || POLICY_VERSION,
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.error('[Cookie Consent] Failed to parse localStorage:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * CLIENT-SIDE: Save preferences to localStorage
 * Used for anonymous users
 */
export function setLocalPreferences(preferences: Partial<CookiePreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getLocalPreferences();
    const updated = {
      ...current,
      ...preferences,
      essential: true, // Always true
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Emit custom event for listeners
    window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', { 
      detail: updated 
    }));
  } catch (error) {
    console.error('[Cookie Consent] Failed to save to localStorage:', error);
  }
}

/**
 * CLIENT-SIDE: Clear localStorage preferences
 * Used after successful sync to MongoDB
 */
export function clearLocalPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Cookie Consent] Failed to clear localStorage:', error);
  }
}

/**
 * CLIENT-SIDE: Check if user has consented to a category
 * Checks localStorage for anonymous users
 */
export function hasLocalConsent(category: 'essential' | 'analytics' | 'marketing'): boolean {
  if (category === 'essential') {
    return true; // Essential always allowed
  }

  const preferences = getLocalPreferences();
  return preferences[category] === true;
}

/**
 * SERVER-SIDE: Get user's cookie preferences from MongoDB
 * SECURITY: tenantId must come from verified JWT
 */
export async function getUserPreferences(
  userId: string,
  tenantId: string
): Promise<CookiePreferences | null> {
  try {
    await dbConnect();
    const preference = await CookiePreference.getUserPreferences(userId, tenantId);

    if (!preference) {
      return null;
    }

    return {
      essential: preference.essential,
      analytics: preference.analytics,
      marketing: preference.marketing,
      policyVersion: preference.policyVersion,
    };
  } catch (error) {
    console.error('[Cookie Consent] Failed to get user preferences:', error);
    return null;
  }
}

/**
 * SERVER-SIDE: Check if user has consented to a category
 * SECURITY: tenantId must come from verified JWT
 * 
 * @example
 * const hasConsent = await hasConsent(tenantId, userId, 'analytics');
 * if (hasConsent) {
 *   // Load Google Analytics
 * }
 */
export async function hasConsent(
  tenantId: string,
  userId: string,
  category: 'essential' | 'analytics' | 'marketing'
): Promise<boolean> {
  if (category === 'essential') {
    return true; // Essential always allowed
  }

  try {
    await dbConnect();
    return await CookiePreference.hasUserConsent(userId, tenantId, category);
  } catch (error) {
    console.error('[Cookie Consent] Failed to check consent:', error);
    return false; // Fail closed - no consent on error
  }
}

/**
 * SERVER-SIDE: Set or update user's cookie preferences
 * SECURITY: tenantId must come from verified JWT
 */
export async function setUserPreferences(
  userId: string,
  tenantId: string,
  preferences: {
    analytics: boolean;
    marketing: boolean;
    policyVersion?: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<boolean> {
  try {
    await dbConnect();

    const ipHash = metadata?.ipAddress 
      ? hashIP(metadata.ipAddress) 
      : undefined;

    await CookiePreference.setUserPreferences(
      userId,
      tenantId,
      {
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        policyVersion: preferences.policyVersion || POLICY_VERSION,
        ipHash,
        userAgent: metadata?.userAgent,
      }
    );

    return true;
  } catch (error) {
    console.error('[Cookie Consent] Failed to set preferences:', error);
    return false;
  }
}

/**
 * SERVER-SIDE: Sync localStorage preferences to MongoDB after login
 * Called automatically after successful authentication
 * 
 * FLOW:
 * 1. User sets preferences as anonymous (localStorage)
 * 2. User logs in
 * 3. This function syncs localStorage → MongoDB
 * 4. localStorage is cleared
 * 
 * SECURITY: tenantId from JWT only
 */
export async function syncLocalToMongoDB(
  userId: string,
  tenantId: string,
  localPreferences: CookiePreferences,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<boolean> {
  try {
    await dbConnect();

    // Check if user already has preferences in MongoDB
    const existing = await CookiePreference.getUserPreferences(userId, tenantId);

    if (existing) {
      // User already has preferences - don't override
      console.log('[Cookie Consent] User already has preferences, skipping sync');
      return true;
    }

    // Sync localStorage to MongoDB
    const ipHash = metadata?.ipAddress 
      ? hashIP(metadata.ipAddress) 
      : undefined;

    await CookiePreference.setUserPreferences(
      userId,
      tenantId,
      {
        analytics: localPreferences.analytics,
        marketing: localPreferences.marketing,
        policyVersion: localPreferences.policyVersion || POLICY_VERSION,
        ipHash,
        userAgent: metadata?.userAgent,
      }
    );

    console.log('[Cookie Consent] Successfully synced localStorage → MongoDB');
    return true;
  } catch (error) {
    console.error('[Cookie Consent] Failed to sync preferences:', error);
    return false;
  }
}

/**
 * CLIENT-SIDE: Initialize cookie consent after login
 * This should be called after successful authentication
 * 
 * FLOW:
 * 1. Check for localStorage preferences
 * 2. If exists, call API to sync to MongoDB
 * 3. Fetch user's MongoDB preferences
 * 4. Clear localStorage
 */
export async function initializeAfterLogin(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const localPrefs = getLocalPreferences();

    // If user had set preferences locally, sync them
    if (localPrefs.timestamp) {
      const response = await fetch('/api/cookie-preferences/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: localPrefs }),
      });

      if (response.ok) {
        console.log('[Cookie Consent] Synced to MongoDB after login');
        clearLocalPreferences();
      }
    }

    // Fetch user's preferences from MongoDB
    const response = await fetch('/api/cookie-preferences');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.preferences) {
        // Emit event with server preferences
        window.dispatchEvent(new CustomEvent('cookiePreferencesLoaded', { 
          detail: data.preferences 
        }));
      }
    }
  } catch (error) {
    console.error('[Cookie Consent] Failed to initialize after login:', error);
  }
}

/**
 * CLIENT-SIDE: React hook for cookie consent
 * 
 * @example
 * const { hasConsent, preferences, updatePreferences } = useCookieConsent();
 * 
 * if (hasConsent('analytics')) {
 *   // Load Google Analytics
 * }
 */
export function useCookieConsent() {
  if (typeof window === 'undefined') {
    return {
      preferences: DEFAULT_PREFERENCES,
      hasConsent: (category: string) => category === 'essential',
      updatePreferences: async () => {},
    };
  }

  // This is a simple implementation - in React, use useState/useEffect
  const preferences = getLocalPreferences();

  return {
    preferences,
    hasConsent: (category: 'essential' | 'analytics' | 'marketing') => {
      if (category === 'essential') return true;
      return preferences[category] === true;
    },
    updatePreferences: async (newPrefs: Partial<CookiePreferences>) => {
      // Try to update on server first (if authenticated)
      try {
        const response = await fetch('/api/cookie-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: newPrefs }),
        });

        if (response.ok) {
          // Server update successful
          return;
        }
      } catch (error) {
        // Fall through to localStorage
      }

      // Fallback to localStorage (anonymous user)
      setLocalPreferences(newPrefs);
    },
  };
}

/**
 * ENFORCEMENT: Block scripts based on consent
 * Use this in _document.tsx or layout to conditionally load scripts
 * 
 * @example
 * {shouldLoadAnalytics() && (
 *   <Script src="https://www.googletagmanager.com/gtag/js" />
 * )}
 */
export function shouldLoadAnalytics(): boolean {
  return hasLocalConsent('analytics');
}

export function shouldLoadMarketing(): boolean {
  return hasLocalConsent('marketing');
}

/**
 * COMPLIANCE: Get consent withdrawal instructions
 * For GDPR Article 7(3) - easy withdrawal
 */
export function getWithdrawalInstructions(): string {
  return `
You can withdraw your consent at any time by:
1. Going to Settings → Privacy → Cookie Preferences
2. Unchecking the categories you wish to withdraw
3. Clicking "Save Preferences"

Your preferences will be updated immediately and take effect on your next page load.
  `.trim();
}

/**
 * COMPLIANCE: Get data retention policy
 * For GDPR Article 13/14 transparency requirements
 */
export function getDataRetentionPolicy(): string {
  return `
Cookie Preference Data Retention:
- Active users: Retained indefinitely while account is active
- After account deletion: Deleted within 30 days
- IP addresses: Stored as one-way hash only (pseudonymization)
- Audit trail: Retained for compliance for 3 years

You have the right to:
- Access your cookie preference data
- Delete your cookie preference data
- Export your cookie preference data
- Withdraw consent at any time
  `.trim();
}
