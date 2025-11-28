import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import TaskDraft from "@/models/dashboard/TaskDraft"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      await dbConnect("uniqbrio")
      const { id } = await params
      const body = await req.json()
      // Include tenantId in query for proper tenant isolation
      const updated = await TaskDraft.findOneAndUpdate(
        { _id: id, tenantId: session.tenantId },
        {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.data !== undefined && { data: body.data }),
          ...(body.type !== undefined && { type: body.type }),
        },
        { new: true }
      )
      if (!updated) return NextResponse.json({ success: false, message: "Draft not found" }, { status: 404 })
      return NextResponse.json({ success: true })
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message || "Failed to update draft" }, { status: 400 })
    }
  })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      await dbConnect("uniqbrio")
      const { id } = await params
      // Include tenantId in query for proper tenant isolation
      const res = await TaskDraft.findOneAndDelete({ _id: id, tenantId: session.tenantId })
      if (!res) return NextResponse.json({ success: false, message: "Draft not found" }, { status: 404 })
      return NextResponse.json({ success: true })
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message || "Failed to delete draft" }, { status: 400 })
    }
  })
}