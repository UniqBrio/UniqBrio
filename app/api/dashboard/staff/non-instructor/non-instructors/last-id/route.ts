import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorModel from "@/models/dashboard/staff/NonInstructor"

// Returns the highest NON INS number found and a suggested next ID
export async function GET() {
  try {
    await dbConnect("uniqbrio")
    const docs = await NonInstructorModel.find({}, { externalId: 1 }).lean()
    let maxNum = 0
    let maxWidth = 4
    for (const d of docs) {
      const ext = (d as any)?.externalId
      if (typeof ext === 'string') {
        const m = /NON\s?INS(\d+)/i.exec(ext)
        if (m) {
          const n = parseInt(m[1], 10)
          if (!Number.isNaN(n)) {
            if (n > maxNum) maxNum = n
            if (m[1].length > maxWidth) maxWidth = m[1].length
          }
        }
      }
    }
    const nextNum = maxNum + 1
    const pad = (n: number, w: number) => `NON INS${String(n).padStart(Math.max(4, w), '0')}`
    const nextExternalId = pad(nextNum, maxWidth)
    return NextResponse.json({ ok: true, lastNumber: maxNum, width: Math.max(4, maxWidth), nextExternalId })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 })
  }
}

