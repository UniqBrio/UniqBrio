import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { NonInstructorLeaveRequest, NonInstructor as NonInstructorModel, NonInstructorLeavePolicy } from "@/lib/dashboard/staff/models"
import NonInstructorAttendanceModel from "@/models/dashboard/staff/NonInstructorAttendance"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function formatNiceDate(d: Date) {
  const day = d.getDate()
  const suffix = (n:number)=> {
    if (n>=11 && n<=13) return 'th'
    switch(n%10){case 1:return 'st';case 2:return 'nd';case 3:return 'rd';default:return 'th'}
  }
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${day}${suffix(day)} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

export async function GET() {
  try {
    await dbConnect("uniqbrio")
    const list = await NonInstructorLeaveRequest.find({}).sort({ createdAt: 1 }).lean()

    const policy = await loadPolicy()
    const allocs = policy?.allocations || { junior: 12, senior: 16, managers: 24 }
    const workingDaysArr = Array.isArray(policy?.workingDays) && policy!.workingDays.length ? policy!.workingDays : [1,2,3,4,5,6]
    const people = await NonInstructorModel.find({}).lean()
    const personMap: Record<string, any> = {}
    people.forEach(i => { personMap[i.id] = i; if (i.externalId) personMap[i.externalId] = i })

    const approvedById: Record<string, any[]> = {}
    const recomputeDayUpdates: Promise<any>[] = []
    for (const r of list) {
      if (r.startDate && r.endDate) {
        const newDays = countWorkingDaysInclusive(r.startDate, r.endDate, workingDaysArr)
        if (r.days !== newDays) {
          r.days = newDays
          recomputeDayUpdates.push(NonInstructorLeaveRequest.updateOne({ _id: r._id }, { $set: { days: newDays } }))
        }
      }
      const statusNorm = typeof r.status === 'string' ? r.status.toUpperCase() : r.status
      if (statusNorm === 'APPROVED' && !r.registeredDate) {
        const srcDate = r.approvedAt ? new Date(r.approvedAt) : ((r as any).createdAt ? new Date((r as any).createdAt) : new Date())
        r.registeredDate = formatNiceDate(srcDate)
        recomputeDayUpdates.push(NonInstructorLeaveRequest.updateOne({ _id: r._id }, { $set: { registeredDate: r.registeredDate } }))
      }
    }
    for (const r of list) {
      const status = typeof r.status === 'string' ? r.status.toUpperCase() : r.status
      if (status === 'APPROVED') {
        approvedById[r.instructorId] ||= []
        approvedById[r.instructorId].push(r)
      }
    }

    const updates: Promise<any>[] = []
    function derivePeriodKey(dateStr?: string) {
      if (!dateStr) return 'unknown'
      const [y,m] = dateStr.split('-').map(Number)
      if (!y || !m) return 'unknown'
      const qt = policy?.quotaType || 'Monthly Quota'
      if (qt === 'Yearly Quota') return `${y}`
      if (qt === 'Quarterly Quota') {
        const q = Math.floor((m-1)/3)+1
        return `${y}-Q${q}`
      }
      return `${y}-${String(m).padStart(2,'0')}`
    }
    for (const pid of Object.keys(approvedById)) {
      const rows = approvedById[pid]
      const jobLevelRaw = (personMap[pid]?.jobLevel || rows[0]?.jobLevel || '') as string
      let alloc: number | undefined = allocationFromPolicy(jobLevelRaw, policy)
      if (!alloc) continue
      const byPeriod: Record<string, any[]> = {}
      for (const r of rows) {
        const pk = derivePeriodKey(r.startDate)
        byPeriod[pk] ||= []
        byPeriod[pk].push(r)
      }
      for (const pk of Object.keys(byPeriod)) {
        const periodRows = byPeriod[pk].sort((a,b)=> (a.startDate||'').localeCompare(b.startDate||''))
        let running = 0
        for (const r of periodRows) {
          running += (r.days || 0)
          const remaining = Math.max(0, alloc - running)
          r.allocationTotal = alloc
          r.allocationUsed = running
          r.balance = remaining
          r.limitReached = remaining === 0
          updates.push(NonInstructorLeaveRequest.updateOne({ _id: r._id }, { $set: {
            allocationTotal: alloc,
            allocationUsed: running,
            balance: remaining,
            limitReached: remaining === 0,
            jobLevel: personMap[pid]?.jobLevel || r.jobLevel,
          }}))
        }
      }
    }
    if (recomputeDayUpdates.length) await Promise.allSettled(recomputeDayUpdates)
    if (updates.length) await Promise.allSettled(updates)
    return NextResponse.json({ ok: true, data: list })
  } catch (err: any) {
    console.error("/api/non-instructor-leave-requests GET error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch" }, { status: 500 })
  }
}

async function loadPolicy() {
  try {
    return await NonInstructorLeavePolicy.findOne({ key: 'default' }).lean()
  } catch { return null }
}

function allocationFromPolicy(jobLevelRaw: string | undefined, policy: any): number | undefined {
  if (!policy) return undefined
  const label = String(jobLevelRaw || '').trim()
  const allocs = policy.allocations || {}
  const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
  if (found) return Number(allocs[found])
  const v = label.toLowerCase()
  if (typeof allocs.junior === 'number' && v.includes('junior')) return allocs.junior
  if (typeof allocs.senior === 'number' && v.includes('senior')) return allocs.senior
  if (typeof allocs.managers === 'number' && v.includes('manager')) return allocs.managers
  return undefined
}

function countWorkingDaysInclusive(start: string, end: string, workingDays = [1,2,3,4,5,6]) {
  const toDate = (d: string) => { const [yy,mm,dd]=d.split('-').map(Number); return new Date(yy,(mm||1)-1,dd||1) }
  const ds = toDate(start); const de = toDate(end)
  if (de < ds) return 0
  let c=0; const cur = new Date(ds)
  while (cur <= de) { if (workingDays.includes(cur.getDay())) c++; cur.setDate(cur.getDate()+1) }
  return c
}

export async function POST(req: Request) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    if (!body.id) body.id = `l${Date.now()}`
    if (!body.status) body.status = 'DRAFT'
    else body.status = String(body.status).toUpperCase()

    const isDraft = body.status === 'DRAFT'
    if (!isDraft) {
      const required = ['instructorId','instructorName','leaveType','startDate','endDate','reason']
      const missing = required.filter(k => !body[k])
      if (missing.length) {
        return NextResponse.json({ ok: false, error: `Missing required fields for submission: ${missing.join(', ')}` }, { status: 400 })
      }
      try {
        const { startDate: start, endDate: end, instructorId } = body
        const person = await NonInstructorModel.findOne({ id: instructorId }).lean()
        const jobLevelRaw: string | undefined = (person as any)?.jobLevel || body.jobLevel || body.selectedJobLevel
        if (!body.jobLevel && jobLevelRaw) body.jobLevel = jobLevelRaw
        const policy = await loadPolicy()
        const allocation = allocationFromPolicy(jobLevelRaw, policy)
        const policyDoc = await loadPolicy()
        const workingDaysArr = Array.isArray(policyDoc?.workingDays) && policyDoc!.workingDays.length ? policyDoc!.workingDays : [1,2,3,4,5,6]
        if (allocation !== undefined && start && end) {
          const [y, m] = start.split('-')
          const quotaType = policyDoc?.quotaType || 'Monthly Quota'
          let regex: string
          if (quotaType === 'Yearly Quota') {
            regex = `^${y}`
          } else if (quotaType === 'Quarterly Quota') {
            const monthNum = Number(m)
            const q = Math.floor((monthNum - 1)/3) + 1
            const startMonth = (q-1)*3 + 1
            const endMonth = startMonth + 2
            const monthPattern = Array.from({length:3}, (_,i)=> String(startMonth+i).padStart(2,'0')).join('|')
            regex = `^${y}-(?:${monthPattern})`
          } else { // Monthly
            regex = `^${y}-${m}`
          }
          const existing = await NonInstructorLeaveRequest.find({ instructorId, startDate: { $regex: regex }, status: 'APPROVED' }).lean()
          const priorUsed = existing.reduce((sum, r:any) => sum + (r.days || countWorkingDaysInclusive(r.startDate, r.endDate, workingDaysArr)), 0)
          const thisDays = body.days || countWorkingDaysInclusive(start, end, workingDaysArr)
          const usedAfter = priorUsed + thisDays
          const remainingAfter = Math.max(0, allocation - usedAfter)
          body.days = thisDays
          body.balance = remainingAfter
          body.limitReached = remainingAfter === 0
          body.allocationTotal = allocation
          body.allocationUsed = usedAfter
          body.submittedAt = body.submittedAt || new Date().toISOString()
          if (body.status === 'APPROVED') {
            body.approvedAt = body.approvedAt || new Date().toISOString()
            if (!body.registeredDate) {
              body.registeredDate = formatNiceDate(new Date())
            }
          }
        }
      } catch (e) {
        console.warn('POST /api/non-instructor-leave-requests quota enrichment failed', e)
      }
    }

    const created = await NonInstructorLeaveRequest.create(body)
    return NextResponse.json({ ok: true, data: created })
  } catch (err: any) {
    console.error("/api/non-instructor-leave-requests POST error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to create" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const { id, updates } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })

    const existing = await NonInstructorLeaveRequest.findOne({ id }).lean()
    if (!existing) return NextResponse.json({ ok: false, error: 'Leave request not found' }, { status: 404 })

  const nextStatus = updates?.status || existing.status
  const promotingDraft = String(existing.status).toUpperCase() === 'DRAFT' && String(nextStatus).toUpperCase() !== 'DRAFT'
    if (updates?.status) updates.status = String(updates.status).toUpperCase()

    const shouldRecompute = promotingDraft || nextStatus === 'APPROVED' || updates?.startDate || updates?.endDate
    if (shouldRecompute) {
      const merged = { ...existing, ...updates, status: nextStatus }
      const required = ['instructorId','instructorName','leaveType','startDate','endDate','reason']
      if (promotingDraft || nextStatus === 'APPROVED') {
        const missing = required.filter(k => !merged[k])
        if (missing.length) {
          return NextResponse.json({ ok: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
        }
      }
      try {
        const person = await NonInstructorModel.findOne({ id: merged.instructorId }).lean()
        const jobLevelRaw: string | undefined = (person as any)?.jobLevel || merged.jobLevel || updates?.selectedJobLevel
        if (!updates.jobLevel && jobLevelRaw) updates.jobLevel = jobLevelRaw
        const policy = await loadPolicy()
        const allocation = allocationFromPolicy(jobLevelRaw, policy)
        const policyDoc = await loadPolicy()
        const workingDaysArr = Array.isArray(policyDoc?.workingDays) && policyDoc!.workingDays.length ? policyDoc!.workingDays : [1,2,3,4,5,6]
        if (allocation !== undefined && merged.startDate && merged.endDate) {
          const [y,m] = merged.startDate.split('-')
          const quotaType = policyDoc?.quotaType || 'Monthly Quota'
          let regex: string
          if (quotaType === 'Yearly Quota') {
            regex = `^${y}`
          } else if (quotaType === 'Quarterly Quota') {
            const monthNum = Number(m)
            const q = Math.floor((monthNum - 1)/3) + 1
            const startMonth = (q-1)*3 + 1
            const endMonth = startMonth + 2
            const monthPattern = Array.from({length:3}, (_,i)=> String(startMonth+i).padStart(2,'0')).join('|')
            regex = `^${y}-(?:${monthPattern})`
          } else { // Monthly
            regex = `^${y}-${m}`
          }
          const already = await NonInstructorLeaveRequest.find({ instructorId: merged.instructorId, startDate: { $regex: regex }, status: 'APPROVED', id: { $ne: existing.id } }).lean()
          const priorUsed = already.reduce((sum, r:any) => sum + (r.days || countWorkingDaysInclusive(r.startDate, r.endDate, workingDaysArr)), 0)
          const thisDays = merged.days || countWorkingDaysInclusive(merged.startDate, merged.endDate, workingDaysArr)
          const usedAfter = priorUsed + thisDays
          const remainingAfter = Math.max(0, allocation - usedAfter)
          updates.days = thisDays
          updates.balance = remainingAfter
          updates.limitReached = remainingAfter === 0
          updates.allocationTotal = allocation
          updates.allocationUsed = usedAfter
          if (promotingDraft) {
            updates.submittedAt = updates.submittedAt || existing.submittedAt || new Date().toISOString()
          }
          if (nextStatus === 'APPROVED') {
            updates.approvedAt = updates.approvedAt || existing.approvedAt || new Date().toISOString()
            if (!existing.registeredDate) {
              updates.registeredDate = formatNiceDate(new Date())
            }
          }
        }
      } catch (e) {
        console.warn('PUT /api/non-instructor-leave-requests recompute quota failed', e)
      }
    }

    const updated = await NonInstructorLeaveRequest.findOneAndUpdate({ id }, { $set: updates }, { new: true })
    return NextResponse.json({ ok: true, data: updated })
  } catch (err: any) {
    console.error("/api/non-instructor-leave-requests PUT error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })
    // Find the leave first to cascade delete planned attendance in the same date range
    const leave = await NonInstructorLeaveRequest.findOne({ id }).lean()
    if (leave) {
      try {
        await NonInstructorAttendanceModel.deleteMany({
          instructorId: leave.instructorId,
          date: { $gte: leave.startDate, $lte: leave.endDate },
          status: 'planned',
        })
      } catch (e) {
        console.warn('Failed to cascade delete non-instructor planned attendance for leave', id, e)
      }
    }
    await NonInstructorLeaveRequest.deleteOne({ id })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("/api/non-instructor-leave-requests DELETE error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to delete" }, { status: 500 })
  }
}

