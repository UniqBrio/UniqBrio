import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorModel from "@/models/dashboard/staff/NonInstructor"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import { logEntityCreate, getClientIp, getUserAgent } from "@/lib/audit-logger"
import { AuditModule } from "@/models/AuditLog"

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
      // Only return active (non-deleted) records - tenant isolation is handled by tenant plugin
      // Status "Inactive" means deleted (set by DELETE endpoint)
      let items: any[] = await NonInstructorModel.find({
    $and: [
      { $or: [ { status: { $exists: false } }, { status: { $ne: "Inactive" } } ] },
      { $or: [ { isDeleted: { $exists: false } }, { isDeleted: { $ne: true } } ] }
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
          NonInstructorModel.findOneAndUpdate({ _id: it._id, tenantId: session.tenantId }, { externalId: newExternalId }, { new: true })
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
        
        // Generate tenant-scoped non-instructor ID
        const { generateNonInstructorId } = await import('@/lib/dashboard/id-generators')
        const nonInstructorId = await generateNonInstructorId(session.tenantId)
        
        console.log('[NonInstructor POST] Creating staff with tenantId:', session.tenantId);
        console.log('[NonInstructor POST] Staff name:', body.firstName, body.lastName);
        
        const created = await NonInstructorModel.create({
          ...body,
          externalId: nonInstructorId, // Assign generated ID
          tenantId: session.tenantId // Explicitly set tenantId
        })
        
        console.log('[NonInstructor POST] Created staff with:', {
          id: created._id,
          externalId: created.externalId,
          name: `${created.firstName} ${created.lastName}`,
          tenantId: created.tenantId
        });
        
        // Audit log
        await logEntityCreate({
          module: AuditModule.STAFF,
          entityType: 'non_instructor',
          entityId: created._id.toString(),
          entityName: created.name || 'Unnamed Non-Instructor',
          data: {
            externalId: created.externalId,
            name: created.name,
            email: created.email,
            phone: created.phone,
            role: created.role
          },
          userId: session.userId,
          userEmail: session.email,
          userRole: 'super_admin',
          tenantId: session.tenantId,
          ipAddress: getClientIp(req.headers),
          userAgent: getUserAgent(req.headers)
        })
        
        return NextResponse.json(created, { status: 201 })
      } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 400 })
      }
    }
  )
}

