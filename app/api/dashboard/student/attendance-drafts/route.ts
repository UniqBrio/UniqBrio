import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import StudentAttendanceDraft from '@/models/dashboard/student/StudentAttendanceDraft';
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build query filters
    let query: any = { tenantId: session.tenantId };
    
    if (studentId) {
      query.studentId = studentId;
    }

    // Build query with sorting (newest first)
    let queryBuilder = StudentAttendanceDraft.find(query).sort({ savedAt: -1 });

    // Add pagination if specified
    if (offset) {
      queryBuilder = queryBuilder.skip(parseInt(offset));
    }
    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }

    const drafts = await queryBuilder.exec();

    // Get total count for pagination (if filters are applied)
    let totalCount = null;
    if (limit || offset) {
      totalCount = await StudentAttendanceDraft.countDocuments(query);
    }

    const response: any = {
      success: true,
      data: drafts,
    };

    if (totalCount !== null) {
      response.pagination = {
        total: totalCount,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : 0,
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching attendance drafts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance drafts',
        message: error.message 
      },
      { status: 500 }
    );
  }
    }
  );
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      studentId,
      studentName,
      cohortId,
      cohortName,
      cohortInstructor,
      cohortTiming,
      courseId,
      courseName,
      date,
      startTime,
      endTime,
      status,
      notes
    } = body;

    // Create new attendance draft
    const attendanceDraft = new StudentAttendanceDraft({
      studentId: studentId || '(unspecified)',
      studentName: studentName || '(unspecified)',
      cohortId,
      cohortName,
      cohortInstructor,
      cohortTiming,
      courseId,
      courseName,
      date: date || new Date().toISOString().slice(0, 10),
      startTime,
      endTime,
      status: status || 'present',
      notes,
      savedAt: new Date()
    });

    const savedDraft = await attendanceDraft.save();

    return NextResponse.json({
      success: true,
      data: savedDraft
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating attendance draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create attendance draft',
        message: error.message 
      },
      { status: 500 }
    );
  }
    }
  );
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Delete all drafts
      const result = await StudentAttendanceDraft.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} attendance drafts`,
        deletedCount: result.deletedCount
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid delete operation' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error deleting attendance drafts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete attendance drafts',
        message: error.message 
      },
      { status: 500 }
    );
  }
    }
  );
}