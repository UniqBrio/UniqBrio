import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorDraftModel from "@/models/dashboard/staff/NonInstructorDraft"

export async function GET(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
  await dbConnect("uniqbrio")
  const item = await NonInstructorDraftModel.findOne({ externalId }).lean()
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  try {
    const { externalId } = await params
    await dbConnect("uniqbrio")
    const body = await req.json()
    const updated = await NonInstructorDraftModel.findOneAndUpdate({ externalId }, body, { new: true, upsert: true })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
  await dbConnect("uniqbrio")
  const res = await NonInstructorDraftModel.findOneAndDelete({ externalId })
  if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
