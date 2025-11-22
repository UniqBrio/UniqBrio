import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET() {
  try {
    await dbConnect("uniqbrio")
    
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const leaveRequestsCollection = db.collection('leave_requests')
    
    // Get all leave requests
    const allLeaves = await leaveRequestsCollection
      .find({})
      .sort({ startDate: -1 })
      .toArray()
    
    const diagnostics = allLeaves.map(leave => ({
      instructorId: leave.instructorId,
      instructorName: leave.instructorName,
      status: leave.status,
      leaveType: leave.leaveType,
      // Show raw date values
      startDateRaw: leave.startDate,
      endDateRaw: leave.endDate,
      // Show as Date objects
      startDateParsed: new Date(leave.startDate).toISOString(),
      endDateParsed: new Date(leave.endDate).toISOString(),
      // Show as YYYY-MM-DD
      startDateFormatted: new Date(leave.startDate).toISOString().split('T')[0],
      endDateFormatted: new Date(leave.endDate).toISOString().split('T')[0],
    }))
    
    return NextResponse.json({
      success: true,
      total: allLeaves.length,
      diagnostics
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in leave diagnostics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
