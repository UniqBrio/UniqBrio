"use client"

import CohortManagement from "@/components/dashboard/courses/CohortManagement";
import { useState, useEffect } from "react";
import { useCustomColors } from "@/lib/use-custom-colors";
import { useGlobalData } from "@/contexts/dashboard/global-data-context";
import type { Course } from "@/types/dashboard/course";
import { 
  createCourseStatusMap, 
  filterActiveCohorts,
  validateScheduleConsistency 
} from "@/lib/dashboard/statusValidation";

export default function CohortsPage() {
  const globalData = useGlobalData();
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use prefetched data for instant load!
    if (globalData.isInitialized) {
      const allCourses = globalData.courses as any;
      const allCohorts = globalData.cohorts;
      
      // Create course status map for validation
      const courseStatusMap = createCourseStatusMap(allCourses);
      
      // Filter active cohorts (those with active parent courses)
      const activeCohorts = filterActiveCohorts(allCohorts, courseStatusMap);
      
      console.log(`Cohorts filtered (instant): ${allCohorts.length} total -> ${activeCohorts.length} active`);
      
      setCourses(allCourses);
      setCohorts(activeCohorts);
      setLoading(false);
    }
  }, [globalData.isInitialized, globalData.courses, globalData.cohorts]);

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
