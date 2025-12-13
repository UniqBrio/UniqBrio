import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection for raw database operations
let clientPromise: Promise<MongoClient> | null = null

function getClientPromise() {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  if (process.env.NODE_ENV === 'development') {
    if (!(global as any)._mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI)
      ;(global as any)._mongoClientPromise = client.connect()
    }
    return (global as any)._mongoClientPromise
  } else {
    if (!clientPromise) {
      const client = new MongoClient(MONGODB_URI)
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

async function getDatabase() {
  const client = await getClientPromise()
  return client.db('uniqbrio')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { 
      sessionId, 
      originalInstructor, 
      originalInstructorId,
      reason, 
      cancelledBy,
      originalDate,
      originalStartTime,
      originalEndTime
    } = body

    if (!sessionId || !originalInstructor || !reason || !cancelledBy) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, originalInstructor, reason, cancelledBy' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Create cancellation record
    const cancellation = {
      sessionId,
      originalInstructor,
      originalInstructorId,
      reason,
      cancelledBy,
      originalDate: originalDate ? new Date(originalDate) : null,
      originalStartTime,
      originalEndTime,
      cancelledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('session_cancellations').insertOne(cancellation)
    
    // Update the schedule document directly with cancellation data
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
        // Query by date and instructor if provided
        ...(originalDate ? [{
          date: new Date(originalDate),
          startTime: originalStartTime,
          endTime: originalEndTime,
          instructorName: originalInstructor
        }] : []),
        // Query by instructor name only as fallback
        { instructorName: originalInstructor }
      ]
      
      for (const query of queries) {
        schedule = await schedulesCollection.findOne(query)
        if (schedule) {
          console.log(`Found schedule for cancellation using query:`, query)
          break
        }
      }
    }

    if (schedule) {
      await schedulesCollection.updateOne(
        { _id: schedule._id },
        {
          $set: {
            'modifications.cancellation': {
              cancelledAt: new Date(),
              reason: reason,
              cancelledBy: cancelledBy,
              backendId: result.insertedId.toString()
            },
            status: 'Cancelled',
            isCancelled: true,
            cancellationReason: reason,
            cancellationDate: new Date(),
            lastModifiedBy: cancelledBy,
            updatedAt: new Date()
          }
        }
      )
      
      console.log(`Updated schedule ${schedule._id} with cancellation modification`)
    } else {
      console.warn(`Could not find schedule for sessionId: ${sessionId}`)
    }
    
    console.log('Session cancellation saved:', result.insertedId)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId,
      scheduleUpdated: !!schedule,
      cancellation: { ...cancellation, _id: result.insertedId }
    })

  } catch (error) {
    console.error('Error saving session cancellation:', error)
    return NextResponse.json(
      { error: 'Failed to save session cancellation' },
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
    
    let filter = {}
    if (sessionId) {
      filter = { sessionId }
    }
    
    const cancellations = await db.collection('session_cancellations')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()
    
    console.log(`Retrieved ${cancellations.length} session cancellations`)
    
    return NextResponse.json(cancellations)

  } catch (error) {
    console.error('Error fetching session cancellations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session cancellations' },
      { status: 500 }
    )
  }
}