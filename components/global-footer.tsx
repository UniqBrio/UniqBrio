"use client"

import Link from "next/link"
import { useState } from "react"
import dynamic from "next/dynamic"

const CookiePreferencesModal = dynamic(() => import("@/components/cookie-preferences-modal"), { ssr: false })

export default function GlobalFooter() {
  const [showCookieModal, setShowCookieModal] = useState(false)

  return (
    <>
      <footer className="bg-white border-t border-gray-200 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} UniqBrio. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link 
                href="/legal/terms" 
                className="text-gray-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Our Promise to You
              </Link>
              <Link 
                href="/legal/privacy" 
                className="text-gray-600 hover:text-purple-700 hover:underline transition-colors"
              >
                How We Protect Your Academy
              </Link>
              <Link 
                href="/legal/cookies" 
                className="text-gray-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Cookie Policy
              </Link>
              <button
                onClick={() => setShowCookieModal(true)}
                className="text-gray-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Cookie Choices
              </button>
            </div>

            {/* Tagline */}
            <div className="text-sm text-gray-600 italic">
              Mentoring Businesses, Nurturing Learners
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Preferences Modal */}
      {showCookieModal && (
        <CookiePreferencesModal onClose={() => setShowCookieModal(false)} />
      )}
    </>
  )
}
