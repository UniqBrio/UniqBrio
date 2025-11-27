"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useCustomColors } from '@/lib/use-custom-colors';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Users, BookOpen, UserCheck, DollarSign, Coins, BarChart3 } from "lucide-react";
import { useCounterAnimation } from "@/components/dashboard/home/useCounterAnimation";
import { useCurrency } from "@/contexts/currency-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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

// Falling cash animation component
const FallingCash = ({ gradient }: { gradient: string }) => {
  const [coins, setCoins] = useState<Array<{ id: number; left: number; delay: number; duration: number; rotation: number }>>([]);

  useEffect(() => {
    // Generate random coins after counter animation completes (3 seconds) + dunk animation (1.2 seconds)
    const generateTimer = setTimeout(() => {
      const newCoins = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: Math.random() * 80 + 10, // Random position between 10% and 90%
        delay: Math.random() * 2.5, // Stagger start times over 2.5 seconds
        duration: 2 + Math.random() * 1, // Duration between 2-3 seconds
        rotation: Math.random() * 720 - 360, // Random rotation
      }));
      setCoins(newCoins);
    }, 4200); // 3s counter + 1.2s dunk animation

    return () => clearTimeout(generateTimer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className={`absolute -top-4 bg-gradient-to-br ${gradient} rounded-full p-1.5 shadow-lg`}
          style={{
            left: `${coin.left}%`,
            animation: `fall ${coin.duration}s ease-in ${coin.delay}s forwards`,
            opacity: 0,
          }}
        >
          <Coins className="h-3 w-3 text-white" />
        </div>
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(200px) rotate(${coins[0]?.rotation || 360}deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export function HomeMetrics() {
  const { currency } = useCurrency();
  const { primaryColor, secondaryColor } = useCustomColors();
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [instructorCount, setInstructorCount] = useState<number | null>(null);
  const [nonInstructorCount, setNonInstructorCount] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);

  // Animated counters for each metric
  const animatedStudentCount = useCounterAnimation({ targetValue: studentCount, duration: 3000 });
  const animatedCoursesCount = useCounterAnimation({ targetValue: courses.length, duration: 3000 });
  const animatedRevenueCount = useCounterAnimation({ targetValue: totalRevenue, duration: 3000 });
  const totalStaffs = (instructorCount !== null && nonInstructorCount !== null) ? instructorCount + nonInstructorCount : null;
  const animatedStaffsCount = useCounterAnimation({ targetValue: totalStaffs, duration: 3000 });

  useEffect(() => {
    // Fetch students - Using the correct endpoint
    fetch("/api/dashboard/student/students", { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const normalizedStudents = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
            ? data.students
            : [];

        setStudents(normalizedStudents);

        if (normalizedStudents.length) {
          setStudentCount(normalizedStudents.length);
        } else if (typeof data?.count === "number") {
          setStudentCount(data.count);
        } else if (typeof data?.numStudents === "number") {
          setStudentCount(data.numStudents);
        } else {
          setStudentCount(0);
        }
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setStudentCount(null);
        setStudents([]);
      });

    // Fetch courses
    fetch("/api/dashboard/services/courses", { credentials: 'include' })
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

    // Fetch total revenue
    const params = new URLSearchParams({ 
      timeframe: 'monthly',
      _t: Date.now().toString()
    });
    fetch(`/api/dashboard/financial/financials/metrics?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.totalRevenue !== undefined) {
          setTotalRevenue(data.totalRevenue);
        }
      })
      .catch((err) => {
        console.error("Error fetching revenue:", err);
        setTotalRevenue(null);
      });

    // Fetch instructors
    fetch("/api/dashboard/payments/instructors", { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInstructorCount(data.length);
        }
      })
      .catch((err) => {
        console.error("Error fetching instructors:", err);
        setInstructorCount(null);
      });

    // Fetch non-instructors
    fetch("/api/dashboard/payments/non-instructors", { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNonInstructorCount(data.length);
        }
      })
      .catch((err) => {
        console.error("Error fetching non-instructors:", err);
        setNonInstructorCount(null);
      });

    // Fetch cohorts for analytics charts
    fetch("/api/dashboard/services/cohorts")
      .then((res) => res.json())
      .then((data) => {
        const normalizedCohorts = Array.isArray(data)
          ? data
          : Array.isArray(data?.cohorts)
            ? data.cohorts
            : [];
        setCohorts(normalizedCohorts);
      })
      .catch((err) => {
        console.error("Error fetching cohorts:", err);
        setCohorts([]);
      });
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
        <div className="bg-white dark:bg-gray-900 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
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
      title: "Total Revenue",
      value: animatedRevenueCount !== null ? `${animatedRevenueCount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ${currency}` : "-",
      change: totalRevenue !== null ? "This month" : "Loading...",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50",
    },
    
    {
      title: "Total Students",
      value: animatedStudentCount !== null ? animatedStudentCount : "-",
      change: "Active students",
      icon: Users,
      gradient: "from-purple-500 to-blue-500",
      bgGradient: "from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50",
    },
    {
      title: "Total Courses",
      value: animatedCoursesCount !== null ? animatedCoursesCount : 0,
      change:  "Active courses" ,
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
    },
    {
      title: "Total Staffs",
      value: animatedStaffsCount !== null ? animatedStaffsCount : "-",
      change: totalStaffs !== null ? `${instructorCount || 0} instructors + ${nonInstructorCount || 0} non-instructors` : "Loading...",
      icon: UserCheck,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50",
    },
  ];

  return (
    <section className="mb-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const showCashAnimation = stat.value !== "-"; // Only show animation when value is loaded
          
          return (
            <div key={index} className="relative">
              
              <Card
                className={`group relative overflow-hidden border-0 shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm`}
              >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-20 blur-2xl rounded-full -mr-16 -mt-16 group-hover:opacity-30 transition-opacity duration-500`} />
              <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${stat.gradient} opacity-10 blur-2xl rounded-full -ml-12 -mb-12`} />
              
              {/* Falling cash animation */}
              {showCashAnimation && <FallingCash gradient={stat.gradient} />}
              
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 tracking-wide uppercase">
                  {stat.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent mb-2 tracking-tight">
                  {stat.value}
                </div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-2 flex items-center gap-1.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r ${stat.gradient} animate-pulse`}></span>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
            </div>
          );
        })}
      </div>

      {/* Charts Section - Only Top 3 Courses and Top 3 Cohorts */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"></div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
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
                  <RechartsTooltip content={<CourseTooltip />} />
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
                  <RechartsTooltip content={<CohortTooltip />} />
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
      </div>
    </section>
  );
}
