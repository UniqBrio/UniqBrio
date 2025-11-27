'use client';

export interface Cohort {
  id: string;
  name: string;
  instructor: string;
  timing: string;
  activity: string;
  capacity: number;
  enrolledStudents?: string[]; // Array of student IDs
  startDate?: string; // ISO date string for cohort start date
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  location?: string;
  status?: string;
  endDate?: string;
}

// Function to fetch cohorts from the API with stronger guards
export async function fetchCohorts(activityId?: string): Promise<Cohort[]> {
  const url = activityId ? `/api/dashboard/student/cohorts?activity=${encodeURIComponent(activityId)}` : '/api/dashboard/student/cohorts';
  try {
    console.groupCollapsed('[fetchCohorts] Request');
    console.log('URL:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
      cache: 'no-store'
    });
    console.log('Status:', response.status);
    let json: any = null;
    try {
      json = await response.json();
    } catch (parseErr) {
      console.error('[fetchCohorts] Failed to parse JSON', parseErr);
      throw new Error('Invalid cohorts response');
    }
    if (!response.ok) {
      console.error('[fetchCohorts] Error payload:', json);
      throw new Error(json?.error || 'Failed to fetch cohorts');
    }
    if (!Array.isArray(json)) {
      console.error('[fetchCohorts] Expected array, received:', json);
      return [];
    }
    const mapped: Cohort[] = [];
    for (const c of json) {
      try {
        if (!c) continue;
        const id = c.id || c._id || undefined;
        if (!id) continue;
        mapped.push({
          id: String(id),
          name: c.name || '',
          instructor: c.instructor || '',
          timing: c.timing || '',
          activity: c.activity || '',
          capacity: typeof c.capacity === 'number' ? c.capacity : 0,
          enrolledStudents: Array.isArray(c.enrolledStudents) ? c.enrolledStudents : [],
          startDate: c.startDate || undefined,
          startTime: c.startTime || '',
          endTime: c.endTime || '',
          daysOfWeek: Array.isArray(c.daysOfWeek) ? c.daysOfWeek : undefined,
          location: c.location || '',
          status: c.status || '',
          endDate: c.endDate || undefined,
        });
      } catch (inner) {
        console.warn('[fetchCohorts] Skipping malformed cohort doc', inner, c);
      }
    }
    console.log('[fetchCohorts] mapped length:', mapped.length);
    console.groupEnd();
    return mapped;
  } catch (error: any) {
    console.error('[fetchCohorts] Fatal error:', error?.message || error, error);
    console.groupEnd?.();
    return [];
  }
}