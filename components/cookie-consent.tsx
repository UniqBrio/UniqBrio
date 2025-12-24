"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react" // Import useSession
import { setCookieConsent, getCookieConsent } from "@/lib/cookies"
import { useCustomColors } from "@/lib/use-custom-colors"
import { isPWAInstalled } from "@/lib/pwa-detector"
import { X } from "lucide-react"
import Link from "next/link"

export default function CookieConsent() {
  const { data: session, status } = useSession() // Get session status
  const { primaryColor } = useCustomColors();
  const [showConsent, setShowConsent] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    strictlyNecessary: true, // Always true, can't be disabled
    analytics: true,
    marketing: false,
  })

  useEffect(() => {
    // Skip cookie popup in PWA mode
    if (typeof window !== 'undefined' && isPWAInstalled()) {
      console.log('[Cookie Consent] Running in PWA mode - skipping cookie popup')
      setShowConsent(false)
      return
    }

    // Only proceed if the authentication status is determined
    if (status === "authenticated") {
      // Check if user has already given consent (via cookie)
      const hasConsent = getCookieConsent()
      
      // Also check localStorage for consent preference (persists across sessions)
      const hasStoredPreference = typeof window !== 'undefined' && localStorage.getItem('cookieConsentGiven') === 'true'
      
      if (!hasConsent && !hasStoredPreference) {
        setShowConsent(true) // Show consent banner if logged in and no consent given
      } else {
        setShowConsent(false) // Hide if consent already given
      }
    } else {
      // If user is not authenticated (or session is loading),
      // ensure the consent banner is not shown.
      setShowConsent(false)
    }
  }, [status]) // Re-run this effect when the authentication status changes

  const acceptAll = async () => {
    setCookieConsent("all")
    // Store in localStorage so it persists even if cookie is cleared
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsentGiven', 'true')
    }
    
    // Save to database for compliance tracking
    try {
      await fetch('/api/cookie-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          preferences: { 
            analytics: true, 
            marketing: false 
          } 
        }),
      })
    } catch (error) {
      console.error('Failed to save cookie preferences to database:', error)
    }
    
    setShowConsent(false)
    setShowPreferences(false)
  }

  const savePreferences = async () => {
    const consentType = preferences.analytics ? "all" : "essential"
    setCookieConsent(consentType)
    // Store in localStorage so it persists even if cookie is cleared
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsentGiven', 'true')
    }
    
    // Save to database for compliance tracking
    try {
      await fetch('/api/cookie-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          preferences: { 
            analytics: preferences.analytics, 
            marketing: preferences.marketing 
          } 
        }),
      })
    } catch (error) {
      console.error('Failed to save cookie preferences to database:', error)
    }
    
    setShowConsent(false)
    setShowPreferences(false)
  }

  const showPreferencesPanel = () => {
    setShowPreferences(true)
  }

  const goBack = () => {
    setShowPreferences(false)
  }

  if (!showConsent) return null

  // Preferences Panel
  if (showPreferences) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 p-6 rounded-2xl border-2" style={{ borderColor: `${primaryColor}50` }}>
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cookie Preferences</h3>
            <button 
              onClick={() => setShowConsent(false)} 
              className="text-gray-400 dark:text-white hover:text-gray-600 dark:text-white dark:hover:text-gray-300 dark:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Strictly Necessary */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="strictlyNecessary"
                  checked={preferences.strictlyNecessary}
                  disabled
                  className="w-4 h-4 rounded border-gray-300 cursor-not-allowed opacity-50"
                />
                <label htmlFor="strictlyNecessary" className="font-semibold text-gray-900 dark:text-white text-sm">
                  Strictly Necessary
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-white ml-6">
                Required for the site to work (login, security)
              </p>
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: primaryColor }}
                />
                <label htmlFor="analytics" className="font-semibold text-gray-900 dark:text-white text-sm cursor-pointer">
                  Analytics
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-white ml-6">
                Help us understand how you use UniqBrio
              </p>
            </div>
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: primaryColor }}
                />
                <label htmlFor="marketing" className="font-semibold text-gray-900 dark:text-white text-sm cursor-pointer">
                  Marketing
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-white ml-6">
                Personalized ads (we don't use these)
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={goBack}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-base"
          >
            Back
          </button>
          <button
            onClick={savePreferences}
            className="flex-1 px-4 py-3 text-white rounded-xl transition-colors font-semibold text-base"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          >
            Save Preferences
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-white mt-4 text-center">
          Learn more in our{" "}
          <Link href="/legal/cookies" target="_blank" className="hover:underline" style={{ color: primaryColor }}>
            Cookie Policy
          </Link>
        </p>
      </div>
    )
  }

  // Initial Banner
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 p-6 rounded-2xl border-2" style={{ borderColor: `${primaryColor}50` }}>
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍪</span>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">We use a few cookies to keep you logged in</h3>
          </div>
          <button 
            onClick={() => setShowConsent(false)} 
            className="text-gray-400 dark:text-white hover:text-gray-600 dark:text-white dark:hover:text-gray-300 dark:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-white leading-relaxed text-sm">
          We use a few cookies to keep you logged in and make UniqBrio faster. Nothing creepy – promise! Learn more in our{" "}
          <Link href="/legal/cookies" target="_blank" className="hover:underline font-medium" style={{ color: primaryColor }}>
            Cookie Policy
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={showPreferencesPanel}
          className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-base"
        >
          Let me choose
        </button>
        <button
          onClick={acceptAll}
          className="flex-1 px-4 py-3 text-white rounded-xl transition-colors font-semibold text-base"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
        >
          Sounds good!
        </button>
      </div>
    </div>
  )
}
