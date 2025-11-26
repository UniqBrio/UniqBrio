import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import StudentDraft, { type IStudentDraft } from '@/models/dashboard/student/StudentDraft';
import { formatDateForDisplay } from '@/lib/dashboard/student/utils';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// GET - Fetch all student drafts
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

    const drafts = await StudentDraft.find({ tenantId: session.tenantId }).sort({ lastUpdated: -1 }).lean();
    
    // Transform to frontend format
    const transformedDrafts = drafts.map((draft: any) => {
      const draftId = draft._id ? String(draft._id) : String(draft.id || Date.now());
        return {
        id: draftId,
        name: draft.name || '',
        instructor: draft.instructor || 'No Course Selected',
        level: draft.level || 'Beginner',
        lastUpdated: formatDateForDisplay(new Date(draft.lastUpdated || draft.createdAt || Date.now()).toISOString().slice(0,10)),
        data: draft.data || {}
      };
    });

        return NextResponse.json(transformedDrafts);
      } catch (error) {
        console.error('Error fetching student drafts:', error);
        return NextResponse.json(
          { error: 'Failed to fetch student drafts' },
          { status: 500 }
        );
      }
    }
  );
}

// POST - Create a new student draft
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
    const { name, instructor, level, data } = body;

    if (!name || !data) {
      return NextResponse.json(
        { error: 'Name and data are required' },
        { status: 400 }
      );
    }

    const newDraft = new StudentDraft({
      name,
      instructor: instructor || 'No Course Selected',
      level: level || 'Beginner',
      data
    });

    const savedDraft = await newDraft.save();

    return NextResponse.json({
      id: savedDraft._id.toString(),
      name: savedDraft.name,
      instructor: savedDraft.instructor,
      level: savedDraft.level,
      lastUpdated: formatDateForDisplay(new Date(savedDraft.lastUpdated).toISOString().slice(0,10)),
      data: savedDraft.data
    }, { status: 201 });
      } catch (error) {
        console.error('Error creating student draft:', error);
        return NextResponse.json(
          { error: 'Failed to create student draft' },
          { status: 500 }
        );
      }
    }
  );
}

// PUT - Update an existing student draft
export async function PUT(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const { id, name, instructor, level, data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const updatedDraft = await StudentDraft.findByIdAndUpdate(
      id,
      {
        name,
        instructor: instructor || 'No Course Selected',
        level: level || 'Beginner',
        data,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDraft) {
      return NextResponse.json(
        { error: 'Student draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedDraft._id.toString(),
      name: updatedDraft.name,
      instructor: updatedDraft.instructor,
      level: updatedDraft.level,
      lastUpdated: formatDateForDisplay(new Date(updatedDraft.lastUpdated).toISOString().slice(0,10)),
      data: updatedDraft.data
    });
  } catch (error) {
    console.error('Error updating student draft:', error);
    return NextResponse.json(
      { error: 'Failed to update student draft' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a student draft
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const deletedDraft = await StudentDraft.findByIdAndDelete(id);

    if (!deletedDraft) {
      return NextResponse.json(
        { error: 'Student draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Student draft deleted successfully',
      id: deletedDraft._id.toString()
    });
  } catch (error) {
    console.error('Error deleting student draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete student draft' },
      { status: 500 }
    );
  }
}