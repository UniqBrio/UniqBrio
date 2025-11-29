import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorAttendanceModel from "@/models/dashboard/staff/InstructorAttendance"
import { LeaveRequest } from "@/lib/dashboard/staff/models"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

// Normalize a document for the current UI shape
function toUi(doc: any) {
  return {
    ...doc,
    id: String(doc._id || doc.id),
    _id: doc._id || doc.id,
  }
}

export async function GET() {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      await dbConnect("uniqbrio")
      
      // One-time cleanup: Add tenantId to any records missing it (legacy data)
      // This ensures the unique index works properly
      try {
        const recordsWithoutTenant = await InstructorAttendanceModel.countDocuments({ 
          tenantId: { $exists: false } 
        })
        
        if (recordsWithoutTenant > 0) {
          console.log(`Found ${recordsWithoutTenant} attendance records without tenantId, cleaning up...`)
          // For safety, we'll delete records without tenantId rather than assigning them
          // to avoid data leakage between tenants
          await InstructorAttendanceModel.deleteMany({ tenantId: { $exists: false } })
          console.log(`Deleted ${recordsWithoutTenant} orphaned attendance records`)
        }
      } catch (cleanupError) {
        console.warn('Attendance cleanup failed:', cleanupError)
      }
      
      // Sync planned attendance from approved instructor leave requests for today and future
    try {
      const toYmd = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      const today = toYmd(new Date())
      const leaves = await LeaveRequest.find({ tenantId: session.tenantId, status: 'APPROVED', endDate: { $gte: today } }).lean()
      if (leaves && leaves.length) {
        const ops: any[] = []
        for (const r of leaves) {
          const start = (r.startDate && r.startDate > today) ? r.startDate : today
          const end = r.endDate
          if (!start || !end) continue
          const [sy, sm, sd] = start.split('-').map(Number)
          const [ey, em, ed] = end.split('-').map(Number)
          let cur = new Date(sy!, (sm || 1) - 1, sd || 1)
          const endD = new Date(ey!, (em || 1) - 1, ed || 1)
          while (cur <= endD) {
            const ymd = toYmd(cur)
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
            await (InstructorAttendanceModel as any).bulkWrite(ops, { ordered: false })
          } catch (e: any) {
            // Ignore duplicate errors; unique index protects existing rows
            console.warn('bulkWrite planned sync (instructor) encountered errors', (e && (e.writeErrors?.length || e.message)) || e)
          }
        }
      }
    } catch (e) {
      console.warn('Instructor attendance planned sync failed', e)
    }
      const items = await InstructorAttendanceModel.find({ tenantId: session.tenantId }).sort({ date: -1 }).lean()
      return NextResponse.json({ success: true, data: items.map(toUi) })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Failed to fetch attendance' }, { status: 500 })
    }
  })
}

export async function POST(req: Request) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      await dbConnect("uniqbrio")
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

      // Check if record already exists for this tenant/instructor/date
      const existing = await InstructorAttendanceModel.findOne({
        tenantId: session.tenantId,
        instructorId,
        date
      }).lean()

      if (existing) {
        return NextResponse.json({ 
          success: false, 
          error: `Attendance record already exists for ${instructorName} on ${date}. Please edit the existing record instead.`,
          existingRecord: toUi(existing)
        }, { status: 409 })
      }

      const created = await InstructorAttendanceModel.create(toSave as any)
      return NextResponse.json({ success: true, data: toUi(created.toObject()) }, { status: 201 })
    } catch (e: any) {
      if (e?.code === 11000) {
        return NextResponse.json({ success: false, error: 'Attendance already exists for this instructor and date' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: e.message || 'Failed to create attendance' }, { status: 500 })
    }
  })
}

