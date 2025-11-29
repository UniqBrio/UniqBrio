import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { InstructorLeaveDraft, LeaveRequest, Instructor, LeavePolicy } from "@/lib/dashboard/staff/models"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

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

async function loadPolicy(tenantId: string) {
  try {
    return await LeavePolicy.findOne({ key: 'default', tenantId }).lean()
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

// POST - Convert draft to leave request (submit/approve)
export async function POST(req: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await req.json()
        const { draftId, status = 'PENDING' } = body
        
        if (!draftId) {
          return NextResponse.json({ ok: false, error: "Draft ID is required" }, { status: 400 })
        }

        // Find the draft
        const draft = await InstructorLeaveDraft.findOne({ id: draftId, tenantId: session.tenantId }).lean()
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

        // Check for duplicate leave request (same instructor, same date range, same reason)
        const duplicateCheck = await LeaveRequest.findOne({
          instructorId: draft.instructorId,
          startDate: draft.startDate,
          endDate: draft.endDate,
          reason: draft.reason,
          tenantId: session.tenantId,
        }).lean()
        if (duplicateCheck) {
          return NextResponse.json({ 
            ok: false, 
            error: 'A leave request with the same dates and reason already exists for this instructor.' 
          }, { status: 409 })
        }

        // Validate that the instructor exists in the database
        const instructorExists = await Instructor.findOne({ 
          $or: [
            { id: draft.instructorId, tenantId: session.tenantId },
            { externalId: draft.instructorId, tenantId: session.tenantId }
          ],
          $and: [
            {
              $or: [
                { isDeleted: { $exists: false } },
                { isDeleted: false }
              ]
            }
          ]
        }).lean()
        if (!instructorExists) {
          return NextResponse.json({ 
            ok: false, 
            error: 'The selected instructor does not exist or has been deleted. Please select a valid instructor.' 
          }, { status: 400 })
        }

        // Generate new leave request ID
        const leaveRequestId = `l${Date.now()}`
        
        // Create leave request data from draft
        const leaveRequestData: any = {
          id: leaveRequestId,
          instructorId: draft.instructorId,
          instructorName: draft.instructorName,
          status: status.toUpperCase(),
          leaveType: draft.leaveType,
          startDate: draft.startDate,
          endDate: draft.endDate,
          reason: draft.reason,
          jobLevel: draft.jobLevel,
          comments: draft.comments,
          substituteId: draft.substituteId,
          substituteConfirmed: draft.substituteConfirmed,
          documents: draft.documents || [],
          carriedOver: draft.carriedOver,
          title: draft.title,
          submittedAt: new Date().toISOString(),
          tenantId: session.tenantId
        }

        // If approving directly, add approval data
        if (status.toUpperCase() === 'APPROVED') {
          leaveRequestData.approvedAt = new Date().toISOString()
          leaveRequestData.registeredDate = formatNiceDate(new Date())
        }

        try {
          // Get instructor and policy for quota calculations
          const inst = await Instructor.findOne({ id: draft.instructorId, tenantId: session.tenantId }).lean()
          const jobLevelRaw = inst?.jobLevel || draft.jobLevel
          if (jobLevelRaw) leaveRequestData.jobLevel = jobLevelRaw
          // Denormalize course/cohort from instructor if available
          if ((inst as any)?.courseAssigned) leaveRequestData.courseName = (inst as any).courseAssigned
          if ((inst as any)?.cohortName) leaveRequestData.cohortName = (inst as any).cohortName

          const policy = await loadPolicy(session.tenantId)
          const allocation = allocationFromPolicy(jobLevelRaw, policy)
          const workingDaysArr = Array.isArray(policy?.workingDays) && policy!.workingDays.length ? policy!.workingDays : [1,2,3,4,5,6]

          if (allocation !== undefined && draft.startDate && draft.endDate) {
            const [y, m] = draft.startDate.split('-')
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
            const existing = await LeaveRequest.find({ 
              instructorId: draft.instructorId, 
              startDate: { $regex: regex }, 
              status: 'APPROVED',
              tenantId: session.tenantId
            }).lean()
            
            const priorUsed = existing.reduce((sum, r: any) => 
              sum + (r.days || countWorkingDaysInclusive(r.startDate, r.endDate, workingDaysArr)), 0)
            
            const thisDays = countWorkingDaysInclusive(draft.startDate, draft.endDate, workingDaysArr)
            const usedAfter = priorUsed + thisDays
            const remainingAfter = Math.max(0, allocation - usedAfter)

            leaveRequestData.days = thisDays
            leaveRequestData.balance = remainingAfter
            leaveRequestData.limitReached = remainingAfter === 0
            leaveRequestData.allocationTotal = allocation
            leaveRequestData.allocationUsed = usedAfter
          }
        } catch (e) {
          console.warn('Draft conversion quota enrichment failed', e)
        }

        // Create the leave request
        const leaveRequest = await LeaveRequest.create(leaveRequestData)
        
        // Delete the draft after successful conversion
        await InstructorLeaveDraft.deleteOne({ id: draftId, tenantId: session.tenantId })

        return NextResponse.json({ ok: true, data: leaveRequest })
      } catch (err: any) {
        console.error("/api/drafts/convert POST error", err)
        return NextResponse.json({ ok: false, error: err?.message || "Failed to convert draft" }, { status: 500 })
      }
    }
  );
}
