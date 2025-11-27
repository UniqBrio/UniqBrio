import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';


// Define the Course schema to access course fees
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  courseId: String,
  description: String,
  courseCategory: String,
  type: String,
  duration: String,
  level: String,
  priceINR: Number,
  registrationFee: Number,
  status: String
}, {
  collection: 'courses',
  strict: false
});

interface CourseDocument extends mongoose.Document {
  name: string;
  courseId: string;
  description: string;
  courseCategory: string;
  type: string;
  duration: string;
  level: string;
  priceINR?: number;
  registrationFee?: number;
  status: string;
}

const Course: mongoose.Model<CourseDocument> = mongoose.models.CoursePayment || 
  mongoose.model<CourseDocument>('CoursePayment', courseSchema);

/**
 * Get course fee by course ID
 * GET /api/payments/course-fee?courseId=COURSE0001
 */
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
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Find course by courseId
    const course = await Course.findOne({ courseId, tenantId: session.tenantId }).lean();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        courseId: (course as any).courseId,
        courseName: (course as any).name,
        courseFee: (course as any).priceINR || 0,
        registrationFee: (course as any).registrationFee || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching course fee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course fee', details: error.message },
      { status: 500 }
    );
  }
    }
  );
}

/**
 * Get all courses with their fees
 * GET /api/payments/course-fees
 */
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

    // Fetch all courses with fees
    const courses = await Course.find({ tenantId: session.tenantId }).lean();

    const courseFees = courses.map((course: any) => ({
      courseId: course.courseId,
      courseName: course.name,
      courseFee: course.priceINR || 0,
      registrationFee: course.registrationFee || 0,
      category: course.courseCategory,
      type: course.type,
      level: course.level,
    }));

    return NextResponse.json(courseFees, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching all course fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course fees', details: error.message },
      { status: 500 }
    );
  }
    }
  );
}
