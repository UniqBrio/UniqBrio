"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
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
} from "recharts"
import { formatMonthLabel } from "@/lib/dashboard/utils"
import React, { useMemo, useCallback } from "react"

export function OverviewTab() {
  // Primary chart data (only chart we keep)
  const [chartData, setChartData] = React.useState<Array<{ name: string; income: number; expense: number; profit: number; roi: number }>>([])
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
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Advanced analytics with filtering and category insights</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="year-select" className="text-sm font-medium"></Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-48">
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
      <CardContent className="space-y-6">

        {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded">{error}</div>}
        {loading && <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">Loading charts...</div>}
        
        {/* Main Income to Profit Flow Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Income to Profit Flow Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 25, right: 20, bottom: 80, left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickFormatter={formatMonthLabel}
                  label={{ value: 'Period', position: 'insideBottom', offset: -40 }}
                />
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
                  label={{ value: 'Amount', angle: -90, position: 'insideLeft', offset: -30 }}
                />
                <RechartsTooltip formatter={(value: number) => `INR ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="income" fill="#8b5cf6" name="Income" label={{ position: 'top', offset: 5, fill: '#8b5cf6', fontSize: 12 }} />
                <Bar dataKey="expense" fill="#f97316" name="Expenses" label={{ position: 'top', offset: 5, fill: '#f97316', fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Net Profit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* All other analytical charts removed per request � only the main Income to Profit Flow Analysis remains */}
      </CardContent>
    </Card>
  )
}