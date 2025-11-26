import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import Event from '@/models/dashboard/events/Event'
import mongoose from 'mongoose'
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

/**
 * POST /api/events/[eventId]/participants
 * Body: { action: 'inc' | 'dec', amount?: number }
 * Increments or decrements participants count safely (0 <= participants <= maxParticipants)
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
        await dbConnect("uniqbrio")

    const { eventId } = await params
    if (!eventId) return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 })

    const body = await request.json()
    const action = body?.action
    const amount = Math.max(1, parseInt(String(body?.amount || 1), 10))

    if (!action || !['inc', 'dec'].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action. Use 'inc' or 'dec'" }, { status: 400 })
    }

    // Only include _id in query when eventId is a valid ObjectId to avoid cast errors
    const findQuery: any = mongoose.isValidObjectId(eventId) ? { $or: [{ eventId }, { _id: eventId }] } : { eventId }
    const event = await Event.findOne(findQuery)
    if (!event || event.isDeleted) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })

    let newCount = (event.participants || 0)
    if (action === 'inc') {
      newCount = Math.min(event.maxParticipants || Number.MAX_SAFE_INTEGER, newCount + amount)
    } else {
      newCount = Math.max(0, newCount - amount)
    }

    const updateQuery: any = mongoose.isValidObjectId(eventId) ? { $or: [{ eventId }, { _id: eventId }] } : { eventId }
    const updated = await Event.findOneAndUpdate(
      updateQuery,
      { $set: { participants: newCount } },
      { new: true }
    )

        return NextResponse.json({ success: true, message: 'Participants updated', data: updated }, { status: 200 })
      } catch (error: any) {
        console.error('Error updating participants:', error)
        return NextResponse.json({ success: false, error: error.message || 'Failed to update participants' }, { status: 500 })
      }
    }
  );
}
