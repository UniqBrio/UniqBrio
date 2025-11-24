import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { useCurrency } from "@/contexts/currency-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { TrendingUp, Package, FileDown, FileText, FileImage, ShoppingCart, Users } from 'lucide-react'

interface AnalyticsDashboardProps {
  onExport?: (format: string) => void
}

export function AnalyticsDashboard({ onExport }: AnalyticsDashboardProps) {
  const { currency } = useCurrency();
  const [reportPeriod, setReportPeriod] = useState("monthly")

  const salesData = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 19000 },
    { month: "Mar", revenue: 15000 },
    { month: "Apr", revenue: 25000 },
    { month: "May", revenue: 22000 },
    { month: "Jun", revenue: 30000 },
  ]

  const categoryData = [
    { name: "Art Materials", value: 45 },
    { name: "Sports Equipment", value: 32 },
    { name: "Services", value: 18 },
    { name: "Courses", value: 28 },
  ]

  const COLORS = [
    "#9333ea", // Purple
    "#f97316", // Orange
    "#22c55e", // Green
    "#3b82f6", // Blue
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-green-50 border border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-semibold text-green-700">Revenue ({currency})</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-800">95,400</div>
            <p className="text-sm text-green-700">Total revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-pink-50 border border-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-semibold text-pink-700">Total Products</CardTitle>
            <Package className="h-5 w-5 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-teal-800">8</div>
            <p className="text-sm text-teal-700">Available products</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-semibold text-purple-700">Total Sales</CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-800">247</div>
            <p className="text-sm text-purple-700">Completed sales</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-semibold text-blue-700">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-800">156</div>
            <p className="text-sm text-blue-700">Active customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue Trends</h2>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-32 border-gray-200 bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888" 
                  fontSize={12}
                  label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fill: '#666', fontWeight: 500 } }}
                />
                <YAxis 
                  stroke="#888" 
                  fontSize={12}
                  label={{ value: 'Revenue (?)', angle: -90, position: 'insideLeft', style: { fill: '#666', fontWeight: 500 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: number) => [`?${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Category-wise Sales</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: number) => [`${value} units`, '']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
