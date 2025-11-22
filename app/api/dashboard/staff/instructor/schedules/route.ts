import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import ScheduleModel from "@/models/dashboard/staff/Schedule"

// Route segment config for optimal performance
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  await dbConnect("uniqbrio")
  const items = await ScheduleModel.find().lean()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const created = await ScheduleModel.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 })
  }
}

