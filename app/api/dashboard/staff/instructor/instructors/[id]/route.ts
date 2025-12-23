import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorModel from "@/models/dashboard/staff/Instructor"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import { cascadeInstructorNameUpdate, buildInstructorFullName } from "@/lib/dashboard/cascade-updates"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
      const item = await InstructorModel.findOne({ _id: id, tenantId: session.tenantId }).lean()
      if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json(item)
    }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
        const body = await req.json()
        
        // Fetch the existing instructor to detect name changes
        const existingInstructor = await InstructorModel.findOne({
          _id: id,
          tenantId: session.tenantId
        }).lean()
        
        if (!existingInstructor) {
          return NextResponse.json({ message: "Not found" }, { status: 404 })
        }
        
        // Calculate old and new names
        const oldName = buildInstructorFullName(
          existingInstructor.firstName,
          existingInstructor.middleName,
          existingInstructor.lastName
        )
        
        const newFirstName = body.firstName || existingInstructor.firstName
        const newMiddleName = body.middleName !== undefined ? body.middleName : existingInstructor.middleName
        const newLastName = body.lastName || existingInstructor.lastName
        const newName = buildInstructorFullName(newFirstName, newMiddleName, newLastName)
        
        // Update the instructor record
        let updated = await InstructorModel.findOneAndUpdate(
          { _id: id, tenantId: session.tenantId },
          { $set: { ...body, tenantId: session.tenantId } },
          { new: true }
        )
        
        // If name changed, cascade the update to all related collections
        if (oldName !== newName) {
          try {
            const cascadeResult = await cascadeInstructorNameUpdate(
              existingInstructor.instructorId || existingInstructor.externalId || id,
              oldName,
              newName,
              session.tenantId
            )
            
            console.log('Instructor name cascade update:', cascadeResult)
          } catch (err: any) {
            console.error('Error cascading instructor name update:', err.message)
          }
        }
        
        // Also compute denormalized fields post-update
        try {
          const toKey = (s?: string) => (s || '').trim().toLowerCase()
          const fullName = [updated?.firstName, updated?.middleName, updated?.lastName].filter(Boolean).join(' ').trim()
          const key = toKey(fullName)
          const [courses, cohorts] = await Promise.all([
            CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
            CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
          ])
          const courseAssigned = Array.from(new Set((courses as any[])
            .filter(c => toKey(c?.instructor) === key)
            .map(c => (c?.name || '').trim())
            .filter(Boolean))).join(', ')
          const cohortName = Array.from(new Set((cohorts as any[])
            .filter(c => toKey(c?.instructor) === key)
            .map(c => (c?.name || '').trim())
            .filter(Boolean))).join(', ')
          const courseIds = Array.from(new Set((cohorts as any[])
            .filter(c => toKey(c?.instructor) === key)
            .map(c => (c?.courseId || '').trim())
            .filter(Boolean))).join(', ')
          const cohortIds = Array.from(new Set((cohorts as any[])
            .filter(c => toKey(c?.instructor) === key)
            .map(c => (c?.cohortId || '').trim())
            .filter(Boolean))).join(', ')
          if ((courseAssigned && courseAssigned !== (updated as any)?.courseAssigned) || (cohortName && cohortName !== (updated as any)?.cohortName) || (courseIds && courseIds !== (updated as any)?.courseIds) || (cohortIds && cohortIds !== (updated as any)?.cohortIds)) {
            const refreshed = await InstructorModel.findOneAndUpdate(
              { _id: id, tenantId: session.tenantId },
              { $set: { courseAssigned, cohortName, courseIds, cohortIds } },
              { new: true }
            )
            updated = refreshed ?? updated
          }
        } catch {}
        
        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
        return NextResponse.json(updated)
      }
    )
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
      const res = await InstructorModel.findOneAndUpdate(
        { _id: id, tenantId: session.tenantId },
        { $set: { status: "Inactive" } },
        { new: true }
      )
      if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json({ ok: true })
    }
  )
}