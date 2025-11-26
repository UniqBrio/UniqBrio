import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import StudentAttendanceDraft from '@/models/dashboard/student/StudentAttendanceDraft';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
        const { id } = await params;

    const draft = await StudentAttendanceDraft.findById(id);
    
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Attendance draft not found' },
        { status: 404 }
      );
    }

        return NextResponse.json({
          success: true,
          data: draft
        });
      } catch (error: any) {
        console.error('Error fetching attendance draft:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch attendance draft',
            message: error.message 
          },
          { status: 500 }
        );
      }
    }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        const { id } = await params;

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

    // Update the draft with new savedAt timestamp
    const updatedDraft = await StudentAttendanceDraft.findByIdAndUpdate(
      id,
      {
        ...(studentId !== undefined && { studentId: studentId || '(unspecified)' }),
        ...(studentName !== undefined && { studentName: studentName || '(unspecified)' }),
        ...(cohortId !== undefined && { cohortId }),
        ...(cohortName !== undefined && { cohortName }),
        ...(cohortInstructor !== undefined && { cohortInstructor }),
        ...(cohortTiming !== undefined && { cohortTiming }),
        ...(courseId !== undefined && { courseId }),
        ...(courseName !== undefined && { courseName }),
        ...(date !== undefined && { date: date || new Date().toISOString().slice(0, 10) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(status !== undefined && { status: status || 'present' }),
        ...(notes !== undefined && { notes }),
        savedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDraft) {
      return NextResponse.json(
        { success: false, error: 'Attendance draft not found' },
        { status: 404 }
      );
    }

        return NextResponse.json({
          success: true,
          data: updatedDraft
        });

      } catch (error: any) {
        console.error('Error updating attendance draft:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to update attendance draft',
            message: error.message 
          },
          { status: 500 }
        );
      }
    }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const { id } = await params;

    const deletedDraft = await StudentAttendanceDraft.findByIdAndDelete(id);
    
    if (!deletedDraft) {
      return NextResponse.json(
        { success: false, error: 'Attendance draft not found' },
        { status: 404 }
      );
    }

        return NextResponse.json({
          success: true,
          message: 'Attendance draft deleted successfully',
          data: deletedDraft
        });
      } catch (error: any) {
        console.error('Error deleting attendance draft:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to delete attendance draft',
            message: error.message 
          },
          { status: 500 }
        );
      }
    }
  );
}