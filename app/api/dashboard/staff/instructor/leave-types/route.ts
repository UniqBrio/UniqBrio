import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { LeaveRequest } from '@/lib/dashboard/staff/models';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");
        const { searchParams } = new URL(request.url);
        const checkType = searchParams.get('check');

        if (checkType) {
          const count = await LeaveRequest.countDocuments({ leaveType: checkType });
          return NextResponse.json({ isUsed: count > 0, count });
        }

        const types = await LeaveRequest.distinct('leaveType');
        const valid = (types as string[]).filter((t) => t && t.trim() !== '');
        return NextResponse.json({ leaveTypes: valid });
      } catch (e) {
        console.error('GET /api/leave-types error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    // This endpoint mirrors /api/roles sync behavior: no separate storage required.
    // Custom types are effectively persisted when a leave request uses them.
    const body = await request.json();
    
    // Validate custom leave types - only letters and spaces allowed
    if (body.customLeaveTypes && Array.isArray(body.customLeaveTypes)) {
      const invalid = body.customLeaveTypes.filter((type: string) => !/^[a-zA-Z\s]+$/.test(type));
      if (invalid.length > 0) {
        return NextResponse.json({ 
          error: 'Invalid leave type names: only letters and spaces are allowed',
          invalid 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/leave-types error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
