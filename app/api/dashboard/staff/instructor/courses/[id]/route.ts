import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import CourseModel from "@/models/dashboard/staff/Course"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await dbConnect("uniqbrio")
  const item = await CourseModel.findById(id).lean()
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect("uniqbrio")
    const body = await req.json()
    const updated = await CourseModel.findByIdAndUpdate(id, body, { new: true })
    if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await dbConnect("uniqbrio")
  const res = await CourseModel.findByIdAndDelete(id)
  if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}