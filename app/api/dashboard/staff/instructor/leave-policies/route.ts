import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import { LeavePolicy } from '@/lib/dashboard/staff/models'
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET returns the single (default) leave policy. If none exists, create one with defaults.
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
        // Query with explicit tenantId for tenant isolation
        let policy = await LeavePolicy.findOne({ key: 'default', tenantId: session.tenantId }).lean()
    if (!policy) {
      const newPolicy = await LeavePolicy.create({
        key: 'default',
        tenantId: session.tenantId,
        quotaType: 'Monthly Quota',
        autoReject: false,
        allocations: { junior: 12, senior: 16, managers: 24 },
        carryForward: true,
        workingDays: [1,2,3,4,5,6],
      })
        policy = await LeavePolicy.findOne({ key: 'default', tenantId: session.tenantId }).lean()
      }
      return NextResponse.json({ ok: true, data: policy })
    } catch (err: any) {
      console.error('/api/leave-policies GET error', err)
      return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch policy' }, { status: 500 })
    }
  });
}

// PUT updates (upserts) the default policy
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
  const { quotaType, autoReject, allocations, carryForward, workingDays } = body || {}
    // Basic validation
    const quotaValues = ['Monthly Quota','Quarterly Quota','Yearly Quota']
    if (quotaType && !quotaValues.includes(quotaType)) {
      return NextResponse.json({ ok: false, error: 'Invalid quotaType' }, { status: 400 })
    }
    
    const setOperations: Record<string, any> = {}
    
    // Add tenantId to ensure it's always set
    setOperations.tenantId = session.tenantId
    
    if (quotaType) setOperations.quotaType = quotaType
    if (typeof autoReject === 'boolean') setOperations.autoReject = autoReject
    if (typeof carryForward === 'boolean') setOperations.carryForward = carryForward
    if (Array.isArray(workingDays)) setOperations.workingDays = workingDays.filter((d: any)=> Number.isInteger(d) && d>=0 && d<=6)
    
    // Handle allocations - set the entire object
    if (allocations && typeof allocations === 'object') {
      const validAllocations: Record<string, number> = {}
      Object.entries(allocations).forEach(([k, v]) => {
        const key = String(k).trim()
        const num = Number(v)
        if (!key) return
        if (!Number.isFinite(num) || num < 0) return
        // Mongo keys cannot contain dots or $; simple guard
        if (key.includes('.') || key.includes('$')) return
        validAllocations[key] = num
      })
      if (Object.keys(validAllocations).length > 0) {
        setOperations.allocations = validAllocations
      }
    }

    // Update with explicit tenantId for tenant isolation
    const policy = await LeavePolicy.findOneAndUpdate(
      { key: 'default', tenantId: session.tenantId },
      { $set: setOperations },
      { upsert: true, new: true, strict: false }
    ).lean()

    return NextResponse.json({ ok: true, data: policy })
  } catch (err: any) {
    console.error('/api/leave-policies PUT error', err)
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update policy' }, { status: 500 })
  }
  });
}
