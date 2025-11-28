import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorModel from "@/models/dashboard/staff/NonInstructor"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'
import { logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from "@/lib/audit-logger"
import { AuditModule } from "@/models/AuditLog"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      const { id } = await params
      await dbConnect("uniqbrio")
      const res = await NonInstructorModel.findOne({ _id: id, tenantId: session.tenantId }).lean()
      if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
      return NextResponse.json(res)
    }
  );
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        const { id } = await params
        await dbConnect("uniqbrio")
        const body = await req.json()
        
        // Get existing record for audit trail with tenant isolation
        const existing = await NonInstructorModel.findOne({ _id: id, tenantId: session.tenantId }).lean()
        if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 })
        
        const updated = await NonInstructorModel.findOneAndUpdate({ _id: id, tenantId: session.tenantId }, body, { new: true })
        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
        
        // Track field changes
        const changes: Record<string, { old: any; new: any }> = {}
        const fieldsToTrack = ['externalId', 'firstName', 'lastName', 'email', 'phone', 'role', 'status']
        for (const field of fieldsToTrack) {
          if (body[field] !== undefined && (existing as any)[field] !== body[field]) {
            changes[field] = { old: (existing as any)[field], new: body[field] }
          }
        }
        
        const entityName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'Unnamed Non-Instructor'
        
        // Convert changes to IFieldChange array format
        const fieldChanges = Object.entries(changes).map(([field, vals]) => ({
          field,
          oldValue: JSON.stringify(vals.old),
          newValue: JSON.stringify(vals.new)
        }))
        
        // Audit log
        await logEntityUpdate(
          AuditModule.STAFF,
          (updated._id as any).toString(),
          entityName,
          fieldChanges,
          session.userId,
          session.email,
          'super_admin',
          session.tenantId,
          getClientIp(req.headers),
          getUserAgent(req.headers)
        )
        
        return NextResponse.json(updated)
      } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 400 })
      }
    }
  );
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      const { id } = await params
      await dbConnect("uniqbrio")
      
      // Get existing record for audit trail
      const existing = await NonInstructorModel.findOne({ _id: id, tenantId: session.tenantId }).lean()
      if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 })
      
      const res = await NonInstructorModel.findOneAndUpdate({ _id: id, tenantId: session.tenantId }, { $set: { status: "Inactive" } }, { new: true })
      if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 })
      
      const entityName = `${(existing as any).firstName || ''} ${(existing as any).lastName || ''}`.trim() || 'Unnamed Non-Instructor'
      
      // Audit log
      await logEntityDelete(
        AuditModule.STAFF,
        id,
        entityName,
        session.userId,
        session.email,
        'super_admin',
        session.tenantId,
        getClientIp(req.headers),
        getUserAgent(req.headers)
      )
      
      return NextResponse.json({ ok: true })
    }
  );
}
