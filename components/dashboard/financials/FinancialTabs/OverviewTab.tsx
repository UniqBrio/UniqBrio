"use client"

import { useCurrency } from '@/contexts/currency-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Button } from "@/components/dashboard/ui/button"
import { Label as UILabel } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { FilterIcon, RefreshCwIcon } from "lucide-react"
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Label,
} from "recharts"
import { formatMonthLabel } from "@/lib/dashboard/utils"
import React, { useMemo, useCallback } from "react"
import { useIsMobile } from "@/hooks/dashboard/use-mobile"
import { useResponsiveBreakpoints, useResponsiveValue } from "@/hooks/dashboard/useResponsiveBreakpoints"
import { ResponsiveChartContainer } from "@/components/dashboard/ui/responsive-container"

export function OverviewTab() {
  const isMobile = useIsMobile()
  const { screenSize } = useResponsiveBreakpoints()
  
  // Responsive chart configurations
  const chartConfig = useResponsiveValue({
    mobile: {
      fontSize: 10,
      margins: { left: 15, right: 5, bottom: 40, top: 5 },
      showLabels: false,
      strokeWidth: 2
    },
    tablet: {
      fontSize: 11,
      margins: { left: 50, right: 15, bottom: 60, top: 20 },
      showLabels: true,
      strokeWidth: 2
    },
    desktop: {
      fontSize: 12,
      margins: { left: 70, right: 20, bottom: 80, top: 25 },
      showLabels: true,
      strokeWidth: 3
    }
  })

  const { currency } = useCurrency();

  // Primary chart data (only chart we keep)
  const [chartData, setChartData] = React.useState<Array<{ name: string; income: number; expense: number; profit: number; roi: number }>>([]);
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Only year filter
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  
  // (Colors kept if future extension required, currently unused beyond potential styling.)
  const COLORS = ['#8b5cf6', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4']

  // Load categories on mount - removed since no longer needed

  // Load chart data
  React.useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Build query parameters
        const params = new URLSearchParams({
          year: selectedYear.toString(),
          _t: Date.now().toString() // Cache busting parameter
        })

        const url = `/api/dashboard/financial/financials/charts?${params}`;
        console.log('OverviewTab: Fetching charts from:', url);

        // Load all chart data in parallel
        const chartsRes = await fetch(url, { 
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        console.log('OverviewTab: Charts response status:', chartsRes.status);
        
        if (!chartsRes.ok) {
          const errorText = await chartsRes.text();
          console.error('OverviewTab: Charts error response:', {
            status: chartsRes.status,
            statusText: chartsRes.statusText,
            url: chartsRes.url,
            errorText
          });
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || chartsRes.statusText };
          }
          throw new Error(`Charts API error (${chartsRes.status}): ${errorData.details || errorData.error || chartsRes.statusText || 'Unknown error'}`)
        }
        const chartsJson = await chartsRes.json()
        console.log('OverviewTab: Charts data loaded successfully');
        // Sanitize data to prevent NaN values in Recharts
        const sanitizedData = (chartsJson.data || []).map((item: any) => ({
          name: item.name || '',
          income: isFinite(item.income) ? Number(item.income) : 0,
          expense: isFinite(item.expense) ? Number(item.expense) : 0,
          profit: isFinite(item.profit) ? Number(item.profit) : 0,
          roi: isFinite(item.roi) ? Number(item.roi) : 0
        }));
        if (!abort) setChartData(sanitizedData)
      } catch (e: any) {
        if (abort) return
        console.error('OverviewTab chart loading error:', e)
        console.error('Error details:', {
          message: e.message,
          stack: e.stack,
          name: e.name
        })
        setError(e.message || 'Failed to load chart data')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => { abort = true }
  }, [selectedYear])

  const handleRefresh = () => {
    // Trigger reload by updating a dependency
    setSelectedYear(prev => prev)
  }

  const handleResetFilters = () => {
    setSelectedYear(new Date().getFullYear())
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6 lg:pb-8 px-3 sm:px-6 lg:px-8 pt-2 sm:pt-6 lg:pt-8 space-y-2 sm:space-y-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-2">
            <CardTitle className="text-sm sm:text-xl lg:text-2xl break-words leading-tight font-bold">Financial Overview</CardTitle>
            <CardDescription className="text-[10px] sm:text-base leading-tight">Advanced analytics with filtering and category insights</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-1.5 sm:mt-0">
            <UILabel htmlFor="year-select" className="text-xs sm:text-sm font-medium sr-only">Year Selection</UILabel>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-full sm:w-48 lg:w-56 min-w-0 h-9 sm:h-11 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                  Last Year ({new Date().getFullYear() - 1})
                </SelectItem>
                <SelectItem value={new Date().getFullYear().toString()}>
                  Current Year ({new Date().getFullYear()})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 space-y-3 sm:space-y-4 lg:space-y-6">

        {error && <div className="text-red-600 text-xs sm:text-sm p-2 sm:p-3 bg-red-50 rounded">{error}</div>}
        {loading && <div className="text-xs sm:text-sm text-muted-foreground p-2 sm:p-3 bg-gray-50 rounded">Loading charts...</div>}
        
        {/* Main Income to Profit Flow Chart */}
        <Card className="w-full overflow-hidden shadow-lg border-2">
          <CardHeader className="pb-2 sm:pb-6 px-2 sm:px-6 pt-2 sm:pt-6 bg-gradient-to-r from-purple-50 to-orange-50">
            <CardTitle className="text-xs sm:text-xl lg:text-2xl font-bold break-words leading-snug">Income to Profit Flow Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 bg-white">
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  margin={chartConfig.margins}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeWidth={1.5} opacity={0.7} />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: chartConfig.fontSize, fill: '#334155', fontWeight: 600 }}
                    className="text-xs sm:text-sm"
                    stroke="#64748b"
                    strokeWidth={2}
                  >
                    {chartConfig.showLabels && (
                      <Label value="Period" offset={-5} position="insideBottom" style={{ fontSize: 14, fontWeight: 'bold', fill: '#1e293b' }} />
                    )}
                  </XAxis>
                  <YAxis
                    domain={[0, (dataMax: number) => {
                      if (!isFinite(dataMax) || dataMax <= 0) return 100;
                      const buffer = dataMax * 0.1;
                      const maxWithBuffer = dataMax + buffer;
                      if (!isFinite(maxWithBuffer) || maxWithBuffer <= 0) return 100;
                      const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithBuffer)));
                      if (!isFinite(magnitude) || magnitude <= 0) return Math.ceil(maxWithBuffer);
                      return Math.ceil(maxWithBuffer / magnitude) * magnitude;
                    }]}
                    tick={{ fontSize: chartConfig.fontSize, fill: '#334155', fontWeight: 600 }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 45 : 70}
                    stroke="#64748b"
                    strokeWidth={2}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value={`Amount (${currency || 'Amount'})`} 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle', fontSize: 14, fontWeight: 'bold', fill: '#1e293b' }} 
                      />
                    )}
                  </YAxis>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '12px' : '15px',
                      padding: screenSize === "mobile" ? '8px 12px' : '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #64748b',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontWeight: 600
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: screenSize === "mobile" ? '12px' : '24px',
                      fontSize: screenSize === "mobile" ? '13px' : '16px',
                      fontWeight: 'bold'
                    }}
                    iconSize={screenSize === "mobile" ? 16 : 20}
                  />
                  <Bar 
                    dataKey="income" 
                    fill="#7c3aed" 
                    name="Income"
                    radius={screenSize === "mobile" ? [4, 4, 0, 0] : [6, 6, 0, 0]}
                    opacity={0.9}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="#ea580c" 
                    name="Expenses"
                    radius={screenSize === "mobile" ? [4, 4, 0, 0] : [6, 6, 0, 0]}
                    opacity={0.9}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#059669" 
                    strokeWidth={screenSize === "mobile" ? 3 : 4}
                    name="Net Profit"
                    dot={{ r: screenSize === "mobile" ? 5 : 7, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: screenSize === "mobile" ? 7 : 9, fill: '#059669', stroke: '#ffffff', strokeWidth: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ResponsiveChartContainer>
          </CardContent>
        </Card>

        {/* All other analytical charts removed per request � only the main Income to Profit Flow Analysis remains */}
      </CardContent>
    </Card>
  )
}