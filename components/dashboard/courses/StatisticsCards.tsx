"use client"

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { BookOpen, CheckCircle, Users, Banknote, Star, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { useCurrency } from "@/contexts/currency-context"

interface Stats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  totalRevenue: number;
  
}

interface StatisticsCardsProps {
  stats?: Stats;
}

export default function StatisticsCards({ stats: propStats }: StatisticsCardsProps) {
  const { currency } = useCurrency();
  const [stats, setStats] = useState<Stats>(propStats || {
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch course stats and students count in parallel
        const [courseResponse, studentsResponse] = await Promise.all([
          fetch('/api/dashboard/services/courses?stats=true'),
          fetch('/api/dashboard/services/user-management/students')
        ]);

        const [courseData, studentsData] = await Promise.all([
          courseResponse.json(),
          studentsResponse.json()
        ]);

        console.log('Students API response:', studentsData);

        // Combine course stats and student count
        const newStats = {
          ...(courseData.success && courseData.stats ? courseData.stats : stats),
          totalStudents: studentsData?.count ?? studentsData?.numStudents ?? 0  // Support both possible keys
        };

        console.log('New stats after update:', newStats);
        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    // Always fetch stats unless props are provided
    if (!propStats) {
      fetchStats();
    }
  }, [propStats]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Courses</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Courses</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeCourses}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Stuents</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Revenue ({currency})</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalRevenue.toLocaleString('en-IN')}  </p>
            </div>
            <Banknote className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
}
