import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Event from '@/models/dashboard/events/Event';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { logEntityCreate, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { AuditModule } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// Helper: generate next event ID like EVT0001
async function generateNextEventId(tenantId: string): Promise<string> {
  let attempts = 0
  const maxAttempts = 5
  while (attempts < maxAttempts) {
    const existing = await Event.find({ tenantId, eventId: { $regex: /^EVT\d{4}$/ } }, { eventId: 1, _id: 0 }).lean()
    const numbers: number[] = []
    for (const e of existing) {
      const n = parseInt(String((e as any).eventId).substring(3), 10)
      if (!Number.isNaN(n) && n > 0) numbers.push(n)
    }
    numbers.sort((a, b) => a - b)
    let candidateNum = 1
    for (const n of numbers) {
      if (n === candidateNum) candidateNum++
      else if (n > candidateNum) break
    }
    const candidateId = `EVT${String(candidateNum).padStart(4, '0')}`
    const collision = await Event.findOne({ tenantId, eventId: candidateId })
    if (!collision) return candidateId
    attempts++
    console.warn(`generateNextEventId collision on ${candidateId}, retrying (attempt ${attempts})`)
  }
  return `EVT${String(Date.now() % 10000).padStart(4, '0')}`
}

/**
 * GET /api/events
 * Fetch all events with optional filtering, pagination, and search
 * Query params: 
 *   - search: search by name/description
 *   - sport: filter by sport
 *   - status: filter by status (Upcoming/Ongoing/Completed)
 *   - isPublished: filter by publication status
 *   - page: pagination page (default 1)
 *   - limit: items per page (default 10)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sport = searchParams.get('sport') || '';
    const status = searchParams.get('status') || '';
    const isPublished = searchParams.get('isPublished');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build query
    const query: any = { tenantId: session.tenantId };

    // Exclude soft-deleted events by default
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    if (!includeDeleted) query.isDeleted = { $ne: true }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sport: { $regex: search, $options: 'i' } },
      ];
    }

    if (sport) {
      query.sport = sport;
    }

    if (status) {
      query.status = status;
    }

    if (isPublished !== null) {
      query.isPublished = isPublished === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch events and total count
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: events,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
    }
  );
}

/**
 * POST /api/events
 * Create a new event
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

    // Log incoming data for debugging
    console.log('Creating event with data:', body);

    // Normalize some legacy field names
    if (!body.eventId && body.id) body.eventId = body.id

    // Generate sequential event ID if not provided or if it's a temp ID
    if (!body.eventId || String(body.eventId).startsWith('TEMP_') || String(body.eventId).startsWith('temp_')) {
      body.eventId = await generateNextEventId(session.tenantId)
      console.log('POST /api/events - Generated sequential event ID:', body.eventId)
    }

    // Coerce and normalize dates
    const toDate = (v: any) => (v ? new Date(v) : undefined)
    const startDate = toDate(body.startDate)
    const endDate = toDate(body.endDate)
    const registrationDeadline = toDate(body.registrationDeadline)

    if (!startDate || !endDate || !registrationDeadline) {
      return NextResponse.json({ success: false, error: 'Invalid or missing date fields' }, { status: 400 })
    }

    // Only allow a whitelist of fields from the create form
    const allowed: any = ((e: any) => ({
      eventId: e.eventId,
      name: e.name,
      sport: e.sport,
      type: e.type,
      description: e.description,
      startDate: startDate,
      startTime: e.startTime,
      endDate: endDate,
      endTime: e.endTime,
      registrationDeadline: registrationDeadline,
      venue: e.venue,
      staff: e.staff,
      participants: e.participants || 0,
      maxParticipants: e.maxParticipants,
      skillLevel: e.skillLevel,
      format: e.format,
      ageGroup: e.ageGroup,
      equipment: e.equipment,
      entryFee: e.entryFee || 0,
      prizes: e.prizes,
      rules: e.rules,
      isPublished: e.isPublished || false,
      publishedDate: e.isPublished ? new Date() : undefined,
      createdAt: new Date(),
    }))(body)

    // Ensure uniqueness of eventId (handle duplicates like students API)
    const existingEvent = await Event.findOne({ tenantId: session.tenantId, eventId: allowed.eventId })
    if (existingEvent && !existingEvent.isDeleted) {
      // Try generating a new sequential ID and retry
      const newId = await generateNextEventId(session.tenantId)
      console.warn(`Event ID conflict for ${allowed.eventId}, generated new ID ${newId}`)
      allowed.eventId = newId
    }

    // Compute status server-side
    const computeStatus = (start: Date, end: Date) => {
      const now = new Date()
      if (now < start) return 'Upcoming'
      if (now > end) return 'Completed'
      return 'Ongoing'
    }

    allowed.status = computeStatus(allowed.startDate as Date, allowed.endDate as Date)

    const newEvent = await Event.create({ ...allowed, tenantId: session.tenantId })

    // Log entity creation
    const headers = new Headers(request.headers);
    await logEntityCreate(
      AuditModule.EVENTS,
      String(newEvent._id),
      newEvent.name || newEvent.eventId || 'Unnamed Event',
      session.userId,
      session.email,
      'super_admin',
      session.tenantId,
      getClientIp(headers),
      getUserAgent(headers),
      {
        eventId: newEvent.eventId,
        name: newEvent.name,
        sport: newEvent.sport,
        type: newEvent.type,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
      }
    );

    const toIso = (d: any) => (d instanceof Date ? d.toISOString().slice(0, 10) : d)
    const s = (newEvent as any).toObject()
    const pick = {
      id: s.eventId || s._id,
      eventId: s.eventId || s._id,
      name: s.name,
      sport: s.sport,
      type: s.type,
      description: s.description,
      startDate: toIso(s.startDate),
      startTime: s.startTime,
      endDate: toIso(s.endDate),
      endTime: s.endTime,
      registrationDeadline: toIso(s.registrationDeadline),
      venue: s.venue,
      staff: s.staff,
      participants: s.participants || 0,
      maxParticipants: s.maxParticipants,
      skillLevel: s.skillLevel,
      format: s.format,
      ageGroup: s.ageGroup,
      equipment: s.equipment,
      entryFee: s.entryFee || 0,
      prizes: s.prizes,
      rules: s.rules,
      isPublished: s.isPublished,
      publishedDate: s.publishedDate ? toIso(s.publishedDate) : undefined,
      createdAt: toIso(s.createdAt),
      status: s.status,
    }

    console.log('Event created successfully:', pick.eventId)
    return NextResponse.json({ success: true, message: 'Event created successfully', data: pick }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
    }
  );
}
