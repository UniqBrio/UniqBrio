import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Achievement from '@/models/dashboard/student/Achievement';
import Student from '@/models/dashboard/student/Student';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

// GET all achievements with student populated
export async function GET() {
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
    console.log('[Achievements API] Fetching achievements for tenant:', session.tenantId);
    
    // Explicitly filter by tenantId to satisfy tenant plugin
    const achievements = await Achievement.find({ tenantId: session.tenantId });
    console.log('[Achievements API] Found achievements:', achievements.length);
    
    return NextResponse.json(achievements);
  } catch (error: any) {
    console.error('[Achievements API] Error fetching achievements:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch achievements', 
      details: error.message 
    }, { status: 500 });
  }
    }
  );
}

// POST a new achievement and link to student (accepts student as ObjectId or studentId string)
export async function POST(req: NextRequest) {
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
    const data = await req.json();

    // If only studentId is provided, resolve to Student _id and keep studentId copy
    if (!data.student && data.studentId) {
      const owner = await Student.findOne({ studentId: data.studentId, tenantId: session.tenantId });
      if (owner) {
        data.student = owner._id;
      }
    }

    // Ensure tenantId is set
    data.tenantId = session.tenantId;

    const achievement = await Achievement.create(data);

    // Maintain back-reference on Student
    if (achievement.student) {
      await Student.findByIdAndUpdate(achievement.student, { $push: { achievements: achievement._id } });
    }

    const populatedAchievement = await Achievement.findOne({ _id: achievement._id, tenantId: session.tenantId });
    return NextResponse.json(populatedAchievement || achievement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
  }
    }
  );
}

// PUT: update an achievement
export async function PUT(req: NextRequest) {
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
    const body = await req.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json({ error: 'Missing achievement id' }, { status: 400 });
    }

    // If updating with studentId, resolve to ObjectId
    if (!body.student && body.studentId) {
      const owner = await Student.findOne({ studentId: body.studentId, tenantId: session.tenantId });
      if (owner) body.student = owner._id;
    }

    const update = { ...body } as any;
    delete update._id;
    delete update.id;

    const updated = await Achievement.findOneAndUpdate(
      { _id: id, tenantId: session.tenantId },
      update,
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
  }
    }
  );
}

// DELETE: delete an achievement
export async function DELETE(req: NextRequest) {
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
    const body = await req.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json({ error: 'Missing achievement id' }, { status: 400 });
    }
    const ach = await Achievement.findOneAndDelete({ _id: id, tenantId: session.tenantId });
    if (!ach) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    // Also pull from student's achievements array if present
    if (ach.student) {
      await Student.findByIdAndUpdate(ach.student, { $pull: { achievements: ach._id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
  }
    }
  );
}
