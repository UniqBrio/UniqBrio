import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { NonInstructor, NonInstructorLeaveRequest, NonInstructorLeaveDraft, NonInstructorLeavePolicy } from "@/lib/dashboard/staff/models"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Fixed collection name mapping for non-instructor leave management
export async function GET() {
  try {
    await dbConnect("uniqbrio")
    const [nonInstructorList, leaveRequests, leaveDrafts, leavePolicy] = await Promise.all([
      NonInstructor.find({}, {
        id: 1,
        name: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        externalId: 1,
        role: 1,
        department: 1,
        jobLevel: 1,
        employmentType: 1,
        roleType: 1,
        contractType: 1,
      }).lean(),
      NonInstructorLeaveRequest.find({}).sort({ createdAt: -1 }).lean(),
      NonInstructorLeaveDraft.find({}).sort({ createdAt: -1 }).lean(),
      NonInstructorLeavePolicy.findOne({ key: 'default' }).lean()
    ])

    const nonInstructors = nonInstructorList.map((raw: any) => {
      const doc: any = { ...raw }
      const identifier = doc.externalId || doc.nonInstructorId || doc.id || doc.code || doc.employeeId || ""
      if (!doc.id && identifier) doc.id = identifier

      if ((!doc.firstName && !doc.lastName) && typeof doc.name === 'string') {
        const parts = doc.name.trim().split(/\s+/)
        if (parts.length === 1) {
          doc.firstName = parts[0]
        } else if (parts.length === 2) {
          ;[doc.firstName, doc.lastName] = parts
        } else if (parts.length >= 3) {
          doc.firstName = parts[0]
          doc.lastName = parts[parts.length - 1]
          doc.middleName = parts.slice(1, -1).join(' ')
        }
      }

      const first = (doc.firstName || '').trim()
      const middle = (doc.middleName || '').trim()
      const last = (doc.lastName || '').trim()
      const fullName = [first, middle, last].filter(Boolean).join(' ')

      const code = doc.externalId || doc.nonInstructorId || doc.id
      const name = fullName || doc.name || code
      return {
        id: doc.id,
        nonInstructorId: doc.nonInstructorId || doc.id,
        externalId: doc.externalId,
        name,
        fullName: name,
        displayName: name,
        displayCode: code,
        firstName: doc.firstName || undefined,
        middleName: doc.middleName || undefined,
        lastName: doc.lastName || undefined,
        role: doc.role,
        department: doc.department,
        jobLevel: doc.jobLevel,
        employmentType: doc.employmentType,
        contractType: doc.contractType || doc.employmentType || doc.contract_type || doc.employment_type,
        roleType: doc.roleType,
      }
    })

    const nonInstructorMap = new Map()
    nonInstructors.forEach((inst: any) => {
      nonInstructorMap.set(inst.id, inst)
      if ((inst as any).nonInstructorId && (inst as any).nonInstructorId !== inst.id) {
        nonInstructorMap.set((inst as any).nonInstructorId, inst)
      }
      if (inst.externalId) {
        nonInstructorMap.set(inst.externalId, inst)
      }
    })

    const processedLeaveRequests = leaveRequests.map((request: any) => {
      const person = nonInstructorMap.get(request.instructorId)
      return {
        ...request,
        instructorName: request.instructorName || person?.displayName || person?.name || 'Unknown',
        jobLevel: request.jobLevel || person?.jobLevel || '',
        contractType: request.contractType || person?.contractType || person?.employmentType || ''
      }
    })

    const processedDrafts = leaveDrafts.map((draft: any) => {
      const person = nonInstructorMap.get(draft.instructorId)
      return {
        ...draft,
        instructorName: draft.instructorName || person?.displayName || person?.name || 'Unknown',
        jobLevel: draft.jobLevel || person?.jobLevel || '',
        contractType: draft.contractType || person?.contractType || person?.employmentType || ''
      }
    })

    return NextResponse.json({ 
      ok: true, 
      data: {
        instructors: nonInstructors,
        leaveRequests: processedLeaveRequests,
        leaveDrafts: processedDrafts,
        leavePolicy: leavePolicy || {
          key: 'default',
          quotaType: 'Monthly Quota',
          autoReject: false,
          allocations: { junior: 12, senior: 16, managers: 24 },
          carryForward: true,
          workingDays: [1, 2, 3, 4, 5, 6]
        },
        stats: {
          totalInstructors: nonInstructors.length,
          totalLeaveRequests: processedLeaveRequests.length,
          totalDrafts: processedDrafts.length,
          approvedRequests: processedLeaveRequests.filter((r: any) => r.status === 'APPROVED').length,
          pendingRequests: processedLeaveRequests.filter((r: any) => r.status === 'PENDING').length
        }
      }
    })
  } catch (err: any) {
    console.error("/api/dashboard/staff/non-instructor/non-instructors-leave GET error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch non-instructor leave data" }, { status: 500 })
  }
}
