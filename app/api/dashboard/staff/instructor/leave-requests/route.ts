import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { LeaveRequest, Instructor, LeavePolicy } from "@/lib/dashboard/staff/models"
import InstructorAttendanceModel from "@/models/dashboard/staff/InstructorAttendance"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"
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

export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const list = await LeaveRequest.find({ tenantId: session.tenantId }).sort({ createdAt: 1 }).lean()

    // Recompute ALL allocation metadata so every row for an instructor shares the SAME aggregate usage + total.
    // Simpler interpretation: used = total approved leave days (all time) for that instructor; total = current job level allocation.
  const policy = await loadPolicy(session.tenantId)
    const allocs = policy?.allocations || { junior: 12, senior: 16, managers: 24 }
  const workingDaysArr = Array.isArray(policy?.workingDays) && policy!.workingDays.length ? policy!.workingDays : [1,2,3,4,5,6]
    const instructors = await Instructor.find({ 
      tenantId: session.tenantId,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false }
      ]
    }).lean()
    const instMap: Record<string, any> = {}
    instructors.forEach(i => { instMap[i.id] = i })

    // Backfill denormalized course/cohort on leave requests using instructor docs
    try {
      // Build quick lookup for names also by externalId if provided
      const byAnyId = new Map<string, any>()
      for (const i of instructors as any[]) {
        if (i?.id) byAnyId.set(String(i.id), i)
        if (i?.externalId) byAnyId.set(String(i.externalId), i)
        if (i?._id) byAnyId.set(String(i._id), i)
      }
      const updates: Promise<any>[] = []
      // Fallback computation if instructor doc lacks denormalized fields
      const [courses, cohorts] = await Promise.all([
        CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
        CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
      ])
      const toKey = (s?: string) => (s || '').trim().toLowerCase()
      const courseByInstr = new Map<string, Set<string>>()
      const cohortByInstr = new Map<string, Set<string>>()
      const courseIdByInstr = new Map<string, Set<string>>()
      const cohortIdByInstr = new Map<string, Set<string>>()
      // Safe fallback indexes ? keyed by exact names
      const courseIdsByCourseName = new Map<string, Set<string>>()
      const cohortsByName = new Map<string, Array<{ cohortId: string; instrKey: string; courseId: string }>>()
      for (const c of courses as any[]) {
        const k = toKey(c?.instructor)
        const nm = (c?.name || '').trim()
        if (!k || !nm) continue
        if (!courseByInstr.has(k)) courseByInstr.set(k, new Set())
        courseByInstr.get(k)!.add(nm)
        const cnKey = toKey(nm)
        if (!courseIdsByCourseName.has(cnKey)) courseIdsByCourseName.set(cnKey, new Set())
        // Collect stable course identifiers from Course docs
        const cid = ((c as any)?.courseId || (c as any)?.externalId || (c as any)?.id || '').trim()
        if (cid) {
          if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid)
          courseIdsByCourseName.get(cnKey)!.add(cid)
        }
      }
      for (const co of cohorts as any[]) {
        const k = toKey(co?.instructor)
        const nm = (co?.name || '').trim()
        if (!k || !nm) continue
        if (!cohortByInstr.has(k)) cohortByInstr.set(k, new Set())
        cohortByInstr.get(k)!.add(nm)
        const cid = (co?.courseId || '').trim()
        const hid = (co?.cohortId || '').trim()
        if (cid) { if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid) }
        if (hid) { if (!cohortIdByInstr.has(k)) cohortIdByInstr.set(k, new Set()); cohortIdByInstr.get(k)!.add(hid) }
        // Keep an index for constrained fallbacks later (requires same instructor or matching courseId)
        const cohKey = toKey(nm)
        if (!cohortsByName.has(cohKey)) cohortsByName.set(cohKey, [])
        cohortsByName.get(cohKey)!.push({ cohortId: hid, instrKey: k, courseId: cid })
      }
      for (const r of list) {
        const inst = byAnyId.get(String(r.instructorId))
        let courseName = (inst as any)?.courseAssigned || r.courseName || ''
        let cohortName = (inst as any)?.cohortName || r.cohortName || ''
        let courseId = (r as any)?.courseId || ''
        let cohortId = (r as any)?.cohortId || ''
        if ((!courseName || !cohortName) && inst) {
          const fullName = [inst.firstName, inst.middleName, inst.lastName].filter(Boolean).join(' ').trim()
          const key = toKey(fullName)
          if (!courseName) courseName = Array.from(courseByInstr.get(key)?.values() || []).join(', ')
          if (!cohortName) cohortName = Array.from(cohortByInstr.get(key)?.values() || []).join(', ')
          if (!courseId) courseId = Array.from(courseIdByInstr.get(key)?.values() || []).join(', ')
          if (!cohortId) cohortId = Array.from(cohortIdByInstr.get(key)?.values() || []).join(', ')
        }
        // Constrained fallbacks: use course names to resolve courseId, and cohort names only if same instructor or matching courseId
        if (!courseId && courseName) {
          const parts = courseName.split(',').map((s: string) => toKey(s)).filter(Boolean)
          const ids = new Set<string>()
          for (const p of parts) for (const v of Array.from(courseIdsByCourseName.get(p)?.values() || [])) ids.add(v)
          if (ids.size) courseId = Array.from(ids.values()).join(', ')
        }
        if (!cohortId && cohortName) {
          // Build allow-list of courseIds (possibly from the newly derived courseId)
          const allowCourses = new Set((courseId || '').split(',').map((s: string) => s.trim()).filter(Boolean))
          const parts = cohortName.split(',').map((s: string) => toKey(s)).filter(Boolean)
          const ids = new Set<string>()
          // Determine instructor key once for matching
          const instKey = inst ? toKey([inst.firstName, inst.middleName, inst.lastName].filter(Boolean).join(' ').trim()) : ''
          for (const p of parts) {
            for (const entry of (cohortsByName.get(p) || [])) {
              if (!entry.cohortId) continue
              if ((instKey && entry.instrKey === instKey) || (allowCourses.size && allowCourses.has(entry.courseId))) ids.add(entry.cohortId)
            }
          }
          if (ids.size) cohortId = Array.from(ids.values()).join(', ')
        }
        const needUpdate = (!!courseName && courseName !== r.courseName) || (!!cohortName && cohortName !== r.cohortName) || (!!courseId && courseId !== (r as any).courseId) || (!!cohortId && cohortId !== (r as any).cohortId)
        if (needUpdate) {
          r.courseName = courseName || r.courseName
          r.cohortName = cohortName || r.cohortName
          ;(r as any).courseId = courseId || (r as any).courseId
          ;(r as any).cohortId = cohortId || (r as any).cohortId
          updates.push(LeaveRequest.updateOne({ _id: r._id }, { $set: { courseName, cohortName, courseId, cohortId } }))
        }
      }
      if (updates.length) await Promise.allSettled(updates)
    } catch (e) {
      console.warn('GET /api/leave-requests: course/cohort backfill failed', e)
    }

  const approvedByInstructor: Record<string, any[]> = {}
    // First recompute 'days' for every request that has start/end using current working days config.
    const recomputeDayUpdates: Promise<any>[] = []
    for (const r of list) {
      if (r.startDate && r.endDate) {
        const newDays = countWorkingDaysInclusive(r.startDate, r.endDate, workingDaysArr)
        if (r.days !== newDays) {
          r.days = newDays
          recomputeDayUpdates.push(LeaveRequest.updateOne({ _id: r._id }, { $set: { days: newDays } }))
        }
      }
      // Backfill registeredDate for approved requests missing it
      const statusNorm = typeof r.status === 'string' ? r.status.toUpperCase() : r.status
      if (statusNorm === 'APPROVED' && !r.registeredDate) {
        const srcDate = r.approvedAt ? new Date(r.approvedAt) : (r.createdAt ? new Date(r.createdAt) : new Date())
        r.registeredDate = formatNiceDate(srcDate)
        recomputeDayUpdates.push(LeaveRequest.updateOne({ _id: r._id }, { $set: { registeredDate: r.registeredDate } }))
      }
    }
    for (const r of list) {
      const status = typeof r.status === 'string' ? r.status.toUpperCase() : r.status
      if (status === 'APPROVED') {
        approvedByInstructor[r.instructorId] ||= []
        approvedByInstructor[r.instructorId].push(r)
      }
    }

    const updates: Promise<any>[] = []
    // Helper to derive period key based on policy quotaType
    const derivePeriodKey = (dateStr?: string) => {
      if (!dateStr) return 'unknown'
      const [y,m] = dateStr.split('-').map(Number)
      if (!y || !m) return 'unknown'
      const qt = policy?.quotaType || 'Monthly Quota'
      if (qt === 'Yearly Quota') return `${y}`
      if (qt === 'Quarterly Quota') {
        const q = Math.floor((m-1)/3)+1
        return `${y}-Q${q}`
      }
      return `${y}-${String(m).padStart(2,'0')}` // Monthly
    }
    for (const instrId of Object.keys(approvedByInstructor)) {
      const rows = approvedByInstructor[instrId]
      const jobLevelRaw = (instMap[instrId]?.jobLevel || rows[0]?.jobLevel || '') as string
      let alloc: number | undefined = allocationFromPolicy(jobLevelRaw, policy)
      if (!alloc) continue
      // Group rows by derived period
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
          updates.push(LeaveRequest.updateOne({ _id: r._id }, { $set: {
            allocationTotal: alloc,
            allocationUsed: running,
            balance: remaining,
            limitReached: remaining === 0,
            jobLevel: instMap[instrId]?.jobLevel || r.jobLevel,
          }}))
        }
      }
    }
  if (recomputeDayUpdates.length) await Promise.allSettled(recomputeDayUpdates)
  if (updates.length) await Promise.allSettled(updates)
    return NextResponse.json({ ok: true, data: list })
  } catch (err: any) {
    console.error("/api/leave-requests GET error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch" }, { status: 500 })
  }
  });
}

// Fetch policy fresh each call (small collection, inexpensive). Avoid stale quotaType after edits.
async function loadPolicy(tenantId: string) {
  try {
    return await LeavePolicy.findOne({ key: 'default', tenantId }).lean()
  } catch {
    return null
  }
}

function allocationFromPolicy(jobLevelRaw: string | undefined, policy: any): number | undefined {
  if (!policy) return undefined
  const label = String(jobLevelRaw || '').trim()
  const allocs = policy.allocations || {}
  // 1) exact-label match in allocations map (case-insensitive)
  const found = Object.keys(allocs).find(k => k.trim().toLowerCase() === label.toLowerCase())
  if (found) return Number(allocs[found])
  // 2) legacy buckets if present (kept for backward compat)
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
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await req.json()
    if (!body.id) body.id = `l${Date.now()}`
  if (!body.status) body.status = 'DRAFT'
  else body.status = String(body.status).toUpperCase()

    // If this is a draft, allow partial content & skip quota calculation.
    const isDraft = body.status === 'DRAFT'
    if (!isDraft) {
      // Validate required submission fields
      const required = ['instructorId','instructorName','leaveType','startDate','endDate','reason']
      const missing = required.filter(k => !body[k])
      if (missing.length) {
        return NextResponse.json({ ok: false, error: `Missing required fields for submission: ${missing.join(', ')}` }, { status: 400 })
      }

      // Check for duplicate/overlapping leave requests
      const overlapping = await LeaveRequest.findOne({
        instructorId: body.instructorId,
        tenantId: session.tenantId,
        status: { $in: ['APPROVED', 'PENDING'] },
        $or: [
          // New request starts during existing leave
          { startDate: { $lte: body.startDate }, endDate: { $gte: body.startDate } },
          // New request ends during existing leave
          { startDate: { $lte: body.endDate }, endDate: { $gte: body.endDate } },
          // New request completely contains existing leave
          { startDate: { $gte: body.startDate }, endDate: { $lte: body.endDate } }
        ]
      }).lean()
      if (overlapping) {
        return NextResponse.json({ 
          ok: false, 
          error: `A leave request already exists for this instructor from ${overlapping.startDate} to ${overlapping.endDate}. Please choose different dates.` 
        }, { status: 409 })
      }

      // Check if attendance has already been marked for this instructor on any of these dates
      try {
        const [startYear, startMonth, startDay] = body.startDate.split('-').map(Number)
        const [endYear, endMonth, endDay] = body.endDate.split('-').map(Number)
        const startDateObj = new Date(startYear, (startMonth || 1) - 1, startDay || 1)
        const endDateObj = new Date(endYear, (endMonth || 1) - 1, endDay || 1)
        
        const attendanceDates: string[] = []
        let current = new Date(startDateObj)
        while (current <= endDateObj) {
          const y = current.getFullYear()
          const m = String(current.getMonth() + 1).padStart(2, '0')
          const d = String(current.getDate()).padStart(2, '0')
          attendanceDates.push(`${y}-${m}-${d}`)
          current.setDate(current.getDate() + 1)
        }
        
        const existingAttendance = await InstructorAttendanceModel.findOne({
          tenantId: session.tenantId,
          instructorId: body.instructorId,
          date: { $in: attendanceDates },
          status: { $ne: 'planned' } // Ignore planned attendance, only block actual attendance records
        }).lean()
        
        if (existingAttendance) {
          return NextResponse.json({
            ok: false,
            error: `Attendance has already been marked for ${body.instructorName || 'this instructor'} on ${existingAttendance.date}. Cannot create leave request for dates with existing attendance records.`
          }, { status: 409 })
        }
      } catch (attendanceCheckError) {
        console.error('Error checking attendance for leave request:', attendanceCheckError)
        // Continue with leave request creation if attendance check fails (logged for debugging)
      }

      // Validate that the instructor exists in the database
      const instructorExists = await Instructor.findOne({ 
        $or: [
          { id: body.instructorId, tenantId: session.tenantId },
          { externalId: body.instructorId, tenantId: session.tenantId }
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
          error: 'The selected instructor does not exist or has been deleted. Please refresh and select a valid instructor.' 
        }, { status: 400 })
      }

      try {
        const { startDate: start, endDate: end, instructorId } = body
        const inst = await Instructor.findOne({ id: instructorId, tenantId: session.tenantId }).lean()
    const jobLevelRaw: string | undefined = inst?.jobLevel || body.jobLevel || body.selectedJobLevel
        if (!body.jobLevel && jobLevelRaw) body.jobLevel = jobLevelRaw
  const policy = await loadPolicy(session.tenantId)
  const allocation = allocationFromPolicy(jobLevelRaw, policy)
  const policyDoc = await loadPolicy(session.tenantId)
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
            // Quarter months range: q1 => 01-03, q2 => 04-06, etc.
            const startMonth = (q-1)*3 + 1
            const endMonth = startMonth + 2
            const monthPattern = Array.from({length:3}, (_,i)=> String(startMonth+i).padStart(2,'0')).join('|')
            regex = `^${y}-(?:${monthPattern})`
          } else { // Monthly
            regex = `^${y}-${m}`
          }
          const existing = await LeaveRequest.find({ instructorId, startDate: { $regex: regex }, status: 'APPROVED', tenantId: session.tenantId }).lean()
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
        console.warn('POST /api/leave-requests quota enrichment failed', e)
      }
    }

    // Enrich with course/cohort names and IDs based on instructor data using safe, constrained logic
    try {
      const inst = await Instructor.findOne({ $or: [ { id: body.instructorId, tenantId: session.tenantId }, { externalId: body.instructorId, tenantId: session.tenantId } ] }).lean()
      let courseName = (inst as any)?.courseAssigned || ''
      let cohortName = (inst as any)?.cohortName || ''
      let courseId = ''
      let cohortId = ''
      // Build safe indexes and derive values primarily from instructor association
      const toKey = (s?: string) => (s || '').trim().toLowerCase()
      const fullName = [inst?.firstName, inst?.middleName, inst?.lastName].filter(Boolean).join(' ').trim()
      const key = toKey(fullName)
      const [courses, cohorts] = await Promise.all([
        CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
        CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
      ])
      const courseByInstr = new Map<string, Set<string>>()
      const cohortByInstr = new Map<string, Set<string>>()
      const courseIdByInstr = new Map<string, Set<string>>()
      const cohortIdByInstr = new Map<string, Set<string>>()
      const courseIdsByCourseName = new Map<string, Set<string>>()
      const cohortsByName = new Map<string, Array<{ cohortId: string; instrKey: string; courseId: string }>>()
      for (const c of courses as any[]) {
        const k = toKey(c?.instructor)
        const nm = (c?.name || '').trim()
        if (!k || !nm) continue
        if (!courseByInstr.has(k)) courseByInstr.set(k, new Set())
        courseByInstr.get(k)!.add(nm)
        const cnKey = toKey(nm)
        if (!courseIdsByCourseName.has(cnKey)) courseIdsByCourseName.set(cnKey, new Set())
        const cid = ((c as any)?.courseId || (c as any)?.externalId || (c as any)?.id || '').trim()
        if (cid) {
          if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid)
          courseIdsByCourseName.get(cnKey)!.add(cid)
        }
      }
      for (const co of cohorts as any[]) {
        const k = toKey(co?.instructor)
        const nm = (co?.name || '').trim()
        if (!k || !nm) continue
        if (!cohortByInstr.has(k)) cohortByInstr.set(k, new Set())
        cohortByInstr.get(k)!.add(nm)
        const cid = (co?.courseId || '').trim()
        const hid = (co?.cohortId || '').trim()
        if (cid) { if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid) }
        if (hid) { if (!cohortIdByInstr.has(k)) cohortIdByInstr.set(k, new Set()); cohortIdByInstr.get(k)!.add(hid) }
        const cohKey = toKey(nm)
        if (!cohortsByName.has(cohKey)) cohortsByName.set(cohKey, [])
        cohortsByName.get(cohKey)!.push({ cohortId: hid, instrKey: k, courseId: cid })
      }
      // Prefer instructor-attached names first
      if (!courseName) courseName = Array.from(courseByInstr.get(key)?.values() || []).join(', ')
      if (!cohortName) cohortName = Array.from(cohortByInstr.get(key)?.values() || []).join(', ')
      // Derive IDs strictly by instructor first
      courseId = Array.from(courseIdByInstr.get(key)?.values() || []).join(', ')
      cohortId = Array.from(cohortIdByInstr.get(key)?.values() || []).join(', ')
      // Constrained fallbacks for IDs if still empty
      if (!courseId && courseName) {
        const parts = courseName.split(',').map((s: string) => toKey(s)).filter(Boolean)
        const ids = new Set<string>()
        for (const p of parts) for (const v of Array.from(courseIdsByCourseName.get(p)?.values() || [])) ids.add(v)
        if (ids.size) courseId = Array.from(ids.values()).join(', ')
      }
      if (!cohortId && cohortName) {
        const parts = cohortName.split(',').map((s: string) => toKey(s)).filter(Boolean)
        const ids = new Set<string>()
  const allowCourses = new Set((courseId || '').split(',').map((s: string) => s.trim()).filter(Boolean))
        for (const p of parts) {
          for (const entry of (cohortsByName.get(p) || [])) {
            if (!entry.cohortId) continue
            if (entry.instrKey === key || (allowCourses.size && allowCourses.has(entry.courseId))) ids.add(entry.cohortId)
          }
        }
        if (ids.size) cohortId = Array.from(ids.values()).join(', ')
      }
      if (courseName) body.courseName = courseName
      if (cohortName) body.cohortName = cohortName
      if (courseId) body.courseId = courseId
      if (cohortId) body.cohortId = cohortId
    } catch {}

    // Ensure tenantId is set on the body
    body.tenantId = session.tenantId
    const created = await LeaveRequest.create(body)
    return NextResponse.json({ ok: true, data: created })
  } catch (err: any) {
    console.error("/api/leave-requests POST error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to create" }, { status: 500 })
  }
  });
}

export async function PUT(req: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await req.json()
    const { id, updates } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })

    // Fetch existing to know current status
    const existing = await LeaveRequest.findOne({ id, tenantId: session.tenantId }).lean()
    if (!existing) return NextResponse.json({ ok: false, error: 'Leave request not found' }, { status: 404 })

    const nextStatus = updates?.status || existing.status
  const promotingDraft = existing.status === 'DRAFT' && nextStatus !== 'DRAFT'
  // Normalize status to uppercase for consistency
  if (updates?.status) updates.status = String(updates.status).toUpperCase()

    // Check for duplicate when promoting from draft or when dates/reason change
    if (promotingDraft || updates?.startDate || updates?.endDate || updates?.reason) {
      const merged = { ...existing, ...updates }
      const duplicateCheck = await LeaveRequest.findOne({
        instructorId: merged.instructorId,
        startDate: merged.startDate,
        endDate: merged.endDate,
        reason: merged.reason,
        id: { $ne: existing.id }, // Exclude the current record
        tenantId: session.tenantId,
      }).lean()
      if (duplicateCheck) {
        return NextResponse.json({ 
          ok: false, 
          error: 'A leave request with the same dates and reason already exists for this instructor.' 
        }, { status: 409 })
      }
    }

    // Validate that the instructor exists when promoting from draft or changing instructor
    if (promotingDraft || updates?.instructorId) {
      const instructorIdToCheck = updates?.instructorId || existing.instructorId
      const instructorExists = await Instructor.findOne({ 
        $or: [
          { id: instructorIdToCheck, tenantId: session.tenantId },
          { externalId: instructorIdToCheck, tenantId: session.tenantId }
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
    }

    const shouldRecompute = promotingDraft || nextStatus === 'APPROVED' || updates?.startDate || updates?.endDate
    if (shouldRecompute) {
      const merged = { ...existing, ...updates, status: nextStatus }
      const required = ['instructorId','instructorName','leaveType','startDate','endDate','reason']
      // Only enforce required set if transitioning to approved state (from draft or pending to approved) or promoting draft
      if (promotingDraft || nextStatus === 'APPROVED') {
        const missing = required.filter(k => !merged[k])
        if (missing.length) {
          return NextResponse.json({ ok: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
        }
      }
      try {
        const inst = await Instructor.findOne({ id: merged.instructorId, tenantId: session.tenantId }).lean()
  const jobLevelRaw: string | undefined = inst?.jobLevel || merged.jobLevel || updates?.selectedJobLevel
        if (!updates.jobLevel && jobLevelRaw) updates.jobLevel = jobLevelRaw
        const policy = await loadPolicy(session.tenantId)
  const allocation = allocationFromPolicy(jobLevelRaw, policy)
  const policyDoc = await loadPolicy(session.tenantId)
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
          const already = await LeaveRequest.find({ instructorId: merged.instructorId, startDate: { $regex: regex }, status: 'APPROVED', id: { $ne: existing.id }, tenantId: session.tenantId }).lean()
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
        console.warn('PUT /api/leave-requests recompute quota failed', e)
      }
    }

    // Enrich updates with course/cohort names and IDs using the same safe, constrained logic
    try {
      const inst = await Instructor.findOne({ $or: [ { id: existing.instructorId, tenantId: session.tenantId }, { externalId: existing.instructorId, tenantId: session.tenantId } ] }).lean()
      let courseName = updates.courseName || (inst as any)?.courseAssigned || ''
      let cohortName = updates.cohortName || (inst as any)?.cohortName || ''
      let courseId = updates.courseId || ''
      let cohortId = updates.cohortId || ''
      const toKey = (s?: string) => (s || '').trim().toLowerCase()
      const fullName = [inst?.firstName, inst?.middleName, inst?.lastName].filter(Boolean).join(' ').trim()
      const key = toKey(fullName)
      const [courses, cohorts] = await Promise.all([
        CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
        CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
      ])
      const courseByInstr = new Map<string, Set<string>>()
      const cohortByInstr = new Map<string, Set<string>>()
      const courseIdByInstr = new Map<string, Set<string>>()
      const cohortIdByInstr = new Map<string, Set<string>>()
      const courseIdsByCourseName = new Map<string, Set<string>>()
      const cohortsByName = new Map<string, Array<{ cohortId: string; instrKey: string; courseId: string }>>()
      for (const c of courses as any[]) {
        const k = toKey(c?.instructor)
        const nm = (c?.name || '').trim()
        if (!k || !nm) continue
        if (!courseByInstr.has(k)) courseByInstr.set(k, new Set())
        courseByInstr.get(k)!.add(nm)
        const cnKey = toKey(nm)
        if (!courseIdsByCourseName.has(cnKey)) courseIdsByCourseName.set(cnKey, new Set())
        const cid = ((c as any)?.courseId || (c as any)?.externalId || (c as any)?.id || '').trim()
        if (cid) {
          if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid)
          courseIdsByCourseName.get(cnKey)!.add(cid)
        }
      }
      for (const co of cohorts as any[]) {
        const k = toKey(co?.instructor)
        const nm = (co?.name || '').trim()
        if (!k || !nm) continue
        if (!cohortByInstr.has(k)) cohortByInstr.set(k, new Set())
        cohortByInstr.get(k)!.add(nm)
        const cid = (co?.courseId || '').trim()
        const hid = (co?.cohortId || '').trim()
        if (cid) { if (!courseIdByInstr.has(k)) courseIdByInstr.set(k, new Set()); courseIdByInstr.get(k)!.add(cid) }
        if (hid) { if (!cohortIdByInstr.has(k)) cohortIdByInstr.set(k, new Set()); cohortIdByInstr.get(k)!.add(hid) }
        const cohKey = toKey(nm)
        if (!cohortsByName.has(cohKey)) cohortsByName.set(cohKey, [])
        cohortsByName.get(cohKey)!.push({ cohortId: hid, instrKey: k, courseId: cid })
      }
      if (!courseName) courseName = Array.from(courseByInstr.get(key)?.values() || []).join(', ')
      if (!cohortName) cohortName = Array.from(cohortByInstr.get(key)?.values() || []).join(', ')
      if (!courseId) courseId = Array.from(courseIdByInstr.get(key)?.values() || []).join(', ')
      if (!cohortId) cohortId = Array.from(cohortIdByInstr.get(key)?.values() || []).join(', ')
      if (!courseId && courseName) {
        const parts = (courseName || '').split(',').map((s: string) => toKey(s)).filter(Boolean)
        const ids = new Set<string>()
        for (const p of parts) for (const v of Array.from(courseIdsByCourseName.get(p)?.values() || [])) ids.add(v)
        if (ids.size) courseId = Array.from(ids.values()).join(', ')
      }
      if (!cohortId && cohortName) {
  const allowCourses = new Set((courseId || '').split(',').map((s: string) => s.trim()).filter(Boolean))
        const parts = (cohortName || '').split(',').map((s: string) => toKey(s)).filter(Boolean)
        const ids = new Set<string>()
        for (const p of parts) {
          for (const entry of (cohortsByName.get(p) || [])) {
            if (!entry.cohortId) continue
            if (entry.instrKey === key || (allowCourses.size && allowCourses.has(entry.courseId))) ids.add(entry.cohortId)
          }
        }
        if (ids.size) cohortId = Array.from(ids.values()).join(', ')
      }
      if (courseName) updates.courseName = courseName
      if (cohortName) updates.cohortName = cohortName
      if (courseId) updates.courseId = courseId
      if (cohortId) updates.cohortId = cohortId
    } catch {}

    const updated = await LeaveRequest.findOneAndUpdate({ id }, { $set: updates }, { new: true })
    return NextResponse.json({ ok: true, data: updated })
  } catch (err: any) {
    console.error("/api/leave-requests PUT error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Failed to update" }, { status: 500 })
  }
  });
}

export async function DELETE(req: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })
        // Find the leave first to cascade delete planned attendance in the same date range
        const leave = await LeaveRequest.findOne({ id, tenantId: session.tenantId }).lean()
        if (leave) {
          try {
            await InstructorAttendanceModel.deleteMany({
              instructorId: leave.instructorId,
              date: { $gte: leave.startDate, $lte: leave.endDate },
              status: 'planned',
              tenantId: session.tenantId,
            })
          } catch (e) {
            console.warn('Failed to cascade delete instructor planned attendance for leave', id, e)
          }
        }
        await LeaveRequest.deleteOne({ id, tenantId: session.tenantId })
        return NextResponse.json({ ok: true })
      } catch (err: any) {
        console.error("/api/leave-requests DELETE error", err)
        return NextResponse.json({ ok: false, error: err?.message || "Failed to delete" }, { status: 500 })
      }
    }
  );
}

