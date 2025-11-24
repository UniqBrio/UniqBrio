"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Check, Users, DollarSign, BarChart3, BookOpen } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from "recharts"
import { Course } from "@/types/dashboard/course"

interface DashboardTabProps {
  courses: Course[]
  cohorts: any[]
  studentCount: number | null
  currency: string
}

export default function DashboardTab({ courses, cohorts, studentCount, currency }: DashboardTabProps) {
  // Statistics calculations
  const stats = useMemo(() => ({
    totalCourses: Array.isArray(courses) ? courses.length : 0,
    activeCourses: Array.isArray(courses) ? courses.filter(c => c.status === "Active").length : 0,
    totalStudents: studentCount,
    totalRevenue: Array.isArray(courses) ? courses.reduce((sum, c) => sum + (c.priceINR || c.price || 0) * (c.enrolledStudents || 0), 0) : 0,
    averageRating: Array.isArray(courses) && courses.length > 0 ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length : 0,
    completionRate: Array.isArray(courses) && courses.length > 0 ? courses.reduce((sum, c) => sum + (c.completionRate || 0), 0) / courses.length : 0,
  }), [courses, cohorts, studentCount, currency])

  // Chart data preparation
  const courseStatusData = useMemo(() => [
    { name: 'Active', value: stats.activeCourses, color: '#10b981' },
    { name: 'Inactive', value: stats.totalCourses - stats.activeCourses, color: '#ef4444' }
  ], [stats])

  const courseTypeData = useMemo(() => {
    if (!Array.isArray(courses)) return []

    const typeCounts: { [key: string]: number } = {}
    courses.forEach(course => {
      const type = course.type || 'Unknown'
      typeCounts[type] = (typeCounts[type] || 0) + (course.enrolledStudents || 0)
    })
    return Object.entries(typeCounts).map(([type, students]) => ({
      type,
      students,
      fill: type === 'Online' ? '#3b82f6' : type === 'Offline' ? '#f59e0b' : '#8b5cf6'
    }))
  }, [courses])

  const categoryData = useMemo(() => {
    if (!Array.isArray(courses)) return []

    const categoryCounts: { [key: string]: number } = {}
    courses.forEach(course => {
      const category = course.courseCategory || 'General'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      fill: category === 'Regular' ? '#10b981' : category === 'Premium' ? '#f59e0b' : '#8b5cf6'
    }))
  }, [courses])

  // Mock revenue trend data (in real app, this would come from analytics)
  const revenueTrendData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 }
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Courses</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeCourses}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Cohorts</p>
                <p className="text-2xl font-bold text-purple-900">{Array.isArray(cohorts) ? cohorts.length : 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-900">{studentCount !== null ? studentCount : '-'}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Revenue (${currency})</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalRevenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Course Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={courseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {courseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {courseStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enrollment by Course Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enrollment by Course Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={courseTypeData} margin={{ left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type">
                  <Label value="Course Type" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Number of Students" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip formatter={(v: any) => [`${v}`, 'Students']} />
                <Bar dataKey="students" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {categoryData.map((item) => (
                <div key={item.category} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.category}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueTrendData} margin={{ left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month">
                  <Label value="Month" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value={`Revenue (${currency})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip formatter={(v: any) => [`${new Intl.NumberFormat("en-IN").format(Number(v))} ${currency}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}