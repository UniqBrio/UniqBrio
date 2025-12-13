"use client"

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { UserCheck, UserX, Clock, Calendar, TrendingUp, TrendingDown, Users, BookOpen, AlertTriangle, Award } from "lucide-react"
import { useMemo } from "react"

interface AttendanceSummaryProps {
  attendanceData?: Array<{
    id: string | number;
    studentId: string;
    studentName: string;
    cohortId?: string;
    cohortName?: string;
    courseId?: string;
    courseName?: string;
    date: string;
    status: 'present' | 'absent' | string;
    notes?: string;
  }>;
  loading?: boolean;
}

export function AttendanceSummary({ attendanceData = [], loading = false }: AttendanceSummaryProps) {
  // Process attendance data for summary metrics
  const summaryMetrics = useMemo(() => {
    // Show placeholder values while loading
    if (loading || !attendanceData || attendanceData.length === 0) {
      return {
        todayPresent: loading ? null : 0,
        todayAbsent: loading ? null : 0,
        totalStudents: loading ? null : 0,
        presentPercentage: loading ? null : 0,
        absentCount: loading ? null : 0,
        attendanceRate: loading ? null : 0,
        trendsUp: true,
        activeCourses: loading ? null : 0,
        criticalStudents: loading ? null : 0,
        perfectAttendance: loading ? null : 0
      };
    }

    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceData.filter(record => record.date === today);
    
    // Calculate metrics
    const totalRecords = attendanceData.length;
    const presentRecords = attendanceData.filter(r => r.status === 'present').length;
    const absentRecords = attendanceData.filter(r => r.status === 'absent').length;
    
    // Today's metrics
    const todayPresent = todayRecords.filter(r => r.status === 'present').length;
    const todayAbsent = todayRecords.filter(r => r.status === 'absent').length;
    const todayTotal = todayRecords.length;
    
    // Overall metrics
    const presentPercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    const uniqueStudents = new Set(attendanceData.filter(r => r.studentId).map(r => r.studentId)).size;
    const uniqueCourses = new Set(attendanceData.filter(r => r.courseId).map(r => r.courseId)).size;
    
    // Student performance analysis
    const studentStats = attendanceData.reduce((acc, record) => {
      const studentId = record.studentId;
      if (!acc[studentId]) {
        acc[studentId] = { present: 0, total: 0 };
      }
      if (record.status === 'present') acc[studentId].present++;
      acc[studentId].total++;
      return acc;
    }, {} as Record<string, { present: number; total: number }>);
    
    const criticalStudents = Object.values(studentStats).filter(
      stats => stats.total > 0 && (stats.present / stats.total) < 0.6
    ).length;
    
    const perfectAttendance = Object.values(studentStats).filter(
      stats => stats.total > 0 && (stats.present / stats.total) === 1.0
    ).length;

    return {
      todayPresent,
      todayAbsent,
      totalStudents: uniqueStudents,
      presentPercentage,
      absentCount: absentRecords,
      attendanceRate: presentPercentage,
      trendsUp: presentPercentage >= 80, // Assume trending up if above 80%
      activeCourses: uniqueCourses,
      criticalStudents,
      perfectAttendance
    };
  }, [attendanceData, loading]);

  return (
    <div className="space-y-4">
      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Primary Attendance Metrics */}
      

      {/* Total Students */}  
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Students</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">
                {loading ? (
                  <span className="inline-block animate-pulse bg-blue-300 rounded h-8 w-12"></span>
                ) : (
                  summaryMetrics.totalStudents !== null ? summaryMetrics.totalStudents : '0'
                )}
              </h3>
              <p className="text-xs text-blue-700 mt-1">With attendance records</p>
            </div>
            <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      

      {/* Active Courses */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Active Courses</p>
              <h3 className="text-2xl font-bold text-purple-900 mt-1">
                {loading ? (
                  <span className="inline-block animate-pulse bg-purple-300 rounded h-8 w-12"></span>
                ) : (
                  summaryMetrics.activeCourses !== null ? summaryMetrics.activeCourses : '0'
                )}
              </h3>
              <p className="text-xs text-purple-700 mt-1">With attendance data</p>
            </div>
            <div className="h-10 w-10 bg-purple-200 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-purple-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students below 60% attendance */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Students Below 60% Attendance</p>
              <h3 className="text-2xl font-bold text-orange-900 mt-1">
                {loading ? (
                  <span className="inline-block animate-pulse bg-orange-300 rounded h-8 w-12"></span>
                ) : (
                  summaryMetrics.criticalStudents !== null ? summaryMetrics.criticalStudents : '0'
                )}
              </h3>
              <p className="text-xs text-orange-700 mt-1">
                {loading ? (
                  <span className="inline-block animate-pulse bg-orange-300 rounded h-3 w-24"></span>
                ) : (
                  summaryMetrics.criticalStudents !== null 
                    ? (summaryMetrics.criticalStudents > 0 ? 'Need intervention' : 'All students good')
                    : 'No data available'
                )}
              </p>
            </div>
            <div className="h-10 w-10 bg-orange-200 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-700" />
            </div>
          </div>
        </CardContent>
      </Card>

     
      </div>
    </div>
  )
}
