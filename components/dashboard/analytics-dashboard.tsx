"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Badge } from "@/components/dashboard/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Label,
  LabelList,
} from "recharts"
import { Users, Clock, AlertCircle, Calendar, Target, Award, Activity } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"

interface AnalyticsDashboardProps {
  events: any[]
}

export default function AnalyticsDashboard({ events }: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedMetric, setSelectedMetric] = useState("attendance")

  // Helper function to filter events by selected period
  const filterEventsByPeriod = (events: any[]) => {
    const now = new Date()
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      
      switch (selectedPeriod) {
        case "week":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay()) // Start of current week
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6) // End of current week
          return eventDate >= weekStart && eventDate <= weekEnd
          
        case "month":
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
          
        case "quarter":
          const currentQuarter = Math.floor(now.getMonth() / 3)
          const eventQuarter = Math.floor(eventDate.getMonth() / 3)
          return eventQuarter === currentQuarter && eventDate.getFullYear() === now.getFullYear()
          
        case "year":
          return eventDate.getFullYear() === now.getFullYear()
          
        default:
          return true
      }
    })
  }

  // Generate analytics data
  const generateWeekdayDistribution = () => {
    const filteredEvents = filterEventsByPeriod(events)
    const weekdayCounts: { [key: string]: number } = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0
    }

    filteredEvents.forEach((event) => {
      const date = new Date(event.date)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      weekdayCounts[dayName] = (weekdayCounts[dayName] || 0) + 1
    })

    return Object.entries(weekdayCounts).map(([day, count]) => ({
      day: day.substring(0, 3),
      sessions: count,
      percentage: filteredEvents.length > 0 ? (count / filteredEvents.length) * 100 : 0
    }))
  }

  const generateSessionStatusDistribution = () => {
    const filteredEvents = filterEventsByPeriod(events)
    const statusCounts: { [key: string]: number } = {
      'Scheduled': 0,
      'Completed': 0,
      'Cancelled': 0,
      'In Progress': 0,
      'Rescheduled': 0,
      'Reassigned': 0
    }

    filteredEvents.forEach((event) => {
      // Check for reassigned sessions first
      if (event.modificationType === 'instructor_changed' || event.isReassigned) {
        statusCounts['Reassigned'] = (statusCounts['Reassigned'] || 0) + 1
      } else {
        const status = event.status || 'Scheduled'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      }
    })

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
        percentage: filteredEvents.length > 0 ? (count / filteredEvents.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  }

  const generateClassPopularity = () => {
    const categoryStats: { [key: string]: number } = {}

    events.forEach((event) => {
      categoryStats[event.category] = (categoryStats[event.category] || 0) + event.students
    })

    return Object.entries(categoryStats).map(([category, students]) => ({
      category,
      students,
      percentage: (students / events.reduce((sum, e) => sum + e.students, 0)) * 100,
    }))
  }

  const generateCancellationTrends = () => {
    const filteredEvents = filterEventsByPeriod(events)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    return last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      cancellations: filteredEvents.filter((e) => e.isCancelled && e.date.toISOString().split("T")[0] === date).length,
      total: filteredEvents.filter((e) => e.date.toISOString().split("T")[0] === date).length,
    }))
  }

  const generateSessionCompletionData = () => {
    // Filter events by selected period
    const now = new Date()
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.date)
      
      switch (selectedPeriod) {
        case "week":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay()) // Start of current week
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6) // End of current week
          return eventDate >= weekStart && eventDate <= weekEnd
          
        case "month":
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
          
        case "quarter":
          const currentQuarter = Math.floor(now.getMonth() / 3)
          const eventQuarter = Math.floor(eventDate.getMonth() / 3)
          return eventQuarter === currentQuarter && eventDate.getFullYear() === now.getFullYear()
          
        case "year":
          return eventDate.getFullYear() === now.getFullYear()
          
        default:
          return true
      }
    })

    // Group by course and calculate completion metrics
    const courseStats: { [key: string]: { completed: number; total: number; cancelled: number } } = {}
    
    filteredEvents.forEach((event) => {
      const courseName = event.courseName || event.title
      if (!courseStats[courseName]) {
        courseStats[courseName] = { completed: 0, total: 0, cancelled: 0 }
      }
      
      courseStats[courseName].total += 1
      if (event.status === 'Completed') {
        courseStats[courseName].completed += 1
      } else if (event.status === 'Cancelled') {
        courseStats[courseName].cancelled += 1
      }
    })

    return Object.entries(courseStats).map(([courseName, stats]) => ({
      className: courseName,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
      totalSessions: stats.total,
      completedSessions: stats.completed,
      period: selectedPeriod
    })).sort((a, b) => b.completionRate - a.completionRate)
  }

  const generateEngagementScores = () => {
    // Filter events by selected period
    const now = new Date()
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.date)
      
      switch (selectedPeriod) {
        case "week":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay()) // Start of current week
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6) // End of current week
          return eventDate >= weekStart && eventDate <= weekEnd
          
        case "month":
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
          
        case "quarter":
          const currentQuarter = Math.floor(now.getMonth() / 3)
          const eventQuarter = Math.floor(eventDate.getMonth() / 3)
          return eventQuarter === currentQuarter && eventDate.getFullYear() === now.getFullYear()
          
        case "year":
          return eventDate.getFullYear() === now.getFullYear()
          
        default:
          return true
      }
    })

    // Group events by course name to avoid duplicates
    const courseGroups: { [key: string]: any[] } = {}
    
    filteredEvents.forEach((event) => {
      const courseName = event.courseName || event.title
      if (!courseGroups[courseName]) {
        courseGroups[courseName] = []
      }
      courseGroups[courseName].push(event)
    })

    return Object.entries(courseGroups).map(([courseName, courseEvents]) => {
      const totalStudents = courseEvents.reduce((sum, e) => sum + e.students, 0)
      const totalCapacity = courseEvents.reduce((sum, e) => sum + (e.maxCapacity || e.students), 0)
      const avgAttendance = (totalStudents / totalCapacity) * 100
      
      return {
        className: courseName,
        attendance: Math.min(100, avgAttendance),
        satisfaction: 75 + Math.random() * 20, // Mock satisfaction score 75-95%
        engagement: 65 + Math.random() * 25, // Mock engagement score 65-90%
        sessions: courseEvents.length
      }
    }).sort((a, b) => b.engagement - a.engagement) // Sort by engagement score
  }

  const weekdayData = generateWeekdayDistribution()
  const sessionStatusData = generateSessionStatusDistribution()
  const popularityData = generateClassPopularity()
  const cancellationData = generateCancellationTrends()
  const sessionCompletionData = generateSessionCompletionData()
  const engagementData = generateEngagementScores()

  const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

  // Determine interval based on selected period
  const getInterval = () => {
    switch (selectedPeriod) {
      case 'month':
        return 8
      case 'quarter':
      case 'year':
        return 20
      default: // week
        return 5
    }
  }

  const interval = getInterval()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-700">Analytics Dashboard</h2>
          <p className="text-gray-500">Comprehensive insights into your schedule performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      {(() => {
        // Filter events by selected period
        const filteredEvents = filterEventsByPeriod(events)
        
        // Derive unique courses using courseId (fallback to courseName if id missing)
        const uniqueCourseIds = new Set(
          filteredEvents
            .map(e => e.courseId || e.courseName)
            .filter(Boolean)
        )
        const totalCourses = uniqueCourseIds.size
        
        // Calculate unique cohorts
        const uniqueCohorts = new Set(
          filteredEvents
            .map(e => e.cohortId || e.cohort)
            .filter(Boolean)
        )
        const totalCohorts = uniqueCohorts.size
        
        // Calculate today's sessions
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const todaysSessions = filteredEvents.filter(e => {
          const eventDate = new Date(e.date)
          return eventDate.toISOString().split('T')[0] === todayStr
        }).length
        
        // Calculate today's cancelled sessions
        const todaysCancelledSessions = filteredEvents.filter(e => {
          const eventDate = new Date(e.date)
          const isToday = eventDate.toISOString().split('T')[0] === todayStr
          const isCancelled = e.isCancelled || e.status === 'Cancelled' || e.modificationType === 'cancelled'
          return isToday && isCancelled
        }).length
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Courses</p>
                    <p className="text-2xl font-bold text-green-900">{totalCourses}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Cohorts</p>
                    <p className="text-2xl font-bold text-purple-900">{totalCohorts}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Today's Sessions</p>
                    <p className="text-2xl font-bold text-blue-900">{todaysSessions}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Today's Cancelled Sessions</p>
                    <p className="text-2xl font-bold text-red-900">{todaysCancelledSessions}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )
  })()}

      {/* Filter Dropdown */}
      <div className="flex justify-end">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Graphs */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekday Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day">
                      <Label value="Day of Week" position="insideBottom" offset={-4} className="fill-gray-600 text-xs" />
                    </XAxis>
                    <YAxis 
                      allowDecimals={false} 
                      domain={[
                        0, 
                        () => {
                          const maxValue = Math.max(...weekdayData.map(d => d.sessions), 0)
                          // Round up to next multiple of interval, then add one interval for spacing
                          const roundedMax = Math.ceil(maxValue / interval) * interval
                          return roundedMax < maxValue ? roundedMax + interval : roundedMax + interval
                        }
                      ]}
                      ticks={(() => {
                        const maxValue = Math.max(...weekdayData.map(d => d.sessions), 0)
                        const maxTick = Math.ceil(maxValue / interval) * interval + interval
                        const ticks = []
                        for (let i = 0; i <= maxTick; i += interval) {
                          ticks.push(i)
                        }
                        return ticks
                      })()}
                    >
                      <Label value="Sessions" angle={-90} position="insideLeft" offset={10} className="fill-gray-600 text-xs" />
                    </YAxis>
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#8b5cf6">
                      <LabelList dataKey="sessions" position="top" className="fill-purple-700 text-[10px]" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Session Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={sessionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="count"
                      label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                      labelLine={true}
                    >
                      {sessionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} sessions (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.status
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => `${entry.payload.status}: ${entry.payload.count}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Trends - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Weekly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cancellationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date">
                    <Label value="Day" position="insideBottom" offset={-4} className="fill-gray-600 text-xs" />
                  </XAxis>
                  <YAxis>
                    <Label value="Sessions" angle={-90} position="insideLeft" offset={10} className="fill-gray-600 text-xs" />
                  </YAxis>
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Sessions" >
                    <LabelList dataKey="total" position="top" className="fill-purple-700 text-[10px]" />
                  </Line>
                  <Line type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} name="Cancellations" >
                    <LabelList dataKey="cancellations" position="top" className="fill-red-600 text-[10px]" />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
