/**
 * PWA Detection Utility
 * 
 * Detects if the user is accessing the app via installed PWA (standalone mode)
 * vs regular browser. This helps track PWA adoption and usage.
 */

/**
 * CLIENT-SIDE: Detect if app is running as installed PWA
 * 
 * Checks multiple indicators:
 * - display-mode: standalone (from manifest)
 * - navigator.standalone (iOS Safari)
 * - matchMedia for standalone display mode
 * 
 * @returns true if running as installed PWA, false if in browser
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') {
    console.log('[PWA Detector] ❌ Server-side rendering - window not available');
    return false;
  }

  console.log('[PWA Detector] 🔍 Starting PWA detection...');
  console.log('[PWA Detector] User Agent:', navigator.userAgent);

  // Check 1: iOS Safari standalone mode
  const isIOSStandalone = (window.navigator as any).standalone === true;
  console.log('[PWA Detector] 📱 iOS standalone mode:', isIOSStandalone);
  if (isIOSStandalone) {
    console.log('[PWA Detector] ✅ PWA detected via iOS standalone mode');
    return true;
  }

  // Check 2: Display mode from manifest (Android/Desktop)
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
  console.log('[PWA Detector] 🖥️ Display mode standalone:', isStandaloneMode);
  if (isStandaloneMode) {
    console.log('[PWA Detector] ✅ PWA detected via standalone display mode');
    return true;
  }

  // Check 3: Alternative display mode check
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  console.log('[PWA Detector] 🎨 Display mode minimal-ui:', isMinimalUI);
  if (isMinimalUI) {
    console.log('[PWA Detector] ✅ PWA detected via minimal-ui display mode');
    return true;
  }

  // Check 4: Check if launched from home screen (Android)
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  console.log('[PWA Detector] 📱 Display mode fullscreen:', isFullscreen);
  if (isFullscreen) {
    console.log('[PWA Detector] ✅ PWA detected via fullscreen display mode');
    return true;
  }

  // Log all display modes for debugging
  const currentDisplayMode = 
    window.matchMedia('(display-mode: browser)').matches ? 'browser' : 
    window.matchMedia('(display-mode: standalone)').matches ? 'standalone' :
    window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' :
    window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' : 'unknown';
    
  console.log('[PWA Detector] 📊 Current display mode:', currentDisplayMode);
  console.log('[PWA Detector] 🌐 Running in browser mode (not PWA)');

  return false;
}

/**
 * CLIENT-SIDE: Get PWA status as string for display
 */
export function getPWAStatus(): 'PWA' | 'Browser' {
  return isPWAInstalled() ? 'PWA' : 'Browser';
}

/**
 * CLIENT-SIDE: Manual PWA detection trigger for testing
 * Can be called from browser console: window.testPWADetection()
 */
export function testPWADetection(): void {
  console.log('🧪 [PWA Test] Manual PWA detection triggered');
  const result = isPWAInstalled();
  console.log('🧪 [PWA Test] Result:', result ? 'PWA Mode ✅' : 'Browser Mode 🌐');
  
  // Make it globally available for console testing
  if (typeof window !== 'undefined') {
    (window as any).testPWADetection = testPWADetection;
  }
}

/**
 * CLIENT-SIDE: Store PWA status in session storage for persistence
 */
export function storePWAStatus(): void {
  if (typeof window === 'undefined') return;
  
  const isPWA = isPWAInstalled();
  sessionStorage.setItem('ub_is_pwa', isPWA ? 'true' : 'false');
}

/**
 * CLIENT-SIDE: Get stored PWA status
 */
export function getStoredPWAStatus(): boolean {
  if (typeof window === 'undefined') return false;
  
  const stored = sessionStorage.getItem('ub_is_pwa');
  return stored === 'true';
}
