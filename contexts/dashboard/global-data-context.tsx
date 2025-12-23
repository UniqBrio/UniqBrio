"use client"

/**
 * Global Data Prefetching Context
 * 
 * This context pre-loads commonly used data (courses, cohorts, students, user info)
 * once when the dashboard loads, then shares it across all pages.
 * 
 * Benefits:
 * - ⚡ Instant page loads (data already in memory)
 * - 🔄 Auto-refreshes every 2 minutes to stay current
 * - 📉 Reduces redundant API calls (from 4+ calls per page to 1 shared call)
 * - 💾 Works with backend API caching for optimal performance
 * 
 * Usage: const { courses, cohorts, students, userInfo, refetch } = useGlobalData()
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Course {
  _id?: string;
  courseId: string;
  name: string;
  instructor?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

interface Cohort {
  id: string;
  name: string;
  courseId: string;
  status?: string;
  [key: string]: any;
}

interface Student {
  _id?: string;
  studentId: string;
  name: string;
  email?: string;
  [key: string]: any;
}

interface GlobalData {
  courses: Course[];
  cohorts: Cohort[];
  students: Student[];
  userInfo: any;
  isLoading: boolean;
  isInitialized: boolean;
  lastUpdated: number;
  refetch: () => Promise<void>;
}

const GlobalDataContext = createContext<GlobalData | null>(null);

export function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all critical data in parallel
      const [coursesRes, cohortsRes, studentsRes, userInfoRes] = await Promise.all([
        fetch('/api/dashboard/services/courses').then(r => r.ok ? r.json() : { courses: [] }),
        fetch('/api/dashboard/services/cohorts').then(r => r.ok ? r.json() : { cohorts: [] }),
        fetch('/api/dashboard/services/user-management/students').then(r => r.ok ? r.json() : []),
        fetch('/api/user-academy-info').then(r => r.ok ? r.json() : null),
      ]);

      // Update state with fetched data
      setCourses(coursesRes.courses || coursesRes || []);
      setCohorts(cohortsRes.cohorts || cohortsRes || []);
      setStudents(Array.isArray(studentsRes) ? studentsRes : studentsRes.students || []);
      setUserInfo(userInfoRes);
      setLastUpdated(Date.now());
      setIsInitialized(true);
    } catch (error) {
      console.error('Error prefetching global data:', error);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const value: GlobalData = {
    courses,
    cohorts,
    students,
    userInfo,
    isLoading,
    isInitialized,
    lastUpdated,
    refetch: fetchAllData,
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
}
