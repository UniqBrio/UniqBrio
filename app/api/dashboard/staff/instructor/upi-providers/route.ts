import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import InstructorModel from '@/models/dashboard/staff/Instructor'

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(request.url)
    const check = searchParams.get('check')

    if (check) {
      const count = await InstructorModel.countDocuments({ 'paymentInfo.upiProvider': check })
      return NextResponse.json({ isUsed: count > 0, count })
    }

    const providers = await InstructorModel.distinct('paymentInfo.upiProvider')
    const valid = (providers as string[]).filter(p => p && String(p).trim() !== '')
    return NextResponse.json({ upiProviders: valid })
  } catch (e) {
    console.error('Error in upi-providers API:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const { customUpiProviders } = await request.json()
    if (!Array.isArray(customUpiProviders)) {
      return NextResponse.json({ error: 'customUpiProviders must be an array' }, { status: 400 })
    }
    // Sync endpoint only. Values persist when documents use them.
    return NextResponse.json({ success: true, message: 'UPI providers updated successfully' })
  } catch (e) {
    console.error('Error updating UPI providers:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
