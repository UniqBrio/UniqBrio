"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Progress } from "@/components/dashboard/ui/progress"
import {
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowDown,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react"
import { CRMNavigation } from "@/components/dashboard/crm-navigation"

interface FunnelStage {
  id: string
  name: string
  count: number
  percentage: number
  conversionRate?: number
  leads: FunnelLead[]
}

interface FunnelLead {
  id: string
  name: string
  email: string
  course: string
  source: string
  currentStage: string
  daysInStage: number
  priority: "Hot" | "Warm" | "Cold"
  counselor?: string
  lastActivity: string
  nextAction?: string
}

interface FunnelMetrics {
  totalLeads: number
  overallConversionRate: number
  averageTimeToConvert: number
  dropoffRate: number
  topPerformingSource: string
  topPerformingCourse: string
}

export default function FunnelPage() {
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState("30")
  const [sourceFilter, setSourceFilter] = useState("all")

  useEffect(() => {
    const mockFunnelData: FunnelStage[] = [
        {
          id: "new",
          name: "New Leads",
          count: 156,
          percentage: 100,
          leads: [
            {
              id: "L001",
              name: "Priya Sharma",
              email: "priya@email.com",
              course: "Web Development",
              source: "Website",
              currentStage: "New",
              daysInStage: 1,
              priority: "Hot",
              counselor: "John Doe",
              lastActivity: "Form submitted",
              nextAction: "Initial call scheduled",
            },
            {
              id: "L002",
              name: "Amit Patel",
              email: "amit@email.com",
              course: "Data Science",
              source: "Referral",
              currentStage: "New",
              daysInStage: 2,
              priority: "Warm",
              lastActivity: "Enquiry received",
              nextAction: "Send course brochure",
            },
          ],
        },
        {
          id: "qualified",
          name: "Qualified",
          count: 89,
          percentage: 57,
          conversionRate: 57,
          leads: [
            {
              id: "L003",
              name: "Sneha Gupta",
              email: "sneha@email.com",
              course: "Python Programming",
              source: "QR Code",
              currentStage: "Qualified",
              daysInStage: 3,
              priority: "Hot",
              counselor: "Jane Smith",
              lastActivity: "Qualification call completed",
              nextAction: "Schedule trial session",
            },
          ],
        },
        {
          id: "trial-booked",
          name: "Trial Booked",
          count: 45,
          percentage: 29,
          conversionRate: 51,
          leads: [
            {
              id: "L004",
              name: "Rahul Verma",
              email: "rahul@email.com",
              course: "AI/ML",
              source: "Website",
              currentStage: "Trial Booked",
              daysInStage: 1,
              priority: "Hot",
              counselor: "Mike Johnson",
              lastActivity: "Trial session scheduled",
              nextAction: "Send trial reminder",
            },
          ],
        },
        {
          id: "attended",
          name: "Trial Attended",
          count: 32,
          percentage: 21,
          conversionRate: 71,
          leads: [
            {
              id: "L005",
              name: "Anita Singh",
              email: "anita@email.com",
              course: "Web Development",
              source: "Referral",
              currentStage: "Trial Attended",
              daysInStage: 2,
              priority: "Hot",
              counselor: "John Doe",
              lastActivity: "Trial session completed",
              nextAction: "Follow-up call for enrollment",
            },
          ],
        },
        {
          id: "enrolled",
          name: "Enrolled",
          count: 23,
          percentage: 15,
          conversionRate: 72,
          leads: [
            {
              id: "L006",
              name: "Vikram Kumar",
              email: "vikram@email.com",
              course: "Data Science",
              source: "Website",
              currentStage: "Enrolled",
              daysInStage: 0,
              priority: "Hot",
              counselor: "Jane Smith",
              lastActivity: "Enrollment completed",
              nextAction: "Welcome sequence initiated",
            },
          ],
        },
        {
          id: "dropped",
          name: "Dropped",
          count: 67,
          percentage: 43,
          leads: [
            {
              id: "L007",
              name: "Ravi Sharma",
              email: "ravi@email.com",
              course: "Python Programming",
              source: "QR Code",
              currentStage: "Dropped",
              daysInStage: 15,
              priority: "Cold",
              lastActivity: "No response to follow-ups",
              nextAction: "Archive lead",
            },
          ],
        },
      ]

      const mockMetrics: FunnelMetrics = {
        totalLeads: 156,
        overallConversionRate: 15,
        averageTimeToConvert: 12,
        dropoffRate: 43,
        topPerformingSource: "Website",
        topPerformingCourse: "Web Development",
      }

      setFunnelData(mockFunnelData)
      setMetrics(mockMetrics)
      setLoading(false)
  }, [])

  const getStageColor = (stageId: string) => {
    switch (stageId) {
      case "new":
        return "bg-purple-500"
      case "qualified":
        return "bg-purple-500"
      case "trial-booked":
        return "bg-orange-500"
      case "attended":
        return "bg-orange-500"
      case "enrolled":
        return "bg-purple-500"
      case "dropped":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Hot":
        return "bg-red-100 text-red-800"
      case "Warm":
        return "bg-yellow-100 text-yellow-800"
      case "Cold":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Funnel</h1>
          <p className="text-gray-500 dark:text-white">Track lead progression and conversion rates</p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-white">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-white">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.overallConversionRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-white">Avg Time to Convert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.averageTimeToConvert} days</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-white">Drop-off Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics.dropoffRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Funnel Stages</CardTitle>
          <CardDescription>Lead progression through conversion stages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelData.map((stage, index) => (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStageColor(stage.id)}`} />
                  <span className="font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">{stage.count}</span>
                  <span className="text-sm text-gray-500 dark:text-white">{stage.percentage}%</span>
                  {stage.conversionRate && (
                    <Badge variant="outline" className="text-xs">
                      {stage.conversionRate}% conversion
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={stage.percentage} className="h-2" />
              {index < funnelData.length - 1 && (
                <div className="flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 text-gray-400 dark:text-white" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
