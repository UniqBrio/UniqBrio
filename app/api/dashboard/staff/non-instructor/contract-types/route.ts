import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import NonInstructorModel from "@/models/dashboard/staff/NonInstructor"

export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'unique-contract-types') {
      const contractTypes = await NonInstructorModel.distinct('contractType', {
        $and: [
          { contractType: { $exists: true } },
          { contractType: { $ne: null } },
          { contractType: { $ne: '' } }
        ]
      })

      const defaultTypes = ['full-time', 'part-time', 'guest-faculty', 'temporary']
      const customContractTypes = contractTypes.filter(
        (type: any) => type && !defaultTypes.includes(String(type).toLowerCase())
      )

      return NextResponse.json({ customContractTypes })
    }

    if (action === 'check-usage') {
      const contractType = searchParams.get('contractType')
      if (!contractType) return NextResponse.json({ error: 'Contract type is required' }, { status: 400 })
      const count = await NonInstructorModel.countDocuments({ contractType })
      return NextResponse.json({ contractType, inUse: count > 0, usageCount: count })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('Non-instructor contract types API error:', error)
    return NextResponse.json({ error: 'Failed to fetch contract types', details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const body = await req.json()
    const { action, contractType, newContractType } = body

    if (action === 'bulk-update') {
      if (!contractType) return NextResponse.json({ error: 'contractType is required' }, { status: 400 })
      const result = await NonInstructorModel.updateMany(
        { contractType: contractType },
        { $set: { contractType: newContractType || '' } }
      )
      return NextResponse.json({ success: true, modifiedCount: result.modifiedCount, message: `Updated ${result.modifiedCount} non-instructor(s)` })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('Non-instructor contract types bulk update error:', error)
    return NextResponse.json({ error: 'Failed to update contract types', details: error.message }, { status: 500 })
  }
}

