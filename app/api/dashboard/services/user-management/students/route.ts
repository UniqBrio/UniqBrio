import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { addStudentToCohort, removeStudentFromCohort, getStudentWithCohorts } from '@/lib/dashboard/studentCohortSync';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import Student from '@/models/dashboard/student/Student';
import { logEntityCreate, logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from '@/lib/audit-logger';
import { AuditModule } from '@/models/AuditLog';
 
export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        console.log('🔍 [Students API] Connecting to MongoDB...');
        await dbConnect("uniqbrio");
        console.log('✅ [Students API] Connected to database');
       
        // Use Mongoose model instead of direct MongoDB collection access
        // This ensures the tenant plugin is applied
        console.log('📊 [Students API] Fetching from students collection with tenant filter...');
       
        // Get students using Mongoose model with explicit tenantId
        // CRITICAL: Explicitly set tenantId to ensure tenant isolation
        const students = await Student.find({
          isDeleted: { $ne: true }, // Only active students
          tenantId: session.tenantId // Explicit tenant filter
        }).lean();
   
    const count = students.length;
    console.log('✅ [Students API] Students found in students collection:', { count });
   
    // Calculate accurate statistics
    // Active students are those who are enrolled in at least one cohort and not deleted
    const activeStudents = students.filter((s: any) => 
      !s.isDeleted && (
        (Array.isArray(s.cohorts) && s.cohorts.length > 0) || 
        (Array.isArray(s.enrolledCohorts) && s.enrolledCohorts.length > 0) ||
        s.cohortId
      )
    ).length;
    
    // Enrolled students are those with cohort assignments
    const enrolledStudents = students.filter((s: any) => 
      (Array.isArray(s.cohorts) && s.cohorts.length > 0) || 
      (Array.isArray(s.enrolledCohorts) && s.enrolledCohorts.length > 0) ||
      s.cohortId
    ).length;
    
    // Check for students on leave today
    // Note: If you have a StudentLeaveRequest collection, query it here
    // For now, we'll use a field on the student document if it exists
    const onLeaveToday = students.filter((s: any) => s.onLeave === true || s.leaveStatus === 'APPROVED').length;
    
    console.log('📊 [Students API] Statistics:', {
      total: count,
      active: activeStudents,
      enrolled: enrolledStudents,
      onLeave: onLeaveToday
    });
   
    // Log the first student record to see all available fields
    if (students.length > 0) {
      console.log('🔍 [Students API] Sample student record fields:', Object.keys(students[0]));
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
   
        console.log('🚀 [Students API] Returning response:', { count, active: activeStudents, enrolled: enrolledStudents, onLeave: onLeaveToday });
        return NextResponse.json({
          success: true,
          count,
          active: activeStudents,
          enrolled: enrolledStudents,
          onLeave: onLeaveToday,
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
    }
  );
}
 
export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    const headers = request.headers;
    
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
        if (result.success) {
          // Get student details for logging
          const student = await getStudentWithCohorts(studentId);
          await logEntityUpdate(
            AuditModule.STUDENTS,
            studentId,
            {
              studentId,
              name: student?.name,
              email: student?.email,
              cohortId,
              action: 'add-to-cohort'
            },
            {
              userId: session.userId,
              email: session.email,
              role: 'super_admin',
              tenantId: session.tenantId,
              ip: getClientIp(headers),
              userAgent: getUserAgent(headers)
            }
          );
        }
        break;
       
      case 'remove-from-cohort':
        result = await removeStudentFromCohort(cohortId, studentId);
        if (result.success) {
          // Get student details for logging
          const student = await getStudentWithCohorts(studentId);
          await logEntityUpdate(
            AuditModule.STUDENTS,
            studentId,
            {
              studentId,
              name: student?.name,
              email: student?.email,
              cohortId,
              action: 'remove-from-cohort'
            },
            {
              userId: session.userId,
              email: session.email,
              role: 'super_admin',
              tenantId: session.tenantId,
              ip: getClientIp(headers),
              userAgent: getUserAgent(headers)
            }
          );
        }
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
