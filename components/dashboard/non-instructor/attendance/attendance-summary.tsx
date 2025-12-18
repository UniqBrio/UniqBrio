'use client';

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"
import { useMemo } from "react"
import { parseToYMDFlexible, toYMDLocal } from "@/lib/dashboard/staff/date-utils"

interface AttendanceSummaryProps {
  attendanceData?: Array<{
    id: number;
    instructorId: string;
    instructorName: string;
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
    // Normalize a JS Date to yyyy-mm-dd local string
    const todayYMD = toYMDLocal(new Date())

    const isSameYMD = (input: string) => {
      const y = parseToYMDFlexible(input)
      return y === todayYMD
    }

  const todayRecords = attendanceData.filter(r => isSameYMD(r.date))
  const todayPresent = todayRecords.filter(r => (r.status || '').toString().trim().toLowerCase() === 'present').length
  // Count both unplanned ('absent') and planned ('planned') leaves as absent for summary
  const todayAbsent = todayRecords.filter(r => {
    const s = (r.status || '').toString().trim().toLowerCase()
    return s === 'absent' || s === 'planned'
  }).length

    return { todayPresent, todayAbsent }
  }, [attendanceData])

  return (
    <div className="space-y-4">
      {/* Main Metrics Row: Today Present / Today Absent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today Present */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">Today Present</p>
                <h3 className="text-2xl font-bold text-emerald-900 mt-1">
                  {loading ? (
                    <span className="text-base font-normal text-emerald-600">Loading...</span>
                  ) : (
                    summaryMetrics.todayPresent
                  )}
                </h3>
                <p className="text-xs text-emerald-700 mt-1">Count from today's records</p>
              </div>
              <div className="h-10 w-10 bg-emerald-200 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today Absent */}
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-800">Today Absent</p>
                <h3 className="text-2xl font-bold text-rose-900 mt-1">
                  {loading ? (
                    <span className="text-base font-normal text-rose-600">Loading...</span>
                  ) : (
                    summaryMetrics.todayAbsent
                  )}
                </h3>
                <p className="text-xs text-rose-700 mt-1">Count from today's records</p>
              </div>
              <div className="h-10 w-10 bg-rose-200 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
