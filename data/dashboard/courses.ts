'use client';

export interface Course {
  id: string;
  name: string;
  description: string;
  category: string; // mapped from courseCategory in backend
  type: string;
  duration: string;
  level: string;
  prerequisites: string[];
  outcomes: string[];
  status: string;
  courseId?: string;
}

// Function to fetch courses from the API
export async function fetchCourses(): Promise<Course[]> {
  try {
    const start = performance.now?.() || Date.now();
    console.groupCollapsed('[fetchCourses] start');
    console.log('Fetching courses from API...');
    const response = await fetch('/api/dashboard/student/courses', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable cache to ensure fresh data
      next: { revalidate: 0 } // Disable Next.js cache
    });

    console.log('API Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.details || data.error || 'Failed to fetch courses');
    }

    if (!Array.isArray(data)) {
      console.error('Unexpected courses data format:', data);
      throw new Error('Invalid courses data received');
    }

    const mapped = data.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      type: c.type,
      duration: c.duration,
      level: c.level,
      prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
      outcomes: Array.isArray(c.outcomes) ? c.outcomes : [],
      status: c.status,
      courseId: c.courseId,
    }));
    const duration = (performance.now?.() || Date.now()) - start;
    console.log('Successfully fetched courses:', mapped.length, 'in', duration.toFixed(1), 'ms');
    console.groupEnd();
    return mapped;
  } catch (error: any) {
    console.error('Error in fetchCourses:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.groupEnd?.();
    throw error;
  }
}