"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Users, BookOpen, Calendar, UserCheck, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export function HomeMetrics() {
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [scheduleCount, setScheduleCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch students - Using the correct endpoint
    fetch("/api/dashboard/student/students")
      .then((res) => res.json())
      .then((data) => {
        console.log("Students API response:", data);
        if (Array.isArray(data)) {
          setStudentCount(data.length);
          setStudents(data);
        } else if (data.students && Array.isArray(data.students)) {
          setStudentCount(data.students.length);
          setStudents(data.students);
        } else if (data.count !== undefined) {
          setStudentCount(data.count);
          if (data.students && Array.isArray(data.students)) {
            setStudents(data.students);
          }
        } else if (data.numStudents !== undefined) {
          setStudentCount(data.numStudents);
          if (data.students && Array.isArray(data.students)) {
            setStudents(data.students);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setStudentCount(null);
      });

    // Fetch courses
    fetch("/api/dashboard/services/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else if (data.courses && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      })
      .catch((err) => {
        console.error("Error fetching courses:", err);
        setCourses([]);
      });

    // Fetch cohorts - Fixed URL
    fetch("/api/dashboard/services/cohorts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCohorts(data);
        } else if (data.cohorts && Array.isArray(data.cohorts)) {
          setCohorts(data.cohorts);
        }
      })
      .catch((err) => {
        console.error("Error fetching cohorts:", err);
        setCohorts([]);
      });

    // Fetch schedules count
    fetch("/api/dashboard/services/schedules")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setScheduleCount(data.length);
        } else if (data.count !== undefined) {
          setScheduleCount(data.count);
        } else if (data.schedules && Array.isArray(data.schedules)) {
          setScheduleCount(data.schedules.length);
        }
      })
      .catch((err) => {
        console.error("Error fetching schedules:", err);
        setScheduleCount(null);
      });
  }, []);

  // Custom tooltip for courses
  const CourseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">ID: {data.course}</p>
          {data.courseName && data.courseName !== data.course && (
            <p className="text-sm text-gray-600">Name: {data.courseName}</p>
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
          <p className="font-semibold text-gray-800">ID: {data.cohort}</p>
          {data.cohortName && data.cohortName !== data.cohort && (
            <p className="text-sm text-gray-600">Name: {data.cohortName}</p>
          )}
          <p className="text-sm text-orange-600 font-medium">Students: {data.students}</p>
        </div>
      );
    }
    return null;
  };

  // Build course distribution
  const courseChart = useMemo(() => {
    const courseGroups = new Map<string, { id: string; name: string; count: number }>();
    students.forEach(student => {
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

    const top3Data = data.sort((a, b) => b.students - a.students).slice(0, 3);
    return top3Data.length > 0 ? top3Data : [{ course: 'No Data', courseName: 'No Data', students: 0 }];
  }, [students]);

  // Build cohort distribution
  const cohortChart = useMemo(() => {
    const cohortGroups = new Map<string, { id: string; name: string; count: number }>();
    
    students.forEach(student => {
      const cohortId = student.cohortId;
      if (cohortId && cohortId.trim()) {
        const cohort = cohorts.find(c => c.id === cohortId);
        const cohortName = cohort?.name || cohortId;
        const existing = cohortGroups.get(cohortId) || { id: cohortId, name: cohortName, count: 0 };
        cohortGroups.set(cohortId, { ...existing, count: existing.count + 1 });
      }
    });

    const data = Array.from(cohortGroups.values()).map(group => ({
      cohort: group.id,
      cohortName: group.name,
      students: group.count,
    }));

    const top3Data = data.sort((a, b) => b.students - a.students).slice(0, 3);
    return top3Data.length > 0 ? top3Data : [{ cohort: 'No Data', cohortName: 'No Data', students: 0 }];
  }, [students, cohorts]);

  const stats = [
    {
      title: "Total Students",
      value: studentCount !== null ? studentCount : "-",
      change: studentCount !== null ? `${studentCount} enrolled` : "Loading...",
      icon: Users,
      gradient: "from-purple-500 to-blue-500",
      bgGradient: "from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50",
    },
    {
      title: "Active Courses",
      value: courses.length > 0 ? courses.length : "-",
      change: courses.length > 0 ? `${courses.length} courses` : "Loading...",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
    },
    {
      title: "Active Cohorts",
      value: cohorts.length > 0 ? cohorts.length : "-",
      change: cohorts.length > 0 ? `${cohorts.length} cohorts` : "Loading...",
      icon: Users,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50",
    },
    {
      title: "Scheduled Sessions",
      value: scheduleCount !== null ? scheduleCount : "-",
      change: scheduleCount !== null ? `${scheduleCount} total` : "Loading...",
      icon: Calendar,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50",
    },
  ];

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold tracking-tight mb-6">Platform Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${stat.bgGradient}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl rounded-full -mr-16 -mt-16`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section - Only Top 3 Courses and Top 3 Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Courses by Students */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-purple-600 dark:text-purple-400">Top 3 Courses by Students</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={courseChart}
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

        {/* Top 3 Cohorts by Students */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-purple-600 dark:text-purple-400">Top 3 Cohorts by Students</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={cohortChart}
                  margin={{ top: 25, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="cohort" 
                    label={{ value: 'Cohorts', position: 'insideBottom', offset: 0 }}
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
                  <Tooltip content={<CohortTooltip />} />
                  <Bar dataKey="students" fill="url(#cohortGradient)">
                    <LabelList dataKey="students" position="top" offset={5} />
                  </Bar>
                  <defs>
                    <linearGradient id="cohortGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF8C00" />
                      <stop offset="100%" stopColor="#FFA500" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
