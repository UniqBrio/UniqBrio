import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorModel from "@/models/dashboard/staff/Instructor"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

// Route segment config for optimal performance
export const dynamic = 'force-dynamic' // Always fetch fresh data for staff changes
export const revalidate = 0 // No caching for staff data

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
  await dbConnect("uniqbrio")
  // Only return non-inactive records. Also exclude legacy soft-deleted where deleted_data === false if present.
  let items: any[] = await InstructorModel.find({
    $and: [
      { $or: [ { status: { $exists: false } }, { status: { $ne: "Inactive" } } ] },
      { $or: [ { deleted_data: { $exists: false } }, { deleted_data: { $ne: false } } ] }
    ]
  }).lean()

  // 1) Load courses and cohorts to compute denormalized names
  // We match by instructor full name (first+middle+last), case-insensitive trim
  const [courses, cohorts] = await Promise.all([
    CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
    CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
  ])
  const toKey = (name?: string) => (name || "").trim().toLowerCase()
  const byInstructorCourses = new Map<string, Set<string>>()
  const byInstructorCourseIds = new Map<string, Set<string>>()
  for (const c of courses as any[]) {
    const instr = toKey(c?.instructor)
    const nm = (c?.name || "").trim()
    
    // DEBUG: Log Emily Carter course data
    if (instr.includes('emily') && instr.includes('carter')) {
      console.log('🔍 COURSE PROCESSING - Emily Carter:', {
        instructor: c?.instructor,
        instructorKey: instr,
        courseName: nm,
        courseId: c?.courseId,
        externalId: c?.externalId,
        id: c?.id,
        fullCourseObject: JSON.stringify(c, null, 2)
      })
    }
    
    if (!instr || !nm) continue
    if (!byInstructorCourses.has(instr)) byInstructorCourses.set(instr, new Set())
    byInstructorCourses.get(instr)!.add(nm)
    // Also collect stable Course IDs if present on the course document
    const cid = ((c as any)?.courseId || (c as any)?.externalId || (c as any)?.id || "").trim()
    if (cid) {
      if (!byInstructorCourseIds.has(instr)) byInstructorCourseIds.set(instr, new Set())
      byInstructorCourseIds.get(instr)!.add(cid)
      
      // DEBUG: Log when adding course ID
      if (instr.includes('emily') && instr.includes('carter')) {
        console.log('✅ ADDED COURSE ID:', cid, 'for', instr)
      }
    }
  }
  const byInstructorCohorts = new Map<string, Set<string>>()
  const byInstructorCohortIds = new Map<string, Set<string>>()
  for (const co of cohorts as any[]) {
    const instr = toKey(co?.instructor)
    const nm = (co?.name || "").trim()
    const hid = (co?.cohortId || "").trim()
    const statusOk = ((co?.status || "").trim().toLowerCase() === 'active')
    
    // DEBUG: Log Emily Carter cohort data
    if (instr.includes('emily') && instr.includes('carter')) {
      console.log('🔍 COHORT PROCESSING - Emily Carter:', {
        instructor: co?.instructor,
        instructorKey: instr,
        cohortName: nm,
        cohortId: hid,
        courseIdFromCohort: co?.courseId,
        status: co?.status,
        statusOk,
        fullCohortObject: JSON.stringify(co, null, 2)
      })
    }
    
    // Only consider Active cohorts per requirements
    if (!instr || !nm || !statusOk) continue
    if (!byInstructorCohorts.has(instr)) byInstructorCohorts.set(instr, new Set())
    byInstructorCohorts.get(instr)!.add(nm)
    if (hid) {
      if (!byInstructorCohortIds.has(instr)) byInstructorCohortIds.set(instr, new Set())
      byInstructorCohortIds.get(instr)!.add(hid)
      
      // DEBUG: Log when adding cohort ID
      if (instr.includes('emily') && instr.includes('carter')) {
        console.log('✅ ADDED COHORT ID:', hid, 'for', instr)
      }
    }
  }

  // Backfill externalId for legacy documents that lack one so the UI can search by INSTR codes.
  try {
    const existingNums: number[] = []
    for (const it of items) {
      if (typeof it.externalId === 'string') {
        const m = /INSTR(\d+)/i.exec(it.externalId)
        if (m) existingNums.push(parseInt(m[1], 10))
      }
    }
    let next = existingNums.length ? Math.max(...existingNums) + 1 : 1
    const pad = (n: number) => `INSTR${String(n).padStart(4, '0')}`
    const updates: Promise<any>[] = []
    let mutated = false
    for (const it of items) {
      if (!it.externalId) {
        const newExternalId = pad(next++)
        // Schedule DB update using findByIdAndUpdate to avoid creating new documents.
        updates.push(
          InstructorModel.findByIdAndUpdate(it._id, { externalId: newExternalId }, { new: true })
            .lean()
            .then(updated => {
              if (updated) Object.assign(it, { externalId: updated.externalId })
            })
            .catch(() => {})
        )
        mutated = true
      }
    }
    if (updates.length) {
      await Promise.allSettled(updates)
      if (mutated) {
        // Re-fetch mutated docs to ensure consistency (optional small optimization: we already patched in place)
      }
    }
  } catch (e) {
    // Non-fatal: if backfill fails we still return existing items
    console.error('Failed to backfill instructor externalIds', e)
  }

  // 2) Compute denormalized fields and persist if changed
  try {
    const updates: Promise<any>[] = []
    for (const it of items) {
      const fullName = [it.firstName, it.middleName, it.lastName].filter(Boolean).join(' ').trim()
      const key = toKey(fullName)
      const coursesSet = byInstructorCourses.get(key) || new Set<string>()
      const cohortsSet = byInstructorCohorts.get(key) || new Set<string>()
      const nextCourseAssigned = Array.from(coursesSet.values()).join(', ')
      const nextCohortName = Array.from(cohortsSet.values()).join(', ')
      const nextCourseIds = Array.from((byInstructorCourseIds.get(key) || new Set<string>()).values()).join(', ')
      const nextCohortIds = Array.from((byInstructorCohortIds.get(key) || new Set<string>()).values()).join(', ')
      
      // DEBUG: Log Emily Carter computation
      if (key.includes('emily') && key.includes('carter')) {
        console.log('📊 COMPUTING DENORMALIZED FIELDS - Emily Carter:', {
          fullName,
          key,
          coursesSetRaw: Array.from(coursesSet.values()),
          cohortsSetRaw: Array.from(cohortsSet.values()),
          courseIdsSetRaw: Array.from((byInstructorCourseIds.get(key) || new Set<string>()).values()),
          cohortIdsSetRaw: Array.from((byInstructorCohortIds.get(key) || new Set<string>()).values()),
          nextCourseAssigned,
          nextCohortName,
          nextCourseIds,
          nextCohortIds,
          currentCohortIds: it.cohortIds,
          currentCourseIds: it.courseIds
        })
      }

      const currentCourseAssigned = it.courseAssigned || ''
      const currentCohortName = it.cohortName || ''
  const needCourseUpdate = nextCourseAssigned !== '' && currentCourseAssigned !== nextCourseAssigned
  const needCohortUpdate = nextCohortName !== '' && currentCohortName !== nextCohortName
  const needCourseIdsUpdate = nextCourseIds !== '' && (it.courseIds || '') !== nextCourseIds
  const needCohortIdsUpdate = nextCohortIds !== '' && (it.cohortIds || '') !== nextCohortIds

      // Attach to response (prefer computed non-empty values)
      it.courseAssigned = nextCourseAssigned || currentCourseAssigned
      it.cohortName = nextCohortName || currentCohortName
      it.courseIds = nextCourseIds || it.courseIds || ''
      it.cohortIds = nextCohortIds || it.cohortIds || ''
      
      // DEBUG: Log final assigned values for Emily Carter
      if (key.includes('emily') && key.includes('carter')) {
        console.log('✨ FINAL ASSIGNED VALUES - Emily Carter:', {
          courseAssigned: it.courseAssigned,
          cohortName: it.cohortName,
          courseIds: it.courseIds,
          cohortIds: it.cohortIds,
          willUpdate: needCourseUpdate || needCohortUpdate || needCourseIdsUpdate || needCohortIdsUpdate
        })
      }

      if (needCourseUpdate || needCohortUpdate || needCourseIdsUpdate || needCohortIdsUpdate) {
        const $set: any = {}
        if (needCourseUpdate) $set.courseAssigned = nextCourseAssigned
        if (needCohortUpdate) $set.cohortName = nextCohortName
        if (needCourseIdsUpdate) $set.courseIds = nextCourseIds
        if (needCohortIdsUpdate) $set.cohortIds = nextCohortIds
        updates.push(
          InstructorModel.findByIdAndUpdate(it._id, { $set }, { new: true })
            .catch(() => {})
        )
      }
    }
    if (updates.length) await Promise.allSettled(updates)
  } catch (e) {
    console.error('Failed to denormalize course/cohort names for instructors', e)
  }

  return NextResponse.json({ ok: true, data: items })
    }
  );
}

export async function POST(req: NextRequest) {
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
    try { await InstructorModel.syncIndexes() } catch {}
    const body = await req.json()
    // Normalize empty string email to undefined so partial unique index works as intended
    if (typeof body.email === 'string' && body.email.trim() === '') {
      delete body.email
    }
    let created = await InstructorModel.create(body)
    // After create, compute and set denormalized fields based on current Courses/Cohorts
    try {
      const toKey = (s?: string) => (s || '').trim().toLowerCase()
      const fullName = [created?.firstName, created?.middleName, created?.lastName].filter(Boolean).join(' ').trim()
      const key = toKey(fullName)
      const [courses, cohorts] = await Promise.all([
        CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
        CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
      ])
      const coursesFor = (courses as any[]).filter(c => toKey(c?.instructor) === key)
      const cohortsFor = (cohorts as any[]).filter(c => {
        const statusOk = ((c?.status || '').trim().toLowerCase() === 'active')
        return toKey(c?.instructor) === key && statusOk
      })
      const courseAssigned = Array.from(new Set(coursesFor
        .map(c => (c?.name || '').trim())
        .filter(Boolean))).join(', ')
      const cohortName = Array.from(new Set(cohortsFor
        .map(c => (c?.name || '').trim())
        .filter(Boolean))).join(', ')
      // Get courseIds ONLY from courses collection
      const courseIds = Array.from(new Set(
        coursesFor.map(c => ((c as any)?.courseId || (c as any)?.externalId || (c as any)?.id || '').trim()).filter(Boolean)
      )).join(', ')
      // Get cohortIds ONLY from cohorts collection (Active only)
      const cohortIds = Array.from(new Set(cohortsFor
        .map(c => ((c as any)?.cohortId || '').trim())
        .filter(Boolean))).join(', ')
      if (courseAssigned || cohortName || courseIds || cohortIds) {
        created = await InstructorModel.findByIdAndUpdate(
          created._id,
          { $set: { courseAssigned, cohortName, courseIds, cohortIds } },
          { new: true }
        ) as any
      }
    } catch {}
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
    }
  );
}

