import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import InstructorModel from "@/models/dashboard/staff/Instructor"

export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    
    if (action === 'unique-contract-types') {
      // Get all unique contract types from instructors collection
      const contractTypes = await InstructorModel.distinct('contractType', {
        $and: [
          { contractType: { $exists: true } },
          { contractType: { $ne: null } },
          { contractType: { $ne: '' } }
        ]
      })
      
      // Filter out default contract types to get only custom ones
      const defaultTypes = ['full-time', 'part-time', 'guest-faculty', 'temporary']
      const customContractTypes = contractTypes.filter(
        type => type && !defaultTypes.includes(type.toLowerCase())
      )
      
      return NextResponse.json({ customContractTypes })
    }
    
    if (action === 'check-usage') {
      const contractType = searchParams.get('contractType')
      if (!contractType) {
        return NextResponse.json({ error: 'Contract type is required' }, { status: 400 })
      }
      
      // Check if this contract type is being used by any instructor
      const count = await InstructorModel.countDocuments({ contractType })
      return NextResponse.json({ 
        contractType,
        inUse: count > 0,
        usageCount: count
      })
    }
    
    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Contract types API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract types', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    
    const body = await req.json()
    const { action, contractType, newContractType } = body
    
    if (action === 'bulk-update') {
      // Update all instructors using the old contract type to use the new one
      if (!contractType) {
        return NextResponse.json({ error: 'contractType is required' }, { status: 400 })
      }
      
      const result = await InstructorModel.updateMany(
        { contractType: contractType },
        { $set: { contractType: newContractType || '' } }
      )
      
      return NextResponse.json({ 
        success: true,
        modifiedCount: result.modifiedCount,
        message: `Updated ${result.modifiedCount} instructor(s)`
      })
    }
    
    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Contract types bulk update error:', error)
    return NextResponse.json(
      { error: 'Failed to update contract types', details: error.message },
      { status: 500 }
    )
  }
}

