import Link from "next/link"
import { ArrowLeft, Shield, CheckCircle, XCircle, DollarSign, FileText, AlertTriangle, Scale, Mail } from "lucide-react"
import GlobalFooter from "@/components/global-footer"

export const metadata = {
  title: "Terms of Service",
  description: "UniqBrio Terms of Service - Our Promise to You",
}

export default function TermsPage() {
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
        <div className="relative bg-gradient-to-r from-purple-600 to-orange-500 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Terms of Service
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
          <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-l-4 border-purple-600 rounded-xl p-6 mb-8">
            <p className="text-base text-gray-800 dark:text-white font-semibold mb-3">
              Welcome to UniqBrio – Your Digital Academy Companion
            </p>
            <p className="text-sm text-gray-700 dark:text-white leading-relaxed mb-3">
              We're thrilled you're here to grow your academy (or your child's talent) with us.
            </p>
            <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
              By creating an account or using UniqBrio, you agree to these terms. If you are under 18, your parent or guardian must agree on your behalf.
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Who we are</h2>
                <p className="text-gray-700 dark:text-white leading-relaxed">
                  UniqBrio is operated by [Your Legal Entity Name], a company registered in India. We help arts & sports academies run smoothly so owners and coaches can focus on what they love – teaching.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Your account</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">Keep your password safe. You are responsible for everything that happens under your account.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">One academy = one administrator account (free or paid). Creating fake accounts is not allowed.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. What you can do</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">Use UniqBrio to manage classes, students, payments, attendance, and communication.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">Invite staff, students, and parents – they'll each get their own secure login.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-6 p-6 bg-red-50 rounded-2xl border border-red-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. What you cannot do</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">Share, sell, or reverse-engineer UniqBrio.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">Upload anything harmful (viruses, hate speech, illegal content).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">Use the platform for anything except running your legitimate arts/sports academy.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl flex-shrink-0">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. Payments & Subscriptions</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-gray-700 dark:text-white">Free tier: genuinely useful forever for small academies.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-gray-700 dark:text-white">Paid plans: monthly or yearly, auto-renew. Cancel anytime from Settings → Billing.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-gray-700 dark:text-white">All fees are in Indian Rupees (INR) and non-refundable except where required by law.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-gray-700 dark:text-white">Late payments may temporarily limit access until settled.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Content & Data</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">You own your data (student names, photos you upload, schedules, etc.).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">You give us permission to store, process, and display it so the platform works.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white">We'll never sell your academy's data.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Termination</h2>
                <p className="text-gray-700 dark:text-white leading-relaxed">
                  We can suspend or delete accounts that break these rules. You can delete your academy and all data anytime from Settings → Danger Zone.
                </p>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
                <Scale className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
                <p className="text-gray-700 dark:text-white leading-relaxed">
                  UniqBrio is provided "as-is". We're a tiny team doing our absolute best, but we're not liable for lost revenue, missed classes, or any indirect damages. Maximum liability = what you paid us in the last 12 months.
                </p>
              </div>
            </div>
          </div>

          {/* Section 9 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-100 rounded-xl flex-shrink-0">
                <FileText className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">9. Changes</h2>
                <p className="text-gray-700 dark:text-white leading-relaxed">
                  We'll email you if we make big changes. Continued use after changes = acceptance.
                </p>
              </div>
            </div>
          </div>

          {/* Section 10 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-xl flex-shrink-0">
                <Scale className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">10. Governing Law</h2>
                <p className="text-gray-700 dark:text-white leading-relaxed">
                  Indian law applies. Any disputes will be settled in the courts of [Your City], India.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="mt-8 p-8 bg-gradient-to-r from-purple-100 to-orange-100 rounded-2xl border-2 border-purple-300 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl flex-shrink-0">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-white leading-relaxed text-sm">
                  Questions? Write to us at{" "}
                  <a href="mailto:support@uniqbrio.com" className="text-purple-700 hover:text-purple-800 font-semibold underline">
                    support@uniqbrio.com
                  </a>{" "}
                  – we actually reply within hours.
                </p>
                <p className="text-gray-800 dark:text-white leading-relaxed mt-4 font-semibold text-lg">
                  Sincerely,<br />
                  <span className="text-purple-700">The UniqBrio Team</span> ❤️
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
