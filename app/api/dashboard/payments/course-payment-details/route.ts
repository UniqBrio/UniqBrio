import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Define Course schema for payment details
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  courseId: String,
  name: String,
  courseName: String,
  courseCategory: String,
  paymentCategory: String,
  type: String,
  courseType: String,
  price: Number,
  registrationFee: Number,
  level: String,
  duration: String,
  status: String
}, {
  collection: 'courses',
  strict: false
});

interface CoursePaymentDetails {
  courseId: string;
  name: string;
  paymentCategory: string;
  courseCategory: string;
  courseType: string;
  price?: number;
  registrationFee?: number;
  level?: string;
  duration?: string;
  status?: string;
}

const Course = mongoose.models.CoursePaymentDetails || 
  mongoose.model('CoursePaymentDetails', courseSchema);

/**
 * Get course payment details by course ID
 * GET /api/payments/course-payment-details?courseId=COURSE0001
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

    console.log('[course-payment-details] Fetching payment details for courseId:', courseId);

    // Find course by courseId
    const course = await Course.findOne({ courseId, tenantId: session.tenantId })
      .select('courseId name courseName courseCategory paymentCategory type courseType price registrationFee level duration status')
      .lean()
      .exec();

    if (!course) {
      console.log('[course-payment-details] Course not found for courseId:', courseId);
      
      // Log available courses for debugging
      const sampleCourses = await Course.find({ tenantId: session.tenantId })
        .select('courseId name courseName courseCategory type')
        .limit(5)
        .lean();
      
      console.log('[course-payment-details] Sample courses available:', sampleCourses);
      
      return NextResponse.json(
        { 
          error: 'Course not found',
          details: `No course found with courseId: ${courseId}`,
          hint: 'Check if the courseId exists in the courses collection'
        },
        { status: 404 }
      );
    }

    // Type cast and normalize the response to handle different field naming conventions
    const courseData = course as any;
    const paymentDetails: CoursePaymentDetails = {
      courseId: courseData.courseId,
      name: courseData.name || courseData.courseName || '',
      paymentCategory: courseData.paymentCategory || 'Not Specified',
      courseCategory: courseData.courseCategory || 'Not Specified',
      courseType: courseData.courseType || courseData.type || 'Not Specified',
      price: courseData.price,
      registrationFee: courseData.registrationFee,
      level: courseData.level,
      duration: courseData.duration,
      status: courseData.status
    };

    console.log('[course-payment-details] Successfully fetched course details:', paymentDetails);

    return NextResponse.json({
      success: true,
      data: paymentDetails
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('[course-payment-details] Error fetching course payment details:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch course payment details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
    }
  );
}

/**
 * Get payment details for multiple courses
 * POST /api/payments/course-payment-details
 * Body: { courseIds: string[] }
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

    const body = await request.json();
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds array is required' },
        { status: 400 }
      );
    }

    console.log('[course-payment-details] Fetching payment details for courseIds:', courseIds);

    // Find courses by courseIds
    const courses = await Course.find({ 
      courseId: { $in: courseIds },
      tenantId: session.tenantId
    })
      .select('courseId name courseName courseCategory paymentCategory type courseType price registrationFee level duration status')
      .lean()
      .exec();

    // Normalize the response with proper type casting
    const paymentDetails: CoursePaymentDetails[] = (courses as any[]).map((course: any) => ({
      courseId: course.courseId,
      name: course.name || course.courseName || '',
      paymentCategory: course.paymentCategory || 'Not Specified',
      courseCategory: course.courseCategory || 'Not Specified',
      courseType: course.courseType || course.type || 'Not Specified',
      price: course.price,
      registrationFee: course.registrationFee,
      level: course.level,
      duration: course.duration,
      status: course.status
    }));

    // Check for missing courses
    const foundCourseIds = paymentDetails.map(c => c.courseId);
    const missingCourseIds = courseIds.filter(id => !foundCourseIds.includes(id));

    console.log('[course-payment-details] Successfully fetched details for courses:', foundCourseIds);
    if (missingCourseIds.length > 0) {
      console.log('[course-payment-details] Missing courses:', missingCourseIds);
    }

    return NextResponse.json({
      success: true,
      data: paymentDetails,
      missingCourseIds: missingCourseIds.length > 0 ? missingCourseIds : undefined
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('[course-payment-details] Error fetching multiple course payment details:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch course payment details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
    }
  );
}