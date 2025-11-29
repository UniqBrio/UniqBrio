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
  
  if (!session?.tenantId) {
    console.error('[Task GET] No tenant context found in session');
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context', success: false, message: 'Please log in again' },
      { status: 401 }
    );
  }
  
  console.log('[Task GET] Fetching tasks for tenantId:', session.tenantId);
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio")
    console.log('[Task GET] Connected to database, querying tasks for tenant:', session.tenantId);
    // Explicit tenantId filter for proper tenant isolation
    const tasks = await Task.find({ tenantId: session.tenantId }).sort({ targetDate: 1, createdAt: -1 }).lean()
    console.log('[Task GET] Found tasks:', tasks.length);

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
    console.error('[Task GET] Error fetching tasks:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch tasks" }, { status: 500 })
  }
    }
  );
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    console.error('[Task POST] No tenant context found in session');
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context', success: false, message: 'Please log in again' },
      { status: 401 }
    );
  }
  
  console.log('[Task POST] Creating task for tenantId:', session.tenantId);
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    const body = await req.json()
    console.log('[Task POST] Request body:', body);
    await dbConnect("uniqbrio")
    
    // Include tenantId for proper tenant isolation
    const taskData = { ...toDoc(body), tenantId: session.tenantId };
    console.log('[Task POST] Creating task with data:', taskData);
    
    const doc = await Task.create(taskData)
    console.log('[Task POST] Task created successfully:', doc._id.toString());
    
    return NextResponse.json({ success: true, id: doc._id.toString() }, { status: 201 })
  } catch (err: any) {
    console.error('[Task POST] Error creating task:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message || "Failed to create task" }, { status: 400 })
  }
    }
  );
}