import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import StudentAttendance from '@/models/dashboard/student/StudentAttendance';
import Student from '@/models/dashboard/student/Student';

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    // Find all attendance records where studentName looks like a student ID pattern (STUxxxx)
    const attendanceRecords = await StudentAttendance.find({
      studentName: { $regex: /^STU\d+$/i }
    });

    console.log(`Found ${attendanceRecords.length} attendance records with student IDs as names`);

    let updated = 0;
    let errors = 0;

    for (const record of attendanceRecords) {
      try {
        // Find the actual student record
        const student = await Student.findOne({ studentId: record.studentId });
        
        if (student && student.name && student.name !== record.studentName) {
          // Update the attendance record with the correct student name
          await StudentAttendance.updateOne(
            { _id: record._id },
            { $set: { studentName: student.name } }
          );
          
          console.log(`Updated ${record.studentId}: "${record.studentName}" -> "${student.name}"`);
          updated++;
        } else if (!student) {
          console.warn(`No student found for ID: ${record.studentId}`);
          errors++;
        } else if (!student.name) {
          console.warn(`Student ${record.studentId} has no name in database`);
          errors++;
        }
      } catch (err) {
        console.error(`Error updating record for ${record.studentId}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updated} attendance records. ${errors} errors encountered.`,
      updated,
      errors,
      totalProcessed: attendanceRecords.length
    });

  } catch (error: any) {
    console.error('Error fixing attendance record names:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fix attendance record names',
        message: error.message 
      },
      { status: 500 }
    );
  }
}