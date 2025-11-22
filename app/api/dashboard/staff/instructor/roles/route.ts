import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import InstructorModel from '@/models/dashboard/staff/Instructor';

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    
    const { searchParams } = new URL(request.url);
    const checkRole = searchParams.get('check');
    
    if (checkRole) {
      // Check if a specific role is being used
      const count = await InstructorModel.countDocuments({ role: checkRole });
      return NextResponse.json({
        isUsed: count > 0,
        count
      });
    }
    
    // Get all unique roles from instructors
    const roles = await InstructorModel.distinct('role');
    
    // Filter out empty/null values
    const validRoles = roles.filter((role: string) => role && role.trim() !== '');
    
    return NextResponse.json({
      roles: validRoles
    });
    
  } catch (error) {
    console.error('Error in roles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    
    const { customRoles } = await request.json();
    
    if (!Array.isArray(customRoles)) {
      return NextResponse.json(
        { error: 'customRoles must be an array' },
        { status: 400 }
      );
    }
    
    // This endpoint is used to sync custom roles
    // The actual storage happens when instructors are created/updated with these roles
    // We don't need to store roles separately as they're part of instructor documents
    
    return NextResponse.json({
      success: true,
      message: 'Roles updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
