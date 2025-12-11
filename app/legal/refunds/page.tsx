import Link from "next/link"
import { ArrowLeft, RefreshCw, Calendar, CreditCard, Receipt, Mail, XCircle, AlertCircle, Heart } from "lucide-react"
import GlobalFooter from "@/components/global-footer"

export const metadata = {
  title: "Refund & Cancellation Policy",
  description: "UniqBrio Refund & Cancellation Policy - Our straightforward promise",
}

export default function RefundsPage() {
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
                <RefreshCw className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Refund & Cancellation Policy
              </h1>
            </div>
            <p className="text-sm text-white/90 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Last updated: 08 December 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600 rounded-xl p-6 mb-8">
            <p className="text-base text-gray-800 dark:text-white font-semibold">
              At UniqBrio, we want you to feel completely confident when you subscribe. Here&apos;s our straightforward promise of refunds and cancellations.
            </p>
          </div>

          {/* Section 1 - Subscription Cancellations */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <XCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Subscription Cancellations</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">You can cancel your paid subscription any time from your Academy Dashboard → Billing → &quot;Manage Subscription&quot;.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Cancellation takes effect immediately at the end of your current billing cycle (monthly or yearly).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">You will continue to have full access until the last paid day — no prorated refund for the remaining days of the cycle.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">After cancellation = zero charges from the next billing date.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 - Monthly Subscriptions */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Refunds for Monthly Subscriptions</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">If you cancel within <strong>48 hours</strong> of the payment being made, we will refund 100% automatically.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">After 48 hours, the current month is non-refundable because you already have full access to all features.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 - Yearly Subscriptions */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Refunds for Yearly (Annual) Subscriptions</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">If you cancel within <strong>14 days</strong> of the payment date → 100% refund (no questions asked).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Between <strong>15–30 days</strong> → 50% refund.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">After 30 days → no refund, but you keep access until the end of the 12-month period.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4 - One-time Payments */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. One-time Payments</h2>
                <p className="text-sm text-gray-600 mb-3">(e.g., workshop fees, event tickets, merchandise ordered via UniqBrio)</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Fully refundable if requested at least <strong>7 days</strong> before the event/workshop starts.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white"><strong>50% refund</strong> between 3–7 days before the event.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">No refund within 72 hours of the event (because seats/materials are already reserved).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5 - How to Request */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 rounded-xl flex-shrink-0">
                <Mail className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. How to Request a Refund</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Simply email us at <a href="mailto:support@uniqbrio.com" className="text-purple-600 hover:underline font-medium">support@uniqbrio.com</a> or raise a ticket from your dashboard within the eligible period.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Mention your Academy name and transaction ID (visible in Billing History).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">We process refunds within <strong>5–7 business days</strong> back to the original payment method.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 6 - Non-refundable Items */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Non-refundable Items</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Free plan usage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Any custom setup/onboarding fees (if charged separately)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">Transaction fees charged by payment gateway or banks (these are deducted by the bank, not by us)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 7 - Exceptional Cases */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Exceptional Cases</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">If UniqBrio is unable to provide the service for more than 7 consecutive days due to our fault, you are entitled to a prorated refund for the downtime period.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-sm text-gray-700 dark:text-white">We are always human — if something feels unfair, write to us at <a href="mailto:support@uniqbrio.com" className="text-purple-600 hover:underline font-medium">support@uniqbrio.com</a>. We will review every case with care.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Closing Message */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-100 rounded-xl flex-shrink-0">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
                  We&apos;re here to help you grow your academy, not to create stress. If anything is unclear, just drop us a message — we reply fast and with a smile 😊
                </p>
                <p className="text-sm text-gray-700 dark:text-white mt-3 font-semibold">
                  Thank you for trusting UniqBrio!<br />
                  Team UniqBrio ❤️
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/legal/privacy" 
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/legal/terms" 
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/legal/cookies" 
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  )
}
