import { Cookie, CheckCircle, XCircle, Settings, Shield } from "lucide-react"

export function CookiesContent() {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-l-4 border-orange-600 rounded-lg p-4">
        <p className="text-sm text-gray-800 font-semibold">
          We use cookies and similar technologies to make UniqBrio secure and functional.
        </p>
      </div>

      {/* Section 1 - Essential Cookies */}
      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-bold text-gray-900">1. Strictly necessary cookies</h3>
              <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-bold">REQUIRED</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Keep you logged in</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Remember your academy and role</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Prevent fraud</span>
              </li>
            </ul>
            <div className="mt-3 p-2 bg-white/80 rounded-lg">
              <p className="text-xs text-gray-700 font-medium">→ Cannot be turned off (otherwise the site breaks)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 - Analytics Cookies */}
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-bold text-gray-900">2. Performance & analytics cookies</h3>
              <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">OPTIONAL</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Help us understand which features are most used</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Completely anonymous analytics</span>
              </li>
            </ul>
            <div className="mt-3 p-2 bg-white/80 rounded-lg">
              <p className="text-xs text-gray-700 font-medium">→ You can disable them in the cookie banner or browser settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 - Marketing Cookies */}
      <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
            <XCircle className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-bold text-gray-900">3. Marketing cookies</h3>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded-full text-xs font-bold">NOT USED</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              We don't use any. We do not use marketing cookies or retargeting advertisements.✨
            </p>
          </div>
        </div>
      </div>

      {/* Info Card - How to Manage */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border border-purple-200">
        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-600" />
          How to manage your cookie preferences
        </h3>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">1.</span>
            <span className="text-xs text-gray-700">Click "Cookie Choices" in the footer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">2.</span>
            <span className="text-xs text-gray-700">Adjust your browser settings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">3.</span>
            <span className="text-xs text-gray-700">Use browser extensions for cookie management</span>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div className="p-4 bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg border-2 border-orange-300">
        <div className="flex items-start gap-2 mb-2">
          <Cookie className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <h3 className="text-sm font-bold text-gray-900">Questions about cookies?</h3>
        </div>
        <p className="text-xs text-gray-800 leading-relaxed">
          For inquiries, please contact us at{" "}
          <a href="mailto:support@uniqbrio.com" className="text-orange-700 hover:text-orange-800 font-semibold underline">
            support@uniqbrio.com
          </a>
        </p>
        <p className="text-xs text-orange-700 font-semibold mt-2">
          Team UniqBrio
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Last updated: 24 November 2025
      </p>
    </div>
  )
}
