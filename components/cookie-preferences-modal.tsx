"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { setCookieConsent, getCookieConsent } from "@/lib/cookies"

interface CookiePreferencesModalProps {
  onClose: () => void
}

export default function CookiePreferencesModal({ onClose }: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState({
    strictlyNecessary: true, // Always true, can't be disabled
    analytics: true,
    personalization: false,
  })

  useEffect(() => {
    // Load existing preferences
    const consent = getCookieConsent()
    if (consent) {
      setPreferences({
        strictlyNecessary: true,
        analytics: consent === "all",
        personalization: consent === "all",
      })
    }
  }, [])

  const savePreferences = () => {
    const consentType = preferences.analytics ? "all" : "essential"
    setCookieConsent(consentType)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Cookie Preferences</h2>
              <p className="text-sm text-gray-600">
                Manage how we use cookies to improve your experience
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Strictly Necessary */}
          <div className="border-b border-gray-100 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="strictlyNecessary"
                    checked={preferences.strictlyNecessary}
                    disabled
                    className="w-5 h-5 rounded border-gray-300 cursor-not-allowed opacity-50"
                  />
                  <label htmlFor="strictlyNecessary" className="font-semibold text-gray-900 cursor-not-allowed">
                    Essential Cookies
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Required for the site to work properly. These cookies enable core functionality like security, 
                  authentication, and session management. They cannot be disabled.
                </p>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="border-b border-gray-100 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="analytics"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="analytics" className="font-semibold text-gray-900 cursor-pointer">
                    Analytics Cookies
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Help us understand how you use UniqBrio so we can improve features and fix issues. 
                  All data is anonymized and aggregated.
                </p>
              </div>
            </div>
          </div>

          {/* Personalization */}
          <div className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="personalization"
                    checked={preferences.personalization}
                    onChange={(e) => setPreferences({ ...preferences, personalization: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="personalization" className="font-semibold text-gray-900 cursor-pointer">
                    Personalization Cookies
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Remember your preferences and settings to provide a tailored experience. 
                  Currently not used by UniqBrio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              className="flex-1 px-6 py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition-colors font-semibold shadow-lg shadow-purple-200"
            >
              Save Preferences
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            You can change your preferences anytime from the footer
          </p>
        </div>
      </div>
    </div>
  )
}
