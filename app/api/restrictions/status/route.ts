import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { getRestrictionStatus } from '@/lib/restrictions';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getUserSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized: No tenant context' }, { status: 401 });
  }
  return runWithTenantContext({ tenantId: session.tenantId }, async () => {
    const status = await getRestrictionStatus(session.tenantId!);
    return NextResponse.json({ success: true, ...status });
  });
}
