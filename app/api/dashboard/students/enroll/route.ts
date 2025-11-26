import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { enrollStudentInCohort } from '@/lib/dashboard/studentCohortSync';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function POST(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        const body = await request.json();
        const { studentId, cohortId, action } = body;

    console.log(`🎓 [Enrollment API] ${action} request:`, { studentId, cohortId });

    if (!studentId || !cohortId) {
      return NextResponse.json({
        success: false,
        error: 'Student ID and Cohort ID are required'
      }, { status: 400 });
    }

    await dbConnect("uniqbrio");

    if (action === 'enroll') {
      // Use the new enrollment function that handles bidirectional sync
      const result = await enrollStudentInCohort(studentId, cohortId);
      
      if (result.success) {
        console.log(`✅ [Enrollment API] Successfully enrolled ${studentId} in ${cohortId}`);
        return NextResponse.json({
          success: true,
          message: `Student ${studentId} successfully enrolled in cohort ${cohortId}`,
          updatedCount: result.updatedCount
        });
      } else {
        console.error(`❌ [Enrollment API] Enrollment failed:`, result.error);
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "enroll"'
      }, { status: 400 });
    }

      } catch (error) {
        console.error('❌ [Enrollment API] Error:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
      }
    }
  );
}