import { Lock, Database, Users, Eye, Shield, Globe, Server, Mail, Download } from "lucide-react"

export function PrivacyContent() {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600 rounded-lg p-4">
        <p className="text-sm text-gray-800 font-semibold">
          We care deeply about your privacy and the privacy of every child and family who uses UniqBrio.
        </p>
      </div>

      {/* Section 1 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. What we collect</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Academy info (name, address, logo)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Personal info (name, email, phone, payment details)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Student & parent info you choose to add (name, age, photo, medical notes, attendance)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Usage data (which pages you visit, device info, IP address)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <Eye className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Why we collect it</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">To run the platform and send payment reminders, class updates, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">To improve UniqBrio (anonymous analytics)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">To comply with Indian law</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Who sees your data</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Only people you invite (staff, parents, students) see the data you share with them.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Our team can access it only to provide support or fix bugs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Trusted partners: Auth0 (authentication), MongoDB Atlas, Cloudflare R2, Cashfree (payments) – all under strict contracts.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4 */}
      <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
            <Shield className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. Children's data</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              We never collect data from children under 13 without explicit parental consent (via the parent account). Parents can view and delete their child's data anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5 */}
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Security</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">All data is encrypted at rest and in transit (SSL/TLS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Payment details are handled by PCI-compliant providers (Cashfree) – we never see or store your card numbers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Two-factor authentication available</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 6 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <Download className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Your rights</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">View, update, or export your data anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Delete your account and all data (Settings → Danger Zone)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Opt out of marketing emails (we barely send them anyway)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 7 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Globe className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. International data transfers</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              Data may be stored on servers in India or cloud providers (MongoDB Atlas, Cloudflare). We ensure adequate protection wherever data resides.
            </p>
          </div>
        </div>
      </div>

      {/* Section 8 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
            <Server className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. Data retention</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              We keep your data as long as your account is active. After deletion, backups are purged within 90 days.
            </p>
          </div>
        </div>
      </div>

      {/* Section 9 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
            <Mail className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. Changes to this policy</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              We'll notify you via email if we make significant changes. Continued use = acceptance.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg flex-shrink-0">
            <Mail className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-800 leading-relaxed">
              Questions about privacy? Email{" "}
              <a href="mailto:support@uniqbrio.com" className="text-purple-700 hover:text-purple-800 font-semibold underline">
                support@uniqbrio.com
              </a>{" "}
              – we respond promptly.
            </p>
            <p className="text-xs text-gray-800 leading-relaxed mt-2 font-semibold">
              With care,<br />
              <span className="text-purple-700">The UniqBrio Team</span> 🔒
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Last updated: 09 December 2025
      </p>
    </div>
  )
}
