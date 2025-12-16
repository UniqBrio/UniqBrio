"use client"
import React from "react";
import { useCustomColors } from '@/lib/use-custom-colors';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { CreditCard, ShieldCheck, Banknote, Receipt, TrendingUp, HeartPulse } from "lucide-react"
import { StatData } from "./types"
import { useCurrency } from "@/contexts/currency-context"

interface StatsOverviewProps {
  // No props needed - component will show current month data by default
}

export function StatsOverview() {
  const { currency } = useCurrency()
  const { primaryColor, secondaryColor } = useCustomColors();
  // Loading & error state + fetched stats
  const [stats, setStats] = React.useState<StatData[]>([
    { title: 'Total Revenue', value: '—', change: 'Loading...' },
    { title: 'Total Expenses', value: '—', change: 'Loading...' },
    { title: 'Net Profit', value: '—', change: 'Loading...' },
    { title: 'Financial Health', value: '—', change: 'Loading...' },
  ])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  const formatCurrency = (value: number) => `${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ${currency}`

  React.useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams({ 
          timeframe: 'monthly',
          _t: Date.now().toString() // Cache busting parameter
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
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = await res.json()
        if (abort) return
        
        const displayTimeframe = 'This month'
        setStats([
          { title: 'Total Revenue', value: formatCurrency(data.totalRevenue), change: displayTimeframe },
          { title: 'Total Expenses', value: formatCurrency(data.totalExpenses), change: displayTimeframe },
          { title: 'Net Profit', value: formatCurrency(data.netProfit), change: displayTimeframe },
          { title: 'Financial Health', value: data.financialHealth, change: data.profitMargin != null ? `Margin ${data.profitMargin}%` : '—' },
        ])
      } catch (e: any) {
        if (abort) return
        console.error(e)
        setFetchError(e.message || 'Failed to load metrics')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => { abort = true }
  }, [currency]) // Re-fetch when currency changes

  // Icon mapping for each stat - mobile-optimized sizing
  const statIcons = [
    // Revenue, Expenses, Net Profit, Health
    {
      bg: "bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200",
      icon: <Banknote className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: secondaryColor }} />,
    },
    {
      bg: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
      icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-500 flex-shrink-0" />,
    },
    {
      bg: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
      icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500 flex-shrink-0" />,
    },
    {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
      icon: <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500 flex-shrink-0" />,
    },
  ]

  return (
    <>
      {/* Stats Overview - Mobile-optimized layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3 lg:gap-4 mb-4 sm:mb-4 lg:mb-6">
        {stats.map((stat, index) => {
          const style = statIcons[index] || statIcons[0]
          return (
            <Card key={index} className={`${style.bg} min-h-0 overflow-hidden`}>
              <CardContent className="p-3 sm:p-3 lg:p-4">
                <div className="flex flex-col space-y-1.5 sm:space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs sm:text-sm font-medium leading-snug flex-1 min-w-0 ${index === 0 ? "" : index === 1 ? "text-red-600" : index === 2 ? "text-green-600" : "text-blue-600"}`} style={index === 0 ? { color: `${secondaryColor}cc` } : {}}>{stat.title}</p>
                    <div className="flex-shrink-0">{style.icon}</div>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-base sm:text-base lg:text-lg font-bold leading-snug break-words hyphens-auto overflow-wrap-anywhere ${index === 0 ? "" : index === 1 ? "text-red-900" : index === 2 ? "text-green-900" : "text-blue-900"}`} style={index === 0 ? { color: secondaryColor } : {}}>{stat.value}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-1.5 truncate">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}