"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { useCustomColors } from "@/lib/use-custom-colors"
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

  const { primaryColor } = useCustomColors()
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
              <XAxis dataKey="name" stroke={primaryColor}>
                <Label value="Entity" offset={-4} position="insideBottom" className="fill-gray-600 text-xs" />
              </XAxis>
              <YAxis stroke={primaryColor}>
                <Label value="Count" angle={-90} position="insideLeft" offset={10} className="fill-gray-600 text-xs" />
              </YAxis>
              <Tooltip />
              <Bar dataKey="count" fill={primaryColor}>
                <LabelList dataKey="count" position="top" className="fill-gray-700 text-xs" />
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
              <XAxis dataKey="label" minTickGap={20} stroke={primaryColor}>
                <Label value="Hour" offset={-4} position="insideBottom" className="fill-gray-600 text-xs" />
              </XAxis>
              <YAxis allowDecimals={false} stroke={primaryColor}>
                <Label value="Events" angle={-90} position="insideLeft" offset={10} className="fill-gray-600 text-xs" />
              </YAxis>
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={primaryColor} strokeWidth={2} dot={false}>
                <LabelList dataKey="count" position="top" className="fill-gray-700 text-xs" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* (Pie charts removed) */}
    </div>
  )
}
