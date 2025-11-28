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
    const response = await fetch('/api/dashboard/student/courses', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store', // Disable cache to ensure fresh data
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.details || data.error || 'Failed to fetch courses');
    }

    if (!Array.isArray(data)) {
      throw new Error('Invalid courses data received');
    }

    return data.map((c: any) => ({
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
  } catch (error: any) {
    console.error('Error fetching courses:', error.message);
    throw error;
  }
}