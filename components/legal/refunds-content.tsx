import { RefreshCw, Calendar, CreditCard, Receipt, Mail, XCircle, AlertCircle, Heart } from "lucide-react"

export function RefundsContent() {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-l-4 border-purple-600 rounded-lg p-4">
        <p className="text-sm text-gray-800 font-semibold mb-2">
          Our Straightforward Promise
        </p>
        <p className="text-xs text-gray-600">
          (Last updated: 08 December 2025)
        </p>
        <p className="text-xs text-gray-700 leading-relaxed mt-2">
          At UniqBrio, we want you to feel completely confident when you subscribe. Here&apos;s our straightforward promise of refunds and cancellations.
        </p>
      </div>

      {/* Section 1 - Subscription Cancellations */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <XCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Subscription Cancellations</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Cancel any time from Dashboard → Billing → &quot;Manage Subscription&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Takes effect at the end of your current billing cycle</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Full access until last paid day — no prorated refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Zero charges from the next billing date</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2 - Monthly Subscriptions */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Monthly Subscription Refunds</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Cancel within <strong>48 hours</strong> → 100% automatic refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">After 48 hours → non-refundable (full access already granted)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3 - Yearly Subscriptions */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Annual Subscription Refunds</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Within <strong>14 days</strong> → 100% refund (no questions asked)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700"><strong>15–30 days</strong> → 50% refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">After 30 days → no refund, but access until end of 12 months</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4 - One-time Payments */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
            <Receipt className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. One-time Payments</h3>
            <p className="text-xs text-gray-600 mb-2">(workshops, events, merchandise)</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700"><strong>7+ days</strong> before event → full refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700"><strong>3–7 days</strong> before event → 50% refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Within 72 hours → no refund (seats/materials reserved)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 5 - How to Request */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
            <Mail className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. How to Request a Refund</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Email <a href="mailto:support@uniqbrio.com" className="text-purple-600 hover:underline">support@uniqbrio.com</a> or raise a ticket from dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Include: Academy name + Transaction ID (from Billing History)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Processed within <strong>5–7 business days</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 6 - Non-refundable */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Non-refundable Items</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Free plan usage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Custom setup/onboarding fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Payment gateway/bank transaction fees</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 7 - Exceptional Cases */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. Exceptional Cases</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">7+ days downtime (our fault) → prorated refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="text-xs text-gray-700">Something feels unfair? Email us — we review every case with care</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Closing Message */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-pink-100 rounded-lg flex-shrink-0">
            <Heart className="w-4 h-4 text-pink-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-700 leading-relaxed">
              We&apos;re here to help you grow your academy, not to create stress. If anything is unclear, just drop us a message — we reply fast and with a smile 😊
            </p>
            <p className="text-xs text-gray-700 mt-2 font-semibold">
              Thank you for trusting UniqBrio! ❤️
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
