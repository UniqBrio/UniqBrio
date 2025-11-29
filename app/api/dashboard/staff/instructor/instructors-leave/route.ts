import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Instructor, LeaveRequest, InstructorLeaveDraft, LeavePolicy } from "@/lib/dashboard/staff/models"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Fixed collection name mapping for leave management
export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio")
    
    // Fetch all leave-related data in parallel
    const [instructorList, leaveRequests, leaveDrafts, leavePolicy] = await Promise.all([
      Instructor.find({ 
        tenantId: session.tenantId,
        $or: [
          { isDeleted: { $exists: false } },
          { isDeleted: false }
        ]
      }, {
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
      LeaveRequest.find({ tenantId: session.tenantId }).sort({ createdAt: -1 }).lean(),
      InstructorLeaveDraft.find({ tenantId: session.tenantId }).sort({ createdAt: -1 }).lean(),
      LeavePolicy.findOne({ tenantId: session.tenantId, key: 'default' }).lean()
    ])

    // Process instructors data
    const instructors = instructorList.map((raw: any) => {
      const doc: any = { ...raw }
      // Support alternative field names
      const identifier = doc.externalId || doc.instructorId || doc.id || doc.code || doc.employeeId || ""
      if (!doc.id && identifier) doc.id = identifier

      // If no name parts but combined name exists, try to split
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

      const code = doc.externalId || doc.instructorId || doc.id
      const name = fullName || doc.name || code
      return {
        id: doc.id,
        instructorId: doc.instructorId || doc.id,
        externalId: doc.externalId,
        name, // legacy
        fullName: name,
        displayName: name,
        displayCode: code,
        firstName: doc.firstName || undefined,
        middleName: doc.middleName || undefined,
        lastName: doc.lastName || undefined,
        role: doc.role,
        department: doc.department,
        jobLevel: doc.jobLevel,
        employmentType: doc.employmentType, // keep original
        contractType: doc.contractType || doc.employmentType || doc.contract_type || doc.employment_type,
        roleType: doc.roleType,
      }
    })

    // Create instructor lookup map for enriching leave data
    const instructorMap = new Map()
    instructors.forEach(inst => {
      instructorMap.set(inst.id, inst)
      if (inst.instructorId && inst.instructorId !== inst.id) {
        instructorMap.set(inst.instructorId, inst)
      }
      if (inst.externalId) {
        instructorMap.set(inst.externalId, inst)
      }
    })

    // Process and enrich leave requests with instructor data
    const processedLeaveRequests = leaveRequests.map((request: any) => {
      const instructor = instructorMap.get(request.instructorId)
      return {
        ...request,
        instructorName: request.instructorName || instructor?.displayName || instructor?.name || 'Unknown',
        jobLevel: request.jobLevel || instructor?.jobLevel || '',
        contractType: request.contractType || instructor?.contractType || instructor?.employmentType || ''
      }
    })

    // Process and enrich drafts with instructor data  
    const processedDrafts = leaveDrafts.map((draft: any) => {
      const instructor = instructorMap.get(draft.instructorId)
      return {
        ...draft,
        instructorName: draft.instructorName || instructor?.displayName || instructor?.name || 'Unknown',
        jobLevel: draft.jobLevel || instructor?.jobLevel || '',
        contractType: draft.contractType || instructor?.contractType || instructor?.employmentType || ''
      }
    })

    // Return all leave-related data
    return NextResponse.json({ 
      ok: true, 
      data: {
        instructors,
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
          totalInstructors: instructors.length,
          totalLeaveRequests: processedLeaveRequests.length,
          totalDrafts: processedDrafts.length,
          approvedRequests: processedLeaveRequests.filter((r: any) => r.status === 'APPROVED').length,
          pendingRequests: processedLeaveRequests.filter((r: any) => r.status === 'PENDING').length
        }
      }
    })
  } catch (err: any) {
    console.error("/api/dashboard/staff/instructor/instructors(leave) GET error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch leave data" }, { status: 500 })
  }
    }
  );
}
