import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(request.url)
    
    // Get database reference to access leave_requests collection directly
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    const leaveRequestsCollection = db.collection('leave_requests')
    
    // Build query for approved leave requests
    const query: any = {
      status: "APPROVED" // Only get approved leave requests
    }
    
    // Optional: Filter by instructor ID
    if (searchParams.get('instructorId')) {
      query.instructorId = searchParams.get('instructorId')
    }
    
    // Optional: Filter by date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate || endDate) {
      query.$and = []
      
      if (startDate) {
        query.$and.push({
          $or: [
            { startDate: { $gte: new Date(startDate) } },
            { endDate: { $gte: new Date(startDate) } }
          ]
        })
      }
      
      if (endDate) {
        query.$and.push({
          startDate: { $lte: new Date(endDate) }
        })
      }
    }
    
    // Fetch leave requests
    const leaveRequests = await leaveRequestsCollection
      .find(query)
      .sort({ startDate: -1 })
      .toArray()
    
    console.log(`[Leave API] Found ${leaveRequests.length} APPROVED leave requests`)
    
    // Convert ObjectId to string for JSON serialization
    const serializedLeaveRequests = leaveRequests.map(leave => ({
      ...leave,
      _id: leave._id.toString()
    }))
    
    return NextResponse.json({
      success: true,
      leaveRequests: serializedLeaveRequests,
      count: serializedLeaveRequests.length
    })
    
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leave requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}