import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from '@/lib/mongodb';
import Task from "@/models/dashboard/Task"
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Route segment config for optimal performance
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Map client payload to DB document
function toDoc(body: any) {
  return {
    name: body.name,
    description: body.description || undefined,
    assignedTo: body.assignedTo ?? "Self",
    targetDate: new Date(body.targetDate),
    createdOn: new Date(body.createdOn),
    priority: body.priority,
    status: body.status || "open",
    remarks: body.remarks || undefined,
    isCompleted: !!body.isCompleted,
    completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
  }
}

export async function GET() {
  const session = await getUserSession();
  
  return runWithTenantContext(
    { tenantId: session?.tenantId || 'default' },
    async () => {
  try {
    await dbConnect("uniqbrio")
    const tasks = await Task.find().sort({ targetDate: 1, createdAt: -1 }).lean()

    // Normalize for client
    const data = tasks.map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
      description: t.description ?? "",
      assignedTo: t.assignedTo ?? "Self",
      targetDate: new Date(t.targetDate).toISOString().slice(0, 10),
      createdOn: new Date(t.createdOn).toISOString().slice(0, 10),
      priority: t.priority,
      status: t.status,
      remarks: t.remarks ?? "",
      isCompleted: !!t.isCompleted,
      completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : undefined,
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch tasks" }, { status: 500 })
  }
    }
  );
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  
  return runWithTenantContext(
    { tenantId: session?.tenantId || 'default' },
    async () => {
  try {
    const body = await req.json()
    await dbConnect("uniqbrio")
    const doc = await Task.create(toDoc(body))
    return NextResponse.json({ success: true, id: doc._id.toString() }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to create task" }, { status: 400 })
  }
    }
  );
}