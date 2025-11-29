import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorAttendanceDraftModel from "@/models/dashboard/staff/InstructorAttendanceDraft"
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
        const patch = await req.json()

        const updated = await InstructorAttendanceDraftModel.findOneAndUpdate(
          { _id: params.id, tenantId: session.tenantId },
          { $set: { ...patch, updatedAt: new Date() } },
          { new: true }
        ).lean()
        if (!updated) return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: toUi(updated) })
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Failed to update draft' }, { status: 500 })
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
        const res = await InstructorAttendanceDraftModel.deleteOne({ _id: params.id, tenantId: session.tenantId })
        if (!res.deletedCount) return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 })
        return NextResponse.json({ success: true })
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Failed to delete draft' }, { status: 500 })
      }
    }
  );
}
