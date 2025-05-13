"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react" // Import useSession
import { setCookieConsent, getCookieConsent } from "@/lib/cookies"
import { X } from "lucide-react"

export default function CookieConsent() {
  const { data: session, status } = useSession() // Get session status
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // Only proceed if the authentication status is determined
    if (status === "authenticated") {
      // User is logged in, now check if they've already given consent
      const hasConsent = getCookieConsent()
      if (!hasConsent) {
        setShowConsent(true) // Show consent banner if logged in and no consent given
      } else {
        setShowConsent(false) // Hide if logged in but consent already given
      }
    } else {
      // If user is not authenticated (or session is loading),
      // ensure the consent banner is not shown.
      setShowConsent(false)
    }
  }, [status]) // Re-run this effect when the authentication status changes

  const acceptAll = () => {
    setCookieConsent("all")
    setShowConsent(false)
  }

  const acceptEssential = () => {
    setCookieConsent("essential")
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4 md:p-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Cookie Consent</h3>
          <button onClick={() => setShowConsent(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our
          traffic. By clicking "Accept All", you consent to our use of cookies. You can manage your preferences by
          clicking "Accept Essential Only".
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={acceptEssential}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Accept Essential Only
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#e08c28] transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
