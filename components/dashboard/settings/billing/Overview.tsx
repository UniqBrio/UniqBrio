"use client"
import React, { useMemo, useState, useEffect } from "react"
import { IndianRupee, FileText, CheckCircle2, TrendingUp, Users, AlertCircle, Sparkles, Award, Download, Calendar, CreditCard, ArrowUpRight, ArrowDownRight, Zap, Shield, Gift, Target, Activity } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Badge } from "./Badge"
import { PLANS } from "./plans"
import { BillingCycle, PlanKey } from "./types"
import { UpgradePathVisualization } from "./UpgradePathVisualization"

interface UsageStats {
  totalStudents: number
  activeStudents: number
  totalInstructors: number
  activeInstructors: number
  loading: boolean
}

interface PaymentRecord {
  _id: string
  plan: string
  amount: number
  startDate: string
  endDate: string
  status: string
  planStatus: string
  daysRemaining: number
  studentSize: number
  isCancelled: boolean
  cancellationDate?: string
  cancellationType?: "immediate" | "end_of_cycle"
  cancellationReason?: string
}

interface ActivePaymentData {
  record: PaymentRecord | null
  isUpcoming: boolean
  nextCycle: PaymentRecord | null
  loading: boolean
}

interface OverviewProps {
  setShowCancelModal: (show: boolean) => void
  nextRenewal: string
}

export function Overview({ setShowCancelModal, nextRenewal }: OverviewProps) {
  const [showCancelSection, setShowCancelSection] = useState(false)
  const { primaryColor } = useCustomColors()
  const [activePayment, setActivePayment] = useState<ActivePaymentData>({
    record: null,
    isUpcoming: false,
    nextCycle: null,
    loading: true
  })
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalInstructors: 0,
    activeInstructors: 0,
    loading: true
  })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Derive values from active payment record
  const currentPlan: PlanKey = (!activePayment.isUpcoming && activePayment.record?.plan?.toLowerCase() as PlanKey) || "free"
  const cycle: BillingCycle = useMemo(() => {
    if (!activePayment.record) return "yearly"
    const start = new Date(activePayment.record.startDate)
    const end = new Date(activePayment.record.endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff > 31 ? "yearly" : "monthly"
  }, [activePayment.record])
  const currentPlanCost = activePayment.record?.amount || 0
  const startDate = activePayment.record ? new Date(activePayment.record.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const renewalDate = activePayment.record ? new Date(activePayment.record.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : nextRenewal

  const daysUntilRenewal = activePayment.record?.daysRemaining || 0

  // Fetch active payment record
  useEffect(() => {
    const fetchActivePayment = async () => {
      try {
        const res = await fetch('/api/payment-records/active', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setActivePayment({
            record: data.data,
            isUpcoming: data.isUpcoming || false,
            nextCycle: data.nextCycle || null,
            loading: false
          })
        } else {
          setActivePayment({ record: null, isUpcoming: false, nextCycle: null, loading: false })
        }
      } catch (error) {
        console.error('Failed to fetch active payment:', error)
        setActivePayment({ record: null, isUpcoming: false, nextCycle: null, loading: false })
      }
    }

    fetchActivePayment()
  }, [])

  // Fetch real usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const [studentsRes, instructorsRes] = await Promise.all([
          fetch('/api/dashboard/services/user-management/students', { credentials: 'include' }),
          fetch('/api/dashboard/staff/instructors/stats', { credentials: 'include' })
        ])

        const studentsData = studentsRes.ok ? await studentsRes.json() : null
        const instructorsData = instructorsRes.ok ? await instructorsRes.json() : null

        setUsageStats({
          totalStudents: studentsData?.count || 0,
          activeStudents: studentsData?.active || 0,
          totalInstructors: instructorsData?.total || 0,
          activeInstructors: instructorsData?.active || 0,
          loading: false
        })
      } catch (error) {
        console.error('Failed to fetch usage stats:', error)
        setUsageStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchUsageData()
  }, [])

  const utilizationRate = usageStats.totalStudents > 0 ? Math.round((usageStats.activeStudents / usageStats.totalStudents) * 100) : 0

  // Get plan features dynamically - if current plan is free, show Grow plan features to motivate upgrade
  const displayPlan = currentPlan === "free" ? "grow" : currentPlan
  const currentPlanFeatures = PLANS[displayPlan]?.features || []
  const isFreePlan = currentPlan === "free"

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Loading State */}
      {activePayment.loading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-700">Loading your subscription details...</p>
        </div>
      )}

      {/* No Active Plan */}
      {!activePayment.loading && !activePayment.record && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <p className="text-sm text-amber-700 font-semibold">No active subscription found</p>
          <p className="text-sm text-amber-600 mt-1">Contact admin to activate your subscription.</p>
        </div>
      )}

      {/* Cancellation Alert */}
      {!activePayment.loading && activePayment.record && activePayment.record.isCancelled && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Subscription Cancelled</p>
              <p className="text-sm text-red-700 mt-1">
                {activePayment.record.cancellationType === "immediate" 
                  ? `Your subscription was cancelled on ${new Date(activePayment.record.cancellationDate!).toLocaleDateString('en-GB')}. You've been moved to the Free plan.`
                  : `Your subscription will end on ${renewalDate}. After that, you'll be moved to the Free plan with a 14-student limit.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Cycle Alert */}
      {!activePayment.loading && activePayment.record && !activePayment.isUpcoming && !activePayment.record.isCancelled && activePayment.nextCycle && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Next cycle scheduled</p>
              <p className="text-sm text-blue-700 mt-1">
                Your current <span className="font-bold">{activePayment.record.plan}</span> plan ends on {renewalDate}. 
                Your next cycle with <span className="font-bold">{activePayment.nextCycle.plan}</span> plan starts on {new Date(activePayment.nextCycle.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
                and ends on {new Date(activePayment.nextCycle.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proactive Alert Bar */}
      {!activePayment.loading && activePayment.record && !activePayment.isUpcoming && !activePayment.nextCycle && daysUntilRenewal <= 30 && daysUntilRenewal > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Payment reminder</p>
              <p className="text-sm text-amber-700 mt-1">
                Your subscription renews in <span className="font-bold">{daysUntilRenewal} days</span> on {renewalDate}. 
                Make sure your payment method is up to date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Plan Alert */}
      {!activePayment.loading && activePayment.isUpcoming && activePayment.record && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Upcoming Subscription</p>
              <p className="text-sm text-blue-700 mt-1">
                Your <span className="font-bold">{activePayment.record.plan}</span> plan will activate on {new Date(activePayment.record.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      {!activePayment.loading && activePayment.record && (
        <div className="grid grid-cols-1 gap-6">
          {/* Current Plan Card */}
          <div 
            className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            onMouseEnter={() => setHoveredCard('plan')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg shadow-lg">
                  <Award className="text-white" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={primaryColor}>{activePayment.record.plan.charAt(0).toUpperCase() + activePayment.record.plan.slice(1)}</Badge>
                    <Badge color="#fd9c2d">{cycle === "monthly" ? "Monthly" : "Yearly"}</Badge>
                    {activePayment.record.isCancelled && <Badge color="#ef4444">Cancelled</Badge>}
                    {!activePayment.record.isCancelled && activePayment.isUpcoming && <Badge color="#3b82f6">Upcoming</Badge>}
                    {!activePayment.record.isCancelled && !activePayment.isUpcoming && <Badge color="#10b981">Active</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">
                    {activePayment.record.isCancelled 
                      ? activePayment.record.cancellationType === "immediate" 
                        ? "Cancelled immediately" 
                        : "Cancels at end of cycle"
                      : activePayment.isUpcoming 
                        ? "Scheduled subscription" 
                        : "Active subscription"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-purple-700">
                  <IndianRupee size={20} />
                  {currentPlanCost.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">/ {cycle === "monthly" ? "month" : "year"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="text-green-600" size={16} />
                  <p className="text-xs font-medium text-gray-600">Start Date</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{startDate}</p>
                <p className="text-xs text-gray-500 mt-1">Subscription started</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="text-purple-600" size={16} />
                  <p className="text-xs font-medium text-gray-600">{activePayment.isUpcoming ? "Starts On" : "End Date"}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{renewalDate}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activePayment.isUpcoming 
                    ? `Starts in ${Math.abs(daysUntilRenewal)} days` 
                    : "Subscription ends"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="text-blue-600" size={16} />
                  <p className="text-xs font-medium text-gray-600">Days Remaining</p>
                </div>
                <p className={`text-sm font-bold ${daysUntilRenewal <= 3 ? 'text-orange-600' : daysUntilRenewal < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : daysUntilRenewal === 0 ? "Expires today" : "Expired"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {daysUntilRenewal > 0 ? "Until renewal" : "Renew now"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="text-orange-600" size={16} />
                  <p className="text-xs font-medium text-gray-600">Student Enrolled</p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {activePayment.record.studentSize}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {usageStats.loading ? "Loading..." : `${usageStats.totalStudents} enrolled`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <button className="group px-4 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg hover:shadow-lg shadow-md transition-all duration-300 hover:-translate-y-0.5 font-medium flex items-center gap-2">
                <Zap size={16} className="group-hover:scale-110 transition-transform" />
                Upgrade / Change Plan
                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium">
                <FileText size={16} /> View All Invoices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features You're Using / Available with Grow Plan */}
      {!activePayment.loading && activePayment.record && !activePayment.isUpcoming && (
        <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-600" size={20} />
              <h3 className="font-semibold text-gray-800">
                {isFreePlan ? "Unlock with Grow Plan" : "Features You're Using"}
              </h3>
            </div>
            {isFreePlan && (
              <Badge color="#10b981">Available on Upgrade</Badge>
            )}
          </div>
          
          {isFreePlan && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Ready to scale your academy?</span> Upgrade to Grow plan and unlock all these powerful features to manage unlimited students!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPlanFeatures.map((feature, idx) => (
              <div 
                key={feature}
                className={`flex items-start gap-3 p-3 bg-white rounded-lg border transition-all duration-300 ${
                  isFreePlan 
                    ? 'border-blue-200 hover:border-blue-300 hover:shadow-md' 
                    : 'border-gray-100 hover:border-purple-200 hover:shadow-sm'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`p-1 rounded-full ${isFreePlan ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                  <CheckCircle2 className={`flex-shrink-0 ${isFreePlan ? 'text-blue-600' : 'text-emerald-600'}`} size={16} />
                </div>
                <span className="text-sm text-gray-700 flex-1">{feature}</span>
              </div>
            ))}
          </div>

          {isFreePlan ? (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-solid border-purple-400 rounded-xl">
              <div className="flex items-start gap-3">
                <Zap className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 mb-1">Upgrade to Grow Plan Today!</p>
                  <p className="text-xs text-purple-700 mb-3">
                    Get unlimited students, advanced automation, comprehensive analytics, and so much more. Start growing your academy now!
                  </p>
                  <button className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-orange-500 px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    Upgrade to Grow Plan →
                  </button>
                </div>
              </div>
            </div>
          ) : currentPlan !== "scale" && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-dashed border-purple-300 rounded-xl">
              <div className="flex items-start gap-3">
                <Gift className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 mb-1">Unlock Premium Features</p>
                  <p className="text-xs text-purple-700 mb-3">
                    Upgrade to Scale and get payroll management, merchandise store, white-label branding, and more!
                  </p>
                  <button className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-orange-500 px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    Explore Scale Plan →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Hidden Cancellation Section - Deliberately hard to find */}
      <div className="mt-8 pt-6 border-t border-gray-100">
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
    </div>
  )
}
