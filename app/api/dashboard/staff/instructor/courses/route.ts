import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import CourseModel from "@/models/dashboard/staff/Course"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

// Route segment config for optimal performance
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
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
      await dbConnect("uniqbrio")
      const items = await CourseModel.find({
        $or: [ { isDeleted: { $exists: false } }, { isDeleted: { $ne: true } } ]
      }).lean()
      return NextResponse.json(items)
    }
  )
}

export async function POST(req: NextRequest) {
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
        await dbConnect("uniqbrio")
        const body = await req.json()
        const created = await CourseModel.create(body)
        return NextResponse.json(created, { status: 201 })
      } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 400 })
      }
    }
  )
}

