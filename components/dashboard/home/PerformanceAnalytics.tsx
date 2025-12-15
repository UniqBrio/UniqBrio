"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useCustomColors } from '@/lib/use-custom-colors';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Users, BarChart3 } from "lucide-react";
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

// Custom animated bar shape
const AnimatedBar = (props: any) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Small delay before starting animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { fill, x, y, width, height, index } = props;
  const animationDelay = index * 200; // 200ms delay between each bar

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
          transformOrigin: `${x + width / 2}px ${y + height}px`,
          transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay}ms`,
        }}
      />
    </g>
  );
};

export function PerformanceAnalytics() {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [students, setStudents] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch students
    fetch("/api/dashboard/student/students", { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data);
        }
      })
      .catch((err) => console.error("Error fetching students:", err));

    // Fetch cohorts
    fetch("/api/dashboard/services/cohorts", { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCohorts(data);
        }
      })
      .catch((err) => console.error("Error fetching cohorts:", err));
  }, []);

  // Custom tooltip for courses
  const CourseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-900 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white">ID: {data.course}</p>
          {data.courseName && data.courseName !== data.course && (
            <p className="text-sm text-gray-600 dark:text-white">Name: {data.courseName}</p>
          )}
          <p className="text-sm font-medium" style={{ color: primaryColor }}>Students: {data.students}</p>
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
        <div className="bg-white dark:bg-gray-900 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white">ID: {data.cohort}</p>
          {data.cohortName && data.cohortName !== data.cohort && (
            <p className="text-sm text-gray-600 dark:text-white">Name: {data.cohortName}</p>
          )}
          <p className="text-sm font-medium" style={{ color: secondaryColor }}>Students: {data.students}</p>
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

  return (
    <section className="mb-6">
      {/* Charts Section - Only Top 3 Courses and Top 3 Cohorts */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"></div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: primaryColor }} />
            Performance Analytics
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Courses by Students */}
        <Card className="group shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] border-0 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-neutral-900 dark:via-purple-950/20 dark:to-blue-950/20 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                Top 3 Courses by Students
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
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
                  <Bar 
                    dataKey="students" 
                    fill="url(#courseGradient)"
                    shape={<AnimatedBar />}
                    animationDuration={600}
                    animationBegin={0}
                  >
                    <LabelList dataKey="students" position="top" offset={5} />
                  </Bar>
                  <defs>
                    <linearGradient id="courseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
                      <stop offset="100%" stopColor={primaryColor} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Cohorts by Students */}
        <Card className="group shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] border-0 bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-neutral-900 dark:via-orange-950/20 dark:to-red-950/20 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                Top 3 Cohorts by Students
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
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
                  <Bar 
                    dataKey="students" 
                    fill="url(#cohortGradient)"
                    shape={<AnimatedBar />}
                    animationDuration={600}
                    animationBegin={0}
                  >
                    <LabelList dataKey="students" position="top" offset={5} />
                  </Bar>
                  <defs>
                    <linearGradient id="cohortGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={secondaryColor} stopOpacity={1} />
                      <stop offset="100%" stopColor={secondaryColor} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </section>
  );
}
