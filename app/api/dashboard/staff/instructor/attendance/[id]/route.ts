import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorAttendanceModel from "@/models/dashboard/staff/InstructorAttendance"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

function toUi(doc: any) {
  return {
    ...doc,
    id: String(doc._id || doc.id),
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        // Drop course/cohort ids & names from the persisted payload per requirement
        if ('courseId' in patch) delete patch.courseId
        if ('courseName' in patch) delete patch.courseName
        if ('cohortId' in patch) delete patch.cohortId
        if ('cohortName' in patch) delete patch.cohortName
        
        // Ensure tenantId is not being overridden
        if ('tenantId' in patch) delete patch.tenantId

        // Explicitly include tenantId in both the filter and update
        const updated = await InstructorAttendanceModel.findOneAndUpdate(
          { _id: params.id, tenantId: session.tenantId },
          { $set: { ...patch, tenantId: session.tenantId } },
          { new: true }
        ).lean()

        if (!updated) {
          return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, data: toUi(updated) })
      } catch (e: any) {
        console.error('PUT /attendance/[id] error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Failed to update attendance' }, { status: 500 })
      }
    }
  );
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        // Explicitly include tenantId in the query
        const res = await InstructorAttendanceModel.deleteOne({ 
          _id: params.id, 
          tenantId: session.tenantId 
        })
        if (!res.deletedCount) {
          return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
      } catch (e: any) {
        console.error('DELETE /attendance/[id] error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Failed to delete attendance' }, { status: 500 })
      }
    }
  );
}
