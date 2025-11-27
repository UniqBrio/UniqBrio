import { useState, useEffect, useCallback } from 'react'
import { Course } from '@/types/dashboard/course'
import { toast } from '@/hooks/dashboard/use-toast'

interface DraftType {
  id: string
  name: string
  instructor: string
  description: string
  updatedAt: number
  level?: string
  type?: string
  priceINR?: number
  schedule?: string
  maxStudents?: number
  location?: string
  tags?: string[]
  status?: string
  courseCategory?: string
  [key: string]: any
}

interface Cohort {
  id: string;
  name: string;
  courseId: string;
  notes: string;
  status: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  capacity: number;
  members: { id: string; name: string; }[];
  location?: string;
  instructorName?: string;
}

export function useCourseManagement() {
  // State
  const [courses, setCourses] = useState<Course[]>([])
  const [drafts, setDrafts] = useState<DraftType[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [studentCount, setStudentCount] = useState<number | null>(null)

  // Load initial data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/services/courses", { credentials: 'include' }).then(res => res.json()),
      fetch("/api/dashboard/services/courses/drafts", { credentials: 'include' }).then(res => res.json()).catch(() => []),
      fetch('/api/dashboard/services/cohorts', { credentials: 'include' }).then(res => res.json()).catch(() => [])
    ]).then(([coursesData, draftsData, cohortsData]) => {
      // Handle courses data
      if (coursesData.success && coursesData.courses) {
        setCourses(coursesData.courses);
      } else if (Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        setCourses([]);
      }

      // Handle drafts data
      if (draftsData.success && draftsData.drafts) {
        setDrafts(draftsData.drafts);
      } else if (Array.isArray(draftsData)) {
        setDrafts(draftsData);
      } else {
        setDrafts([]);
      }

      // Handle cohorts data
      if (cohortsData.success && cohortsData.cohorts) {
        const formattedCohorts = cohortsData.cohorts.map((cohort: any) => ({
          ...cohort,
          members: Array.isArray(cohort.members)
            ? cohort.members.map((member: any) =>
                typeof member === 'string'
                  ? { id: member, name: member }
                  : { id: member.id || '', name: member.name || '' }
              )
            : []
        }));
        setCohorts(formattedCohorts);
      } else if (Array.isArray(cohortsData)) {
        const formattedCohorts = cohortsData.map((cohort: any) => ({
          ...cohort,
          members: Array.isArray(cohort.members)
            ? cohort.members.map((member: string | { id?: string; name?: string }) =>
                typeof member === 'string'
                  ? { id: member, name: member }
                  : { id: member.id || '', name: member.name || '' }
              )
            : []
        }));
        setCohorts(formattedCohorts);
      } else {
        setCohorts([]);
      }

      setLoading(false);
    }).catch((error) => {
      setCourses([]);
      setDrafts([]);
      setCohorts([]);
      setLoading(false);
    });
  }, []);

  // Fetch student count
  useEffect(() => {
    fetch("/api/dashboard/services/user-management/students", {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) {
          setStudentCount(data.count);
        } else if (data.numStudents !== undefined) {
          setStudentCount(data.numStudents);
        } else {
          setStudentCount(null);
        }
      })
      .catch(() => setStudentCount(null));
  }, []);

  // Handlers
  const handleDeleteCourse = useCallback(async (course: Course) => {
    // First, check if there are any cohorts associated with this course
    const associatedCohorts = cohorts.filter(cohort =>
      cohort.courseId === course.id || cohort.courseId === course.courseId
    );

    try {
      const response = await fetch('/api/dashboard/services/courses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: course.id,
          cascadeDelete: true // Flag to indicate cascade deletion
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the course from the state
        setCourses(prevCourses => prevCourses.filter(c => c.id !== course.id));

        // Remove all associated cohorts from the state
        if (associatedCohorts.length > 0) {
          setCohorts(prevCohorts => prevCohorts.filter(cohort =>
            cohort.courseId !== course.id && cohort.courseId !== course.courseId
          ));
        }

        const deletedCohortsCount = associatedCohorts.length;
        const message = deletedCohortsCount > 0
          ? `${course.name} and ${deletedCohortsCount} associated cohort${deletedCohortsCount > 1 ? 's' : ''} have been deleted successfully.`
          : `${course.name} has been deleted successfully.`;

        toast({
          title: "Course Deleted",
          description: message,
        });
      } else {
        throw new Error(data.error || 'Failed to delete course');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
    }
  }, [cohorts]);

  const handleDeleteDraft = useCallback(async (draft: DraftType) => {
    try {
      const response = await fetch(`/api/dashboard/services/courses/drafts?id=${draft.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draft.id));
        toast({
          title: "Draft Deleted",
          description: `${draft.name} has been deleted successfully.`,
        });
      } else {
        throw new Error(data.error || 'Failed to delete draft');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete draft",
        variant: "destructive",
      });
    }
  }, []);

  const refetchDrafts = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/services/courses/drafts", {
        credentials: 'include',
      });
      const draftsData = await response.json();

      if (draftsData.success && draftsData.drafts) {
        setDrafts(draftsData.drafts);
      } else if (Array.isArray(draftsData)) {
        setDrafts(draftsData);
      } else {
        setDrafts([]);
      }
    } catch (error) {
      console.error('Error refetching drafts:', error);
    }
  }, []);

  return {
    // State
    courses,
    setCourses,
    drafts,
    setDrafts,
    cohorts,
    setCohorts,
    loading,
    studentCount,

    // Handlers
    handleDeleteCourse,
    handleDeleteDraft,
    refetchDrafts,
  }
}
