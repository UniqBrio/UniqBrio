import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import DraftModel from "@/models/dashboard/staff/Draft"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export async function GET() {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    await dbConnect("uniqbrio")
    const items = await DraftModel.find({ tenantId: session.tenantId }).lean()
    return NextResponse.json(items)
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
      const created = await DraftModel.create({ ...body, tenantId: session.tenantId })
      return NextResponse.json(created, { status: 201 })
    } catch (e: any) {
      return NextResponse.json({ message: e.message }, { status: 400 })
    }
  })
}

