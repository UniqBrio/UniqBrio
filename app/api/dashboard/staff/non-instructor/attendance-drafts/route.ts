import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorAttendanceDraftModel from "@/models/dashboard/staff/NonInstructorAttendanceDraft"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

function toUi(doc: any) {
  return {
    ...doc,
    studentId: doc.studentId || doc.instructorId,
    studentName: doc.studentName || doc.instructorName,
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
      const instructorId = String(body.instructorId ?? body.studentId ?? '') || undefined
      const instructorName = String(body.instructorName ?? body.studentName ?? '') || undefined
      const toSave: any = {
        ...body,
        tenantId: session.tenantId,
        instructorId,
        instructorName,
        savedAt,
      }
      delete toSave.studentId
      delete toSave.studentName
      const created = await NonInstructorAttendanceDraftModel.create(toSave)
      return NextResponse.json({ success: true, data: toUi(created.toObject()) }, { status: 201 })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Failed to save draft' }, { status: 500 })
    }
  })
}

