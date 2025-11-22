import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { NonInstructorLeaveDraft, NonInstructorLeaveRequest, NonInstructor, NonInstructorLeavePolicy } from "@/lib/dashboard/staff/models"

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

async function loadPolicy() {
  try {
    return await NonInstructorLeavePolicy.findOne({ key: 'default' }).lean()
  } catch {
    return null
  }
}

function allocationFromPolicy(jobLevelRaw: string | undefined, policy: any): number | undefined {
  if (!policy) return undefined
  const level = (jobLevelRaw || '').toLowerCase()
  const allocs = policy.allocations || {}
  if (level.includes('junior')) return allocs.junior
  if (level.includes('senior')) return allocs.senior
  if (level.includes('manager')) return allocs.managers
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

// POST - Convert NI draft to NI leave request (submit/approve)
export async function POST(req: Request) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const { draftId, status = 'PENDING' } = body
    
    if (!draftId) {
      return NextResponse.json({ ok: false, error: "Draft ID is required" }, { status: 400 })
    }

    // Find the draft
    const draft = await NonInstructorLeaveDraft.findOne({ id: draftId }).lean()
    if (!draft) {
      return NextResponse.json({ ok: false, error: 'Draft not found' }, { status: 404 })
    }

    // Validate required fields for submission
    const required = ['instructorId', 'instructorName', 'leaveType', 'startDate', 'endDate', 'reason']
    const missing = required.filter(k => !(draft as any)[k])
    if (missing.length) {
      return NextResponse.json({ 
        ok: false, 
        error: `Missing required fields for submission: ${missing.join(', ')}` 
      }, { status: 400 })
    }

    // Generate new leave request ID
    const leaveRequestId = `l${Date.now()}`
    
    // Create leave request data from draft
    const leaveRequestData: any = {
      id: leaveRequestId,
      instructorId: (draft as any).instructorId,
      instructorName: (draft as any).instructorName,
      status: String(status).toUpperCase(),
      leaveType: (draft as any).leaveType,
      startDate: (draft as any).startDate,
      endDate: (draft as any).endDate,
      reason: (draft as any).reason,
      jobLevel: (draft as any).jobLevel,
      comments: (draft as any).comments,
      substituteId: (draft as any).substituteId,
      substituteConfirmed: (draft as any).substituteConfirmed,
      documents: (draft as any).documents || [],
      carriedOver: (draft as any).carriedOver,
      title: (draft as any).title,
      submittedAt: new Date().toISOString()
    }

    // If approving directly, add approval data
    if (String(status).toUpperCase() === 'APPROVED') {
      ;(leaveRequestData as any).approvedAt = new Date().toISOString()
      ;(leaveRequestData as any).registeredDate = formatNiceDate(new Date())
    }

    try {
      // Get non-instructor and policy for quota calculations
      const inst = await NonInstructor.findOne({ $or: [ { externalId: (draft as any).instructorId }, { _id: (draft as any).instructorId }, { id: (draft as any).instructorId } ] }).lean()
      const jobLevelRaw = (inst as any)?.jobLevel || (draft as any).jobLevel
      if (jobLevelRaw) (leaveRequestData as any).jobLevel = jobLevelRaw

      const policy = await loadPolicy()
      const allocation = allocationFromPolicy(jobLevelRaw, policy)
      const workingDaysArr = Array.isArray(policy?.workingDays) && policy!.workingDays.length ? policy!.workingDays : [1,2,3,4,5,6]

      if (allocation !== undefined && (draft as any).startDate && (draft as any).endDate) {
        const [y, m] = String((draft as any).startDate).split('-')
        const quotaType = policy?.quotaType || 'Monthly Quota'
        let regex: string
        
        if (quotaType === 'Yearly Quota') {
          regex = `^${y}`
        } else if (quotaType === 'Quarterly Quota') {
          const monthNum = Number(m)
          const q = Math.floor((monthNum - 1)/3) + 1
          const startMonth = (q-1)*3 + 1
          const monthPattern = Array.from({length:3}, (_,i)=> String(startMonth+i).padStart(2,'0')).join('|')
          regex = `^${y}-(?:${monthPattern})`
        } else { // Monthly
          regex = `^${y}-${m}`
        }

        // Calculate existing approved leave for the period
        const existing = await NonInstructorLeaveRequest.find({ 
          instructorId: (draft as any).instructorId, 
          startDate: { $regex: regex }, 
          status: 'APPROVED' 
        }).lean()
        
        const priorUsed = existing.reduce((sum, r: any) => 
          sum + (r.days || countWorkingDaysInclusive(r.startDate, r.endDate, workingDaysArr)), 0)
        
        const thisDays = countWorkingDaysInclusive((draft as any).startDate, (draft as any).endDate, workingDaysArr)
        const usedAfter = priorUsed + thisDays
        const remainingAfter = Math.max(0, allocation - usedAfter)

        ;(leaveRequestData as any).days = thisDays
        ;(leaveRequestData as any).balance = remainingAfter
        ;(leaveRequestData as any).limitReached = remainingAfter === 0
        ;(leaveRequestData as any).allocationTotal = allocation
        ;(leaveRequestData as any).allocationUsed = usedAfter
      }
    } catch (e) {
      console.warn('NI draft conversion quota enrichment failed', e)
    }

    // Create the NI leave request
    const leaveRequest = await NonInstructorLeaveRequest.create(leaveRequestData)
    
    // Delete the draft after successful conversion
    await NonInstructorLeaveDraft.deleteOne({ id: draftId })

    return NextResponse.json({ ok: true, data: leaveRequest })
  } catch (err: any) {
    console.error("/api/non-instructor-leave-drafts/convert POST error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to convert NI draft" }, { status: 500 })
  }
}
