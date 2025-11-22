import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import TaskDraft from "@/models/dashboard/TaskDraft"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect("uniqbrio")
    const { id } = await params
    const body = await req.json()
    const updated = await TaskDraft.findByIdAndUpdate(
      id,
      {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.data !== undefined && { data: body.data }),
        ...(body.type !== undefined && { type: body.type }),
      },
      { new: true }
    )
    if (!updated) return NextResponse.json({ success: false, message: "Draft not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to update draft" }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect("uniqbrio")
    const { id } = await params
    const res = await TaskDraft.findByIdAndDelete(id)
    if (!res) return NextResponse.json({ success: false, message: "Draft not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to delete draft" }, { status: 400 })
  }
}