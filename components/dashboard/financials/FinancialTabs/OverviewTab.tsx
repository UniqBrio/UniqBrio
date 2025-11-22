"use client"

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
      <CardHeader className="pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl break-words leading-tight font-bold">Financial Overview</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2 leading-relaxed">Advanced analytics with filtering and category insights</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <UILabel htmlFor="year-select" className="text-sm font-medium sr-only">Year Selection</UILabel>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-full sm:w-48 lg:w-56 min-w-0 h-10 sm:h-11">
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
      <CardContent className="p-3 sm:p-6 space-y-4 lg:space-y-6">

        {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded">{error}</div>}
        {loading && <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">Loading charts...</div>}
        
        {/* Main Income to Profit Flow Chart */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl break-words">Income to Profit Flow Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  margin={chartConfig.margins}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                  >
                    {chartConfig.showLabels && (
                      <Label value="Period" offset={-5} position="insideBottom" />
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
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 40 : 60}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value="Amount (INR)" 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle' }} 
                      />
                    )}
                  </YAxis>
                  <RechartsTooltip 
                    formatter={(value: number) => [`INR ${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: screenSize === "mobile" ? '8px' : '20px',
                      fontSize: screenSize === "mobile" ? '11px' : '14px'
                    }}
                    iconSize={screenSize === "mobile" ? 12 : 14}
                  />
                  <Bar 
                    dataKey="income" 
                    fill="#8b5cf6" 
                    name="Income"
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="#f97316" 
                    name="Expenses"
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={chartConfig.strokeWidth}
                    name="Net Profit"
                    dot={{ r: screenSize === "mobile" ? 3 : 4 }}
                    activeDot={{ r: screenSize === "mobile" ? 5 : 6 }}
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