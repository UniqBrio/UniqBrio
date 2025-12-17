"use client"

import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { isPWAInstalled, testPWADetection } from '@/lib/pwa-detector';

/**
 * PWA Status Tracker
 * 
 * Detects if user is accessing via PWA and reports to backend
 * Should be included in the main layout after authentication
 */
const PWAStatusTracker: FC = () => {
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure authentication has been established
    const timer = setTimeout(async () => {
      console.log('[PWA Tracker] Starting PWA detection process');
      
      // Check if we've already reported PWA status for this session
      const hasReported = sessionStorage.getItem('pwa_status_reported');
      if (hasReported === 'true') {
        console.log('[PWA Tracker] Already reported for this session');
        return;
      }

      // Always detect PWA mode first (this doesn't require authentication)
      const isPWA = isPWAInstalled();
      console.log('[PWA Tracker] 📋 PWA Detection Summary:', isPWA ? '✅ PWA Mode' : '🌐 Browser Mode');
      
      // Make test function globally available for manual testing
      if (typeof window !== 'undefined') {
        (window as any).testPWADetection = testPWADetection;
        console.log('[PWA Tracker] 🧪 Test function available: window.testPWADetection()');
      }

      // Try to report to backend (will handle its own authentication)
      try {
        const response = await fetch('/api/session/pwa-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isPWA }),
        });

        console.log('[PWA Tracker] API Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem('pwa_status_reported', 'true');
          console.log('[PWA Tracker] ✅ PWA status successfully reported to backend:', isPWA ? 'PWA Mode' : 'Browser Mode');
          console.log('[PWA Tracker] Response data:', data);
        } else {
          try {
            const errorData = await response.json();
            console.warn('[PWA Tracker] ⚠️ Backend reported error:', response.status, errorData);
          } catch (e) {
            const errorText = await response.text();
            console.warn('[PWA Tracker] ⚠️ Backend reported non-JSON error:', response.status, errorText);
          }
        }
      } catch (error) {
        console.error('[PWA Tracker] ❌ Network error reporting PWA status:', error);
      }

      setHasChecked(true);
    }, 2000); // 2 second delay to allow authentication to settle

    return () => clearTimeout(timer);
  }, [hasChecked]);

  return null; // This is an invisible tracker component
};

export default PWAStatusTracker;
