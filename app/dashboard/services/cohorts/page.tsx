"use client"

export const dynamic = 'force-dynamic';

import CohortManagement from "@/components/dashboard/courses/CohortManagement";
import { useState, useEffect } from "react";
import { useCustomColors } from "@/lib/use-custom-colors";
import type { Course } from "@/types/dashboard/course";
import { 
  createCourseStatusMap, 
  filterActiveCohorts,
  validateScheduleConsistency 
} from "@/lib/dashboard/statusValidation";

export default function CohortsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/services/courses").then(res => res.json()),
      fetch("/api/dashboard/services/cohorts").then(res => res.json())
    ]).then(([coursesData, cohortsData]) => {
      const allCourses = Array.isArray(coursesData) ? coursesData : coursesData.courses || [];
      const allCohorts = Array.isArray(cohortsData) ? cohortsData : cohortsData.cohorts || [];
      
      // Create course status map for validation
      const courseStatusMap = createCourseStatusMap(allCourses);
      
      // Filter active cohorts (those with active parent courses)
      const activeCohorts = filterActiveCohorts(allCohorts, courseStatusMap);
      
      console.log(`Cohorts filtered: ${allCohorts.length} total -> ${activeCohorts.length} active`);
      
      setCourses(allCourses); // Show all courses for course selection
      setCohorts(activeCohorts); // Only show cohorts from active courses
      setLoading(false);
    }).catch(() => {
      setCourses([]);
      setCohorts([]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-white">Loading cohorts...</p>
            </div>
          </div>
        ) : (
          <CohortManagement 
            courses={courses}
            cohorts={cohorts}
            setCohorts={setCohorts}
            showDeleteConfirmation={() => {}}
          />
        )}
      </div>);
}
