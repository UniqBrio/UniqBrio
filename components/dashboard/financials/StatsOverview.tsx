"use client"
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { CreditCard, ShieldCheck, Banknote, Receipt, TrendingUp, HeartPulse } from "lucide-react"
import { StatData } from "./types"

interface StatsOverviewProps {
  // No props needed - component will show current month data by default
}

export function StatsOverview() {
  // Loading & error state + fetched stats
  const [stats, setStats] = React.useState<StatData[]>([
    { title: 'Total Revenue', value: '�', change: 'Loading...' },
    { title: 'Total Expenses', value: '�', change: 'Loading...' },
    { title: 'Net Profit', value: '�', change: 'Loading...' },
    { title: 'Financial Health', value: '�', change: 'Loading...' },
  ])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  const formatINR = (value: number) => `${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR`

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
          { title: 'Total Revenue', value: formatINR(data.totalRevenue), change: displayTimeframe },
          { title: 'Total Expenses', value: formatINR(data.totalExpenses), change: displayTimeframe },
          { title: 'Net Profit', value: formatINR(data.netProfit), change: displayTimeframe },
          { title: 'Financial Health', value: data.financialHealth, change: data.profitMargin != null ? `Margin ${data.profitMargin}%` : '�' },
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
  }, []) // No dependencies since we always use This month

  // Icon mapping for each stat
  const statIcons = [
    // Revenue, Expenses, Net Profit, Health
    {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
      icon: <Banknote className="h-8 w-8 text-orange-500" />,
    },
    {
      bg: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
      icon: <CreditCard className="h-8 w-8 text-red-500" />,
    },
    {
      bg: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
    },
    {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
      icon: <ShieldCheck className="h-8 w-8 text-blue-500" />,
    },
  ]

  return (
    <>
      {/* Stats Overview Header */}
     
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const style = statIcons[index] || statIcons[0]
          return (
            <Card key={index} className={style.bg}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${index === 0 ? "text-orange-600" : index === 1 ? "text-red-600" : index === 2 ? "text-green-600" : "text-blue-600"}`}>{stat.title}</p>
                    <p className={`text-2xl font-bold ${index === 0 ? "text-orange-900" : index === 1 ? "text-red-900" : index === 2 ? "text-green-900" : "text-blue-900"}`}>{stat.value}</p>
                  </div>
                  {style.icon}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}