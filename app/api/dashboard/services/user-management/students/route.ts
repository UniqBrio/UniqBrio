import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { addStudentToCohort, removeStudentFromCohort, getStudentWithCohorts } from '@/lib/dashboard/studentCohortSync';
 
export async function GET() {
  try {
    console.log('🔍 [Students API] Connecting to MongoDB...');
    const mongoose = await dbConnect("uniqbrio");
    const db = mongoose.connection.db;
    console.log('✅ [Students API] Connected to database:', mongoose.connection.name);
   
    if (!db) {
      console.error('❌ [Students API] Database connection object is null');
      throw new Error('Database connection failed');
    }
   
    // Use the actual students collection instead of users collection
    console.log('� [Students API] Fetching from students collection...');
   
    // Get students from the correct collection
    const students = await db.collection('students').find({
      isDeleted: { $ne: true } // Only active students
    }).toArray();
   
    const count = students.length;
    console.log('✅ [Students API] Students found in students collection:', { count });
   
    // Log the first student record to see all available fields
    if (students.length > 0) {
      console.log('🔍 [Students API] Sample student record fields:', Object.keys(students[0]));
      console.log('🔍 [Students API] First student record:', JSON.stringify(students[0], null, 2));
    }
   
    // Map students from the correct students collection
    const result = students.map((s: any) => {
      // Construct display name from available fields
      let displayName = s.name || '';
      if (!displayName && (s.firstName || s.lastName)) {
        displayName = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim().replace(/\s+/g, ' ');
      }
     
      return {
        id: s.studentId || s._id?.toString() || '', // Use studentId as primary ID
        studentId: s.studentId || s._id?.toString() || '',
        mongoId: s._id?.toString() || '', // Keep mongo ID for internal operations
        name: displayName || `Student ${s.studentId || s._id?.toString()}`,
        email: s.email || '',
        isActive: !s.isDeleted, // Use isDeleted field to determine if active
        // Include additional fields that might be needed
        firstName: s.firstName || '',
        lastName: s.lastName || '',
        middleName: s.middleName || '',
        phone: s.phone || s.mobile || '',
        country: s.country || '',
        stateProvince: s.stateProvince || '',
        cohortId: s.cohortId || '', // Include current cohort assignment
        cohorts: s.cohorts || [], // Include all enrolled cohorts
        enrolledCohorts: s.enrolledCohorts || []
      };
    });
   
    console.log('📝 [Students API] First 3 student records:', result.slice(0, 3));
   
    console.log('🚀 [Students API] Returning response:', { count, studentsLength: result.length });
    return NextResponse.json({
      success: true,
      count,
      students: result
    });
  } catch (e) {
    console.error('❌ [Students API] Error fetching students:', e);
    return NextResponse.json({
      success: false,
      count: 0,
      students: [],
      error: 'Failed to fetch students',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
  // Note: No need to close the connection as we're using a shared connection pool
}
 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, studentId, cohortId } = body;
 
    if (!studentId || !cohortId) {
      return NextResponse.json({
        success: false,
        error: 'Student ID and Cohort ID are required'
      }, { status: 400 });
    }
 
    let result;
   
    switch (action) {
      case 'add-to-cohort':
        result = await addStudentToCohort(cohortId, studentId);
        break;
       
      case 'remove-from-cohort':
        result = await removeStudentFromCohort(cohortId, studentId);
        break;
       
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "add-to-cohort" or "remove-from-cohort"'
        }, { status: 400 });
    }
 
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Operation failed'
      }, { status: 500 });
    }
 
    return NextResponse.json({
      success: true,
      message: `Student ${action === 'add-to-cohort' ? 'added to' : 'removed from'} cohort successfully`,
      updatedCount: result.updatedCount
    });
 
  } catch (error) {
    console.error('Error in student cohort operation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
 
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;
 
    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: 'Student ID is required'
      }, { status: 400 });
    }
 
    const student = await getStudentWithCohorts(studentId);
   
    if (!student) {
      return NextResponse.json({
        success: false,
        error: 'Student not found'
      }, { status: 404 });
    }
 
    return NextResponse.json({
      success: true,
      student: {
        id: student.id || student.studentId || student._id?.toString(),
        studentId: student.studentId || student.id || student._id?.toString(),
        name: student.name || '',
        cohorts: student.cohorts || [],
        enrolledCohorts: student.enrolledCohorts || []
      }
    });
 
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
