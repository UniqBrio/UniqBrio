import Link from "next/link"
import { ArrowLeft, Lock, Database, Users, Eye, Shield, Globe, Server, Mail, Download } from "lucide-react"
import GlobalFooter from "@/components/global-footer"

export const metadata = {
  title: "Privacy Policy",
  description: "UniqBrio Privacy Policy - How We Protect Your Academy",
}

export default function PrivacyPage() {
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
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Privacy Policy
              </h1>
            </div>
            <p className="text-sm text-white/90 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Last updated: 24 November 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600 rounded-xl p-6 mb-8">
            <p className="text-base text-gray-800 font-semibold">
              We care deeply about your privacy and the privacy of every child and family who uses UniqBrio.
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. What we collect</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Academy info (name, address, logo)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Personal info (name, email, phone, payment details)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Student & parent info you choose to add (name, age, photo, medical notes, attendance)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Usage data (which pages you visit, device info, IP address)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Why we collect it</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">To run the platform and send payment reminders, class updates, etc.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">To improve UniqBrio (anonymous analytics)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">To comply with Indian and Canadian law</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Who sees your data</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Only people you invite (staff, parents, students) see the data you share with them.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Our team can access it only to provide support or fix bugs.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700">Trusted partners: Auth0 (authentication), MongoDB Atlas, Cloudflare R2, Razorpay/Stripe (payments) – all under strict contracts.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Children's data</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We never collect data from children under 13 without explicit parental consent (via the parent account). Parents can view and delete their child's data anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="mb-6 p-6 bg-blue-50 rounded-2xl border-2 border-blue-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your rights (India + Canada + GDPR-ready)</h2>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Access, correct, or delete your data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Export everything in one click (Settings → Export Data)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Withdraw consent or object to processing</span>
                  </li>
                </ul>
                <div className="p-4 bg-white/80 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Just email{" "}
                    <a href="mailto:support@uniqbrio.com" className="text-purple-700 hover:text-purple-800 font-semibold underline">
                      support@uniqbrio.com
                    </a>{" "}
                    – we'll handle it within 7 days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="mb-6 p-6 bg-green-50 rounded-2xl border-2 border-green-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Security</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Industry-standard encryption, regular audits, and zero sharing with advertisers. 🔐
                </p>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Data location</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Stored securely in India and backed up in Canada-region servers. 🌏
                </p>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
                <Server className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Significant changes will be communicated via email and in-app notifications. 📢
                </p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="mt-8 p-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-300 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl flex-shrink-0">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 leading-relaxed text-sm">
                  Still have questions? We're real humans – write to{" "}
                  <a href="mailto:support@uniqbrio.com" className="text-purple-700 hover:text-purple-800 font-semibold underline">
                    support@uniqbrio.com
                  </a>
                </p>
                <p className="text-gray-800 leading-relaxed mt-4 font-semibold text-lg">
                  Sincerely,<br />
                  <span className="text-purple-700">Team UniqBrio</span> 💜
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  )
}
