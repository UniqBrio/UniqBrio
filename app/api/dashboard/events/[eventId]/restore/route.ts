import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Event from '@/models/dashboard/events/Event';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/events/[eventId]/restore
 * Restore a soft-deleted event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
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

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const deletedEvent = await Event.findOne({ eventId, isDeleted: true });

    if (!deletedEvent) {
      return NextResponse.json(
        { success: false, error: 'Deleted event not found' },
        { status: 404 }
      );
    }

    const restoredEvent = await Event.findOneAndUpdate(
      { eventId, isDeleted: true },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true }
    );

        return NextResponse.json(
          {
            success: true,
            message: 'Event restored successfully',
            data: restoredEvent,
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error restoring event:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to restore event' },
          { status: 500 }
        );
      }
    }
  );
}
