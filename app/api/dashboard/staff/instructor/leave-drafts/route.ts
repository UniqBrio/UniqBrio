import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { InstructorLeaveDraft, LeaveRequest } from "@/lib/dashboard/staff/models"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Retrieve all draft leave requests
export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const drafts = await InstructorLeaveDraft.find({ tenantId: session.tenantId }).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ ok: true, data: drafts })
      } catch (err: any) {
        console.error("/api/drafts GET error", err)
        return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch drafts" }, { status: 500 })
      }
    }
  );
}

// POST - Create a new draft leave request
export async function POST(req: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await req.json()
        
        // Generate ID if not provided
        if (!body.id) {
          body.id = `draft_${Date.now()}`
        }
        body.tenantId = session.tenantId
        
        // Validate required fields for draft creation
        const required = ['instructorId', 'instructorName']
        const missing = required.filter(k => !body[k])
        if (missing.length) {
          return NextResponse.json({ ok: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
        }

        const created = await InstructorLeaveDraft.create(body)
        return NextResponse.json({ ok: true, data: created })
      } catch (err: any) {
        console.error("/api/drafts POST error", err)
        return NextResponse.json({ ok: false, error: err?.message || "Failed to create draft" }, { status: 500 })
      }
    }
  );
}

// PUT - Update an existing draft leave request
export async function PUT(req: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await req.json()
        const { id, ...updates } = body || {}
        
        if (!id) {
          return NextResponse.json({ ok: false, error: "Draft ID is required" }, { status: 400 })
        }

        const updated = await InstructorLeaveDraft.findOneAndUpdate(
          { id, tenantId: session.tenantId }, 
          { $set: updates }, 
          { new: true }
        )
        
        if (!updated) {
          return NextResponse.json({ ok: false, error: 'Draft not found' }, { status: 404 })
        }

        return NextResponse.json({ ok: true, data: updated })
      } catch (err: any) {
        console.error("/api/drafts PUT error", err)
        return NextResponse.json({ ok: false, error: err?.message || "Failed to update draft" }, { status: 500 })
      }
    }
  );
}

// DELETE - Remove a draft leave request
export async function DELETE(req: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        
        if (!id) {
          return NextResponse.json({ ok: false, error: "Draft ID is required" }, { status: 400 })
        }
        
        const result = await InstructorLeaveDraft.deleteOne({ id, tenantId: session.tenantId })
        
        if (result.deletedCount === 0) {
          return NextResponse.json({ ok: false, error: 'Draft not found' }, { status: 404 })
        }
        
        return NextResponse.json({ ok: true })
      } catch (err: any) {
        console.error("/api/drafts DELETE error", err)
        return NextResponse.json({ ok: false, error: err?.message || "Failed to delete draft" }, { status: 500 })
      }
    }
  );
}
