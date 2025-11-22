"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/dashboard/ui/chart"

// Lightweight shape we need from attendance records
type AttendanceItem = {
  date?: string
  status?: string
}

function dayKeyFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function normalizeRecordDayKey(value: string | undefined): string | null {
  if (!value) return null
  // If already in YYYY-MM-DD, use the first 10 chars
  const m = value.match(/^\d{4}-\d{2}-\d{2}/)
  if (m) return m[0]
  // Fallback to Date parsing (local time)
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return dayKeyFromDate(d)
}

export function AttendanceAnalytics({ attendanceData }: { attendanceData: AttendanceItem[] }) {
  // Build last 7 days (oldest -> newest)
  const last7 = React.useMemo(() => {
    const days: { key: string; label: string }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = dayKeyFromDate(d)
      const label = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
      days.push({ key, label })
    }
    return days
  }, [])

  const chartData = React.useMemo(() => {
    // Count present and absent by dayKey
    const present = new Map<string, number>()
    const absent = new Map<string, number>()
    for (const rec of attendanceData || []) {
      const k = normalizeRecordDayKey(rec.date)
      if (!k) continue
      const s = (rec.status || "").toString().trim().toLowerCase()
      if (s === "present") {
        present.set(k, (present.get(k) || 0) + 1)
      } else if (s === "absent" || s === "planned") {
        // Include both unplanned ('absent') and 'planned' leaves as absent in chart
        absent.set(k, (absent.get(k) || 0) + 1)
      }
    }
    return last7.map(({ key, label }) => ({
      day: label,
      present: present.get(key) || 0,
      absent: absent.get(key) || 0,
    }))
  }, [attendanceData, last7])

  // Only render value labels for non-zero bars
  const ValueLabel: React.FC<any> = (props) => {
    const { value, x, y, width } = props
    if (!value) return null
    const cx = (x || 0) + (width || 0) / 2
    const cy = (y || 0) - 4
    return (
      <text x={cx} y={cy} textAnchor="middle" fontSize={12} fill="#111827">
        {value}
      </text>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Present chart */}
        <div className="space-y-2">
          <div className="text-sm text-emerald-700 font-medium">Past 7 days (Present count)</div>
          <ChartContainer
            className="w-full h-[260px]"
            config={{ present: { label: "Present", color: "#22c55e" } }}
          >
            <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 24 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                label={{ value: "Date", position: "insideBottom", offset: -10 }}
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tickLine={false}
                axisLine={false}
                label={{ value: "Count", angle: -90, position: "insideLeft", offset: 2 }}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="present" />} />
              <Bar dataKey="present" fill="var(--color-present)" radius={6}>
                <LabelList dataKey="present" position="top" content={<ValueLabel />} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Absent chart */}
        <div className="space-y-2">
          <div className="text-sm text-rose-700 font-medium">Past 7 days (Absent count)</div>
          <ChartContainer
            className="w-full h-[260px]"
            config={{ absent: { label: "Absent", color: "#ef4444" } }}
          >
            <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 24 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                label={{ value: "Date", position: "insideBottom", offset: -10 }}
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tickLine={false}
                axisLine={false}
                label={{ value: "Count", angle: -90, position: "insideLeft", offset: 2 }}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="absent" />} />
              <Bar dataKey="absent" fill="var(--color-absent)" radius={6}>
                <LabelList dataKey="absent" position="top" content={<ValueLabel />} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
