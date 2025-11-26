import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorModel from "@/models/dashboard/staff/NonInstructor"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

// Route segment config for optimal performance
export const dynamic = 'force-dynamic' // Always fetch fresh data for staff changes
export const revalidate = 0 // No caching for staff data

export async function GET() {
  const session = await getUserSession()
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    )
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      await dbConnect("uniqbrio")
      // Only return non-inactive records. Also exclude legacy soft-deleted where deleted_data === false if present.
      let items: any[] = await NonInstructorModel.find({
    $and: [
      { $or: [ { status: { $exists: false } }, { status: { $ne: "Inactive" } } ] },
      { $or: [ { deleted_data: { $exists: false } }, { deleted_data: { $ne: false } } ] }
    ]
  }).lean()

  // Backfill externalId for legacy documents that lack one so the UI can search by NON INS codes.
  try {
    const existingNums: number[] = []
    for (const it of items) {
      if (typeof it.externalId === 'string') {
        const m = /NON\s?INS(\d+)/i.exec(it.externalId)
        if (m) existingNums.push(parseInt(m[1], 10))
      }
    }
    let next = existingNums.length ? Math.max(...existingNums) + 1 : 1
    const pad = (n: number, width: number = 4) => `NON INS${String(n).padStart(width, '0')}`
    const updates: Promise<any>[] = []
    let mutated = false
    // Determine current width from any existing max width to preserve formatting growth
    const currentWidth = existingNums.length ? Math.max(4, String(Math.max(...existingNums)).length) : 4
    for (const it of items) {
      if (!it.externalId) {
        const newExternalId = pad(next++, currentWidth)
        updates.push(
          NonInstructorModel.findByIdAndUpdate(it._id, { externalId: newExternalId }, { new: true })
            .lean()
            .then(updated => { if (updated) Object.assign(it, { externalId: updated.externalId }) })
            .catch(() => {})
        )
        mutated = true
      }
    }
    if (updates.length) {
      await Promise.allSettled(updates)
      if (mutated) {
        // Optional: could re-fetch docs for stronger consistency guarantees
      }
    }
  } catch (e) {
    console.error('Failed to backfill non-instructor externalIds', e)
  }

  return NextResponse.json({ ok: true, data: items })
    }
  )
}

export async function POST(req: NextRequest) {
  const session = await getUserSession()
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    )
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        try { await NonInstructorModel.syncIndexes() } catch {}
        const body = await req.json()
        if (typeof body.email === 'string' && body.email.trim() === '') {
          delete body.email
        }
        const created = await NonInstructorModel.create(body)
        return NextResponse.json(created, { status: 201 })
      } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 400 })
      }
    }
  )
}

