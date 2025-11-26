import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import { NonInstructorLeaveRequest } from '@/lib/dashboard/staff/models'
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const { searchParams } = new URL(request.url)
        const checkType = searchParams.get('check')

        if (checkType) {
          const count = await NonInstructorLeaveRequest.countDocuments({ leaveType: checkType })
          return NextResponse.json({ isUsed: count > 0, count })
        }

        const types = await NonInstructorLeaveRequest.distinct('leaveType')
        const valid = (types as string[]).filter((t) => t && t.trim() !== '')
        return NextResponse.json({ leaveTypes: valid })
      } catch (e) {
        console.error('GET /api/non-instructor-leave-types error', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        // Mirror instructor behavior: no separate storage required
        const _ = await request.json()
        return NextResponse.json({ success: true })
      } catch (e) {
        console.error('POST /api/non-instructor-leave-types error', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  );
}
