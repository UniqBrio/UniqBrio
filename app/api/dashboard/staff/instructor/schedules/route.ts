import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import ScheduleModel from "@/models/dashboard/staff/Schedule"

// Route segment config for optimal performance
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  await dbConnect("uniqbrio")
  const items = await ScheduleModel.find().lean()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    // Restrict writes when on Free plan with >14 students
    const { getUserSession } = await import('@/lib/tenant/api-helpers');
    const { runWithTenantContext } = await import('@/lib/tenant/tenant-context');
    const restrictionLib = await import('@/lib/restrictions');
    const session = await getUserSession();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return runWithTenantContext({ tenantId: session.tenantId }, async () => {
      const block = await restrictionLib.assertWriteAllowed(session.tenantId!, 'schedules');
      if (block) return block;
    const body = await req.json()
    const created = await ScheduleModel.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

