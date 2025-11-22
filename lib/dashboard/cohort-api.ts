// Cohort API utilities
export interface CohortInfo {
  id: string;
  name: string;
  instructor?: string;
  timing?: string;
  capacity?: number;
}

/**
 * Fetch cohort information by cohort IDs
 */
export async function fetchCohortsByIds(cohortIds: string[]): Promise<Map<string, CohortInfo>> {
  try {
    if (!cohortIds.length) return new Map();
    
    // Use the services cohorts API which provides detailed information
    const response = await fetch('/api/dashboard/services/cohorts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch cohorts:', response.status, response.statusText);
      return new Map();
    }
    
    const data = await response.json();
    
    // Handle the response structure from services/cohorts API
    const allCohorts: CohortInfo[] = data.success && Array.isArray(data.cohorts) 
      ? data.cohorts 
      : Array.isArray(data) 
        ? data 
        : [];
    
    const cohortMap = new Map<string, CohortInfo>();
    
    // Filter to only include requested cohort IDs and map them
    allCohorts.forEach(cohort => {
      const id = cohort.id || (cohort as any).cohortId;
      if (id && cohortIds.includes(id)) {
        cohortMap.set(id, {
          ...cohort,
          id // Ensure id is set
        });
      }
    });
    
    console.log(`Fetched ${cohortMap.size} cohorts for IDs: ${cohortIds.join(', ')}`);
    
    return cohortMap;
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return new Map();
  }
}

/**
 * Get cohort display name with fallback
 */
export function getCohortDisplayName(cohortId: string, cohortMap: Map<string, CohortInfo>): string {
  const cohort = cohortMap.get(cohortId);
  return cohort?.name || cohortId || 'Unknown';
}

/**
 * Get cohort full info for detailed display
 */
export function getCohortFullInfo(cohortId: string, cohortMap: Map<string, CohortInfo>): {
  id: string;
  name: string;
  instructor?: string;
  timing?: string;
} {
  const cohort = cohortMap.get(cohortId);
  return {
    id: cohortId,
    name: cohort?.name || cohortId,
    instructor: cohort?.instructor,
    timing: cohort?.timing,
  };
}