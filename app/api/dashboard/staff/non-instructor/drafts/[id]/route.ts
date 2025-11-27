import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorDraftModel from "@/models/dashboard/staff/NonInstructorDraft"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      const { id } = await params
      await dbConnect("uniqbrio")
      const item = await NonInstructorDraftModel.findOne({ _id: id, tenantId: session.tenantId }).lean()
      if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json(item)
    }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const { id } = await params
        await dbConnect("uniqbrio")
        const body = await req.json()
        const updated = await NonInstructorDraftModel.findOneAndUpdate({ _id: id, tenantId: session.tenantId }, body, { new: true })
        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
        return NextResponse.json(updated)
      } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 400 })
      }
    }
  )
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      const { id } = await params
      await dbConnect("uniqbrio")
      const res = await NonInstructorDraftModel.findOneAndDelete({ _id: id, tenantId: session.tenantId })
      if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json({ ok: true })
    }
  )
}
