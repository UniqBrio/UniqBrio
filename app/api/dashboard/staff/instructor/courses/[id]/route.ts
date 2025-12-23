import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import CourseModel from "@/models/dashboard/staff/Course"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import { cascadeCourseNameUpdate } from "@/lib/dashboard/cascade-updates"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    const { id } = await params
    await dbConnect("uniqbrio")
    const item = await CourseModel.findOne({ _id: id, tenantId: session.tenantId }).lean()
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    try {
      const { id } = await params
      await dbConnect("uniqbrio")
      const body = await req.json()
      
      // Get the old course to check for name changes
      const oldCourse = await CourseModel.findOne({ _id: id, tenantId: session.tenantId })
      const oldName = oldCourse?.name
      
      const updated = await CourseModel.findOneAndUpdate({ _id: id, tenantId: session.tenantId }, body, { new: true })
      if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
      
      // If course name changed, cascade the update
      if (oldName && updated.name && oldName !== updated.name) {
        try {
          const cascadeResult = await cascadeCourseNameUpdate(
            String(updated._id),
            oldName,
            updated.name,
            session.tenantId
          )
          console.log('Course name cascade update:', cascadeResult)
        } catch (err: any) {
          console.error('Error cascading course name update:', err.message)
        }
      }
      
      return NextResponse.json(updated)
    } catch (e: any) {
      return NextResponse.json({ message: e.message }, { status: 400 })
    }
  })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    const { id } = await params
    await dbConnect("uniqbrio")
    const res = await CourseModel.findOneAndDelete({ _id: id, tenantId: session.tenantId })
    if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  })
}