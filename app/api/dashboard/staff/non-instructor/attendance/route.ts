import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorAttendanceModel from "@/models/dashboard/staff/NonInstructorAttendance"
import { NonInstructorLeaveRequest } from "@/lib/dashboard/staff/models"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

function toUi(doc: any) {
  return {
    ...doc,
    id: doc.id || doc._id,
    _id: doc._id,
  }
}

function toYmd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET() {
  const session = await getUserSession()
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    )
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio")
    // Sync planned attendance from approved leave requests for today and future
    try {
      const today = toYmd(new Date())
      const leaves = await NonInstructorLeaveRequest.find({ 
        tenantId: session.tenantId,
        status: 'APPROVED', 
        endDate: { $gte: today } 
      }).lean()
      if (leaves && leaves.length) {
        const ops: any[] = []
        for (const r of leaves) {
          const start = (r.startDate && r.startDate > today) ? r.startDate : today
          const end = r.endDate
          if (!start || !end) continue
          // iterate inclusive from start..end
          const [sy, sm, sd] = start.split('-').map(Number)
          const [ey, em, ed] = end.split('-').map(Number)
          let cur = new Date(sy!, (sm || 1) - 1, sd || 1)
          const endD = new Date(ey!, (em || 1) - 1, ed || 1)
          while (cur <= endD) {
            const ymd = toYmd(cur)
            // Upsert without overwriting existing records (set on insert only)
            ops.push({
              updateOne: {
                filter: { tenantId: session.tenantId, instructorId: r.instructorId, date: ymd },
                update: {
                  $setOnInsert: {
                    tenantId: session.tenantId,
                    instructorId: r.instructorId,
                    instructorName: r.instructorName,
                    date: ymd,
                    startTime: null,
                    endTime: null,
                    status: 'planned',
                    cohortTiming: null,
                    notes: 'Planned leave',
                  },
                },
                upsert: true,
              }
            })
            cur.setDate(cur.getDate() + 1)
          }
        }
        if (ops.length) {
          try {
            await (NonInstructorAttendanceModel as any).bulkWrite(ops, { ordered: false })
          } catch (e) {
            // Ignore duplicate errors; unique index will protect existing rows
            const err: any = e as any
            console.warn('bulkWrite planned sync encountered errors', (err && (err.writeErrors?.length || err.message)) || err)
          }
        }
      }
    } catch (e) {
      console.warn('Attendance planned sync failed', e)
    }
    const items = await NonInstructorAttendanceModel.find({ tenantId: session.tenantId }).sort({ date: -1 }).lean()
    return NextResponse.json({ success: true, data: items.map(toUi) })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to fetch attendance' }, { status: 500 })
  }
    }
  )
}

export async function POST(req: Request) {
  const session = await getUserSession()
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    )
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio")
    // Enforce plan restriction for attendance writes
    const restriction = await import('@/lib/restrictions');
    const block = await restriction.assertWriteAllowed(session.tenantId!, 'attendance');
    if (block) return block;
    const body = await req.json()

    const instructorId = String(body.instructorId ?? '')
    const instructorName = String(body.instructorName ?? '')
    const date = String(body.date ?? '')

    if (!instructorId || !instructorName || !date) {
      return NextResponse.json({ success: false, error: 'Instructor and date are required' }, { status: 400 })
    }

    const rawStatus = String(body.status || '').toLowerCase()
    const normalizedStatus = rawStatus === 'absent' ? 'absent' : rawStatus === 'planned' ? 'planned' : 'present'

    const toSave = {
      tenantId: session.tenantId,
      instructorId,
      instructorName,
      date,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      status: normalizedStatus,
      cohortTiming: body.cohortTiming ?? null,
      notes: body.notes ?? null,
    }

    // Use findOneAndUpdate with upsert to handle both new records and updates to existing ones (e.g., planned leave)
    const result = await NonInstructorAttendanceModel.findOneAndUpdate(
      { tenantId: session.tenantId, instructorId, date },
      { $set: toSave },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    
    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to create or update attendance record' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: toUi(result.toObject()) }, { status: 201 })
  } catch (e: any) {
    console.error('Error creating attendance:', e)
    return NextResponse.json({ success: false, error: e.message || 'Failed to create attendance' }, { status: 500 })
  }
    }
  )
}

