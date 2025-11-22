import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import { NonInstructorLeavePolicy } from '@/lib/dashboard/staff/models'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET returns the single (default) leave policy for non-instructors. If none exists, create one with defaults.
export async function GET() {
  try {
    await dbConnect("uniqbrio")
    let policy: any = await NonInstructorLeavePolicy.findOne({ key: 'default' }).lean()
    if (!policy) {
      policy = (await NonInstructorLeavePolicy.create({
        key: 'default',
        quotaType: 'Monthly Quota',
        autoReject: false,
        allocations: { junior: 12, senior: 16, managers: 24 },
        carryForward: true,
        workingDays: [1,2,3,4,5,6],
      })).toObject() as any
    }
    return NextResponse.json({ ok: true, data: policy })
  } catch (err: any) {
    console.error('/api/non-instructor-leave-policies GET error', err)
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch policy' }, { status: 500 })
  }
}

// PUT updates (upserts) the default policy for non-instructors
export async function PUT(req: Request) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const { quotaType, autoReject, allocations, carryForward, workingDays } = body || {}
    const quotaValues = ['Monthly Quota','Quarterly Quota','Yearly Quota']
    if (quotaType && !quotaValues.includes(quotaType)) {
      return NextResponse.json({ ok: false, error: 'Invalid quotaType' }, { status: 400 })
    }
    const update: any = {}
    if (quotaType) update.quotaType = quotaType
    if (typeof autoReject === 'boolean') update.autoReject = autoReject
    const atomicSet: Record<string, any> = {}
    if (allocations && typeof allocations === 'object') {
      Object.entries(allocations).forEach(([k, v]) => {
        const key = String(k).trim()
        const num = Number(v)
        if (!key) return
        if (!Number.isFinite(num) || num < 0) return
        if (key.includes('.') || key.includes('$')) return
        atomicSet[`allocations.${key}`] = num
      })
    }
    if (typeof carryForward === 'boolean') update.carryForward = carryForward
    if (Array.isArray(workingDays)) update.workingDays = workingDays.filter((d: any)=> Number.isInteger(d) && d>=0 && d<=6)

    const policy = await NonInstructorLeavePolicy.findOneAndUpdate(
      { key: 'default' },
      Object.keys(atomicSet).length ? { $set: { ...update, ...atomicSet } } : { $set: update },
      { upsert: true, new: true, strict: false }
    ).lean()

    return NextResponse.json({ ok: true, data: policy })
  } catch (err: any) {
    console.error('/api/non-instructor-leave-policies PUT error', err)
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update policy' }, { status: 500 })
  }
}
