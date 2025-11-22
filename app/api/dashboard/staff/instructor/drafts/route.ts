import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import DraftModel from "@/models/dashboard/staff/Draft"

export async function GET() {
  await dbConnect("uniqbrio")
  const items = await DraftModel.find().lean()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const created = await DraftModel.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

