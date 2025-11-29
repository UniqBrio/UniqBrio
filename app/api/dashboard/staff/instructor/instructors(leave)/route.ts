import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Instructor, LeaveRequest, InstructorLeaveDraft, LeavePolicy } from "@/lib/dashboard/staff/models"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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
  const [instructorList, leaveRequests, leaveDrafts, leavePolicy, courses, cohorts] = await Promise.all([
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
        courseAssigned: 1,
        cohortName: 1,
      }).lean(),
      LeaveRequest.find({ tenantId: session.tenantId }).sort({ createdAt: -1 }).lean(),
      InstructorLeaveDraft.find({ tenantId: session.tenantId }).sort({ createdAt: -1 }).lean(),
      LeavePolicy.findOne({ tenantId: session.tenantId, key: 'default' }).lean(),
      CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
      CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[])
    ])
    const toKey = (s?: string) => (s || '').trim().toLowerCase()
  const courseByInstr = new Map<string, Set<string>>()
  const cohortByInstr = new Map<string, Set<string>>()
  const courseIdByInstr = new Map<string, Set<string>>()
  const cohortIdByInstr = new Map<string, Set<string>>()
    for (const c of courses as any[]) {
      const k = toKey((c as any)?.instructor)
      const nm = ((c as any)?.name || '').trim()
      if (!k || !nm) continue
      if (!courseByInstr.has(k)) courseByInstr.set(k, new Set())
      courseByInstr.get(k)!.add(nm)
      // Gather stable course identifiers ONLY from Course docs
      const cid = (((c as any)?.courseId) || ((c as any)?.externalId) || ((c as any)?.id) || '').trim()
      if (cid) {
        if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid)
      }
    }
    for (const co of cohorts as any[]) {
      const k = toKey((co as any)?.instructor)
      const nm = ((co as any)?.name || '').trim()
      const statusOk = ((co as any)?.status || '').trim().toLowerCase() === 'active'
      // Only consider Active cohorts per requirements
      if (!k || !nm || !statusOk) continue
      if (!cohortByInstr.has(k)) cohortByInstr.set(k, new Set())
      cohortByInstr.get(k)!.add(nm)
      const hid = ((co as any)?.cohortId || '').trim()
      if (hid) { if (!cohortIdByInstr.has(k)) cohortIdByInstr.set(k, new Set()); cohortIdByInstr.get(k)!.add(hid) }
    }

    // Process instructors data
  const instructorUpdates: Promise<any>[] = []
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

      // Compute denormalized course/cohort by matching Course/Cohort.instructor with fullName
      const nameKey = toKey(fullName)
      const computedCourse = doc.courseAssigned && String(doc.courseAssigned).trim().length
        ? String(doc.courseAssigned).trim()
        : Array.from(courseByInstr.get(nameKey)?.values() || []).join(', ')
      const computedCohort = doc.cohortName && String(doc.cohortName).trim().length
        ? String(doc.cohortName).trim()
        : Array.from(cohortByInstr.get(nameKey)?.values() || []).join(', ')
      const computedCourseIds = Array.from(courseIdByInstr.get(nameKey)?.values() || []).join(', ')
      const computedCohortIds = Array.from(cohortIdByInstr.get(nameKey)?.values() || []).join(', ')
      const needInstUpdate = (
        (!!computedCourse && computedCourse !== (doc.courseAssigned || '')) ||
        (!!computedCohort && computedCohort !== (doc.cohortName || '')) ||
        (!!computedCourseIds && computedCourseIds !== (doc.courseIds || '')) ||
        (!!computedCohortIds && computedCohortIds !== (doc.cohortIds || ''))
      )
      if (needInstUpdate) {
        const $set: any = {}
        if (computedCourse) $set.courseAssigned = computedCourse
        if (computedCohort) $set.cohortName = computedCohort
        if (computedCourseIds) $set.courseIds = computedCourseIds
        if (computedCohortIds) $set.cohortIds = computedCohortIds
        // Try by _id and by id string (some historical docs use `id` as primary app key)
        instructorUpdates.push(
          Instructor.updateOne({ _id: doc._id }, { $set }).catch(() => {}),
          Instructor.updateOne({ id: doc.id }, { $set }).catch(() => {})
        )
        doc.courseAssigned = computedCourse || doc.courseAssigned
        doc.cohortName = computedCohort || doc.cohortName
        doc.courseIds = computedCourseIds || doc.courseIds
        doc.cohortIds = computedCohortIds || doc.cohortIds
      }

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
        courseAssigned: doc.courseAssigned || undefined,
        cohortName: doc.cohortName || undefined,
        // Important for leave table fallbacks
        courseIds: doc.courseIds || computedCourseIds || undefined,
        cohortIds: doc.cohortIds || computedCohortIds || undefined,
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
  const lrBulkOps: any[] = []
    const processedLeaveRequests = leaveRequests.map((request: any) => {
      const instructor = instructorMap.get(request.instructorId)
      const baseName = instructor?.displayName || instructor?.name || ''
      const k = toKey(baseName)
      // Compute best-known values from instructor/cross-collections
      const bestCourse = (instructor?.courseAssigned && String(instructor.courseAssigned).trim().length)
        ? String(instructor.courseAssigned).trim()
        : Array.from(courseByInstr.get(k)?.values() || []).join(', ')
      const bestCohort = (instructor?.cohortName && String(instructor.cohortName).trim().length)
        ? String(instructor.cohortName).trim()
        : Array.from(cohortByInstr.get(k)?.values() || []).join(', ')
      // Strictly derive by instructor only - get courseIds from courses, cohortIds from cohorts
      const derivedCourseId = Array.from(courseIdByInstr.get(k)?.values() || []).join(', ')
      const derivedCohortId = Array.from(cohortIdByInstr.get(k)?.values() || []).join(', ')
      // Persist backfill if our best-known data is richer than what's on the request
      const needCourseUpdate = !!bestCourse && bestCourse !== (request.courseName || '')
      const needCohortUpdate = !!bestCohort && bestCohort !== (request.cohortName || '')
      const needCourseIdUpdate = !!derivedCourseId && derivedCourseId !== ((request as any).courseId || '')
      const needCohortIdUpdate = !!derivedCohortId && derivedCohortId !== ((request as any).cohortId || '')
      if (needCourseUpdate || needCohortUpdate || needCourseIdUpdate || needCohortIdUpdate) {
        const $set: any = {}
        if (needCourseUpdate) $set.courseName = bestCourse
        if (needCohortUpdate) $set.cohortName = bestCohort
        if (derivedCourseId) $set.courseId = derivedCourseId
        if (derivedCohortId) $set.cohortId = derivedCohortId
        lrBulkOps.push(
          { updateOne: { filter: { _id: request._id }, update: { $set } } },
          { updateOne: { filter: { id: request.id }, update: { $set } } }
        )
      }
      return {
        ...request,
        instructorName: request.instructorName || baseName || 'Unknown',
        jobLevel: request.jobLevel || instructor?.jobLevel || '',
        contractType: request.contractType || instructor?.contractType || instructor?.employmentType || '',
        courseName: (bestCourse || request.courseName || ''),
        cohortName: (bestCohort || request.cohortName || ''),
        courseId: derivedCourseId || (request as any).courseId || (instructor as any)?.courseIds || '',
        cohortId: derivedCohortId || (request as any).cohortId || (instructor as any)?.cohortIds || '',
      }
    })

    // Process and enrich drafts with instructor data  
  const draftBulkOps: any[] = []
    const processedDrafts = leaveDrafts.map((draft: any) => {
      const instructor = instructorMap.get(draft.instructorId)
      const baseName = instructor?.displayName || instructor?.name || ''
      const k = toKey(baseName)
      const bestCourse = (instructor?.courseAssigned && String(instructor.courseAssigned).trim().length)
        ? String(instructor.courseAssigned).trim()
        : Array.from(courseByInstr.get(k)?.values() || []).join(', ')
      const bestCohort = (instructor?.cohortName && String(instructor.cohortName).trim().length)
        ? String(instructor.cohortName).trim()
        : Array.from(cohortByInstr.get(k)?.values() || []).join(', ')
      // Strictly derive IDs by instructor only - courseIds from courses, cohortIds from cohorts
      const derivedCourseId = Array.from(courseIdByInstr.get(k)?.values() || []).join(', ')
      const derivedCohortId = Array.from(cohortIdByInstr.get(k)?.values() || []).join(', ')
      const needCourseUpdate = !!bestCourse && bestCourse !== (draft.courseName || '')
      const needCohortUpdate = !!bestCohort && bestCohort !== (draft.cohortName || '')
      const needCourseIdUpdate = !!derivedCourseId && derivedCourseId !== ((draft as any).courseId || '')
      const needCohortIdUpdate = !!derivedCohortId && derivedCohortId !== ((draft as any).cohortId || '')
      if (needCourseUpdate || needCohortUpdate || needCourseIdUpdate || needCohortIdUpdate) {
        const $set: any = {}
        if (needCourseUpdate) $set.courseName = bestCourse
        if (needCohortUpdate) $set.cohortName = bestCohort
        if (derivedCourseId) $set.courseId = derivedCourseId
        if (derivedCohortId) $set.cohortId = derivedCohortId
        draftBulkOps.push(
          { updateOne: { filter: { _id: draft._id }, update: { $set } } },
          { updateOne: { filter: { id: draft.id }, update: { $set } } }
        )
      }
      return {
        ...draft,
        instructorName: draft.instructorName || baseName || 'Unknown',
        jobLevel: draft.jobLevel || instructor?.jobLevel || '',
        contractType: draft.contractType || instructor?.contractType || instructor?.employmentType || '',
        courseName: (bestCourse || draft.courseName || ''),
        cohortName: (bestCohort || draft.cohortName || ''),
        courseId: derivedCourseId || (draft as any).courseId || (instructor as any)?.courseIds || '',
        cohortId: derivedCohortId || (draft as any).cohortId || (instructor as any)?.cohortIds || '',
      }
    })

    // Return all leave-related data
    // Apply any persistence updates in the background
    // Apply instructor updates + bulk persists for requests/drafts
    if (instructorUpdates.length) {
      try { await Promise.allSettled(instructorUpdates) } catch {}
    }
    if (lrBulkOps.length) {
      try { await (LeaveRequest as any).bulkWrite(lrBulkOps, { ordered: false }) } catch {}
    }
    if (draftBulkOps.length) {
      try { await (InstructorLeaveDraft as any).bulkWrite(draftBulkOps, { ordered: false }) } catch {}
    }

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
  });
}

