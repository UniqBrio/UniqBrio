import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from '@/lib/mongodb';
import TaskDraft from "@/models/dashboard/TaskDraft"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export async function GET(req: NextRequest) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      await dbConnect("uniqbrio")
      const { searchParams } = new URL(req.url)
      const type = searchParams.get("type") || undefined
      const filter = type ? { tenantId: session.tenantId, type } : { tenantId: session.tenantId }
      const drafts = await TaskDraft.find(filter).sort({ updatedAt: -1 }).lean()
    const data = drafts.map((d: any) => ({
      id: d._id.toString(),
      title: d.title,
      data: d.data,
      type: d.type,
      createdAt: new Date(d.createdAt).toISOString(),
      updatedAt: new Date(d.updatedAt).toISOString(),
    }))
      return NextResponse.json({ success: true, data })
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message || "Failed to fetch drafts" }, { status: 500 })
    }
  })
}

export async function POST(req: NextRequest) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      await dbConnect("uniqbrio")
      const body = await req.json()
      const doc = await TaskDraft.create({
        tenantId: session.tenantId,
        title: body.title || "Untitled",
        data: body.data,
        type: body.type || "task",
      })
      return NextResponse.json({ success: true, id: doc._id.toString() }, { status: 201 })
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message || "Failed to create draft" }, { status: 400 })
    }
  })
}