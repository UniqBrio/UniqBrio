"use client"

// Embed the full Leave Management Hub inside the Instructor > Attendance tab.
// We keep the LeaveProvider so state matches the standalone Leave page.
import { LeaveProvider } from "@/contexts/dashboard/leave-context"
import LeaveManagement from "@/components/dashboard/instructor/leaves/leave-management"

export default function LeaveAttendance() {
  return (
    <LeaveProvider>
      <LeaveManagement />
    </LeaveProvider>
  )
}
