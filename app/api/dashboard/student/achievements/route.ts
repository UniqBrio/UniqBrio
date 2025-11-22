import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Achievement from '@/models/dashboard/student/Achievement';
import Student from '@/models/dashboard/student/Student';

// GET all achievements with student populated
export async function GET() {
  await dbConnect("uniqbrio");
  try {
    const achievements = await Achievement.find({}).populate('student');
    return NextResponse.json(achievements);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST a new achievement and link to student (accepts student as ObjectId or studentId string)
export async function POST(req: NextRequest) {
  await dbConnect("uniqbrio");
  try {
    const data = await req.json();

    // If only studentId is provided, resolve to Student _id and keep studentId copy
    if (!data.student && data.studentId) {
      const owner = await Student.findOne({ studentId: data.studentId });
      if (owner) {
        data.student = owner._id;
      }
    }

    const achievement = await Achievement.create(data);

    // Maintain back-reference on Student
    if (achievement.student) {
      await Student.findByIdAndUpdate(achievement.student, { $push: { achievements: achievement._id } });
    }

    const populatedAchievement = await Achievement.findById(achievement._id).populate('student');
    return NextResponse.json(populatedAchievement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
  }
}

// PUT: update an achievement
export async function PUT(req: NextRequest) {
  await dbConnect("uniqbrio");
  try {
    const body = await req.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json({ error: 'Missing achievement id' }, { status: 400 });
    }

    // If updating with studentId, resolve to ObjectId
    if (!body.student && body.studentId) {
      const owner = await Student.findOne({ studentId: body.studentId });
      if (owner) body.student = owner._id;
    }

    const update = { ...body } as any;
    delete update._id;
    delete update.id;

    const updated = await Achievement.findByIdAndUpdate(id, update, { new: true }).populate('student');
    if (!updated) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
  }
}

// DELETE: delete an achievement
export async function DELETE(req: NextRequest) {
  await dbConnect("uniqbrio");
  try {
    const body = await req.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json({ error: 'Missing achievement id' }, { status: 400 });
    }
    const ach = await Achievement.findByIdAndDelete(id);
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
