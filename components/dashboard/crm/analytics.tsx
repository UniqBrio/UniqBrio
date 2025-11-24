"use client"

import { useState, useEffect } from "react"
import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/dashboard/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  Brain,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react"

interface AnalyticsData {
  conversionMetrics: {
    totalLeads: number
    qualifiedLeads: number
    trialsScheduled: number
    trialsAttended: number
    enrollments: number
    conversionRate: number
    trend: "up" | "down"
    trendPercentage: number
  }
  sourcePerformance: Array<{
    source: string
    leads: number
    conversions: number
    conversionRate: number
    cost?: number
    roi?: number
  }>
  coursePopularity: Array<{
    course: string
    enquiries: number
    enrollments: number
    revenue: number
  }>
  counselorPerformance: Array<{
    counselor: string
    leadsAssigned: number
    conversions: number
    conversionRate: number
    avgResponseTime: number
  }>
  timeSeriesData: Array<{
    date: string
    leads: number
    conversions: number
    trials: number
  }>
  aiInsights: Array<{
    type: "opportunity" | "warning" | "success"
    title: string
    description: string
    impact: "high" | "medium" | "low"
    actionable: boolean
  }>
}

export default function AnalyticsPage() {
  const { currency } = useCurrency();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeFilter, setTimeFilter] = useState("30")
  const [sourceFilter, setSourceFilter] = useState("all")

  useEffect(() => {
    // Simulate API call
      const mockAnalyticsData: AnalyticsData = {
        conversionMetrics: {
          totalLeads: 156,
          qualifiedLeads: 89,
          trialsScheduled: 45,
          trialsAttended: 32,
          enrollments: 23,
          conversionRate: 14.7,
          trend: "up",
          trendPercentage: 12.5,
        },
        sourcePerformance: [
          {
            source: "Website",
            leads: 67,
            conversions: 12,
            conversionRate: 17.9,
            cost: 15000,
            roi: 240,
          },
          {
            source: "Referral",
            leads: 34,
            conversions: 8,
            conversionRate: 23.5,
            cost: 0,
            roi: 0,
          },
          {
            source: "QR Code",
            leads: 28,
            conversions: 2,
            conversionRate: 7.1,
            cost: 5000,
            roi: 80,
          },
          {
            source: "Walk-in",
            leads: 27,
            conversions: 1,
            conversionRate: 3.7,
            cost: 0,
            roi: 0,
          },
        ],
        coursePopularity: [
          { course: "Web Development", enquiries: 45, enrollments: 12, revenue: 180000 },
          { course: "Data Science", enquiries: 38, enrollments: 8, revenue: 160000 },
          { course: "Python Programming", enquiries: 32, enrollments: 2, revenue: 40000 },
          { course: "AI/ML", enquiries: 25, enrollments: 1, revenue: 25000 },
          { course: "Digital Marketing", enquiries: 16, enrollments: 0, revenue: 0 },
        ],
        counselorPerformance: [
          {
            counselor: "John Doe",
            leadsAssigned: 52,
            conversions: 8,
            conversionRate: 15.4,
            avgResponseTime: 2.5,
          },
          {
            counselor: "Jane Smith",
            leadsAssigned: 48,
            conversions: 9,
            conversionRate: 18.8,
            avgResponseTime: 1.8,
          },
          {
            counselor: "Mike Johnson",
            leadsAssigned: 35,
            conversions: 4,
            conversionRate: 11.4,
            avgResponseTime: 3.2,
          },
          {
            counselor: "Sarah Wilson",
            leadsAssigned: 21,
            conversions: 2,
            conversionRate: 9.5,
            avgResponseTime: 4.1,
          },
        ],
        timeSeriesData: [
          { date: "2024-01-01", leads: 12, conversions: 2, trials: 5 },
          { date: "2024-01-02", leads: 15, conversions: 1, trials: 7 },
          { date: "2024-01-03", leads: 8, conversions: 3, trials: 4 },
          { date: "2024-01-04", leads: 18, conversions: 2, trials: 8 },
          { date: "2024-01-05", leads: 22, conversions: 4, trials: 12 },
          { date: "2024-01-06", leads: 14, conversions: 1, trials: 6 },
          { date: "2024-01-07", leads: 19, conversions: 3, trials: 9 },
        ],
        aiInsights: [
          {
            type: "opportunity",
            title: "Referral Program Optimization",
            description:
              "Referral leads have 23.5% conversion rate vs 14.7% average. Increasing referral incentives could boost overall performance.",
            impact: "high",
            actionable: true,
          },
          {
            type: "warning",
            title: "QR Code Campaign Underperforming",
            description:
              `QR code leads have only 7.1% conversion rate with ${currency} 5000 cost. Consider optimizing landing page or targeting.`,
            impact: "medium",
            actionable: true,
          },
          {
            type: "success",
            title: "Jane Smith Top Performer",
            description:
              "Jane Smith has 18.8% conversion rate with fastest response time (1.8 hours). Consider sharing best practices.",
            impact: "medium",
            actionable: true,
          },
          {
            type: "warning",
            title: "Digital Marketing Course Interest Low",
            description: "Digital Marketing has 16 enquiries but 0 enrollments. Review course positioning and pricing.",
            impact: "low",
            actionable: true,
          },
        ],
      }

      setAnalyticsData(mockAnalyticsData)
      setLoading(false)
  }, [timeFilter, sourceFilter])

  const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#22c55e"]

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Brain className="w-5 h-5 text-blue-500" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "opportunity":
        return "bg-green-50 border-green-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "success":
        return "bg-green-50 border-green-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
              <p className="text-gray-600">AI-powered analytics and performance metrics</p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" className="bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold">{analyticsData.conversionMetrics.totalLeads}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {analyticsData.conversionMetrics.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm ${
                          analyticsData.conversionMetrics.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {analyticsData.conversionMetrics.trendPercentage}%
                      </span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analyticsData.conversionMetrics.conversionRate}%
                    </p>
                    <p className="text-sm text-gray-500">{analyticsData.conversionMetrics.enrollments} enrollments</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Trial Attendance</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        (analyticsData.conversionMetrics.trialsAttended /
                          analyticsData.conversionMetrics.trialsScheduled) *
                          100,
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500">
                      {analyticsData.conversionMetrics.trialsAttended}/{analyticsData.conversionMetrics.trialsScheduled}{" "}
                      attended
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-orange-600">2.4h</p>
                    <p className="text-sm text-gray-500">Across all counselors</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Lead Source Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Source Performance</CardTitle>
                <CardDescription>Conversion rates by lead source</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    conversions: {
                      label: "Conversions",
                      color: "#8b5cf6",
                    },
                    leads: {
                      label: "Leads",
                      color: "#f97316",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.sourcePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="leads" fill="var(--color-leads)" name="Total Leads" />
                      <Bar dataKey="conversions" fill="var(--color-conversions)" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Course Popularity */}
            <Card>
              <CardHeader>
                <CardTitle>Course Popularity</CardTitle>
                <CardDescription>Enquiries vs enrollments by course</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    enquiries: {
                      label: "Enquiries",
                      color: "#8b5cf6",
                    },
                    enrollments: {
                      label: "Enrollments",
                      color: "#f97316",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.coursePopularity}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="enquiries"
                        label={({ course, enquiries }) => `${course}: ${enquiries}`}
                      >
                        {analyticsData.coursePopularity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Lead Trends Over Time</CardTitle>
              <CardDescription>Daily lead generation and conversion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  leads: {
                    label: "Leads",
                    color: "#8b5cf6",
                  },
                  conversions: {
                    label: "Conversions",
                    color: "#f97316",
                  },
                  trials: {
                    label: "Trials",
                    color: "#06b6d4",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} />
                    <Line type="monotone" dataKey="conversions" stroke="var(--color-conversions)" strokeWidth={2} />
                    <Line type="monotone" dataKey="trials" stroke="var(--color-trials)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Counselor Performance & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counselor Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Counselor Performance</CardTitle>
                <CardDescription>Individual counselor metrics and rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.counselorPerformance.map((counselor, index) => (
                    <div key={counselor.counselor} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">{counselor.counselor}</span>
                            {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          </div>
                        </div>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {counselor.conversionRate}% conversion
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Leads Assigned</p>
                          <p className="font-semibold">{counselor.leadsAssigned}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversions</p>
                          <p className="font-semibold">{counselor.conversions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Response</p>
                          <p className="font-semibold">{counselor.avgResponseTime}h</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={counselor.conversionRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription>Intelligent recommendations and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.aiInsights.map((insight, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start space-x-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                          {insight.actionable && (
                            <Button size="sm" variant="outline" className="text-xs bg-transparent">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
  )
}
