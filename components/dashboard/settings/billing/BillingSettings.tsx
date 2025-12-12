"use client"
import React, { useMemo, useState } from "react"
import { ChevronRight, IndianRupee, FileText, Download, CheckCircle2, Lock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Input } from "@/components/dashboard/ui/input"
import { Section } from "./Section"
import { Badge } from "./Badge"
import { Modal } from "./Modal"
import { PLANS } from "./plans"
import { BillingCycle, PlanKey } from "./types"
import { InvoicePaymentHistory } from "./InvoicePaymentHistory"

export default function BillingSettings() {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "plans" | "invoices" | "branches">("overview")
  const [cycle, setCycle] = useState<BillingCycle>("yearly")
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("grow")
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelOption, setCancelOption] = useState<"end" | "immediate">("end")
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelSection, setShowCancelSection] = useState(false)

  const { primaryColor } = useCustomColors()
  const nextRenewal = useMemo(() => {
    const d = new Date()
    if (cycle === "monthly") d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    return d.toLocaleDateString()
  }, [cycle])

  function onConfirmUpgrade(target: PlanKey) {
    toast({ title: "Upgrade initiated", description: `Switching to ${PLANS[target].name}` })
    setShowUpgradeModal(false)
    setCurrentPlan(target)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-sm text-gray-600">Manage your plan and invoices.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-2 border-0 mb-6">
        <div className="grid w-full grid-cols-3 sm:grid-cols-4 gap-2 bg-gradient-to-r from-purple-100 to-orange-100 rounded-xl h-12 p-1">
          {[
            { key: "overview", label: "Overview" },
            { key: "plans", label: "Plan Comparison" },
            { key: "invoices", label: "Invoice & Payment History" },
            { key: "branches", label: "Branch Billing" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveSubTab(t.key as any)}
              className={`rounded-lg font-semibold text-sm transition-all duration-300 ${activeSubTab === t.key ? "text-white bg-gradient-to-r from-purple-600 to-orange-500" : "hover:bg-white/50 bg-transparent"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === "overview" && (
        <Section title="Current Plan" subtitle="Your active subscription details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge color={primaryColor}>{PLANS[currentPlan].name}</Badge>
                  <Badge color="#fd9c2d">{cycle === "monthly" ? "Monthly" : "Yearly"}</Badge>
                </div>
                <span className="flex items-center gap-1 text-lg font-semibold"><IndianRupee size={18} />{(cycle === "monthly" ? PLANS[currentPlan].monthly : PLANS[currentPlan].yearly).toLocaleString()} <span className="text-sm font-normal text-gray-600">/ {cycle === "monthly" ? "month" : "year"}</span></span>
              </div>
              <p className="text-base text-gray-700 font-medium mb-3">Renews on {nextRenewal}</p>
              <p className="text-base text-gray-700 mb-5">{currentPlan === "free" ? PLANS.free.studentLimit : "Unlimited students"}</p>

              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-lg hover:shadow-[0_8px_20px_rgba(124,58,237,0.35)] shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 font-medium" onClick={() => setShowUpgradeModal(true)}>
                  Upgrade / Change Plan
                </button>
                <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 font-medium" onClick={() => setActiveSubTab("invoices")}>
                  <FileText size={16} /> View Invoices
                </button>
              </div>

              <div className="mt-6 border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <div className="font-semibold mb-4 text-gray-800">What you get in Grow</div>
                <ul className="text-sm space-y-2.5">
                  {PLANS.grow.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="text-emerald-600 flex-shrink-0" size={16} /> <span className="text-gray-700">{f}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-5">
              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold text-gray-800">Scale Plan Features Comparison</div>
                  <span className="px-3 py-1.5 text-xs font-semibold rounded-full text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]" style={{ background: 'linear-gradient(90deg, #7c3aed, #f97316)' }}>Premium</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="text-sm font-semibold mb-3 text-gray-700">Included in Grow</div>
                    <ul className="text-sm space-y-2.5">
                      {PLANS.grow.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="text-emerald-600 flex-shrink-0" size={16} /> <span className="text-gray-700">{f}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-3 text-gray-700">Unlock in Scale</div>
                    <ul className="text-sm space-y-2.5">
                      {(PLANS.scale.scaleOnly ?? []).map((f) => (
                        <li key={f} className="flex items-center gap-2 opacity-70">
                          <Lock className="text-gray-400 flex-shrink-0" size={14} />
                          <span className="text-gray-600">{f}</span>
                          <span className="ml-auto text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 font-medium shadow-sm">Locked</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <button className="w-full px-4 py-2.5 rounded-lg text-white font-semibold shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_25px_rgba(124,58,237,0.45)] transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(90deg, #7c3aed, #f97316)' }} onClick={() => setShowUpgradeModal(true)}>Upgrade to unlock</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5 border-2 shadow-[0_8px_30px_rgba(124,58,237,0.25),0_0_0_3px_rgba(124,58,237,0.1)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.35),0_0_0_3px_rgba(124,58,237,0.15)] transition-all duration-300 hover:-translate-y-1" style={{ borderColor: '#7c3aed', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(249,115,22,0.08))' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-purple-700 font-medium mb-1">Go Premium</div>
                    <div className="text-lg font-bold text-gray-800">Scale — Everything in Grow, plus</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 font-medium">Yearly</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent">₹{PLANS.scale.yearly.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm flex flex-wrap gap-2">
                  {(PLANS.scale.scaleOnly ?? []).slice(0, 4).map((f) => (
                    <span key={f} className="px-3 py-1.5 rounded-full bg-white border border-purple-200 text-gray-700 shadow-[0_2px_8px_rgba(124,58,237,0.15)] font-medium">{f}</span>
                  ))}
                </div>
                <div className="mt-5">
                  <button className="w-full px-5 py-3 rounded-lg text-white font-bold shadow-[0_8px_24px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.5)] transition-all duration-300 hover:-translate-y-1 text-base" style={{ background: 'linear-gradient(90deg, #7c3aed, #f97316)' }} onClick={() => setShowUpgradeModal(true)}>Upgrade to Scale</button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Cancellation Section - placed at bottom to be less visible */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <button
              onClick={() => setShowCancelSection(!showCancelSection)}
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              {showCancelSection ? "Hide" : "Manage subscription"}
            </button>
            
            {showCancelSection && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-3">Need to make changes to your subscription?</p>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
                >
                  Cancel subscription
                </button>
              </div>
            )}
          </div>
        </Section>
      )}

      {activeSubTab === "plans" && (
        <Section title="" subtitle="">
          <div className="flex flex-col items-center mb-6">
            {/* Billing Cycle Toggle */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-purple-700">Monthly</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={cycle === "yearly"} onChange={() => setCycle(cycle === "monthly" ? "yearly" : "monthly")} />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600"></div>
              </label>
              <span className="text-sm font-medium text-emerald-700">Yearly</span>
              <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">Save 17%! 🎉</span>
            </div>

            {/* Promotional Banner */}
            {cycle === "yearly" && (
              <div className="mb-6 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-200 rounded-lg shadow-sm">
                <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  Pay annually → Get 2 months FREE + personal onboarding call
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["free","grow","scale"] as PlanKey[]).map((key) => {
              const plan = PLANS[key]
              const price = cycle === "monthly" ? plan.monthly : plan.yearly
              const originalPrice = cycle === "monthly" ? plan.originalMonthly : plan.originalYearly
              const isGrow = key === "grow"
              const isScale = key === "scale"
              const isFree = key === "free"
              
              return (
                <div key={key} className={`border rounded-xl p-6 bg-white transition-all duration-300 hover:-translate-y-2 relative ${
                  isGrow ? "border-3 border-purple-400 shadow-[0_12px_40px_rgba(124,58,237,0.25)] hover:shadow-[0_16px_50px_rgba(124,58,237,0.35)]" : 
                  isScale ? "border-2 border-orange-300 shadow-[0_8px_30px_rgba(249,115,22,0.2)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.3)]" :
                  "border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                }`}>
                  {/* Badge */}
                  {isGrow && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                      <span>⭐</span> Most Popular <span>⭐</span>
                    </div>
                  )}

                  {/* Icon & Plan Name */}
                  <div className="flex items-center gap-3 mb-3">
                    {isFree && <div className="text-2xl">📈</div>}
                    {isGrow && <div className="text-2xl">⚡</div>}
                    {isScale && <div className="text-2xl">👑</div>}
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: plan.description }}></p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-bold text-gray-900 flex items-center">
                        <IndianRupee size={28} />{price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">/{cycle === "monthly" ? "month" : "year"}</span>
                    </div>
                    {!isFree && originalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">or ₹{originalPrice}/month</span>
                        <span className="text-xs text-emerald-600 font-semibold">{cycle === "monthly" ? plan.savingsMonthly : plan.savingsYearly}</span>
                      </div>
                    )}
                  </div>

                  {/* Tagline */}
                  <p className="text-sm text-gray-600 mb-4 italic">{plan.tagline}</p>

                  {/* CTA Button */}
                  <button 
                    className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 mb-5 ${
                      isGrow ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_28px_rgba(124,58,237,0.45)]" :
                      isFree ? "border-2 border-purple-600 text-purple-700 hover:bg-purple-50 shadow-sm hover:shadow-md" :
                      "border-2 border-purple-600 text-purple-700 hover:bg-purple-50 shadow-sm hover:shadow-md"
                    }`}
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    {isFree ? "Start Free" : "Start Free Trial"}
                  </button>

                  {/* Features */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">{isFree ? "What You Get:" : isScale ? "Everything in Grow, plus:" : "Everything in Free, plus:"}</h4>
                      <ul className="text-sm space-y-2.5">
                        {(isFree ? plan.features : plan.additionalFeatures || plan.features).map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                            <span className="text-gray-700">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Coupons & Discounts Section */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎫 Coupons & Discounts</h2>
              <p className="text-sm text-gray-600">Apply a coupon code for additional savings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Apply Coupon Code */}
              <div className="border-2 border-purple-200 rounded-2xl p-6 bg-gradient-to-br from-purple-50/50 to-orange-50/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎟️</span>
                  <h3 className="text-lg font-bold text-gray-900">Apply Coupon Code</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Have a coupon? Enter it here to get instant savings on your subscription</p>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      className="flex-1 text-sm uppercase font-mono border-purple-300 focus:border-purple-500"
                      defaultValue=""
                    />
                    <button
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
                      onClick={() => toast({ title: "Coupon Applied", description: "Your discount has been applied successfully!" })}
                    >
                      Apply
                    </button>
                  </div>
                  
                  <div className="bg-white/80 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-purple-600 font-semibold">💡 Tip:</span>
                      <span>Check your email for exclusive coupon codes or ask our support team for available discounts.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Redemption History */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📜</span>
                  <h3 className="text-lg font-bold text-gray-900">Redemption History</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">View all coupons you've successfully redeemed</p>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[
                    { code: "LAUNCH2025", date: "2025-01-15", savings: 2000, description: "New Year Launch Discount" },
                    { code: "EARLYBIRD", date: "2024-12-01", savings: 1500, description: "Early Bird Special" },
                    { code: "SAVE17", date: "2024-06-15", savings: 2037, description: "17% Annual Discount" },
                  ].map((coupon, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-orange-50/30 transition-colors duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-sm text-purple-700">{coupon.code}</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Applied</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{coupon.description}</p>
                          <p className="text-xs text-gray-500">{new Date(coupon.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-emerald-600 font-bold text-sm">
                            <span className="text-xs mr-0.5">-</span>
                            <IndianRupee size={12} />
                            <span>{coupon.savings.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">saved</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty State */}
                  {/* Uncomment below and remove above sample data when no coupons exist */}
                  {/* <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎫</div>
                    <p className="text-sm text-gray-500">No coupons redeemed yet</p>
                    <p className="text-xs text-gray-400 mt-1">Applied coupons will appear here</p>
                  </div> */}
                </div>

                {/* Total Savings */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Savings</span>
                    <div className="flex items-center text-emerald-600 font-bold text-lg">
                      <IndianRupee size={16} />
                      <span>5,537</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {activeSubTab === "invoices" && (
        <div>
          <InvoicePaymentHistory />
        </div>
      )}

      {activeSubTab === "branches" && (
        <Section title="Branch Billing" subtitle="Manage billing across branches">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { 
                name: "Delhi Main Center", 
                location: "DLF Cyber City, Delhi",
                branchId: "BRANCH_001",
                activeStudents: 45,
                plan: "Grow",
                monthlyCost: 999,
                renewalDate: "12th January 2026",
                status: "PAID"
              },
              { 
                name: "Mumbai Branch", 
                location: "Bandra West, Mumbai",
                branchId: "BRANCH_002",
                activeStudents: 32,
                plan: "Grow",
                monthlyCost: 999,
                renewalDate: "15th January 2026",
                status: "PAID"
              },
              { 
                name: "Bangalore Tech Hub", 
                location: "Koramangala, Bangalore",
                branchId: "BRANCH_003",
                activeStudents: 28,
                plan: "Scale",
                monthlyCost: 4999,
                renewalDate: "20th January 2026",
                status: "PAID"
              },
              { 
                name: "Pune Center", 
                location: "Hinjewadi, Pune",
                branchId: "BRANCH_004",
                activeStudents: 18,
                plan: "Free",
                monthlyCost: 0,
                renewalDate: "-",
                status: "ACTIVE"
              },
            ].map((branch) => (
              <div key={branch.branchId} className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300">
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📍</span>
                      <h3 className="font-bold text-lg text-gray-900">{branch.name}</h3>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Location:</span>
                        <span>{branch.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Branch ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{branch.branchId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Active Students:</span>
                        <span className="font-semibold text-purple-700">{branch.activeStudents}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Status */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💳</span>
                    <h4 className="font-semibold text-gray-900">Billing Status</h4>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Plan:</span>
                      <span className="font-semibold text-gray-900">{branch.plan}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Cost:</span>
                      <span className="font-bold text-purple-700 flex items-center">
                        <IndianRupee size={14} />
                        {branch.monthlyCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Renewal Date:</span>
                      <span className="text-sm font-medium text-gray-900">{branch.renewalDate}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-purple-200/50">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        branch.status === "PAID" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {branch.status === "PAID" ? "✅" : "🔵"} {branch.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button className="flex-1 min-w-[120px] px-3 py-2 text-sm font-medium text-purple-700 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md">
                    View Details
                  </button>
                  <button 
                    className="flex-1 min-w-[120px] px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #f97316)' }}
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    Manage Plan
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
                    <FileText size={16} className="inline mr-1" />
                    Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Modal
        open={showUpgradeModal}
        title="Confirm Plan Change"
        onClose={() => setShowUpgradeModal(false)}
        actions={(
          <>
            <button className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
            <button className="px-3 py-2 text-white rounded" style={{ backgroundColor: primaryColor }} onClick={() => onConfirmUpgrade(currentPlan === "free" ? "grow" : "scale")}>Confirm & Pay</button>
          </>
        )}
      >
        <div className="border rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">Current Plan</div>
              <div className="font-medium">{PLANS[currentPlan].name}</div>
            </div>
            <ChevronRight />
            <div>
              <div className="text-sm">New Plan</div>
              <div className="font-medium">{currentPlan === "free" ? PLANS.grow.name : PLANS.scale.name}</div>
            </div>
          </div>
        </div>
        <div className="text-sm">Selected billing cycle: {cycle === "monthly" ? "Monthly" : "Yearly"}</div>
        <div className="text-sm">Total amount to be paid now</div>
        <div className="text-sm">Next billing date info</div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Your new plan will be activated immediately.</p>
          <p>Your billing cycle will remain the same.</p>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        open={showCancelModal}
        title="Cancel Subscription"
        onClose={() => {
          setShowCancelModal(false)
          setCancelReason("")
          setCancelOption("end")
        }}
        actions={(
          <>
            <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setShowCancelModal(false)}>Keep Subscription</button>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" 
              onClick={() => {
                toast({ 
                  title: "Subscription Cancelled", 
                  description: cancelOption === "end" 
                    ? `Your access will continue until ${nextRenewal}. You'll then be moved to the Free Plan with 14-student limit.`
                    : "Your subscription has been cancelled immediately. You're now on Free Plan with 14-student limit."
                })
                setShowCancelModal(false)
                setCancelReason("")
                setCancelOption("end")
                if (cancelOption === "immediate") setCurrentPlan("free")
              }}
            >
              Confirm Cancellation
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          {/* Warning Message */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">Before you go...</p>
                <p className="text-sm text-yellow-700">
                  {cancelOption === "end" 
                    ? `Your access will continue until ${nextRenewal} (end of current billing cycle). After that, you'll be moved to the Free Plan.`
                    : "Cancelling immediately means you'll lose access to premium features right away and no refund will be provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Options */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Cancellation Option</label>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                cancelOption === "end" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setCancelOption("end")}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={cancelOption === "end"}
                  onChange={() => setCancelOption("end")}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-sm text-gray-900">Cancel at end of billing cycle</p>
                  <p className="text-xs text-gray-600 mt-1">Recommended - Keep access until {nextRenewal}</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                cancelOption === "immediate" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setCancelOption("immediate")}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={cancelOption === "immediate"}
                  onChange={() => setCancelOption("immediate")}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-sm text-gray-900">Cancel immediately</p>
                  <p className="text-xs text-red-600 mt-1">Lose access now - No refund will be provided</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason for Cancellation */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Help us improve - Why are you cancelling?</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Your feedback helps us improve our service..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <p className="text-xs text-gray-500">Optional but appreciated</p>
          </div>

          {/* Free Plan Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">After cancellation</p>
                <p className="text-sm text-blue-800">You'll be moved to the <strong>Free Plan</strong> with a 14-student limit. You can upgrade again anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
