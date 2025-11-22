import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import CohortModel from "@/models/dashboard/staff/Cohort"

export async function GET() {
  await dbConnect("uniqbrio")
  const items = await CohortModel.find().lean()
  return NextResponse.json(items)
}

