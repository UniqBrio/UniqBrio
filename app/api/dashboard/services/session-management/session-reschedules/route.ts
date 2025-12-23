import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic';
export const revalidate = 30;

// MongoDB connection for raw database operations
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    ;(global as any)._mongoClientPromise = client.connect()
  }
  clientPromise = (global as any)._mongoClientPromise
} else {
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

async function getDatabase() {
  const client = await clientPromise
  return client.db('uniqbrio')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { 
      sessionId, 
      instructor, 
      instructorId,
      originalDate,
      originalStartTime,
      originalEndTime,
      newDate,
      newStartTime,
      newEndTime,
      reason, 
      rescheduledBy,
      location
    } = body

    if (!sessionId || !instructor || !originalDate || !newDate || !reason || !rescheduledBy) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, instructor, originalDate, newDate, reason, rescheduledBy' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check for instructor conflicts with existing sessions at the new time
    const conflictingReschedules = await db.collection('session_reschedules')
      .find({
        instructorId: instructorId,
        newDate: new Date(newDate),
        $or: [
          {
            $and: [
              { newStartTime: { $lte: newStartTime } },
              { newEndTime: { $gt: newStartTime } }
            ]
          },
          {
            $and: [
              { newStartTime: { $lt: newEndTime } },
              { newEndTime: { $gte: newEndTime } }
            ]
          },
          {
            $and: [
              { newStartTime: { $gte: newStartTime } },
              { newEndTime: { $lte: newEndTime } }
            ]
          }
        ]
      })
      .toArray()

    if (conflictingReschedules.length > 0) {
      return NextResponse.json(
        { 
          error: 'Instructor conflict detected',
          message: `${instructor} already has a session scheduled during this time slot`,
          conflicts: conflictingReschedules
        },
        { status: 409 }
      )
    }

    // Create reschedule record
    const reschedule = {
      sessionId,
      instructor,
      instructorId,
      originalDate: new Date(originalDate),
      originalStartTime,
      originalEndTime,
      newDate: new Date(newDate),
      newStartTime,
      newEndTime,
      location,
      reason,
      rescheduledBy,
      rescheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('session_reschedules').insertOne(reschedule)
    
    // Update the schedule document directly with reschedule data
    const schedulesCollection = db.collection('schedules')
    
    // Try to find the schedule by sessionId
    let schedule = null
    
    // Check if sessionId is a valid ObjectId format
    if (ObjectId.isValid(sessionId)) {
      schedule = await schedulesCollection.findOne({ _id: new ObjectId(sessionId) })
    }
    
    if (!schedule) {
      // Try multiple fallback queries to find the schedule
      const queries = [
        // Query by sessionId as string field (if it's stored as custom ID)
        { sessionId: sessionId },
        // Query by date and instructor
        { 
          date: new Date(originalDate),
          startTime: originalStartTime,
          endTime: originalEndTime,
          instructorName: instructor
        },
        // Query by instructor and instructor ID if available
        ...(instructorId ? [{ 
          instructor: instructorId,
          date: new Date(originalDate)
        }] : [])
      ]
      
      for (const query of queries) {
        schedule = await schedulesCollection.findOne(query)
        if (schedule) {
          console.log(`Found schedule for reschedule using query:`, query)
          break
        }
      }
    }

    if (schedule) {
      await schedulesCollection.updateOne(
        { _id: schedule._id },
        {
          $set: {
            'modifications.reschedule': {
              originalDate: new Date(originalDate),
              originalStartTime: originalStartTime,
              originalEndTime: originalEndTime,
              rescheduledAt: new Date(),
              reason: reason,
              rescheduledBy: rescheduledBy,
              backendId: result.insertedId.toString()
            },
            date: new Date(newDate),
            startTime: newStartTime,
            endTime: newEndTime,
            lastModifiedBy: rescheduledBy,
            updatedAt: new Date()
          }
        }
      )
      
      console.log(`Updated schedule ${schedule._id} with reschedule modification`)
    } else {
      console.warn(`Could not find schedule for sessionId: ${sessionId}`)
    }
    
    console.log('Session reschedule saved:', result.insertedId)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId,
      scheduleUpdated: !!schedule,
      reschedule: { ...reschedule, _id: result.insertedId }
    })

  } catch (error) {
    console.error('Error saving session reschedule:', error)
    return NextResponse.json(
      { error: 'Failed to save session reschedule' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const instructorId = searchParams.get('instructorId')
    const date = searchParams.get('date')
    
    let filter: any = {}
    if (sessionId) {
      filter.sessionId = sessionId
    }
    if (instructorId) {
      filter.instructorId = instructorId
    }
    if (date) {
      filter.newDate = new Date(date)
    }
    
    const reschedules = await db.collection('session_reschedules')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()
    
    console.log(`Retrieved ${reschedules.length} session reschedules`)
    
    return NextResponse.json(reschedules)

  } catch (error) {
    console.error('Error fetching session reschedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session reschedules' },
      { status: 500 }
    )
  }
}

// Additional endpoint to check instructor availability for a specific time slot
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, date, startTime, endTime } = body

    if (!instructorId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: instructorId, date, startTime, endTime' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check for conflicts in reschedules
    const conflicts = await db.collection('session_reschedules')
      .find({
        instructorId: instructorId,
        newDate: new Date(date),
        $or: [
          {
            $and: [
              { newStartTime: { $lte: startTime } },
              { newEndTime: { $gt: startTime } }
            ]
          },
          {
            $and: [
              { newStartTime: { $lt: endTime } },
              { newEndTime: { $gte: endTime } }
            ]
          },
          {
            $and: [
              { newStartTime: { $gte: startTime } },
              { newEndTime: { $lte: endTime } }
            ]
          }
        ]
      })
      .toArray()

    return NextResponse.json({
      available: conflicts.length === 0,
      conflicts: conflicts
    })

  } catch (error) {
    console.error('Error checking instructor availability:', error)
    return NextResponse.json(
      { error: 'Failed to check instructor availability' },
      { status: 500 }
    )
  }
}