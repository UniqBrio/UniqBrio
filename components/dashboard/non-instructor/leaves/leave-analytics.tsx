"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { useLeave } from "@/contexts/dashboard/leave-context"
import { format, parseISO } from "date-fns"

export default function LeaveAnalytics() {
  const { state } = useLeave()
  const byMonth = new Map<string, number>()
  state.leaveRequests
    .filter((r) => r.status === "APPROVED" && r.startDate && r.days)
    .forEach((r) => {
      const m = format(parseISO(r.startDate!), "yyyy-MM")
      byMonth.set(m, (byMonth.get(m) ?? 0) + r.days!)
    })

  const items = Array.from(byMonth.entries()).sort(([a], [b]) => (a < b ? -1 : 1))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No approved leave yet.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {items.map(([m, d]) => (
              <li key={m} className="flex justify-between">
                <span>{m}</span>
                <span>{d} days</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
