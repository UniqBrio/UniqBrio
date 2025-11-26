import { Shield, CheckCircle, XCircle, DollarSign, FileText, AlertTriangle, Scale, Mail } from "lucide-react"

export function TermsContent() {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-l-4 border-purple-600 rounded-lg p-4">
        <p className="text-sm text-gray-800 font-semibold mb-2">
          Welcome to UniqBrio – Your Digital Academy Companion
        </p>
        <p className="text-xs text-gray-700 leading-relaxed mb-2">
          We're thrilled you're here to grow your academy (or your child's talent) with us.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          By creating an account or using UniqBrio, you agree to these terms. If you are under 18, your parent or guardian must agree on your behalf.
        </p>
      </div>

      {/* Section 1 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Who we are</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              UniqBrio is operated by [Your Legal Entity Name], a company registered in India. We help arts & sports academies run smoothly so owners and coaches can focus on what they love – teaching.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Your account</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Keep your password safe. You are responsible for everything that happens under your account.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">One academy = one administrator account (free or paid). Creating fake accounts is not allowed.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. What you can do</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Use UniqBrio to manage classes, students, payments, attendance, and communication.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Invite staff, students, and parents – they'll each get their own secure login.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4 */}
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. What you cannot do</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Share, sell, or reverse-engineer UniqBrio.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Upload anything harmful (viruses, hate speech, illegal content).</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">Use the platform for anything except running your legitimate arts/sports academy.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 5 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Payments & Subscriptions</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Free tier: genuinely useful forever for small academies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Paid plans: monthly or yearly, auto-renew. Cancel anytime from Settings → Billing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">All fees are in Indian Rupees (INR) and non-refundable except where required by law.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Late payments may temporarily limit access until settled.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 6 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Content & Data</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">You own your data (student names, photos you upload, schedules, etc.).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">You give us permission to store, process, and display it so the platform works.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">We'll never sell your academy's data.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 7 */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. Termination</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              We can suspend or delete accounts that break these rules. You can delete your academy and all data anytime from Settings → Danger Zone.
            </p>
          </div>
        </div>
      </div>

      {/* Section 8 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
            <Scale className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. Limitation of Liability</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              UniqBrio is provided "as-is". We're a tiny team doing our absolute best, but we're not liable for lost revenue, missed classes, or any indirect damages. Maximum liability = what you paid us in the last 12 months.
            </p>
          </div>
        </div>
      </div>

      {/* Section 9 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
            <FileText className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. Changes</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              We'll email you if we make big changes. Continued use after changes = acceptance.
            </p>
          </div>
        </div>
      </div>

      {/* Section 10 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
            <Scale className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">10. Governing Law</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              Indian law applies. Any disputes will be settled in the courts of [Your City], India.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className="p-4 bg-gradient-to-r from-purple-100 to-orange-100 rounded-lg border-2 border-purple-300">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg flex-shrink-0">
            <Mail className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-800 leading-relaxed">
              Questions? Write to us at{" "}
              <a href="mailto:support@uniqbrio.com" className="text-purple-700 hover:text-purple-800 font-semibold underline">
                support@uniqbrio.com
              </a>{" "}
              – we actually reply within hours.
            </p>
            <p className="text-xs text-gray-800 leading-relaxed mt-2 font-semibold">
              Sincerely,<br />
              <span className="text-purple-700">The UniqBrio Team</span> ❤️
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Last updated: 24 November 2025
      </p>
    </div>
  )
}
