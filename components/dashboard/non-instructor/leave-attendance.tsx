"use client"

// Embed the full Leave Management Hub inside the Instructor > Attendance tab.
// We keep the LeaveProvider so state matches the standalone Leave page.
import { LeaveProvider } from "@/contexts/dashboard/leave-context"
// Use the Non-Instructor specific Leave Management which has no course/cohort columns
import LeaveManagement from "@/components/dashboard/non-instructor/leaves/leave-management"
import { useEffect, useState } from "react"

export default function LeaveAttendance() {
  // Set scope to non-instructor for shared leave API helpers while this page is mounted
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try { (window as any).__LEAVE_SCOPE = 'non-instructor' } catch {}
    setReady(true)
    return () => { try { delete (window as any).__LEAVE_SCOPE } catch {} }
  }, [])
  if (!ready) return null
  return (
    <LeaveProvider>
      <LeaveManagement />
    </LeaveProvider>
  )
}
