"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TermsContent } from "@/components/legal/terms-content"
import { PrivacyContent } from "@/components/legal/privacy-content"
import { CookiesContent } from "@/components/legal/cookies-content"
import { RefundsContent } from "@/components/legal/refunds-content"

const CookiePreferencesModal = dynamic(() => import("@/components/cookie-preferences-modal"), { ssr: false })

export default function GlobalFooter() {
  const [showCookieModal, setShowCookieModal] = useState(false)

  return (
    <>
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-gray-600 dark:text-white">
              © {new Date().getFullYear()} UniqBrio. All rights reserved.
            </div>

            {/* Legal Links as Dialogs */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-gray-600 dark:text-white hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition-colors">
                    Our Promise to You
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Terms of Service</DialogTitle>
                  </DialogHeader>
                  <TermsContent />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-gray-600 dark:text-white hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition-colors">
                    How We Protect Your Academy
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <PrivacyContent />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-gray-600 dark:text-white hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition-colors">
                    Cookie Policy
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Cookie Policy</DialogTitle>
                  </DialogHeader>
                  <CookiesContent />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-gray-600 dark:text-white hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition-colors">
                    Refunds & Cancellations
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Refund & Cancellation Policy</DialogTitle>
                  </DialogHeader>
                  <RefundsContent />
                </DialogContent>
              </Dialog>

              <button
                onClick={() => setShowCookieModal(true)}
                className="text-gray-600 dark:text-white hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition-colors"
              >
                Cookie Choices
              </button>
            </div>

            {/* Tagline */}
            <div className="text-sm text-gray-600 dark:text-white italic">
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
