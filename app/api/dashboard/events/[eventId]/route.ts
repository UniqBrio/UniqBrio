import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/dashboard/events/Event';
import mongoose from 'mongoose';

/**
 * GET /api/events/[eventId]
 * Fetch a specific event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await dbConnect('uniqbrio');

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Build query that only tries to match _id when eventId is a valid ObjectId
    const isObjectId = mongoose.isValidObjectId(eventId)
    const findQuery: any = isObjectId ? { $or: [{ eventId }, { _id: eventId }] } : { eventId }
    const event = await Event.findOne(findQuery);

    // don't return soft-deleted events
    if (event && event.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[eventId]
 * Update a specific event
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await dbConnect('uniqbrio');

    const { eventId } = await params;
    const body = await request.json();

    console.log('=== PATCH /api/events/[eventId] ===')
    console.log('Event ID:', eventId)
    console.log('Request body:', JSON.stringify(body, null, 2))

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects if provided
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    if (body.registrationDeadline)
      body.registrationDeadline = new Date(body.registrationDeadline);

    // Update publishedDate if publishing
    if (body.isPublished && !body.publishedDate) {
      body.publishedDate = new Date();
    }

    console.log('Update data after date conversion:', JSON.stringify(body, null, 2))

    const isObjectId2 = mongoose.isValidObjectId(eventId)
    const updateQuery: any = isObjectId2 ? { $or: [{ eventId }, { _id: eventId }] } : { eventId }
    
    console.log('Update query:', updateQuery)
    
    const updatedEvent = await Event.findOneAndUpdate(
      updateQuery,
      { $set: body },
      { new: true, runValidators: true }
    );

    console.log('Updated event from DB:', updatedEvent ? 'Found and updated' : 'Not found')

    if (!updatedEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('Returning updated event:', JSON.stringify(updatedEvent, null, 2))

    return NextResponse.json(
      {
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[eventId]
 * Permanently delete a specific event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await dbConnect('uniqbrio');

    const { eventId } = await params;

    if (!eventId) {
      console.error('Delete failed: Event ID is required');
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to delete event with ID:', eventId);
    
    // Soft-delete by default; allow permanent delete with ?force=true
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    if (force) {
      const delQuery: any = mongoose.isValidObjectId(eventId) ? { $or: [{ eventId }, { _id: eventId }] } : { eventId }
      const deletedEvent = await Event.findOneAndDelete(delQuery)
      if (!deletedEvent) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, message: 'Event permanently deleted', data: deletedEvent }, { status: 200 })
    }

    const softQuery: any = mongoose.isValidObjectId(eventId) ? { $or: [{ eventId }, { _id: eventId }] } : { eventId }
    const softDeleted = await Event.findOneAndUpdate(
      softQuery,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    )

    if (!softDeleted) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Event soft-deleted', data: softDeleted }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting event:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}
