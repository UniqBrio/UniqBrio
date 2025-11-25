"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Progress } from "@/components/dashboard/ui/progress"
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Plus,
} from "lucide-react"

interface DashboardStats {
  totalLeads: number
  totalEnquiries: number
  activeTrials: number
  conversionRate: number
  pendingFollowups: number
  todaysSessions: number
}

interface RecentActivity {
  id: string
  type: "lead" | "enquiry" | "trial" | "session"
  title: string
  description: string
  time: string
  priority: "high" | "medium" | "low"
  counselor?: string
}

export default function CRMDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 156,
    totalEnquiries: 89,
    activeTrials: 23,
    conversionRate: 68,
    pendingFollowups: 12,
    todaysSessions: 8,
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "enquiry",
      title: "New enquiry from Priya Sharma",
      description: "Interested in Web Development course",
      time: "2 minutes ago",
      priority: "high",
      counselor: "John Doe",
    },
    {
      id: "2",
      type: "trial",
      title: "Trial session completed",
      description: "Rahul Kumar - Python Basics",
      time: "15 minutes ago",
      priority: "medium",
      counselor: "Jane Smith",
    },
    {
      id: "3",
      type: "lead",
      title: "Follow-up reminder",
      description: "Contact Anjali Patel regarding course enrollment",
      time: "1 hour ago",
      priority: "high",
      counselor: "John Doe",
    },
    {
      id: "4",
      type: "session",
      title: "Session scheduled",
      description: "Demo class for Data Science - 2:00 PM",
      time: "2 hours ago",
      priority: "medium",
      counselor: "Mike Johnson",
    },
  ])
  const [loading, setLoading] = useState(false)

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Active Enquiries",
      value: stats.totalEnquiries,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "Active Trials",
      value: stats.activeTrials,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+15%",
      changeType: "positive" as const,
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+5%",
      changeType: "positive" as const,
    },
  ]

  const quickActions = [
    { label: "Add New Lead", icon: Users, href: "/crm/leads?action=add" },
    { label: "Schedule Trial", icon: Calendar, href: "/crm/trials?action=schedule" },
    { label: "Send Follow-up", icon: Mail, href: "/crm/enquiries?action=followup" },
    { label: "Make Call", icon: Phone, href: "/crm/sessions?action=call" },
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">CRM Dashboard</h1>
              <p className="text-gray-600 dark:text-white">Welcome back! Here's what's happening with your leads today.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button className="w-full md:w-auto bg-purple-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className={`text-sm ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                        {stat.change} from last month
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your CRM workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === "enquiry"
                              ? "bg-blue-100"
                              : activity.type === "trial"
                                ? "bg-green-100"
                                : activity.type === "lead"
                                  ? "bg-purple-100"
                                  : "bg-orange-100"
                          }`}
                        >
                          {activity.type === "enquiry" && <MessageSquare className="w-4 h-4 text-blue-600" />}
                          {activity.type === "trial" && <Calendar className="w-4 h-4 text-green-600" />}
                          {activity.type === "lead" && <Users className="w-4 h-4 text-purple-600" />}
                          {activity.type === "session" && <Clock className="w-4 h-4 text-orange-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                            <Badge
                              variant={
                                activity.priority === "high"
                                  ? "destructive"
                                  : activity.priority === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {activity.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-white truncate">{activity.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500 dark:text-white">{activity.time}</p>
                            {activity.counselor && <p className="text-xs text-gray-500 dark:text-white">by {activity.counselor}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary hover:text-white transition-colors bg-transparent"
                      >
                        <action.icon className="w-5 h-5" />
                        <span className="text-xs text-center">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <span>Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">{stats.pendingFollowups} pending follow-ups</p>
                        <p className="text-xs text-red-700">Requires immediate attention</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">{stats.todaysSessions} sessions today</p>
                        <p className="text-xs text-green-700">All scheduled and confirmed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Goal</CardTitle>
                  <CardDescription>Conversion target progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Conversions</span>
                        <span>{stats.conversionRate}% of 75%</span>
                      </div>
                      <Progress value={stats.conversionRate} className="h-2" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white">Great progress! You're ahead of last month's performance.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
  )
}
