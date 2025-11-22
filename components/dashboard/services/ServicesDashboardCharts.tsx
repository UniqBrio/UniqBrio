"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Label,
  LabelList,
} from "recharts"

type ScheduleStats = {
  totalSessions: number
  upcomingSessions: number
  todaySessions: number
  thisWeekSessions: number
}

type CourseStats = {
  totalCourses: number
  activeCourses: number
  totalEnrollments: number
  averageRating: number
}

type CohortStats = {
  totalCohorts: number
  activeCohorts: number
  totalStudents: number
  averageCohortSize: number
}

type RecentActivity = {
  id: string
  type: "schedule" | "course" | "enrollment" | "cohort"
  title: string
  description: string
  timestamp: Date
  status: "success" | "warning" | "info"
}

interface ServicesDashboardChartsProps {
  scheduleStats: ScheduleStats
  courseStats: CourseStats
  cohortStats: CohortStats
  recentActivities: RecentActivity[]
}

const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#22c55e"]

export default function ServicesDashboardCharts({
  scheduleStats,
  courseStats,
  cohortStats,
  recentActivities,
}: ServicesDashboardChartsProps) {
  // 1) Overview bar data
  // Adjusted per request: remove Sessions and Enrollments from overview graph
  const overviewData = [
    { name: "Courses", count: courseStats.totalCourses },
    { name: "Cohorts", count: cohortStats.totalCohorts },
  ]

  // 2) Activity by hour (last 12 hours)
  const now = new Date()
  const last12: { label: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(now.getHours() - i, 0, 0, 0)
    const hourLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const cnt = recentActivities.filter((a) => {
      const t = new Date(a.timestamp)
      return t.getHours() === d.getHours() && t.getDate() === d.getDate()
    }).length
    last12.push({ label: hourLabel, count: cnt })
  }

  // 3) Active vs Inactive pies
  // Removed course & cohort status pie charts per request.

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Services Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name">
                <Label value="Entity" offset={-4} position="insideBottom" className="fill-gray-600 text-xs" />
              </XAxis>
              <YAxis>
                <Label value="Count" angle={-90} position="insideLeft" offset={10} className="fill-gray-600 text-xs" />
              </YAxis>
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6">
                <LabelList dataKey="count" position="top" className="fill-purple-700 text-xs" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Line */}
      <Card>
        <CardHeader>
          <CardTitle>Activity (last 12 hours)</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={20}>
                <Label value="Hour" offset={-4} position="insideBottom" className="fill-gray-600 text-xs" />
              </XAxis>
              <YAxis allowDecimals={false}>
                <Label value="Events" angle={-90} position="insideLeft" offset={10} className="fill-gray-600 text-xs" />
              </YAxis>
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false}>
                <LabelList dataKey="count" position="top" className="fill-cyan-700 text-xs" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* (Pie charts removed) */}
    </div>
  )
}
