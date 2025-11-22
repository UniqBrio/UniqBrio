import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import DraftModel from "@/models/dashboard/staff/Draft"

export async function GET(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
  await dbConnect("uniqbrio")
  const item = await DraftModel.findOne({ externalId }).lean()
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  try {
    const { externalId } = await params
    await dbConnect("uniqbrio")
    const body = await req.json()
    const updated = await DraftModel.findOneAndUpdate({ externalId }, body, { new: true, upsert: true })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
  await dbConnect("uniqbrio")
  const res = await DraftModel.findOneAndDelete({ externalId })
  if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}