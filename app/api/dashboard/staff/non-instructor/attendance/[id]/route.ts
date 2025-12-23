import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorAttendanceModel from "@/models/dashboard/staff/NonInstructorAttendance"
import mongoose from "mongoose"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

function toUi(doc: any) {
  return {
    ...doc,
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
        const patch = await req.json()
        const _id = new mongoose.Types.ObjectId(params.id)

        // No student field conversion needed - using instructorId/instructorName directly
        if ('courseId' in patch) delete patch.courseId
        if ('courseName' in patch) delete patch.courseName
        if ('cohortId' in patch) delete patch.cohortId
        if ('cohortName' in patch) delete patch.cohortName

        const updated = await NonInstructorAttendanceModel.findOneAndUpdate(
          { _id, tenantId: session.tenantId },
          { $set: { ...patch } },
          { new: true }
        ).lean()

        if (!updated) {
          return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, data: toUi(updated) })
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Failed to update attendance' }, { status: 500 })
      }
    }
  )
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
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
        const res = await NonInstructorAttendanceModel.deleteOne({ _id: params.id as any, tenantId: session.tenantId })
        if (!res.deletedCount) {
          return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Failed to delete attendance' }, { status: 500 })
      }
    }
  )
}
