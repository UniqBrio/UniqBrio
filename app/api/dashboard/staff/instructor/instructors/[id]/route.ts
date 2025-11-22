import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorModel from "@/models/dashboard/staff/Instructor"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await dbConnect("uniqbrio")
  const item = await InstructorModel.findById(id).lean()
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect("uniqbrio")
    const body = await req.json()
    let updated = await InstructorModel.findByIdAndUpdate(id, body, { new: true })
    // Also compute denormalized fields post-update
    try {
      const toKey = (s?: string) => (s || '').trim().toLowerCase()
      const fullName = [updated?.firstName, updated?.middleName, updated?.lastName].filter(Boolean).join(' ').trim()
      const key = toKey(fullName)
      const [courses, cohorts] = await Promise.all([
        CourseModel.find({}).lean().catch(() => [] as any[]),
        CohortModel.find({}).lean().catch(() => [] as any[]),
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
        const refreshed = await InstructorModel.findByIdAndUpdate(id, { $set: { courseAssigned, cohortName, courseIds, cohortIds } }, { new: true })
        updated = refreshed ?? updated
      }
    } catch {}
    if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await dbConnect("uniqbrio")
  const res = await InstructorModel.findByIdAndUpdate(id, { $set: { status: "Inactive" } }, { new: true })
  if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}