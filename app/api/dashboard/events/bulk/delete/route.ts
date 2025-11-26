import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Event from '@/models/dashboard/events/Event';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/events/bulk/delete
 * Permanently delete multiple events
 */
export async function POST(request: NextRequest) {
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
        await dbConnect("uniqbrio");

    const body = await request.json();
    const { eventIds } = body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'eventIds array is required and cannot be empty' },
        { status: 400 }
      );
    }

    const result = await Event.deleteMany(
      { eventId: { $in: eventIds } }
    );

        return NextResponse.json(
          {
            success: true,
            message: `${result.deletedCount} event(s) deleted successfully`,
            data: {
              deletedCount: result.deletedCount,
            },
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error bulk deleting events:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to bulk delete events' },
          { status: 500 }
        );
      }
    }
  );
}
