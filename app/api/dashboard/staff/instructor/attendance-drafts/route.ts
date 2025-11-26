import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorAttendanceDraftModel from "@/models/dashboard/staff/InstructorAttendanceDraft"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

// Map DB doc to current UI shape (derive student* from instructor*)
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
      const items = await InstructorAttendanceDraftModel.find({ tenantId: session.tenantId }).sort({ updatedAt: -1 }).lean()
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
      // Accept student* or instructor*, store only instructor*
      const instructorId = String(body.instructorId ?? body.studentId ?? '') || undefined
      const instructorName = String(body.instructorName ?? body.studentName ?? '') || undefined
      const toSave: any = {
        ...body,
        tenantId: session.tenantId,
        instructorId,
        instructorName,
        savedAt,
      }
      // Remove student fields from storage
      delete toSave.studentId
      delete toSave.studentName
      const created = await InstructorAttendanceDraftModel.create(toSave)
      return NextResponse.json({ success: true, data: toUi(created.toObject()) }, { status: 201 })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Failed to save draft' }, { status: 500 })
    }
  })
}

