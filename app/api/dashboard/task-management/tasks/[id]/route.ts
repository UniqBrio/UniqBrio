import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Task from "@/models/dashboard/Task"
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    const body = await req.json()
    console.log('Task update request - ID:', id, 'Body remarks:', body.remarks)
    await dbConnect("uniqbrio")
    const updateData = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      ...(body.targetDate !== undefined && { targetDate: new Date(body.targetDate) }),
      ...(body.createdOn !== undefined && { createdOn: new Date(body.createdOn) }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.remarks !== undefined && { remarks: body.remarks }),
      ...(body.isCompleted !== undefined && { isCompleted: !!body.isCompleted }),
      ...(body.completedAt !== undefined && { completedAt: body.completedAt ? new Date(body.completedAt) : undefined }),
    }
    console.log('Update data being sent to MongoDB:', updateData)
    // Include tenantId in query for proper tenant isolation
    const updated = await Task.findOneAndUpdate(
      { _id: id, tenantId: session.tenantId },
      updateData,
      { new: true }
    )
    console.log('Updated task from MongoDB:', updated?.remarks)
    if (!updated) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
    
    // Return the updated task data to ensure client stays in sync
    const taskData = {
      id: updated._id.toString(),
      name: updated.name,
      description: updated.description ?? "",
      assignedTo: updated.assignedTo ?? "Self",
      targetDate: new Date(updated.targetDate).toISOString().slice(0, 10),
      createdOn: new Date(updated.createdOn).toISOString().slice(0, 10),
      priority: updated.priority,
      status: updated.status,
      remarks: updated.remarks ?? "",
      isCompleted: !!updated.isCompleted,
      completedAt: updated.completedAt ? new Date(updated.completedAt).toISOString() : undefined,
    }
    
    return NextResponse.json({ success: true, data: taskData })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to update task" }, { status: 400 })
  }
    }
  );
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    await dbConnect("uniqbrio")
    // Include tenantId in query for proper tenant isolation
    const res = await Task.findOneAndDelete({ _id: id, tenantId: session.tenantId })
    if (!res) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to delete task" }, { status: 400 })
  }
    }
  );
}