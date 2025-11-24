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
  PieChart,
  Pie,
  Cell,
  Legend,
  Label,
} from "recharts"
import { Course } from "@/types/dashboard/course"
import { useIsMobile } from "@/hooks/dashboard/use-mobile"
import { useResponsiveBreakpoints, useResponsiveValue } from "@/hooks/dashboard/useResponsiveBreakpoints"
import { ResponsiveChartContainer } from "@/components/dashboard/ui/responsive-container"

interface CourseDashboardChartsProps {
  courses: Course[]
  currency?: "INR" | "USD"
}

const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#22c55e"]

export default function CourseDashboardCharts({ courses, currency = "INR" }: CourseDashboardChartsProps) {
  const isMobile = useIsMobile()
  const { screenSize } = useResponsiveBreakpoints()
  
  // Responsive chart configurations
  const chartConfig = useResponsiveValue({
    mobile: {
      fontSize: 10,
      outerRadius: 60,
      margins: { left: 5, right: 5, bottom: 40, top: 5 },
      angleOffset: -35,
      showLabels: false
    },
    tablet: {
      fontSize: 11,
      outerRadius: 80,
      margins: { left: 8, right: 8, bottom: 60, top: 5 },
      angleOffset: -20,
      showLabels: false
    },
    desktop: {
      fontSize: 12,
      outerRadius: 100,
      margins: { left: 8, right: 8, bottom: 80, top: 5 },
      angleOffset: -15,
      showLabels: true
    }
  })
  const getPrice = (c: Course) => {
    // Note: priceINR is a legacy field name, but it now stores price in the academy's selected currency
    const price = (c.priceINR as any) || (c as any).price || 0
    return typeof price === "number" ? price : Number(price || 0)
  }

  const enrolled = (c: Course) => (c as any).enrolledStudents ? Number((c as any).enrolledStudents) : 0

  // 1) Revenue by Course (Top 8)
  const revenueByCourse = [...courses]
    .map((c) => ({ name: c.name || c.id || "Course", revenue: getPrice(c) * enrolled(c) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  // 2) Courses by Category
  const categoryMap = new Map<string, number>()
  for (const c of courses) {
    const key = (c as any).courseCategory || "Uncategorized"
    categoryMap.set(key, (categoryMap.get(key) || 0) + 1)
  }
  const categoryDistribution = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }))

  // 3) Students by Level
  const levelMap = new Map<string, number>()
  for (const c of courses) {
    const key = (c as any).level || "Unknown"
    levelMap.set(key, (levelMap.get(key) || 0) + enrolled(c))
  }
  const studentsByLevel = Array.from(levelMap.entries()).map(([level, students]) => ({ level, students }))

  // 4) Status distribution
  const statusMap = new Map<string, number>()
  for (const c of courses) {
    const key = (c as any).status || "Unknown"
    statusMap.set(key, (statusMap.get(key) || 0) + 1)
  }
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Mobile: Single column layout, Tablet & Desktop: Multi-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue by Course */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl break-words">
              Top Courses by Revenue ({currency})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={revenueByCourse} 
                  margin={chartConfig.margins}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: chartConfig.fontSize }} 
                    interval={0} 
                    angle={chartConfig.angleOffset} 
                    textAnchor="end" 
                    height={screenSize === "mobile" ? 40 : 60}
                    className="text-xs sm:text-sm"
                  >
                    {chartConfig.showLabels && (
                      <Label value="Course Names" offset={-5} position="insideBottom" />
                    )}
                  </XAxis>
                  <YAxis 
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 40 : 60}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value={`Revenue (${currency})`} 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle' }} 
                      />
                    )}
                  </YAxis>
                  <Tooltip 
                    formatter={(v: any) => [
                      `${new Intl.NumberFormat("en-IN").format(Number(v))} ${currency}`, 
                      'Revenue'
                    ]}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#8b5cf6" 
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ResponsiveChartContainer>
          </CardContent>
        </Card>

        {/* Courses by Category */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">
              Courses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    dataKey="count" 
                    nameKey="category"
                    data={categoryDistribution} 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={chartConfig.outerRadius}
                    label={chartConfig.showLabels ? ({ category, count }) => 
                      screenSize === "desktop" ? `${category}: ${count}` : `${count}`
                    : false}
                    labelLine={false}
                  >
                    {categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} courses`, name]}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: screenSize === "mobile" ? '8px' : '20px',
                      fontSize: screenSize === "mobile" ? '11px' : '14px'
                    }}
                    iconSize={screenSize === "mobile" ? 12 : 14}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ResponsiveChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second row - Mobile: Stacked, Desktop: Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Students by Level */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">
              Students by Level
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={studentsByLevel} 
                  margin={{
                    left: screenSize === "mobile" ? 15 : 20,
                    right: screenSize === "mobile" ? 5 : 8,
                    bottom: screenSize === "mobile" ? 25 : 40,
                    top: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="level"
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                  >
                    {chartConfig.showLabels && (
                      <Label value="Course Level" offset={-5} position="insideBottom" />
                    )}
                  </XAxis>
                  <YAxis 
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 35 : 60}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value="Number of Students" 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle' }} 
                      />
                    )}
                  </YAxis>
                  <Tooltip 
                    formatter={(v: any) => [`${v}`, 'Students']}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Bar 
                    dataKey="students" 
                    fill="#10b981" 
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ResponsiveChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">
              Course Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <ResponsiveChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={statusDistribution} 
                  margin={{
                    left: screenSize === "mobile" ? 15 : 20,
                    right: screenSize === "mobile" ? 5 : 8,
                    bottom: screenSize === "mobile" ? 25 : 40,
                    top: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="status"
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                  >
                    {chartConfig.showLabels && (
                      <Label value="Course Status" offset={-5} position="insideBottom" />
                    )}
                  </XAxis>
                  <YAxis 
                    tick={{ fontSize: chartConfig.fontSize }}
                    className="text-xs sm:text-sm"
                    width={screenSize === "mobile" ? 35 : 60}
                  >
                    {chartConfig.showLabels && (
                      <Label 
                        value="Number of Courses" 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle' }} 
                      />
                    )}
                  </YAxis>
                  <Tooltip 
                    formatter={(v: any) => [`${v}`, 'Courses']}
                    contentStyle={{
                      fontSize: screenSize === "mobile" ? '11px' : '14px',
                      padding: screenSize === "mobile" ? '6px 8px' : '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#f97316" 
                    radius={screenSize === "mobile" ? [2, 2, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ResponsiveChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
