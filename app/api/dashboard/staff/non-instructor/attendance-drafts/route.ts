import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorAttendanceDraftModel from "@/models/dashboard/staff/NonInstructorAttendanceDraft"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

function toUi(doc: any) {
  return {
    ...doc,
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
      const items = await NonInstructorAttendanceDraftModel.find({ tenantId: session.tenantId }).sort({ updatedAt: -1 }).lean()
      return NextResponse.json({ success: true, data: items.map(toUi) })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Failed to fetch drafts' }, { status: 500 })
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
      const savedAt = body.savedAt || new Date().toISOString()
      const instructorId = body.instructorId || undefined
      const instructorName = body.instructorName || undefined
      
      const toSave: any = {
        tenantId: session.tenantId,
        instructorId,
        instructorName,
        date: body.date,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
        status: body.status || 'present',
        cohortTiming: body.cohortTiming ?? null,
        notes: body.notes ?? null,
        savedAt,
      }
      
      const created = await NonInstructorAttendanceDraftModel.create(toSave)
      return NextResponse.json({ success: true, data: toUi(created.toObject()) }, { status: 201 })
    } catch (e: any) {
      console.error('Error saving attendance draft:', e)
      return NextResponse.json({ success: false, error: e.message || 'Failed to save draft' }, { status: 500 })
    }
  })
}

