"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { formatDateForDisplay } from "@/lib/dashboard/student/utils";
import { Calendar, Users, TrendingUp, TrendingDown, Target, Activity, CalendarDays, BarChart3, AlertTriangle } from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  LabelList
} from "recharts";
import type { LeaveRecord } from "./types"
import { useCustomColors } from "@/lib/use-custom-colors"

interface LeaveAnalyticsProps {
  leaveData: LeaveRecord[];
}

export function LeaveAnalytics({ leaveData }: LeaveAnalyticsProps) {
  const { primaryColor, secondaryColor } = useCustomColors()
  const analytics = useMemo(() => {
    if (!leaveData || leaveData.length === 0) {
      return {
        totalLeaves: 0,
        thisMonthLeaves: 0,
        thisWeekLeaves: 0,
        uniqueStudents: 0,
        avgLeavesPerStudent: 0,
        last7Days: 0,
        previous7Days: 0,
        trendPercentage: 0,
        trendDirection: "steady" as "up" | "down" | "steady",
        peakDay: "",
        peakCount: 0,
        topStudents: [] as Array<{ id: string; name: string; count: number; lastDate: Date | null }>,
        topCohorts: [] as Array<{ name: string; count: number; instructor?: string }>,
        topCourses: [] as Array<{ name: string; count: number }>,
        weekdayBreakdown: [] as Array<{ day: string; count: number; percentage: number }>,
        maxWeekdayCount: 0,
        recentActivity: [] as Array<{ date: string; formattedDate: string; count: number; delta: number }>,
        studentsWithMultipleLeaves: 0,
        repeatStudents: [] as Array<{ id: string; name: string; count: number; lastDate: Date | null }>,
        cohortsImpacted: 0,
        coursesImpacted: 0,
        repeatLeaveRate: 0,
        highestStudentCount: 0,
        highestCohortCount: 0,
        highestCourseCount: 0,
      };
    }

    const totalLeaves = leaveData.length;
    const studentMap = new Map<string, { count: number; name: string; latestTimestamp: number | null }>();
    const cohortMap = new Map<string, { count: number; instructor?: string }>();
    const courseMap = new Map<string, { count: number }>();
    const dateMap = new Map<string, number>();
    const weekdayCounts = Array(7).fill(0) as number[];

    leaveData.forEach(record => {
      const { studentId, studentName, cohortName, cohortInstructor, courseName, date } = record;

      // Date aggregations
      const dateKey = date;
      if (dateKey) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }

      const parsedDate = new Date(dateKey);
      if (!Number.isNaN(parsedDate.getTime())) {
        weekdayCounts[parsedDate.getDay()] += 1;
      }

      // Student aggregations
      if (studentId) {
        const timestamp = parsedDate.getTime();
        const prev = studentMap.get(studentId) || { count: 0, name: studentName || studentId, latestTimestamp: null };
        const latestTimestamp = Number.isNaN(timestamp)
          ? prev.latestTimestamp
          : prev.latestTimestamp === null
            ? timestamp
            : Math.max(prev.latestTimestamp, timestamp);
        studentMap.set(studentId, {
          count: prev.count + 1,
          name: studentName || prev.name || studentId,
          latestTimestamp,
        });
      }

      // Cohort aggregations
      const cohortKey = (cohortName && cohortName.trim()) || "Unassigned";
      const prevCohort = cohortMap.get(cohortKey) || { count: 0, instructor: cohortInstructor };
      cohortMap.set(cohortKey, {
        count: prevCohort.count + 1,
        instructor: prevCohort.instructor || cohortInstructor || undefined,
      });

      // Course aggregations
      const courseKey = (courseName && courseName.trim()) || "Unassigned";
      const prevCourse = courseMap.get(courseKey) || { count: 0 };
      courseMap.set(courseKey, { count: prevCourse.count + 1 });
    });

    // Peak day
    let peakDay = "";
    let peakCount = 0;
    dateMap.forEach((count, date) => {
      if (count > peakCount) {
        peakCount = count;
        peakDay = date;
      }
    });

    const uniqueStudents = studentMap.size;

    const topStudents = Array.from(studentMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count,
        lastDate: data.latestTimestamp ? new Date(data.latestTimestamp) : null,
      }))
      .sort((a, b) => b.count - a.count);

    const topCohorts = Array.from(cohortMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        instructor: data.instructor,
      }))
      .sort((a, b) => b.count - a.count);

    const topCourses = Array.from(courseMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    const studentsWithMultipleLeaves = topStudents.filter(student => student.count > 1).length;
    const repeatStudents = topStudents.filter(student => student.count > 1);

    const avgLeavesPerStudent = uniqueStudents > 0 ? totalLeaves / uniqueStudents : 0;

    const now = new Date();
    
    // Calculate this month's leaves
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthLeaves = leaveData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;

    // Calculate this week's leaves (Monday to Sunday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const thisWeekLeaves = leaveData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    }).length;

    const last7Days = leaveData.filter(record => {
      const recordDate = new Date(record.date);
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff < 7;
    }).length;

    const previous7Days = leaveData.filter(record => {
      const recordDate = new Date(record.date);
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 7 && daysDiff < 14;
    }).length;

    let trendPercentage = 0;
    if (previous7Days > 0) {
      trendPercentage = Number((((last7Days - previous7Days) / previous7Days) * 100).toFixed(1));
    } else if (last7Days > 0) {
      trendPercentage = 100;
    }

    const trendDirection: "up" | "down" | "steady" = trendPercentage > 0 ? "up" : trendPercentage < 0 ? "down" : "steady";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayBreakdown = dayNames.map((day, index) => ({
      day,
      count: weekdayCounts[index],
      percentage: totalLeaves > 0 ? Math.round((weekdayCounts[index] / totalLeaves) * 100) : 0,
    }));
    const maxWeekdayCount = weekdayBreakdown.reduce((max, entry) => Math.max(max, entry.count), 0);

    const sortedDates = Array.from(dateMap.entries()).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    const recentActivity = sortedDates.slice(0, 7).map(([date, count], index) => {
      const previousCount = sortedDates[index + 1]?.[1] ?? 0;
      const formattedDate = (() => {
        // Use shared formatter for consistent dd-MMM-yyyy output
        return formatDateForDisplay(date);
      })();
      return {
        date,
        formattedDate,
        count,
        delta: count - previousCount,
      };
    });

    const cohortsImpacted = topCohorts.length;
    const coursesImpacted = topCourses.length;
    const repeatLeaveRate = uniqueStudents > 0 ? Math.round((studentsWithMultipleLeaves / uniqueStudents) * 100) : 0;

    const highestStudentCount = topStudents.reduce((max, student) => Math.max(max, student.count), 0);
    const highestCohortCount = topCohorts.reduce((max, cohort) => Math.max(max, cohort.count), 0);
    const highestCourseCount = topCourses.reduce((max, course) => Math.max(max, course.count), 0);

    return {
      totalLeaves,
      thisMonthLeaves,
      thisWeekLeaves,
      uniqueStudents,
      avgLeavesPerStudent,
      last7Days,
      previous7Days,
      trendPercentage,
      trendDirection,
      peakDay,
      peakCount,
      topStudents,
      topCohorts,
      topCourses,
      weekdayBreakdown,
      maxWeekdayCount,
      recentActivity,
      studentsWithMultipleLeaves,
      repeatStudents,
      cohortsImpacted,
      coursesImpacted,
      repeatLeaveRate,
      highestStudentCount,
      highestCohortCount,
      highestCourseCount,
    };
  }, [leaveData]);

  if (!analytics.totalLeaves) {
    return (
      <div
        className="rounded-lg border border-dashed p-6 text-center text-sm"
        style={{
          borderColor: `${primaryColor}55`,
          background: `color-mix(in oklab, ${primaryColor} 10%, white)`,
          color: primaryColor,
        }}
      >
        No leave data available yet. Once leave records are created, this area will populate with insights automatically.
      </div>
    );
  }

  const TrendIcon = analytics.trendDirection === "up" ? TrendingUp : analytics.trendDirection === "down" ? TrendingDown : Activity;
  const trendTextColor = analytics.trendDirection === "up" ? "text-red-600" : analytics.trendDirection === "down" ? "text-green-600" : "text-slate-500";
  const peakDayLabel = analytics.peakDay ? (() => {
    const parsed = new Date(analytics.peakDay);
    return Number.isNaN(parsed.getTime()) ? analytics.peakDay : formatDateForDisplay(analytics.peakDay);
  })() : "Not available";
  const getPercent = (value: number, max: number) => {
    if (!max || max <= 0) return 0;
    return Math.max(8, Math.round((value / max) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-xl border-0 p-6 shadow-sm"
              style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${secondaryColor} 10%, white), color-mix(in oklab, ${secondaryColor} 20%, white))` }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1" style={{ color: secondaryColor }}>Total Leaves</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: secondaryColor }}>{analytics.thisMonthLeaves}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: secondaryColor }}>This month</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                   style={{ background: `color-mix(in oklab, ${secondaryColor} 20%, transparent)` }}>
                <Calendar className="h-6 w-6" style={{ color: secondaryColor }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-600 mb-1">Leaves</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-red-700">{analytics.thisWeekLeaves}</span>
              </div>
              <p className="text-xs text-red-600 mt-1">This week</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-red-200/50 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-600 mb-1">Most Impacted Cohort</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-green-700">{analytics.topCohorts[0]?.count || 0}</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{analytics.topCohorts[0]?.name || 'No data'}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-green-200/50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>



      {/* Additional Charts Section */}
      <div className="grid gap-4 xl:grid-cols-2">
        

        {/* Cohorts Impacted Bar Chart */}
        <Card className="shadow-sm" style={{ border: `1px solid ${primaryColor}33` }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
              <CalendarDays className="h-4 w-4" />
              Cohorts Impacted
            </CardTitle>
            <p className="text-sm" style={{ color: primaryColor }}>
              Leave distribution across cohorts
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={analytics.topCohorts.slice(0, 5).map(cohort => ({
                    name: cohort.name.length > 10 ? cohort.name.substring(0, 10) + '...' : cohort.name,
                    leaves: cohort.count,
                    fullName: cohort.name,
                    instructor: cohort.instructor || 'Unassigned',
                    percentage: Math.round((cohort.count / analytics.totalLeaves) * 100)
                  }))}
                  margin={{ top: 25, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke={`${primaryColor}22`} opacity={0.7} />
                  <XAxis 
                    dataKey="name"
                    angle={0}
                    textAnchor="middle"
                    height={60}
                    style={{ fontSize: '10px', fill: primaryColor }}
                    axisLine={{ stroke: `${primaryColor}55`, strokeWidth: 1 }}
                    tickLine={{ stroke: `${primaryColor}55` }}
                    label={{ value: 'Cohorts', position: 'insideBottom', offset: 0, style: { fontSize: '12px', fill: primaryColor } }}
                  />
                  <YAxis 
                    style={{ fontSize: '11px', fill: primaryColor }}
                    axisLine={{ stroke: `${primaryColor}55`, strokeWidth: 1 }}
                    tickLine={{ stroke: `${primaryColor}55` }}
                    label={{ value: 'Number of Leaves', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: primaryColor, textAnchor: 'middle' } }}
                    domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} leave${value === 1 ? '' : 's'}`, 'Count']}
                    labelFormatter={(label: string, payload: any) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.fullName}\nInstructor: ${data.instructor}\n${data.percentage}% of total leaves` : label;
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: `1px solid ${primaryColor}55`, 
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      whiteSpace: 'pre-line'
                    }}
                  />
                  <Bar 
                    dataKey="leaves" 
                    fill={primaryColor}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="leaves" 
                      position="top" 
                      style={{ fontSize: '12px', fontWeight: 'bold', fill: primaryColor }}
                      offset={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Courses Impacted Bar Chart */}
        <Card className="shadow-sm border border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <BarChart3 className="h-4 w-4" />
              Courses Impacted
            </CardTitle>
            <p className="text-sm text-blue-600">
              Course-wise leave distribution
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={analytics.topCourses.slice(0, 5).map(course => ({
                    name: course.name.length > 10 ? course.name.substring(0, 10) + '...' : course.name,
                    leaves: course.count,
                    fullName: course.name,
                    percentage: Math.round((course.count / analytics.totalLeaves) * 100)
                  }))}
                  margin={{ top: 25, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke="#dbeafe" opacity={0.4} />
                  <XAxis 
                    dataKey="name"
                    angle={0}
                    textAnchor="middle"
                    height={60}
                    style={{ fontSize: '10px', fill: '#1e40af' }}
                    axisLine={{ stroke: '#93c5fd', strokeWidth: 1 }}
                    tickLine={{ stroke: '#93c5fd' }}
                    label={{ value: 'Courses', position: 'insideBottom', offset: 0, style: { fontSize: '12px', fill: '#1e40af' } }}
                  />
                  <YAxis 
                    style={{ fontSize: '11px', fill: '#1e40af' }}
                    axisLine={{ stroke: '#93c5fd', strokeWidth: 1 }}
                    tickLine={{ stroke: '#93c5fd' }}
                    label={{ value: 'Number of Leaves', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#1e40af', textAnchor: 'middle' } }}
                    domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} leave${value === 1 ? '' : 's'}`, 'Count']}
                    labelFormatter={(label: string, payload: any) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.fullName}\n${data.percentage}% of total leaves` : label;
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #93c5fd', 
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      whiteSpace: 'pre-line'
                    }}
                  />
                  <Bar 
                    dataKey="leaves" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="leaves" 
                      position="top" 
                      style={{ fontSize: '12px', fontWeight: 'bold', fill: '#1e40af' }}
                      offset={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      

    </div>
  );
}
