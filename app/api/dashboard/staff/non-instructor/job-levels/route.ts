import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import NonInstructorModel from '@/models/dashboard/staff/NonInstructor'

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const { searchParams } = new URL(request.url)
    const checkLevel = searchParams.get('check')

    if (checkLevel) {
      const count = await NonInstructorModel.countDocuments({ jobLevel: checkLevel })
      return NextResponse.json({ isUsed: count > 0, count })
    }

    const jobLevels = await NonInstructorModel.distinct('jobLevel')
    const validJobLevels = (jobLevels as string[]).filter((level: string) => level && level.trim() !== '')
    return NextResponse.json({ jobLevels: validJobLevels })
  } catch (error) {
    console.error('Error in non-instructor job-levels API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    const { customJobLevels } = await request.json()
    if (!Array.isArray(customJobLevels)) {
      return NextResponse.json({ error: 'customJobLevels must be an array' }, { status: 400 })
    }
    // Sync endpoint only; values persist when documents use them
    return NextResponse.json({ success: true, message: 'Job levels updated successfully' })
  } catch (error) {
    console.error('Error updating non-instructor job levels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
