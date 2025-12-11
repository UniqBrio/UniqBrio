"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Shield, Lock, Cookie, RefreshCw } from "lucide-react"
import { TermsContent } from "@/components/legal/terms-content"
import { PrivacyContent } from "@/components/legal/privacy-content"
import { CookiesContent } from "@/components/legal/cookies-content"
import { RefundsContent } from "@/components/legal/refunds-content"

type PolicyType = "terms" | "privacy" | "cookies" | "refunds" | null

export default function Footer() {
  const [showPoliciesDialog, setShowPoliciesDialog] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>(null)

  const renderPolicyContent = () => {
    switch (selectedPolicy) {
      case "terms":
        return <TermsContent />
      case "privacy":
        return <PrivacyContent />
      case "cookies":
        return <CookiesContent />
      case "refunds":
        return <RefundsContent />
      default:
        return null
    }
  }

  return (
    <footer className="bg-background dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-2 px-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-white">© {new Date().getFullYear()} UniqBrio. All rights reserved.</p>

        {/* Policies Dialog Trigger */}
        <Dialog open={showPoliciesDialog} onOpenChange={setShowPoliciesDialog}>
          <DialogTrigger asChild>
            <button className="text-xs text-gray-500 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Policies
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Legal Policies
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {/* Terms of Service */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedPolicy("terms")}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Terms of Service</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Our Promise to You</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Terms of Service</DialogTitle>
                  </DialogHeader>
                  <TermsContent />
                </DialogContent>
              </Dialog>

              {/* Privacy Policy */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedPolicy("privacy")}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                      <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Privacy Policy</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">How We Protect Your Academy</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <PrivacyContent />
                </DialogContent>
              </Dialog>

              {/* Cookie Policy */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedPolicy("cookies")}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 group-hover:scale-110 transition-transform">
                      <Cookie className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Cookie Policy</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">How We Use Cookies</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Cookie Policy</DialogTitle>
                  </DialogHeader>
                  <CookiesContent />
                </DialogContent>
              </Dialog>

              {/* Refund & Cancellation */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedPolicy("refunds")}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                      <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Refund & Cancellation</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Our Refund Promise</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Refund & Cancellation Policy</DialogTitle>
                  </DialogHeader>
                  <RefundsContent />
                </DialogContent>
              </Dialog>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  )
}
