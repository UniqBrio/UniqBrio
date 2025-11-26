import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
// Event model is now available in models/events/Event.ts
import Event from '@/models/dashboard/events/Event';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

/**
 * POST /api/events/[eventId]/publish
 * Publish an event
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

    const event = await Event.findOne({ eventId, isDeleted: { $ne: true } });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Event is already published' },
        { status: 400 }
      );
    }

    const publishedEvent = await Event.findOneAndUpdate(
      { eventId },
      {
        $set: {
          isPublished: true,
          publishedDate: new Date(),
        },
      },
      { new: true }
    );

        return NextResponse.json(
          {
            success: true,
            message: 'Event published successfully',
            data: publishedEvent,
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error publishing event:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to publish event' },
          { status: 500 }
        );
      }
    }
  );
}
