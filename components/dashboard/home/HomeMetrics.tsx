"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useCustomColors } from '@/lib/use-custom-colors';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Users, BookOpen, UserCheck, DollarSign, Coins } from "lucide-react";
import { useCounterAnimation } from "@/components/dashboard/home/useCounterAnimation";
import { useCurrency } from "@/contexts/currency-context";

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
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [instructorCount, setInstructorCount] = useState<number | null>(null);
  const [nonInstructorCount, setNonInstructorCount] = useState<number | null>(null);

  // Animated counters for each metric
  const animatedStudentCount = useCounterAnimation({ targetValue: studentCount, duration: 3000 });
  const animatedCoursesCount = useCounterAnimation({ targetValue: courses.length, duration: 3000 });
  const animatedRevenueCount = useCounterAnimation({ targetValue: totalRevenue, duration: 3000 });
  const totalStaffs = (instructorCount !== null && nonInstructorCount !== null) ? instructorCount + nonInstructorCount : null;
  const animatedStaffsCount = useCounterAnimation({ targetValue: totalStaffs, duration: 3000 });

  useEffect(() => {
    // Fetch students - Using the correct endpoint
    fetch("/api/dashboard/student/students")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudentCount(data.length);
        } else if (data.students && Array.isArray(data.students)) {
          setStudentCount(data.students.length);
        } else if (data.count !== undefined) {
          setStudentCount(data.count);
        } else if (data.numStudents !== undefined) {
          setStudentCount(data.numStudents);
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

    // Fetch total revenue
    const params = new URLSearchParams({ 
      timeframe: 'monthly',
      _t: Date.now().toString()
    });
    fetch(`/api/dashboard/financial/financials/metrics?${params.toString()}`, {
      cache: 'no-store',
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
    fetch("/api/dashboard/payments/instructors")
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
    fetch("/api/dashboard/payments/non-instructors")
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
  }, []);

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
    </section>
  );
}
