"use client";

import { Card, CardContent } from "@/components/dashboard/ui/card";
import { BookOpen, Users, CheckCircle2, AlertCircle } from "lucide-react";

interface PaymentAnalyticsCardsProps {
  totalCourses: number;
  totalStudents: number;
  totalReceived: number;
  totalOutstanding: number;
}

export function PaymentAnalyticsCards({
  totalCourses,
  totalStudents,
  totalReceived,
  totalOutstanding,
}: PaymentAnalyticsCardsProps) {
  const stats = [
    {
      title: "Total Courses",
      value: totalCourses || 0,
      icon: BookOpen,
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      valueColor: "text-purple-900",
    },
    {
      title: "Total Students",
      value: totalStudents || 0,
      icon: Users,
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-blue-900",
    },
    {
      title: "Total Received",
      value: `INR ${(totalReceived || 0).toLocaleString()}`,
      icon: CheckCircle2,
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      iconColor: "text-green-600",
      valueColor: "text-green-900",
    },
    {
      title: "Outstanding",
      value: `INR ${(totalOutstanding || 0).toLocaleString()}`,
      icon: AlertCircle,
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      iconColor: "text-red-600",
      valueColor: "text-red-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`${stat.bgColor} border-0 shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${stat.iconColor} mb-1`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.iconColor} opacity-80`}>
                  <Icon className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
