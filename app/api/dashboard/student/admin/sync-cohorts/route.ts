import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/tenant/api-helpers';

/**
 * Admin endpoint to trigger cohort-student sync
 * This proxies to the PATCH /api/cohorts endpoint
 */
export async function POST() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/cohorts`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error triggering sync:', error);
    return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 500 });
  }
}
