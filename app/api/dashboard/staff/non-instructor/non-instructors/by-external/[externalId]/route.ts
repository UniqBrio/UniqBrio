import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorModel from "@/models/dashboard/staff/NonInstructor"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export async function GET(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
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
      const { externalId } = await params
      await dbConnect("uniqbrio")
      const item = await NonInstructorModel.findOne({ externalId }).lean()
      if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json(item)
    }
  );
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
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
        const { externalId } = await params
        await dbConnect("uniqbrio")
        try { await NonInstructorModel.syncIndexes() } catch {}
        const body = await req.json()
        if (typeof body.email === 'string' && body.email.trim() === '') {
          delete body.email
        }
        const updated = await NonInstructorModel.findOneAndUpdate(
          { externalId },
          { $set: { ...body, externalId } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
        return NextResponse.json(updated)
      } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 400 })
      }
    }
  );
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
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
      const { externalId } = await params
      await dbConnect("uniqbrio")
      const res = await NonInstructorModel.findOneAndUpdate({ externalId }, { $set: { status: "Inactive" } }, { new: true })
      if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json({ ok: true })
    }
  );
}
