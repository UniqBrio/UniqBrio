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

interface SpendingTrend {
  month: string
  amount: number
  change: number
}

interface FinancialData {
  netProfit: number
  loading: boolean
}

interface OverviewProps {
  setShowCancelModal: (show: boolean) => void
  nextRenewal: string
}

export function Overview({ setShowCancelModal, nextRenewal }: OverviewProps) {
  const [cycle, setCycle] = useState<BillingCycle>("yearly")
  const [currentPlan] = useState<PlanKey>("grow")
  const [showCancelSection, setShowCancelSection] = useState(false)
  const { primaryColor } = useCustomColors()
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalInstructors: 0,
    activeInstructors: 0,
    loading: true
  })
  const [financialData, setFinancialData] = useState<FinancialData>({
    netProfit: 0,
    loading: true
  })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const daysUntilRenewal = useMemo(() => {
    const today = new Date()
    const renewal = new Date()
    if (cycle === "monthly") renewal.setMonth(renewal.getMonth() + 1)
    else renewal.setFullYear(renewal.getFullYear() + 1)
    const diff = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [cycle])

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

  // Fetch financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const params = new URLSearchParams({ 
          timeframe: 'monthly',
          _t: Date.now().toString()
        })
        const res = await fetch(`/api/dashboard/financial/financials/metrics?${params.toString()}`, { 
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })

        if (res.ok) {
          const data = await res.json()
          setFinancialData({
            netProfit: data.netProfit || 0,
            loading: false
          })
        } else {
          setFinancialData({ netProfit: 0, loading: false })
        }
      } catch (error) {
        console.error('Failed to fetch financial data:', error)
        setFinancialData({ netProfit: 0, loading: false })
      }
    }

    fetchFinancialData()
  }, [])

  const currentPlanCost = cycle === "monthly" ? PLANS[currentPlan].monthly : PLANS[currentPlan].yearly
  const utilizationRate = usageStats.totalStudents > 0 ? Math.round((usageStats.activeStudents / usageStats.totalStudents) * 100) : 0

  // Mock spending trends (last 3 months)
  const spendingTrends: SpendingTrend[] = useMemo(() => {
    const months = ['October', 'November', 'December']
    return months.map((month, idx) => ({
      month,
      amount: currentPlanCost / 12,
      change: idx === 2 ? 0 : Math.random() > 0.5 ? 5 : -3
    }))
  }, [currentPlanCost])

  const recentInvoices = [
    { id: "INV-2025-12", date: "2025-12-01", amount: currentPlanCost, status: "paid" },
    { id: "INV-2025-11", date: "2025-11-01", amount: currentPlanCost, status: "paid" },
    { id: "INV-2025-10", date: "2025-10-01", amount: currentPlanCost, status: "paid" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Proactive Alert Bar */}
      {daysUntilRenewal <= 30 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Payment reminder</p>
              <p className="text-sm text-amber-700 mt-1">
                Your subscription renews in <span className="font-bold">{daysUntilRenewal} days</span> on {nextRenewal}. 
                Make sure your payment method is up to date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div 
          className="lg:col-span-2 border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
                  <Badge color={primaryColor}>{PLANS[currentPlan].name}</Badge>
                  <Badge color="#fd9c2d">{cycle === "monthly" ? "Monthly" : "Yearly"}</Badge>
                </div>
                <p className="text-sm text-gray-600">Active subscription</p>
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="text-purple-600" size={16} />
                <p className="text-xs font-medium text-gray-600">Next Renewal</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{nextRenewal}</p>
              <p className="text-xs text-gray-500 mt-1">{daysUntilRenewal} days away</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="text-orange-600" size={16} />
                <p className="text-xs font-medium text-gray-600">Student Limit</p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {currentPlan === "free" ? PLANS.free.studentLimit : "Unlimited"}
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

        {/* Usage Analytics Card */}
        <div 
          className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          onMouseEnter={() => setHoveredCard('usage')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Newly joined</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Active Students</span>
                <span className="text-lg font-bold text-blue-600">
                  {usageStats.loading ? "..." : usageStats.activeStudents}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Active Instructors</span>
                <span className="text-lg font-bold text-purple-600">
                  {usageStats.loading ? "..." : usageStats.activeInstructors}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: usageStats.totalInstructors > 0 ? `${Math.min((usageStats.activeInstructors / usageStats.totalInstructors) * 100, 100)}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spending Trend */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <TrendingUp className="text-white" size={16} />
              </div>
              <h4 className="font-semibold text-gray-800">Monthly Spend</h4>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
              Stable
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-gray-900">₹{(currentPlanCost / 12).toLocaleString()}</span>
            <span className="text-sm text-gray-600">/month</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <ArrowDownRight size={14} />
            <span>On track with budget</span>
          </div>
        </div>

        {/* Payment Health */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="text-white" size={16} />
              </div>
              <h4 className="font-semibold text-gray-800">Payment Health</h4>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
              Excellent
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">All payments on time</p>
          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
            <CheckCircle2 size={14} />
            <span>100% payment success rate</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="text-white" size={16} />
              </div>
              <h4 className="font-semibold text-gray-800">Net Profit</h4>
            </div>
          </div>
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">
              ₹{financialData.loading ? "..." : financialData.netProfit.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-gray-600">This month</div>
        </div>
      </div>

      {/* Features You're Using */}
      <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-600" size={20} />
          <h3 className="font-semibold text-gray-800">Features You're Using</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLANS.grow.features.map((feature, idx) => (
            <div 
              key={feature}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="p-1 bg-emerald-100 rounded-full">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={16} />
              </div>
              <span className="text-sm text-gray-700 flex-1">{feature}</span>
            </div>
          ))}
        </div>

        {currentPlan !== "scale" && (
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

      {/* Upgrade Path Visualization */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-md">
        <UpgradePathVisualization />
      </div>

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
