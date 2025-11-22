"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Progress } from "@/components/dashboard/ui/progress"
import { useLeave } from "@/contexts/dashboard/leave-context"

export default function LeaveBalance() {
  const { state } = useLeave()
  const me = state.currentUser
  const balance = me ? state.leaveBalances[me.id] : undefined
  if (!balance) return null
  const categories = [
    { key: "casual", label: "Casual" },
    { key: "sick", label: "Sick" },
    { key: "emergency", label: "Emergency" },
    { key: "planned", label: "Planned" },
  ] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Assigned Leaves</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((c) => {
          const total = balance[c.key]
          const used = state.leaveRequests
            .filter((r) => r.instructorId === me!.id && r.status === "APPROVED")
            .filter((r) => r.leaveType?.toLowerCase().includes(c.label.toLowerCase()))
            .reduce((sum, r) => sum + (r.days ?? 0), 0)
          const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100))
          return (
            <div key={c.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{c.label}</span>
                <span>
                  {used} / {total}
                </span>
              </div>
              <Progress value={pct} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
