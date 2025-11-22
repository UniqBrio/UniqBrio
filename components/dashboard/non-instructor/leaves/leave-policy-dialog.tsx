"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Switch } from "@/components/dashboard/ui/switch"
import { useLeave } from "@/contexts/dashboard/leave-context"
import { cn } from "@/lib/dashboard/staff/utils"

export type LeavePolicy = {
  quotaType: "Monthly Quota" | "Quarterly Quota" | "Yearly Quota"
  autoReject: boolean
  // Allow dynamic keys so new roles can be added and preserved
  allocations: Record<string, number>
  carryForward: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: LeavePolicy
  onSave: (policy: LeavePolicy, workingDays: number[]) => void
}

export default function LeavePolicyDialog({ open, onOpenChange, policy, onSave }: Props) {
  const [draft, setDraft] = useState<LeavePolicy>(policy)
  const { state, dispatch } = useLeave()
  const [workingDraft, setWorkingDraft] = useState<number[]>(state.workingDays)
  // Dynamic role list from instructors collection
  const jobLevelOptions = useMemo(() => {
    const raws = (state.instructors || [])
      .map(i => (i as any)?.jobLevel)
      .filter(Boolean) as string[]
    const uniq = Array.from(new Set(raws.map(s => String(s))))
    // Fallback to common labels if nothing in DB yet
    if (uniq.length === 0) return ["Junior Staff", "Senior Staff", "Manager"]
    return uniq
  }, [state.instructors])

  // Map a label to one of policy allocation keys
  const mapLevelKey = (level?: string): keyof LeavePolicy['allocations'] | undefined => {
    if (!level) return undefined
    const v = level.toLowerCase()
    if (v.includes('junior')) return 'junior'
    if (v.includes('senior')) return 'senior'
    if (v.includes('manager')) return 'managers'
    return undefined
  }

  // Currently selected level for editing
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  useEffect(() => {
    if (open) {
      // Clean up any existing negative values when opening the dialog
      const base = { ...(policy.allocations || {}) }
      // Ensure known buckets are non-negative if present
      if (typeof base.junior === 'number') base.junior = Math.max(0, Number(base.junior))
      if (typeof base.senior === 'number') base.senior = Math.max(0, Number(base.senior))
      if (typeof (base as any).managers === 'number') (base as any).managers = Math.max(0, Number((base as any).managers))
      const cleanedPolicy = { ...policy, allocations: base }
      setDraft(cleanedPolicy)
      setWorkingDraft(state.workingDays)
      // Initialize selectedLevel to the first detectable standard level present in options
      const preferred = ["Junior", "Senior", "Manager"]
      const found = jobLevelOptions.find(o => preferred.some(p => o.toLowerCase().includes(p.toLowerCase()))) || jobLevelOptions[0]
      setSelectedLevel(found || "")
    }
  }, [open, policy, state.workingDays, jobLevelOptions])

  // Ensure the current selectedLevel exists in draft.allocations even if the user doesn't type
  useEffect(() => {
    const label = (selectedLevel || '').trim()
    if (!label) return
    const allocs: any = (draft as any).allocations || {}
    const hasExact = Object.prototype.hasOwnProperty.call(allocs, label)
    if (!hasExact) {
      // Determine current visible value: try bucket, else 0
      const key = mapLevelKey(label)
      const initial = key ? (allocs[key] ?? 0) : 0
      setDraft((p) => ({ ...p, allocations: { ...(p as any).allocations, [label]: Number(initial) } as any }))
    }
  }, [selectedLevel])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leave Policy Configuration</DialogTitle>
          <p className="text-sm text-muted-foreground">Configure advanced leave policies and rules</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quota Type</Label>
            <Select
              value={draft.quotaType}
              onValueChange={(v) => setDraft((p) => ({ ...p, quotaType: v as LeavePolicy["quotaType"] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly Quota">Monthly Quota</SelectItem>
                <SelectItem value="Quarterly Quota">Quarterly Quota</SelectItem>
                <SelectItem value="Yearly Quota">Yearly Quota</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 opacity-60 cursor-not-allowed select-none" title="Coming soon">
            <Label className="flex items-center gap-1">Auto-Reject Settings <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /><span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600"></span></Label>
            <div className="flex items-center gap-3 rounded-md border p-2 bg-muted/40">
              <Switch disabled checked={true} className="opacity-50" />
              <span className="text-sm">Automatic rejection rules coming soon</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-2">
          <h3 className="font-medium">Role-Based Allocations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1 md:col-span-2">
              <Label>Select Job Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose level" />
                </SelectTrigger>
                <SelectContent>
                  {jobLevelOptions.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Allocation</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={(() => {
                  // dynamic allocations map: if exact label exists, use it; else use default bucket
                  const direct: any = (draft as any).allocations?.[selectedLevel as any]
                  if (typeof direct === 'number') return direct
                  const key = mapLevelKey(selectedLevel)
                  if (key) return (draft as any).allocations?.[key] ?? 0
                  return 0
                })()}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value || 0))
                  // Persist directly under allocations[selectedLevel]
                  setDraft((p) => ({
                    ...p,
                    allocations: { ...(p as any).allocations, [selectedLevel]: value } as any
                  }))
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                    e.preventDefault()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">This value will be saved under allocations["{selectedLevel || '?'}"].</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-2 opacity-60 cursor-not-allowed select-none" title="Coming soon">
          <h3 className="font-medium flex items-center gap-1">Carry-Forward Settings <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block" /><span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600"></span></h3>
          <div className="flex items-center gap-3 rounded-md border p-2 bg-muted/40">
            <Switch disabled checked={true} className="opacity-50" />
            <span className="text-sm">Carry-forward configuration coming soon</span>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h3 className="font-medium">Working Days Configuration</h3>
          <p className="text-xs text-muted-foreground">Select which weekdays count as working days for leave calculations (applies globally).</p>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, idx) => {
              const active = workingDraft.includes(idx)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setWorkingDraft(prev => prev.includes(idx) ? prev.filter(d=>d!==idx) : [...prev, idx].sort())}
                  className={cn(
                    'h-9 rounded-md border text-xs flex items-center justify-center transition',
                    active ? 'bg-purple-600 text-white border-purple-600' : 'bg-background text-muted-foreground hover:border-purple-400'
                  )}
                >{label}</button>
              )
            })}
          </div>
        </div>

        {/* Carry-forward tester removed (feature deferred) */}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
            // First update context so rest of app reflects immediately
            dispatch({ type: 'SET_WORKING_DAYS', payload: workingDraft })
            // Pass workingDays explicitly so parent persists correct array without relying on asynchronous state
            onSave(draft, workingDraft)
          }}>Update Policies</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
