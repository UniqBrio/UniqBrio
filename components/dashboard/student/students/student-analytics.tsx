"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { Badge } from "@/components/dashboard/ui/badge";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  BookOpen,
  Target
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";
import { type Student } from "@/types/dashboard/student";
import { type Cohort, fetchCohorts } from "@/data/dashboard/cohorts";
import { type Course, fetchCourses } from "@/data/dashboard/courses";

interface StudentAnalyticsProps {
  students: Student[];
  loading?: boolean;
}

export function StudentAnalytics({ students, loading = false }: StudentAnalyticsProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [totalCohorts, setTotalCohorts] = useState<number>(0);

  const getFilteredAnalyticsData = () => {
    return students || [];
  };

  // Fetch cohorts data and count
  useEffect(() => {
    const loadCohorts = async () => {
      setCohortsLoading(true);
      try {
        const data = await fetchCohorts();
        const cohortsArray = Array.isArray(data) ? data : [];
        setCohorts(cohortsArray);
        // Set total cohorts count from database
        setTotalCohorts(cohortsArray.length);
      } catch (error) {
        console.error('Failed to fetch cohorts for analytics:', error);
        setCohorts([]);
        setTotalCohorts(0);
      } finally {
        setCohortsLoading(false);
      }
    };

    loadCohorts();
  }, []);

  // Fetch courses data
  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const data = await fetchCourses();
        const coursesArray = Array.isArray(data) ? data : [];
        setCourses(coursesArray);
      } catch (error) {
        console.error('Failed to fetch courses for analytics:', error);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Fetch total courses count from database
  useEffect(() => {
    const loadCoursesCount = async () => {
      try {
        const response = await fetch('/api/dashboard/services/courses?page=1&limit=1');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.pagination) {
            setTotalCourses(data.pagination.total);
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses count:', error);
        setTotalCourses(0);
      }
    };

    loadCoursesCount();
  }, []);

  const programs = useMemo(() => Array.from(new Set(students.map(s => s.enrolledCourseName).filter(Boolean))) as string[], [students]);
  const activities = useMemo(() => Array.from(new Set(students.map(s => s.courseOfInterestId).filter(Boolean))) as string[], [students]);
  const enrolledCourses = useMemo(() => Array.from(new Set(students.map(s => s.enrolledCourseName).filter(Boolean))) as string[], [students]);
  const categories = useMemo(() => Array.from(new Set(students.map(s => s.category).filter(Boolean))) as string[], [students]);

  const filtered = () => getFilteredAnalyticsData();

  // Removed duplicate summary cards (Total Students, Total Courses, Total Cohorts)

  const COLORS = ['#8A2BE2', '#9B59B6', '#7B68EE', '#DDA0DD', '#FFA500', '#FF8C00', '#FFB347', '#FFCC80'];

  // Custom tooltip for courses
  const CourseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white">ID: {data.course}</p>
          {data.courseName && data.courseName !== data.course && (
            <p className="text-sm text-gray-600 dark:text-white">Name: {data.courseName}</p>
          )}
          <p className="text-sm text-purple-600 font-medium">Students: {data.students}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for cohorts
  const CohortTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white">ID: {data.cohort}</p>
          {data.cohortName && data.cohortName !== data.cohort && (
            <p className="text-sm text-gray-600 dark:text-white">Name: {data.cohortName}</p>
          )}
          <p className="text-sm text-orange-600 font-medium">Students: {data.students}</p>
        </div>
      );
    }
    return null;
  };

  // Build course distribution and a "nice" set of y-axis ticks (0,2,4,6,8,...)
  const courseChart = useMemo(() => {
    // Group by course ID instead of course name
    const courseGroups = new Map<string, { id: string; name: string; count: number }>();
    getFilteredAnalyticsData().forEach(student => {
      const courseId = student.enrolledCourse;
      const courseName = student.enrolledCourseName || courseId || 'Unknown';
      if (courseId && courseId.trim()) {
        const existing = courseGroups.get(courseId) || { id: courseId, name: courseName, count: 0 };
        courseGroups.set(courseId, { ...existing, count: existing.count + 1 });
      }
    });

    const data = Array.from(courseGroups.values()).map(group => ({
      course: group.id,
      courseName: group.name,
      students: group.count,
    }));

    // Sort by student count descending and take top 3
    const top3Data = data.sort((a, b) => b.students - a.students).slice(0, 3);

    const max = top3Data.reduce((m, d) => Math.max(m, d.students), 0);

    // Ensure max is a valid finite number
    const validMax = Number.isFinite(max) ? max : 0;

    // Compute a nice step (1, 2, 5, 10, 20, ...) to keep <= ~6 ticks
    const targetTickCount = 5; // aim for ~5 ticks
    const roughStep = Math.max(1, Math.ceil(validMax / targetTickCount));
    
    // Ensure we don't get -Infinity from log10(0) or log10(1)
    const logValue = roughStep > 1 ? Math.log10(roughStep) : 0;
    const pow = Number.isFinite(logValue) ? Math.pow(10, Math.floor(logValue)) : 1;
    const norm = Number.isFinite(pow) && pow > 0 ? roughStep / pow : roughStep;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    const step = Number.isFinite(pow) ? niceNorm * pow : 1;
    
    // Ensure all calculated values are finite
    const validStep = Number.isFinite(step) && step > 0 ? step : 1;
    const niceMax = validMax > 0 ? Math.max(validStep, Math.ceil(validMax / validStep) * validStep) : validStep;
    const validNiceMax = Number.isFinite(niceMax) && niceMax > 0 ? niceMax : validStep;
    
    const ticks: number[] = [];
    for (let v = 0; v <= validNiceMax; v += validStep) {
      if (Number.isFinite(v)) {
        ticks.push(v);
      }
    }

    return { data: top3Data, ticks, max: validNiceMax };
  }, [students, enrolledCourses]);

  // Build cohort distribution chart data
  const cohortChart = useMemo(() => {
    const filteredData = getFilteredAnalyticsData();

    // Group students by cohort ID
    const cohortGroups = new Map<string, { id: string; name: string; count: number }>();
    
    filteredData.forEach(student => {
      const cohortId = student.cohortId;
      if (cohortId && cohortId.trim()) {
        const cohort = cohorts.find(c => c.id === cohortId);
        const cohortName = cohort?.name || cohortId;
        const existing = cohortGroups.get(cohortId) || { id: cohortId, name: cohortName, count: 0 };
        cohortGroups.set(cohortId, { ...existing, count: existing.count + 1 });
      } else {
        // Handle students without cohort
        const existing = cohortGroups.get('Unassigned') || { id: 'Unassigned', name: 'Unassigned', count: 0 };
        cohortGroups.set('Unassigned', { ...existing, count: existing.count + 1 });
      }
    });

    const data = Array.from(cohortGroups.values()).map(group => ({
      cohort: group.id,
      cohortName: group.name,
      students: group.count,
    }));

    // Sort by student count descending and take top 3
    const top3Data = data.sort((a, b) => b.students - a.students).slice(0, 3);

    const max = top3Data.reduce((m, d) => Math.max(m, d.students), 0);
    const validMax = Number.isFinite(max) ? max : 0;

    // Calculate nice ticks for y-axis
    const targetTickCount = 5;
    const roughStep = Math.max(1, Math.ceil(validMax / targetTickCount));
    const logValue = roughStep > 1 ? Math.log10(roughStep) : 0;
    const pow = Number.isFinite(logValue) ? Math.pow(10, Math.floor(logValue)) : 1;
    const norm = Number.isFinite(pow) && pow > 0 ? roughStep / pow : roughStep;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    const step = Number.isFinite(pow) ? niceNorm * pow : 1;
    const validStep = Number.isFinite(step) && step > 0 ? step : 1;
    const niceMax = validMax > 0 ? Math.max(validStep, Math.ceil(validMax / validStep) * validStep) : validStep;
    const validNiceMax = Number.isFinite(niceMax) && niceMax > 0 ? niceMax : validStep;
    
    const ticks: number[] = [];
    for (let v = 0; v <= validNiceMax; v += validStep) {
      if (Number.isFinite(v)) {
        ticks.push(v);
      }
    }

    return { data: top3Data, ticks, max: validNiceMax };
  }, [students, cohorts]);

  // Build course level distribution chart data
  const courseLevelChart = useMemo(() => {
    const filteredData = getFilteredAnalyticsData();
    
    // Group students by course level (derived from enrolled course)
    const levelGroups = new Map<string, number>();
    
    filteredData.forEach(student => {
      // Try to get level from student's courseLevel field first
      let courseLevel = student.courseLevel;
      
      // If not available, get it from the enrolled course
      if (!courseLevel || !courseLevel.trim()) {
        const enrolledCourseId = student.enrolledCourse;
        if (enrolledCourseId) {
          const course = courses.find(c => c.id === enrolledCourseId || c.courseId === enrolledCourseId);
          courseLevel = course?.level;
        }
      }
      
      if (courseLevel && courseLevel.trim()) {
        const normalizedLevel = courseLevel.trim();
        levelGroups.set(normalizedLevel, (levelGroups.get(normalizedLevel) || 0) + 1);
      } else {
        // Handle students without course level
        levelGroups.set('Unspecified', (levelGroups.get('Unspecified') || 0) + 1);
      }
    });

    const data = Array.from(levelGroups.entries()).map(([level, count]) => ({
      level,
      students: count,
    }));

    // Sort by common level order if possible, otherwise alphabetically
    const levelOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'];
    data.sort((a, b) => {
      const aIndex = levelOrder.indexOf(a.level);
      const bIndex = levelOrder.indexOf(b.level);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.level.localeCompare(b.level);
      }
    });

    const max = data.reduce((m, d) => Math.max(m, d.students), 0);
    const validMax = Number.isFinite(max) ? max : 0;

    // Calculate nice ticks for y-axis
    const targetTickCount = 5;
    const roughStep = Math.max(1, Math.ceil(validMax / targetTickCount));
    const logValue = roughStep > 1 ? Math.log10(roughStep) : 0;
    const pow = Number.isFinite(logValue) ? Math.pow(10, Math.floor(logValue)) : 1;
    const norm = Number.isFinite(pow) && pow > 0 ? roughStep / pow : roughStep;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    const step = Number.isFinite(pow) ? niceNorm * pow : 1;
    const validStep = Number.isFinite(step) && step > 0 ? step : 1;
    const niceMax = validMax > 0 ? Math.max(validStep, Math.ceil(validMax / validStep) * validStep) : validStep;
    const validNiceMax = Number.isFinite(niceMax) && niceMax > 0 ? niceMax : validStep;
    
    const ticks: number[] = [];
    for (let v = 0; v <= validNiceMax; v += validStep) {
      if (Number.isFinite(v)) {
        ticks.push(v);
      }
    }

    return { data, ticks, max: validNiceMax };
  }, [students, courses]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 dark:text-white">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Early return if no valid student data
  if (!students || students.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-white">
        <p className="text-lg">No student data available for analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="student-analytics-section">



            <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-2">
          <TabsTrigger 
            value="distribution"
            className="text-[#DE7D14] bg-white dark:bg-gray-900 border-2 border-[#DE7D14] dark:border-orange-600 rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-purple-600 data-[state=active]:border-purple-600 hover:text-white hover:bg-purple-700 focus:outline-none shadow-sm"
          >
            Courses, Cohorts & Levels
          </TabsTrigger>
          <TabsTrigger 
            value="trends"
            className="text-[#DE7D14] bg-white dark:bg-gray-900 border-2 border-[#DE7D14] dark:border-orange-600 rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-purple-600 data-[state=active]:border-purple-600 hover:text-white hover:bg-purple-700 focus:outline-none shadow-sm"
          >
            Enrollment & Demographics
          </TabsTrigger>
        </TabsList>

        {/* Combined Courses, Cohorts & Levels */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <BarChart3 className="h-4 w-4" />
                  Top 3 Courses by Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={(() => {
                        const filteredData = courseChart.data.filter(item => 
                          Number.isFinite(item.students) && 
                          item.course && 
                          typeof item.course === 'string' &&
                          item.students >= 0
                        );
                        return filteredData.length > 0 ? filteredData : [{ course: 'No Data', students: 0 }];
                      })()}
                      margin={{ top: 25, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="course" 
                        label={{ value: 'Courses', position: 'insideBottom', offset: 0 }}
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis 
                        label={{ value: 'Students', angle: -90, position: 'insideLeft', offset: 0 }}
                        allowDecimals={false}
                        domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                      />
                      <Tooltip content={<CourseTooltip />} />
                      <Bar dataKey="students" fill="url(#courseGradient)">
                        <LabelList dataKey="students" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="courseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9370DB" />
                          <stop offset="100%" stopColor="#8A2BE2" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Students by Cohort */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <Users className="h-4 w-4" />
                  Top 3 Cohorts by Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={(() => {
                        const filteredData = cohortChart.data.filter(item => 
                          Number.isFinite(item.students) && 
                          item.cohort && 
                          typeof item.cohort === 'string' &&
                          item.students >= 0
                        );
                        return filteredData.length > 0 ? filteredData : [{ cohort: 'No Data', students: 0 }];
                      })()}
                      margin={{ top: 25, right: 10, left: 10, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="cohort" 
                        label={{ value: 'Cohorts', position: 'insideBottom', offset: -15 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis 
                        label={{ value: 'Students', angle: -90, position: 'insideLeft', offset: 0 }}
                        allowDecimals={false}
                        domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                      />
                      <Tooltip content={<CohortTooltip />} />
                      <Bar dataKey="students" fill="url(#cohortGradient)">
                        <LabelList dataKey="students" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="cohortGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF7F50" />
                          <stop offset="100%" stopColor="#FFA07A" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Students by Course Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <BookOpen className="h-4 w-4" />
                  Students by Course Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={(() => {
                        const filteredData = courseLevelChart.data.filter(item => 
                          Number.isFinite(item.students) && 
                          item.level && 
                          typeof item.level === 'string' &&
                          item.students >= 0
                        );
                        return filteredData.length > 0 ? filteredData : [{ level: 'No Data', students: 0 }];
                      })()}
                      margin={{ top: 25, right: 10, left: 10, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="level" 
                        label={{ value: 'Course Level', position: 'insideBottom', offset: -15 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis 
                        label={{ value: 'Students', angle: -90, position: 'insideLeft', offset: 0 }}
                        allowDecimals={false}
                        domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                      />
                      <Tooltip formatter={(value: any) => [String(value), 'students']} labelFormatter={(label: string) => `${label}`}/>
                      <Bar dataKey="students" fill="url(#courseLevelGradient)">
                        <LabelList dataKey="students" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="courseLevelGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#BA55D3" />
                          <stop offset="100%" stopColor="#8B008B" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Combined Enrollment & Demographics */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Enrollment Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <Calendar className="h-4 w-4" />
                  Enrollment Timeline (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        // Get current date and calculate 6 months ago
                        const now = new Date();
                        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                        const sixMonthsAgoKey = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
                        
                        // Aggregate by canonical YYYY-MM keys to ensure stable chronological sorting
                        const monthCounts = new Map<string, number>();
                        filtered().forEach(student => {
                          if (student.registrationDate) {
                            const date = new Date(student.registrationDate);
                            if (!isNaN(date.getTime())) {
                              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // e.g., 2025-09
                              // Only include if within last 6 months
                              if (key >= sixMonthsAgoKey) {
                                monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
                              }
                            }
                          }
                        });
                        
                        // Generate all months in the last 6 months (even if count is 0)
                        const allMonths = new Map<string, number>();
                        for (let i = 5; i >= 0; i--) {
                          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                          const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                          allMonths.set(key, monthCounts.get(key) ?? 0);
                        }
                        
                        // Sort ascending by YYYY-MM and then format labels like Sep'25
                        return Array.from(allMonths.entries())
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([key, count]) => {
                            const [yearStr, monthStr] = key.split('-');
                            const year = Number(yearStr);
                            const monthIndex = Number(monthStr) - 1; // 0-based
                            const labelDate = new Date(year, monthIndex, 1);
                            const label = labelDate.toLocaleString('en-US', { month: 'short' }) + "'" + String(year).slice(-2);
                            return { month: label, students: count };
                          });
                      })()}
                      margin={{ top: 25, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                      <YAxis 
                        label={{ value: 'Enrollments', angle: -90, position: 'insideLeft' }}
                        domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                      />
                      <Tooltip />
                      <Bar dataKey="students" fill="url(#enrollmentGradient)">
                        <LabelList dataKey="students" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9B59B6" />
                          <stop offset="100%" stopColor="#663399" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8A2BE2]">
                  <TrendingUp className="h-4 w-4" />
                  Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const ageGroups = { '10-15': 0, '16-20': 0, '21-25': 0, '26-30': 0, '30+': 0 };
                        filtered().forEach(student => {
                          if (student.dob) {
                            const dobDate = new Date(student.dob);
                            const currentYear = new Date().getFullYear();
                            const birthYear = dobDate.getFullYear();
                            
                            // Validate the date and year values
                            if (Number.isFinite(birthYear) && Number.isFinite(currentYear) && birthYear > 1900 && birthYear <= currentYear) {
                              const age = currentYear - birthYear;
                              if (Number.isFinite(age) && age >= 0) {
                                if (age <= 15) ageGroups['10-15']++;
                                else if (age <= 20) ageGroups['16-20']++;
                                else if (age <= 25) ageGroups['21-25']++;
                                else if (age <= 30) ageGroups['26-30']++;
                                else ageGroups['30+']++;
                              }
                            }
                          }
                        });
                        const ageData = Object.entries(ageGroups).map(([range, count]) => ({ 
                          ageRange: range, 
                          students: Number.isFinite(count) ? count : 0 
                        }));
                        // Ensure we always have some data to prevent chart errors
                        return ageData.every(item => item.students === 0) ? 
                          [{ ageRange: '10-15', students: 0 }, { ageRange: '16-20', students: 0 }, { ageRange: '21-25', students: 0 }, { ageRange: '26-30', students: 0 }, { ageRange: '30+', students: 0 }] : 
                          ageData;
                      })()}
                      margin={{ top: 25, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="ageRange" 
                        interval={0}
                        height={50}
                        tickMargin={10}
                        label={{ value: 'Age Range', position: 'insideBottom', offset: 0 }} 
                      />
                      <YAxis 
                        label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
                        domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax) + 1)]}
                      />
                      <Tooltip />
                      <Bar dataKey="students" fill="url(#ageGradient)">
                        <LabelList dataKey="students" position="top" offset={5} />
                      </Bar>
                      <defs>
                        <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DDA0DD" />
                          <stop offset="100%" stopColor="#BA55D3" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentAnalytics;
