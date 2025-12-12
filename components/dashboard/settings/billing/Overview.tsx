import React, { useMemo, useState } from "react"
import { IndianRupee, FileText, CheckCircle2 } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Badge } from "./Badge"
import { PLANS } from "./plans"
import { BillingCycle, PlanKey } from "./types"

export function Overview() {
  const [cycle, setCycle] = useState<BillingCycle>("yearly")
  const [currentPlan] = useState<PlanKey>("grow")
  const { primaryColor } = useCustomColors()

  const nextRenewal = useMemo(() => {
    const d = new Date()
    if (cycle === "monthly") d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    return d.toLocaleDateString()
  }, [cycle])

  return (
    <div className="border rounded-lg p-5 shadow-md max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge color={primaryColor}>{PLANS[currentPlan].name}</Badge>
          <Badge color="#fd9c2d">{cycle === "monthly" ? "Monthly" : "Yearly"}</Badge>
        </div>
        <span className="flex items-center gap-1 text-lg font-semibold"><IndianRupee size={18} />{(cycle === "monthly" ? PLANS[currentPlan].monthly : PLANS[currentPlan].yearly).toLocaleString()} <span className="text-sm font-normal text-gray-600">/ {cycle === "monthly" ? "month" : "year"}</span></span>
      </div>
      <p className="text-sm text-gray-600 mb-3">Renews on {nextRenewal}</p>
      <p className="text-sm text-gray-600 mb-4">{currentPlan === "free" ? PLANS.free.studentLimit : "Unlimited students"}</p>

      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-2 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9]">
          Upgrade Plan
        </button>
        <button className="px-3 py-2 bg-gray-100 rounded-lg flex items-center gap-2 hover:bg-gray-200">
          <FileText size={16} /> View Invoices
        </button>
      </div>

      <div className="mt-4 border rounded-lg p-5 shadow-sm">
        <div className="font-medium mb-3">What you get in Grow</div>
        <ul className="text-sm space-y-2">
          {PLANS.grow.features.map((f) => (
            <li key={f} className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={16} /> {f}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
