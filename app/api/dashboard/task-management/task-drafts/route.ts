import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from '@/lib/mongodb';
import TaskDraft from "@/models/dashboard/TaskDraft"

export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || undefined
    const filter = type ? { type } : {}
    const drafts = await TaskDraft.find(filter).sort({ updatedAt: -1 }).lean()
    const data = drafts.map((d: any) => ({
      id: d._id.toString(),
      title: d.title,
      data: d.data,
      type: d.type,
      createdAt: new Date(d.createdAt).toISOString(),
      updatedAt: new Date(d.updatedAt).toISOString(),
    }))
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch drafts" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const doc = await TaskDraft.create({
      title: body.title || "Untitled",
      data: body.data,
      type: body.type || "task",
    })
    return NextResponse.json({ success: true, id: doc._id.toString() }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to create draft" }, { status: 400 })
  }
}