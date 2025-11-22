import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorAttendanceModel from "@/models/dashboard/staff/InstructorAttendance"
import mongoose from "mongoose"

function toUi(doc: any) {
  return {
    ...doc,
    studentId: doc.studentId || doc.instructorId,
    studentName: doc.studentName || doc.instructorName,
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio")
    const patch = await req.json()
    const _id = new mongoose.Types.ObjectId(params.id)

  // Normalize incoming fields
    if (patch.instructorId == null && patch.studentId) patch.instructorId = patch.studentId
    if (patch.instructorName == null && patch.studentName) patch.instructorName = patch.studentName
    // Do not persist student* fields in DB
    if ('studentId' in patch) delete patch.studentId
    if ('studentName' in patch) delete patch.studentName
  // Also drop course/cohort ids & names from the persisted payload per requirement
  if ('courseId' in patch) delete patch.courseId
  if ('courseName' in patch) delete patch.courseName
  if ('cohortId' in patch) delete patch.cohortId
  if ('cohortName' in patch) delete patch.cohortName

    const updated = await InstructorAttendanceModel.findByIdAndUpdate(
      _id,
      { $set: { ...patch } },
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: toUi(updated) })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to update attendance' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio")
    const res = await InstructorAttendanceModel.deleteOne({ _id: params.id as any })
    if (!res.deletedCount) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to delete attendance' }, { status: 500 })
  }
}
