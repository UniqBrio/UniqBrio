"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"
import { RefreshCwIcon, DownloadIcon } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Line,
  ComposedChart,
} from "recharts"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { toast } from "@/components/dashboard/ui/use-toast"
import { formatMonthLabel } from "@/lib/dashboard/utils"
import React, { useMemo } from 'react'

interface ExpensesTabProps {
  expenseFilter: string
  setExpenseFilter: (value: string) => void
}

export function ExpensesTab({ expenseFilter, setExpenseFilter }: ExpensesTabProps) {
  const [data, setData] = React.useState<Array<{ name: string; expense: number }>>([])
  const [categoryData, setCategoryData] = React.useState<Array<{ category: string; expense: number; count: number; avgAmount: number; percentage: number }>>([])
  const [vendorData, setVendorData] = React.useState<Array<{ vendor: string; expense: number; count: number; avgAmount: number }>>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Only year filter
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  
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

        // Load main chart data and expense analysis
        const cacheHeaders = {
          cache: 'no-store' as RequestCache,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        };
        const [chartsRes, categoryRes, vendorRes] = await Promise.all([
          fetch(`/api/dashboard/financial/financials/charts?${params}`, cacheHeaders),
          fetch(`/api/dashboard/financial/financials/charts/expense-categories?${params}`, cacheHeaders),
          fetch(`/api/dashboard/financial/financials/charts/expense-vendors?${params}`, cacheHeaders)
        ])
        
        console.log('ExpensesTab: API responses:', {
          charts: chartsRes.status,
          category: categoryRes.status,
          vendor: vendorRes.status
        });
        
        if (!chartsRes.ok) {
          const errorText = await chartsRes.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || chartsRes.statusText };
          }
          console.error('ExpensesTab: Charts API error:', { status: chartsRes.status, errorData });
          throw new Error(`Charts API error (${chartsRes.status}): ${errorData.details || errorData.error || chartsRes.statusText || 'Unknown error'}`)
        }
        
        const chartsJson = await chartsRes.json()
        if (abort) return
        console.log('ExpensesTab: Charts data received:', chartsJson.data?.length, 'items');
        setData(chartsJson.data.map((d: any) => ({ name: d.name, expense: d.expense })))
        
        // Additional data is optional
        if (categoryRes.ok) {
          const categoryJson = await categoryRes.json()
          console.log('ExpensesTab: Category data received:', categoryJson.data?.length, 'items', categoryJson.data);
          if (!abort) setCategoryData(categoryJson.data)
        }
        
        if (vendorRes.ok) {
          const vendorJson = await vendorRes.json()
          console.log('ExpensesTab: Vendor data received:', vendorJson.data?.length, 'items', vendorJson.data);
          if (!abort) setVendorData(vendorJson.data)
        }
        
        // Payment mode distribution removed � corresponding fetch & state cleaned up
      } catch (e: any) {
        if (abort) return
        console.error('ExpensesTab chart loading error:', e);
        console.error('Error details:', {
          message: e.message,
          stack: e.stack,
          name: e.name
        });
        setError(e.message || 'Failed to load expense data')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => { abort = true }
  }, [selectedYear])

  // Removed categoryChartData memo (only used by deleted charts)

  // Top spending categories and vendors - optimized with useMemo
  const topSpenders = useMemo(() => {
    console.log('ExpensesTab: Computing topSpenders with:', {
      categoryData: categoryData.length,
      vendorData: vendorData.length,
      categorySample: categoryData[0],
      vendorSample: vendorData[0]
    });
    const sortedCategories = [...categoryData].sort((a, b) => b.expense - a.expense)
    const sortedVendors = [...vendorData].sort((a, b) => b.expense - a.expense)
    return {
      topCategories: sortedCategories.slice(0, 5),
      topVendors: sortedVendors.slice(0, 5),
      highestFrequency: sortedCategories.sort((a, b) => b.count - a.count).slice(0, 3)
    }
  }, [categoryData, vendorData])

  const handleRefresh = () => {
    setSelectedYear(prev => prev)
  }

  const handleResetFilters = () => {
    setSelectedYear(new Date().getFullYear())
  }

  const handleExportData = () => {
    try {
      const exportData = data.map(item => ({
        Period: item.name,
        Expense: item.expense
      }))
      
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Expense Data")
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `expense-data-${selectedYear}.xlsx`)
      
      toast({
        title: "Export Successful",
        description: "Expense data has been exported to Excel file.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export expense data.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl break-words leading-tight font-bold">Expense Management & Analysis</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2 leading-relaxed">Advanced expense tracking with category, vendor, and payment analysis</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <Label htmlFor="year-select" className="text-sm font-medium sr-only">Year Selection</Label>
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
      <CardContent className="space-y-6">

        {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded">{error}</div>}
        {loading && <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">Loading expense data...</div>}
        
        {/* Debug info */}
        {!loading && !error && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            Debug: Chart data: {data.length} | Categories: {categoryData.length} | Vendors: {vendorData.length} | Top cats: {topSpenders.topCategories.length} | Top vendors: {topSpenders.topVendors.length}
          </div>
        )}
        
        {/* Main Expense Trend Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Expense Trend Analysis</h3>
          {data.length === 0 ? (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">No expense data available for {selectedYear}</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 25, right: 20, bottom: 80, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonthLabel}
                    label={{ value: 'Period', position: 'insideBottom', offset: -40 }}
                  />
                  <YAxis
                    domain={[0, (dataMax: number) => {
                      if (!dataMax || dataMax === 0) return 100;
                      const buffer = dataMax * 0.1;
                      const maxWithBuffer = dataMax + buffer;
                      const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithBuffer)));
                      return Math.ceil(maxWithBuffer / magnitude) * magnitude;
                    }]}
                    label={{ value: 'Expense', angle: -90, position: 'insideLeft', offset: -30 }}
                  />
                  <RechartsTooltip formatter={(value: number) => `INR ${value.toLocaleString()}`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#f97316" 
                    fill="#f97316" 
                    fillOpacity={0.3}
                    name="Expenses"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Expense Trend"
                  label={{ position: 'top', offset: 5, fill: '#ef4444', fontSize: 12 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>

        {/* Removed category-based charts and vendor treemap as requested */}

        {/* Top Spenders Summary */}
        {topSpenders.topCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-orange-700">Highest Expense Categories</h3>
              <div className="space-y-3">
                {topSpenders.topCategories.map((cat, idx) => (
                  <div key={cat.category} className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="font-medium">{cat.category}</span>
                    <div className="text-right">
                      <div className="font-bold text-orange-700">INR {cat.expense.toLocaleString()}</div>
                      <div className="text-xs text-orange-600">{cat.count} transactions</div>
                      <div className="text-xs text-orange-600">Avg: INR {cat.avgAmount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {topSpenders.topVendors.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-red-700">Top Expense Vendors</h3>
                <div className="space-y-3">
                  {topSpenders.topVendors.map((vendor, idx) => (
                    <div key={vendor.vendor} className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <span className="font-medium">{vendor.vendor}</span>
                      <div className="text-right">
                        <div className="font-bold text-red-700">INR {vendor.expense.toLocaleString()}</div>
                        <div className="text-xs text-red-600">{vendor.count} transactions</div>
                        <div className="text-xs text-red-600">Avg: INR {vendor.avgAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-purple-700">Most Frequent Expenses</h3>
              <div className="space-y-3">
                {topSpenders.highestFrequency.map((cat, idx) => (
                  <div key={cat.category} className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="font-medium">{cat.category}</span>
                    <div className="text-right">
                      <div className="font-bold text-purple-700">{cat.count} times</div>
                      <div className="text-xs text-purple-600">INR {cat.expense.toLocaleString()} total</div>
                      <div className="text-xs text-purple-600">Avg: INR {cat.avgAmount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        
        {/* Show message when no data */}
        {!loading && !error && topSpenders.topCategories.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No expense data available for {selectedYear}</p>
            <p className="text-sm text-gray-500 mt-2">Expense data will appear here once transactions are recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}