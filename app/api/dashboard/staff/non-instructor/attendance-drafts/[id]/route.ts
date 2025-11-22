import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorAttendanceDraftModel from "@/models/dashboard/staff/NonInstructorAttendanceDraft"
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

    if (patch.instructorId == null && patch.studentId) patch.instructorId = patch.studentId
    if (patch.instructorName == null && patch.studentName) patch.instructorName = patch.studentName
    if ('studentId' in patch) delete patch.studentId
    if ('studentName' in patch) delete patch.studentName

    const updated = await NonInstructorAttendanceDraftModel.findByIdAndUpdate(
      _id,
      { $set: { ...patch, updatedAt: new Date() } },
      { new: true }
    ).lean()
    if (!updated) return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: toUi(updated) })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to update draft' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect("uniqbrio")
    const res = await NonInstructorAttendanceDraftModel.deleteOne({ _id: params.id as any })
    if (!res.deletedCount) return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to delete draft' }, { status: 500 })
  }
}
