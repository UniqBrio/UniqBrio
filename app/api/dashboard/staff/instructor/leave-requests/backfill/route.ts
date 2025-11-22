import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { LeaveRequest, Instructor } from "@/lib/dashboard/staff/models"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const toKey = (s?: string) => (s || "").trim().toLowerCase()

export async function GET() {
  try {
    await dbConnect("uniqbrio")

    // Load instructors with denormalized fields (preferred source)
    const instructors = await Instructor.find({}, {
      id: 1,
      externalId: 1,
      firstName: 1,
      middleName: 1,
      lastName: 1,
      name: 1,
      courseAssigned: 1,
      cohortName: 1,
    }).lean()

    const byId = new Map<string, any>()
    const byKey = new Map<string, any>()
    for (const i of instructors as any[]) {
      const full = [i.firstName, i.middleName, i.lastName].filter(Boolean).join(" ").trim() || i.name || ""
      const key = toKey(full)
      if (i?.id) byId.set(String(i.id), i)
      if (i?.externalId) byId.set(String(i.externalId), i)
      if (key) byKey.set(key, i)
    }

    // Also prepare name-based fallbacks from the Course/Cohort collections
    const [courses, cohorts] = await Promise.all([
      CourseModel.find({}).lean().catch(() => [] as any[]),
      CohortModel.find({}).lean().catch(() => [] as any[]),
    ])
  const courseByKey = new Map<string, Set<string>>()
  const cohortByKey = new Map<string, Set<string>>()
  const courseIdByKey = new Map<string, Set<string>>()
  const cohortIdByKey = new Map<string, Set<string>>()
    for (const c of courses as any[]) {
      const k = toKey(c?.instructor)
      const nm = (c?.name || "").trim()
      if (!k || !nm) continue
      if (!courseByKey.has(k)) courseByKey.set(k, new Set())
      courseByKey.get(k)!.add(nm)
    }
    for (const co of cohorts as any[]) {
      const k = toKey(co?.instructor)
      const nm = (co?.name || "").trim()
      if (!k || !nm) continue
      if (!cohortByKey.has(k)) cohortByKey.set(k, new Set())
      cohortByKey.get(k)!.add(nm)
      const cid = (co?.courseId || '').trim()
      const hid = (co?.cohortId || '').trim()
      if (cid) { if (!courseIdByKey.has(k)) courseIdByKey.set(k, new Set()); courseIdByKey.get(k)!.add(cid) }
      if (hid) { if (!cohortIdByKey.has(k)) cohortIdByKey.set(k, new Set()); cohortIdByKey.get(k)!.add(hid) }
    }

    // Load all leave requests
    const reqs = await LeaveRequest.find({}).lean()

    const ops: any[] = []
    let touched = 0
    for (const r of reqs as any[]) {
      const inst = byId.get(String(r.instructorId)) || byKey.get(toKey(r.instructorName))
      let courseName = r.courseName || inst?.courseAssigned || ""
      let cohortName = r.cohortName || inst?.cohortName || ""
      let courseId = (r as any).courseId || ""
      let cohortId = (r as any).cohortId || ""
      if ((!courseName || !cohortName)) {
        const key = toKey(inst ? [inst.firstName, inst.middleName, inst.lastName].filter(Boolean).join(" ") : r.instructorName)
        if (!courseName) courseName = Array.from(courseByKey.get(key)?.values() || []).join(", ")
        if (!cohortName) cohortName = Array.from(cohortByKey.get(key)?.values() || []).join(", ")
        if (!courseId) courseId = Array.from(courseIdByKey.get(key)?.values() || []).join(", ")
        if (!cohortId) cohortId = Array.from(cohortIdByKey.get(key)?.values() || []).join(", ")
      }
      if ((courseName && courseName !== r.courseName) || (cohortName && cohortName !== r.cohortName) || (courseId && courseId !== (r as any).courseId) || (cohortId && cohortId !== (r as any).cohortId)) {
        const $set: any = {}
        if (courseName) $set.courseName = courseName
        if (cohortName) $set.cohortName = cohortName
        if (courseId) $set.courseId = courseId
        if (cohortId) $set.cohortId = cohortId
        ops.push({ updateOne: { filter: { _id: r._id }, update: { $set } } })
        ops.push({ updateOne: { filter: { id: r.id }, update: { $set } } })
        touched++
      }
    }

    if (ops.length) await (LeaveRequest as any).bulkWrite(ops, { ordered: false })

    return NextResponse.json({ ok: true, updated: touched })
  } catch (err: any) {
    console.error("/api/leave-requests/backfill error", err)
    return NextResponse.json({ ok: false, error: err?.message || "Backfill failed" }, { status: 500 })
  }
}

