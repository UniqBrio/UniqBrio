import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Student from '@/models/dashboard/student/Student';
import mongoose from 'mongoose';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    await dbConnect("uniqbrio");

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    console.log('[student-details] Request received for studentId:', studentId, 'tenantId:', session.tenantId);

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const studentResult = await Student.findOne({ studentId, tenantId: session.tenantId })
      .select('studentId name enrolledCourse enrolledCourseName category courseType courseLevel cohortId courseOfInterestId guardian guardianFirstName guardianMiddleName guardianLastName')
      .lean()
      .exec();

    console.log('[student-details] Student query result:', studentResult);

    if (!studentResult) {
      return NextResponse.json(
        { 
          error: 'Student not found',
          details: `No student found with studentId: ${studentId}`
        },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
          }
        }
      );
    }
    const student = studentResult as any;

    // Try to get courseId from multiple sources
    let courseId = (student as any).enrolledCourse || null;
    
    // If no enrolledCourse, try to get it from the cohort
    if (!courseId && (student as any).cohortId) {
      console.log('[student-details] Fetching courseId from cohort:', (student as any).cohortId);
      const Cohort = mongoose.connection.collection('cohorts');
      const cohort = await Cohort.findOne({ cohortId: (student as any).cohortId, tenantId: session.tenantId }).lean();
      if (cohort?.courseId) {
        courseId = cohort.courseId;
        console.log('[student-details] Found courseId from cohort:', courseId);
      }
    }
    
    // Final fallback to courseOfInterestId
    if (!courseId) {
      courseId = (student as any).courseOfInterestId || null;
      console.log('[student-details] Using courseOfInterestId as fallback:', courseId);
    }

    const result = {
      studentId: (student as any).studentId,
      name: (student as any).name,
      enrolledCourse: courseId,
      enrolledCourseName: (student as any).enrolledCourseName || null,
      category: (student as any).category || null,
      courseType: (student as any).courseType || null,
      courseLevel: (student as any).courseLevel || null,
      cohortId: (student as any).cohortId || null,
      guardian: (student as any).guardian || null,
      guardianName: (student as any).guardian?.fullName || 
        [
          (student as any).guardianFirstName,
          (student as any).guardianMiddleName,
          (student as any).guardianLastName
        ].filter(Boolean).join(' ') || null
    };

    console.log('[student-details] Returning result:', result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('[student-details] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student details', details: String(error) },
      { status: 500 }
    );
  }
  });
}
