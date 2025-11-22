import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import InstructorModel from '@/models/dashboard/staff/Instructor';

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    
    const { searchParams } = new URL(request.url);
    const checkLevel = searchParams.get('check');
    
    if (checkLevel) {
      // Check if a specific job level is being used
      const count = await InstructorModel.countDocuments({ jobLevel: checkLevel });
      return NextResponse.json({
        isUsed: count > 0,
        count
      });
    }
    
    // Get all unique job levels from instructors
    const jobLevels = await InstructorModel.distinct('jobLevel');
    
    // Filter out empty/null values
    const validJobLevels = jobLevels.filter((level: string) => level && level.trim() !== '');
    
    return NextResponse.json({
      jobLevels: validJobLevels
    });
    
  } catch (error) {
    console.error('Error in job-levels API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    
    const { customJobLevels } = await request.json();
    
    if (!Array.isArray(customJobLevels)) {
      return NextResponse.json(
        { error: 'customJobLevels must be an array' },
        { status: 400 }
      );
    }
    
    // This endpoint is used to sync custom job levels
    // The actual storage happens when instructors are created/updated with these job levels
    // We don't need to store job levels separately as they're part of instructor documents
    
    return NextResponse.json({
      success: true,
      message: 'Job levels updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating job levels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
