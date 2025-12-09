import Link from "next/link"
import { ArrowLeft, Cookie, CheckCircle, XCircle, Settings, Shield } from "lucide-react"
import GlobalFooter from "@/components/global-footer"

export const metadata = {
  title: "Cookie Policy",
  description: "UniqBrio Cookie Policy - How We Use Cookies",
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-6 transition-all hover:gap-3 font-medium group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Cookie className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Cookie Policy
              </h1>
            </div>
            <p className="text-sm text-white/90 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Last updated: 09 December 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-l-4 border-orange-600 rounded-xl p-6 mb-8">
            <p className="text-base text-gray-800 dark:text-white font-semibold">
              We use cookies and similar technologies to make UniqBrio secure and functional.
            </p>
          </div>

          {/* Section 1 - Essential Cookies */}
          <div className="mb-6 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Strictly necessary cookies</h2>
                  <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">REQUIRED</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-white">Keep you logged in</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-white">Remember your academy and role</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-white">Prevent fraud</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-white/80 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-white font-medium">→ Cannot be turned off (otherwise the site breaks)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 - Analytics Cookies */}
          <div className="mb-6 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Performance & analytics cookies</h2>
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">OPTIONAL</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-white">Help us understand which features are most used</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-white">Completely anonymous analytics</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-white/80 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-white font-medium">→ You can disable them in the cookie banner or browser settings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 - Marketing Cookies */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-xl flex-shrink-0">
                <XCircle className="w-6 h-6 text-gray-600 dark:text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Marketing cookies</h2>
                  <span className="px-3 py-1 bg-gray-200 text-gray-800 dark:text-white rounded-full text-xs font-bold">NOT USED</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
                  We don't use any. We do not use marketing cookies or retargeting advertisements.✨
                </p>
              </div>
            </div>
          </div>

          {/* Info Card - How to Manage */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-orange-50 rounded-2xl border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              How to manage your cookie preferences
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">1.</span>
                <span className="text-sm text-gray-700 dark:text-white">Click "Cookie Choices" in the footer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">2.</span>
                <span className="text-sm text-gray-700 dark:text-white">Adjust your browser settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <span className="text-sm text-gray-700 dark:text-white">Use browser extensions for cookie management</span>
              </li>
            </ul>
          </div>

          {/* Contact Card */}
          <div className="mt-8 p-8 bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl border-2 border-orange-300 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Questions about cookies?</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
              For inquiries, please contact us at{" "}
              <a href="mailto:support@uniqbrio.com" className="text-orange-700 hover:text-orange-800 font-semibold underline">
                support@uniqbrio.com
              </a>
            </p>
            <p className="text-sm text-gray-800 dark:text-white mt-4 font-semibold">
              <span className="text-orange-700">Team UniqBrio</span>
            </p>
          </div>

         
        </div>
      </div>

      <GlobalFooter />
    </div>
  )
}
