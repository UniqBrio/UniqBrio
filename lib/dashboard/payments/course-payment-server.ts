import mongoose from 'mongoose';

// Define Course schema for payment details
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  courseId: String,
  name: String,
  courseName: String,
  category: String,
  courseCategory: String,
  paymentCategory: String,
  type: String,
  courseType: String,
  priceINR: Number,
  registrationFee: Number,
  level: String,
  duration: String,
  status: String
}, {
  collection: 'courses',
  strict: false
});

const Course = mongoose.models.CoursePaymentHelper || 
  mongoose.model('CoursePaymentHelper', courseSchema);

export interface CoursePaymentDetails {
  courseId: string;
  name: string;
  paymentCategory: string;
  courseCategory: string;
  courseType: string;
  priceINR?: number;
  registrationFee?: number;
  level?: string;
  duration?: string;
  status?: string;
}

/**
 * Fetch payment category and course type for a single course
 * @param courseId - The course ID to fetch details for
 * @returns CoursePaymentDetails or null if not found
 */
export async function fetchCoursePaymentDetails(courseId: string): Promise<CoursePaymentDetails | null> {
  try {
    if (!courseId) {
      console.warn('[fetchCoursePaymentDetails] No courseId provided');
      return null;
    }

    console.log('[fetchCoursePaymentDetails] Fetching details for courseId:', courseId);

    const course = await Course.findOne({ courseId })
      .select('courseId name courseName category courseCategory paymentCategory type courseType priceINR registrationFee level duration status')
      .lean()
      .exec();

    if (!course) {
      console.warn('[fetchCoursePaymentDetails] Course not found for courseId:', courseId);
      return null;
    }

    // Type cast the course object to any to handle dynamic MongoDB schema
    const courseData = course as any;

    // Normalize the response to handle different field naming conventions
    const paymentDetails: CoursePaymentDetails = {
      courseId: courseData.courseId,
      name: courseData.name || courseData.courseName || '',
      paymentCategory: courseData.paymentCategory || courseData.courseCategory || courseData.category || 'Not Specified',
      courseCategory: courseData.courseCategory || courseData.category || 'Not Specified',
      courseType: courseData.type || courseData.courseType || 'Not Specified',
      priceINR: courseData.priceINR,
      registrationFee: courseData.registrationFee,
      level: courseData.level,
      duration: courseData.duration,
      status: courseData.status
    };

    console.log('[fetchCoursePaymentDetails] Successfully fetched:', paymentDetails);
    return paymentDetails;

  } catch (error) {
    console.error('[fetchCoursePaymentDetails] Error:', error);
    return null;
  }
}

/**
 * Fetch payment category and course type for multiple courses
 * @param courseIds - Array of course IDs to fetch details for
 * @returns Array of CoursePaymentDetails
 */
export async function fetchMultipleCoursePaymentDetails(courseIds: string[]): Promise<{
  courses: CoursePaymentDetails[];
  missingCourseIds: string[];
}> {
  try {
    if (!courseIds || courseIds.length === 0) {
      console.warn('[fetchMultipleCoursePaymentDetails] No courseIds provided');
      return { courses: [], missingCourseIds: [] };
    }

    console.log('[fetchMultipleCoursePaymentDetails] Fetching details for courseIds:', courseIds);

    const courses = await Course.find({ 
      courseId: { $in: courseIds } 
    })
      .select('courseId name courseName category courseCategory paymentCategory type courseType priceINR registrationFee level duration status')
      .lean()
      .exec();

    // Normalize the response with proper type casting
    const paymentDetails: CoursePaymentDetails[] = (courses as any[]).map((course: any) => ({
      courseId: course.courseId,
      name: course.name || course.courseName || 'Unknown Course',
      paymentCategory: course.paymentCategory || course.courseCategory || course.category || 'Not Specified',
      courseCategory: course.courseCategory || course.category || 'Not Specified',
      courseType: course.courseType || course.type || 'Not Specified',
      priceINR: course.priceINR,
      registrationFee: course.registrationFee,
      level: course.level,
      duration: course.duration,
      status: course.status
    }));

    // Check for missing courses
    const foundCourseIds = paymentDetails.map(c => c.courseId);
    const missingCourseIds = courseIds.filter(id => !foundCourseIds.includes(id));

    console.log('[fetchMultipleCoursePaymentDetails] Found:', foundCourseIds);
    if (missingCourseIds.length > 0) {
      console.warn('[fetchMultipleCoursePaymentDetails] Missing courseIds:', missingCourseIds);
    }

    return { courses: paymentDetails, missingCourseIds };

  } catch (error) {
    console.error('[fetchMultipleCoursePaymentDetails] Error:', error);
    return { courses: [], missingCourseIds: courseIds };
  }
}

/**
 * Get payment category for a course (shorthand helper)
 * @param courseId - The course ID
 * @returns Payment category string or null
 */
export async function getCoursePaymentCategory(courseId: string): Promise<string | null> {
  const details = await fetchCoursePaymentDetails(courseId);
  return details?.paymentCategory || null;
}

/**
 * Get course type for a course (shorthand helper)
 * @param courseId - The course ID
 * @returns Course type string or null
 */
export async function getCourseType(courseId: string): Promise<string | null> {
  const details = await fetchCoursePaymentDetails(courseId);
  return details?.courseType || null;
}

/**
 * Get course fees for a course (shorthand helper)
 * @param courseId - The course ID
 * @returns Object with priceINR and registrationFee or null
 */
export async function getCourseFees(courseId: string): Promise<{
  priceINR?: number;
  registrationFee?: number;
} | null> {
  const details = await fetchCoursePaymentDetails(courseId);
  if (!details) return null;
  
  return {
    priceINR: details.priceINR,
    registrationFee: details.registrationFee
  };
}

/**
 * Refresh course payment details cache (useful after course updates)
 * @param courseId - Optional specific course ID to refresh, or all if not provided
 */
export async function refreshCoursePaymentDetails(courseId?: string): Promise<boolean> {
  try {
    // This is a simple implementation - in production you might want to implement
    // actual caching with Redis or similar and invalidate specific keys
    console.log('[refreshCoursePaymentDetails] Refreshing cache for courseId:', courseId || 'all');
    
    // For now, just log that refresh was requested
    // You can implement actual cache invalidation logic here if needed
    
    return true;
  } catch (error) {
    console.error('[refreshCoursePaymentDetails] Error:', error);
    return false;
  }
}

export default {
  fetchCoursePaymentDetails,
  fetchMultipleCoursePaymentDetails,
  getCoursePaymentCategory,
  getCourseType,
  getCourseFees,
  refreshCoursePaymentDetails
};