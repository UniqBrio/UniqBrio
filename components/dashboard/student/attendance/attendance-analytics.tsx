"use client"

import { useState, useMemo } from "react"
import { formatDateForDisplay } from "@/lib/dashboard/student/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Download, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"

interface StudentAttendanceRecord {
  id: string | number;
  studentId: string;
  studentName: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  courseId?: string;
  courseName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'present' | 'absent' | string;
  notes?: string;
}

interface AttendanceAnalyticsProps {
  attendanceData?: StudentAttendanceRecord[];
  loading?: boolean;
}
const COLORS = ["#8A2BE2", "#DE7D14", "#9370DB", "#FFA500", "#8B5CF6", "#FF8C00", "#BA55D3", "#FFB347"]

// Default mock data for when no real data is available
const defaultAttendanceData: StudentAttendanceRecord[] = []

export function AttendanceAnalytics({ attendanceData = defaultAttendanceData, loading = false }: AttendanceAnalyticsProps) {
  const [period, setPeriod] = useState("month")
  const [month, setMonth] = useState("all")

  // Process attendance data into useful analytics - Optimized for large datasets
  const processedData = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) return null;

    // Performance optimization: Early exit for very large datasets
    const isLargeDataset = attendanceData.length > 10000;
    const dataToProcess = isLargeDataset ? attendanceData.slice(0, 10000) : attendanceData;

    // 1. Course-wise attendance distribution (optimized)
    const courseStats = dataToProcess.reduce((acc, record) => {
      const courseName = record.courseName || 'Unknown Course';
      if (!acc[courseName]) {
        acc[courseName] = { present: 0, absent: 0, total: 0 };
      }
      if (record.status === 'present') acc[courseName].present++;
      else if (record.status === 'absent') acc[courseName].absent++;
      acc[courseName].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    const courseChartData = Object.entries(courseStats)
      .map(([courseName, stats]) => {
        // Ensure all values are valid numbers, fallback to 0 if NaN or undefined
        const present = Number.isFinite(stats.present) ? stats.present : 0;
        const absent = Number.isFinite(stats.absent) ? stats.absent : 0;
        const total = Number.isFinite(stats.total) ? stats.total : 0;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return {
          name: courseName,
          value: total,
          present,
          absent,
          percentage: Number.isFinite(percentage) ? percentage : 0
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by total sessions for better insights

    // 2. Daily attendance trends (last 30 days only for performance)
    const recentData = dataToProcess
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, Math.min(1000, dataToProcess.length)); // Limit to recent 1000 records

    const dailyStats = recentData.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, total: 0 };
      }
      if (record.status === 'present') acc[date].present++;
      else if (record.status === 'absent') acc[date].absent++;
      acc[date].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    const trendData = Object.entries(dailyStats)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-30) // Last 30 days only
      .map(([date, stats]) => {
        // Ensure all values are valid numbers, fallback to 0 if NaN or undefined
        const present = Number.isFinite(stats.present) ? stats.present : 0;
        const absent = Number.isFinite(stats.absent) ? stats.absent : 0;
        const total = Number.isFinite(stats.total) ? stats.total : 0;
        const attendance = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return {
          name: formatDateForDisplay(date),
          date,
          attendance: Number.isFinite(attendance) ? attendance : 0,
          present,
          absent,
          total
        };
      });

    // 3. Student attendance rates (optimized with early sorting)
    const studentStats = dataToProcess.reduce((acc, record) => {
      const studentName = record.studentName;
      if (!acc[studentName]) {
        acc[studentName] = { present: 0, absent: 0, total: 0 };
      }
      if (record.status === 'present') acc[studentName].present++;
      else if (record.status === 'absent') acc[studentName].absent++;
      acc[studentName].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    const studentChartData = Object.entries(studentStats)
      .map(([studentName, stats]) => {
        // Ensure all values are valid numbers, fallback to 0 if NaN or undefined
        const present = Number.isFinite(stats.present) ? stats.present : 0;
        const absent = Number.isFinite(stats.absent) ? stats.absent : 0;
        const total = Number.isFinite(stats.total) ? stats.total : 0;
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return {
          name: studentName,
          attendanceRate: Number.isFinite(attendanceRate) ? attendanceRate : 0,
          present,
          absent,
          total
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate);

    // 4. Cohort performance (optimized)
    const cohortStats = dataToProcess.reduce((acc, record) => {
      const cohortName = record.cohortName || 'Unknown Cohort';
      if (!acc[cohortName]) {
        acc[cohortName] = { present: 0, absent: 0, total: 0 };
      }
      if (record.status === 'present') acc[cohortName].present++;
      else if (record.status === 'absent') acc[cohortName].absent++;
      acc[cohortName].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    const cohortChartData = Object.entries(cohortStats)
      .map(([cohortName, stats]) => {
        // Ensure all values are valid numbers, fallback to 0 if NaN or undefined
        const present = Number.isFinite(stats.present) ? stats.present : 0;
        const absent = Number.isFinite(stats.absent) ? stats.absent : 0;
        const total = Number.isFinite(stats.total) ? stats.total : 0;
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return {
          name: cohortName,
          attendanceRate: Number.isFinite(attendanceRate) ? attendanceRate : 0,
          present,
          absent,
          total
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Overall statistics
    const totalRecords = attendanceData.length; // Use original data length
    const totalPresent = dataToProcess.filter(r => r.status === 'present').length;
    const totalAbsent = dataToProcess.filter(r => r.status === 'absent').length;
    const overallAttendanceRate = totalRecords > 0 ? Math.round((totalPresent / Math.min(totalRecords, 10000)) * 100) : 0;
    
    // Ensure the overall attendance rate is a valid number
    const validOverallAttendanceRate = Number.isFinite(overallAttendanceRate) ? overallAttendanceRate : 0;

    // Ensure arrays are never completely empty to prevent chart errors
    const safeCourseChartData = courseChartData.length > 0 ? courseChartData : [{ name: 'No Data', value: 0, present: 0, absent: 0, percentage: 0 }];
    const safeTrendData = trendData.length > 0 ? trendData : [{ name: 'No Data', date: new Date().toISOString().split('T')[0], attendance: 0, present: 0, absent: 0, total: 0 }];
    const safeStudentChartData = studentChartData.length > 0 ? studentChartData : [{ name: 'No Data', attendanceRate: 0, present: 0, absent: 0, total: 0 }];
    const safeCohortChartData = cohortChartData.length > 0 ? cohortChartData : [{ name: 'No Data', attendanceRate: 0, present: 0, absent: 0, total: 0 }];

    return {
      courseChartData: safeCourseChartData,
      trendData: safeTrendData,
      studentChartData: safeStudentChartData,
      cohortChartData: safeCohortChartData,
      totalRecords,
      totalPresent,
      totalAbsent,
      overallAttendanceRate: validOverallAttendanceRate,
      uniqueStudents: Object.keys(studentStats).length,
      uniqueCourses: Object.keys(courseStats).length,
      uniqueCohorts: Object.keys(cohortStats).length,
      isLargeDataset, // Flag for UI optimizations
      dataProcessed: dataToProcess.length // How much data was actually processed
    };
  }, [attendanceData]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-3 cols-3 gap-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-orange-600">??</span>
                <span className="text-orange-800">Top Course Performance</span>
              </CardTitle>
              <CardDescription className="text-sm text-orange-600">Loading course data...</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p>Loading...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-purple-600">??</span>
                <span className="text-purple-800">Top Cohort Performance</span>
              </CardTitle>
              <CardDescription className="text-sm text-purple-600">Loading cohort data...</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p>Loading...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return <div className="p-4 text-center text-gray-500">-</div>;
  }

  // Helper to export analytics section as PNG
  const handleExport = async () => {
    const section = document.getElementById("analytics-section");
    if (!section) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(section);
    const link = document.createElement("a");
    link.download = "attendance-analytics.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-3 cols-3 gap-3">
      
      {/* Large Dataset Performance Banner */}
      {processedData?.isLargeDataset && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-purple-600">??</div>
            <div>
              <h4 className="font-medium text-purple-800">Large Dataset Detected</h4>
              <p className="text-sm text-purple-600">
                Processing {processedData.dataProcessed.toLocaleString()} of {processedData.totalRecords.toLocaleString()} total records 
                for optimal performance. Charts show representative samples with key insights.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div id="analytics-section" className="space-y-6">
          
            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             



              {/* Course-wise Performance Bar Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-orange-600">??</span>
                    <span className="text-orange-800">Top Course Performance</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-orange-600">Attendance rates by course (Top 3)</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(() => {
                          const filteredData = processedData.courseChartData
                            .filter(item => Number.isFinite(item.percentage))
                            .sort((a, b) => b.percentage - a.percentage)
                            .slice(0, 3);
                          return filteredData.length > 0 ? filteredData : [{ name: 'No Data', percentage: 0, present: 0, absent: 0, value: 0 }];
                        })()}
                        margin={{ top: 24, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          angle={0} 
                          textAnchor="middle" 
                          height={50}
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                          label={{ value: 'Courses', position: 'insideBottom', offset: 0 }}
                        />
                        <YAxis 
                          // Keep Y-axis capped at 100 and rely on chart margin to show top labels
                          domain={[0, 100]} 
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        />
                        <RechartsTooltip 
                          formatter={(value, name) => [
                            name === 'percentage' ? `${value}%` : value,
                            name === 'percentage' ? 'Attendance Rate' : name
                          ]}
                          labelFormatter={(label) => `Course: ${label}`}
                          contentStyle={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="percentage" 
                          fill="url(#coursePercentageGradient)" 
                          radius={[4, 4, 0, 0]}
                          label={{
                            position: 'top',
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#374151',
                            formatter: (value: number) => `${value}%`,
                            offset: 6
                          }}
                        />
                        <defs>
                          <linearGradient id="coursePercentageGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF7F50" />
                            <stop offset="100%" stopColor="#FFA07A" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cohort Performance Comparison */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-purple-600">??</span>
                    <span className="text-purple-800">Top Cohort Performance</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-purple-600">Attendance rates by cohort (Top 3)</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(() => {
                          const filteredData = processedData.cohortChartData
                            .filter(item => Number.isFinite(item.attendanceRate))
                            .sort((a, b) => b.attendanceRate - a.attendanceRate)
                            .slice(0, 3);
                          return filteredData.length > 0 ? filteredData : [{ name: 'No Data', attendanceRate: 0, present: 0, absent: 0, total: 0 }];
                        })()}
                        margin={{ top: 24, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          angle={0} 
                          textAnchor="middle" 
                          height={50}
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                          label={{ value: 'Cohorts', position: 'insideBottom', offset: 0 }}
                        />
                        <YAxis 
                          // Keep Y-axis capped at 100 and rely on chart margin to show top labels
                          domain={[0, 100]} 
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        />
                        <RechartsTooltip 
                          formatter={(value, name) => [
                            name === 'attendanceRate' ? `${value}%` : value,
                            name === 'attendanceRate' ? 'Attendance Rate' : 
                            name === 'present' ? 'Present Sessions' : 
                            name === 'absent' ? 'Absent Sessions' :
                            name === 'total' ? 'Total Sessions' : name
                          ]}
                          labelFormatter={(label) => `Cohort: ${label}`}
                          contentStyle={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="attendanceRate" 
                          fill="url(#cohortPerformanceGradient)" 
                          radius={[4, 4, 0, 0]}
                          label={{
                            position: 'top',
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#374151',
                            formatter: (value: number) => `${value}%`,
                            offset: 6
                          }}
                        />
                        <defs>
                          <linearGradient id="cohortPerformanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#BA55D3" />
                            <stop offset="100%" stopColor="#8B008B" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
 {/* Student Performance Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-purple-600">??</span>
                    <span className="text-purple-800">Student Attendance Distribution</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-purple-600">Attendance rate breakdown across all students</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(() => {
                          const validStudentData = processedData.studentChartData.filter(s => Number.isFinite(s.attendanceRate));
                          return [
                            { name: 'Excellent (90%+)', value: validStudentData.filter(s => s.attendanceRate >= 90).length },
                            { name: 'Good (75-89%)', value: validStudentData.filter(s => s.attendanceRate >= 75 && s.attendanceRate < 90).length },
                            { name: 'Fair (60-74%)', value: validStudentData.filter(s => s.attendanceRate >= 60 && s.attendanceRate < 75).length },
                            { name: 'Below 60%', value: validStudentData.filter(s => s.attendanceRate < 60).length }
                          ];
                        })()}
                        margin={{ top: 25, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          angle={0} 
                          textAnchor="middle" 
                          height={50} 
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          label={{ value: 'Performance Categories', position: 'insideBottom', offset: 0 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax) + 1]}
                        />
                        <RechartsTooltip 
                          formatter={(value) => [value, 'Students']}
                          contentStyle={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="url(#performanceGradient)" 
                          radius={[4, 4, 0, 0]}
                          label={{
                            position: 'top',
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#374151',
                            formatter: (value: number) => value.toString(),
                            offset: 5
                          }}
                        />
                        <defs>
                          <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9370DB" />
                            <stop offset="100%" stopColor="#8A2BE2" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            


      </div>
    </div>
  )
}
