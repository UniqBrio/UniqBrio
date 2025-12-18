/**
 * Client-Side Course Payment Helper
 * 
 * This module provides client-side functions to fetch course payment details
 * using API calls instead of direct database access.
 */

export interface CoursePaymentDetails {
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

/**
 * Fetch payment category and course type for a single course (client-side)
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

    const response = await fetch(`/api/dashboard/payments/course-payment-details?courseId=${encodeURIComponent(courseId)}`);
    const result = await response.json();

    if (!response.ok) {
      console.warn('[fetchCoursePaymentDetails] API error:', result.error);
      return null;
    }

    if (!result.success || !result.data) {
      console.warn('[fetchCoursePaymentDetails] No data returned for courseId:', courseId);
      return null;
    }

    console.log('[fetchCoursePaymentDetails] Successfully fetched:', result.data);
    return result.data;

  } catch (error) {
    console.error('[fetchCoursePaymentDetails] Error:', error);
    return null;
  }
}

/**
 * Fetch payment category and course type for multiple courses (client-side)
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

    const response = await fetch('/api/dashboard/payments/course-payment-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseIds: courseIds
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[fetchMultipleCoursePaymentDetails] API error:', result.error);
      return { courses: [], missingCourseIds: courseIds };
    }

    const courses = result.data || [];
    const missingCourseIds = result.missingCourseIds || [];

    console.log('[fetchMultipleCoursePaymentDetails] Found:', courses.length, 'courses');
    if (missingCourseIds.length > 0) {
      console.warn('[fetchMultipleCoursePaymentDetails] Missing courseIds:', missingCourseIds);
    }

    return { courses, missingCourseIds };

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
 * @returns Object with price and registrationFee or null
 */
export async function getCourseFees(courseId: string): Promise<{
  price?: number;
  registrationFee?: number;
} | null> {
  const details = await fetchCoursePaymentDetails(courseId);
  if (!details) return null;
  
  return {
    price: details.price,
    registrationFee: details.registrationFee
  };
}

/**
 * Refresh course payment details cache (useful after course updates)
 * This is a no-op for client-side version since we don't maintain client-side cache
 * @param courseId - Optional specific course ID to refresh, or all if not provided
 */
export async function refreshCoursePaymentDetails(courseId?: string): Promise<boolean> {
  console.log('[refreshCoursePaymentDetails] Client-side cache refresh requested for courseId:', courseId || 'all');
  // Client-side doesn't maintain cache, so this is always successful
  return true;
}

export default {
  fetchCoursePaymentDetails,
  fetchMultipleCoursePaymentDetails,
  getCoursePaymentCategory,
  getCourseType,
  getCourseFees,
  refreshCoursePaymentDetails
};