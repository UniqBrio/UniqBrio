import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Student from '@/models/dashboard/student/Student';

// PATCH - Restore a soft-deleted student
export async function PATCH(req: NextRequest) {
  await dbConnect("uniqbrio");
  try {
    const { studentId } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    
    const student = await Student.findOne({ studentId, isDeleted: true });
    
    if (!student) {
      return NextResponse.json({ 
        error: 'Deleted student not found' 
      }, { status: 404 });
    }
    
    // Restore the student
    student.isDeleted = false;
    student.deletedAt = undefined;
    await student.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Student restored successfully',
      student 
    });
  } catch (error) {
    console.error('Restore student error:', error);
    return NextResponse.json({ 
      error: 'Failed to restore student' 
    }, { status: 500 });
  }
}

// GET - Get all soft-deleted students
export async function GET(req: NextRequest) {
  await dbConnect("uniqbrio");
  try {
    const deletedStudents = await Student.find({ isDeleted: true })
      .sort({ deletedAt: -1 });
    
    return NextResponse.json(deletedStudents);
  } catch (error) {
    console.error('Get deleted students error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch deleted students' 
    }, { status: 500 });
  }
}
