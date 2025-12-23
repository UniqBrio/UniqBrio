import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorModel from "@/models/dashboard/staff/Instructor"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import { cascadeInstructorNameUpdate, buildInstructorFullName } from "@/lib/dashboard/cascade-updates"

export async function GET(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
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
      const item = await InstructorModel.findOne({ externalId, tenantId: session.tenantId }).lean()
      if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json(item)
    }
  )
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  try {
    const { externalId } = await params
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
        // Ensure indexes match the schema (drops old unique email index if it existed)
        try { await InstructorModel.syncIndexes() } catch {}
        const body = await req.json()
        if (typeof body.email === 'string' && body.email.trim() === '') {
          delete body.email
        }
        
        // Get existing instructor to detect name changes (if updating existing record)
        const existingInstructor = await InstructorModel.findOne({
          externalId,
          tenantId: session.tenantId
        }).lean()
        
        // Calculate old name if instructor exists
        const oldName = existingInstructor 
          ? buildInstructorFullName(
              existingInstructor.firstName,
              existingInstructor.middleName,
              existingInstructor.lastName
            )
          : ''
        
        let updated = await InstructorModel.findOneAndUpdate(
          { externalId, tenantId: session.tenantId },
          { $set: { ...body, externalId, tenantId: session.tenantId } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
        
        // Calculate new name after update
        const newName = buildInstructorFullName(
          updated?.firstName || '',
          updated?.middleName,
          updated?.lastName || ''
        )
        
        // If name changed and this is an update (not a new insert), cascade the update
        if (existingInstructor && oldName && oldName !== newName) {
          try {
            const cascadeResult = await cascadeInstructorNameUpdate(
              updated?.instructorId || updated?.externalId || externalId,
              oldName,
              newName,
              session.tenantId
            )
            
            console.log('Instructor name cascade update:', cascadeResult)
          } catch (err: any) {
            console.error('Error cascading instructor name update:', err.message)
          }
        }
        
        // After saving core fields, denormalize courseAssigned and cohortName by matching instructor name
        try {
          const toKey = (s?: string) => (s || '').trim().toLowerCase()
          const fullName = [updated?.firstName, updated?.middleName, updated?.lastName].filter(Boolean).join(' ').trim()
          const key = toKey(fullName)
          const [courses, cohorts] = await Promise.all([
            CourseModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
            CohortModel.find({ tenantId: session.tenantId }).lean().catch(() => [] as any[]),
          ])
          const coursesFor = (courses as any[]).filter(c => toKey(c?.instructor) === key)
          const cohortsFor = (cohorts as any[]).filter(c => toKey(c?.instructor) === key)
          const courseAssigned = Array.from(new Set(coursesFor
            .map(c => (c?.name || '').trim())
            .filter(Boolean))).join(', ')
          const cohortName = Array.from(new Set(cohortsFor
            .map(c => (c?.name || '').trim())
            .filter(Boolean))).join(', ')
          const courseIds = Array.from(new Set([
            ...coursesFor.map(c => ((c as any)?.courseId || (c as any)?.externalId || (c as any)?.id || '').trim()).filter(Boolean),
            ...cohortsFor.map(c => ((c as any)?.courseId || '').trim()).filter(Boolean),
          ])).join(', ')
          const cohortIds = Array.from(new Set(cohortsFor
            .map(c => ((c as any)?.cohortId || '').trim())
            .filter(Boolean))).join(', ')
          if ((courseAssigned && courseAssigned !== (updated as any)?.courseAssigned) || (cohortName && cohortName !== (updated as any)?.cohortName) || (courseIds && courseIds !== (updated as any)?.courseIds) || (cohortIds && cohortIds !== (updated as any)?.cohortIds)) {
            const refreshed = await InstructorModel.findOneAndUpdate(
              { externalId },
              { $set: { courseAssigned, cohortName, courseIds, cohortIds } },
              { new: true }
            )
            updated = refreshed ?? updated
          }
        } catch {}
        return NextResponse.json(updated)
      }
    )
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
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
        { externalId, tenantId: session.tenantId },
        { $set: { status: "Inactive" } },
        { new: true }
      )
      if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json({ ok: true })
    }
  )
}