import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorDraftModel from "@/models/dashboard/staff/NonInstructorDraft"

export async function GET() {
  await dbConnect("uniqbrio")
  const items = await NonInstructorDraftModel.find().lean()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const created = await NonInstructorDraftModel.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

