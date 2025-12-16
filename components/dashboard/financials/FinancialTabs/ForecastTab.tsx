"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { formatMonthLabel } from "@/lib/dashboard/utils"
import React, { useMemo } from "react"

interface ForecastTabProps {
  forecastPeriod: string
  setForecastPeriod: (value: string) => void
}

export function ForecastTab({ forecastPeriod, setForecastPeriod }: ForecastTabProps) {
  // Only year filter
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())

  // Sample forecast data
  const forecastData = [
    { name: "Jul'25", actual: 19200, forecast: 20500 },
    { name: "Aug'25", actual: null, forecast: 21800 },
    { name: "Sep'25", actual: null, forecast: 23200 },
    { name: "Oct'25", actual: null, forecast: 24500 },
    { name: "Nov'25", actual: null, forecast: 25800 },
    { name: "Dec'25", actual: null, forecast: 27000 },
  ]

  const cashFlowForecast = [
    { name: "Jul'25", inflow: 20500, outflow: 18000, net: 2500 },
    { name: "Aug'25", inflow: 21800, outflow: 18500, net: 3300 },
    { name: "Sep'25", inflow: 23200, outflow: 19000, net: 4200 },
    { name: "Oct'25", inflow: 24500, outflow: 19500, net: 5000 },
    { name: "Nov'25", inflow: 25800, outflow: 20000, net: 5800 },
    { name: "Dec'25", inflow: 27000, outflow: 20500, net: 6500 },
  ]

  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6 lg:pb-8 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-3 sm:space-y-2">
            <CardTitle className="text-base sm:text-xl lg:text-2xl break-words leading-snug font-bold">Financial Forecasting</CardTitle>
            <CardDescription className="text-xs sm:text-base leading-relaxed">Predict future financial performance</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Label htmlFor="forecast-period" className="text-sm font-medium whitespace-nowrap">Forecast Period</Label>
              <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger className="w-full sm:w-40 lg:w-48 min-w-0 h-10 sm:h-11" id="forecast-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">1 Month</SelectItem>
                  <SelectItem value="6months">2 Months</SelectItem>
                  <SelectItem value="1year">3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Revenue Forecast</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickFormatter={formatMonthLabel} label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Revenue", angle: -90, position: "insideLeft" }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#f97316" strokeDasharray="5 5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Cash Flow Forecast</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickFormatter={formatMonthLabel} label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Amount", angle: -90, position: "insideLeft" }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="inflow" name="Inflow" fill="#10b981" />
                  <Bar dataKey="outflow" name="Outflow" fill="#ef4444" />
                  <Bar dataKey="net" name="Net" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  )
}