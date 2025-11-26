"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import {
  Bell,
  UserPlus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Users,
} from "lucide-react";
import { useCustomColors } from '@/lib/use-custom-colors';

interface Activity {
  id: string;
  type: "enrollment" | "session" | "approval" | "leave" | "task" | "course";
  title: string;
  description: string;
  timestamp: Date;
  priority: "low" | "medium" | "high";
  status?: "pending" | "completed" | "cancelled";
  link?: string;
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({
  className = "",
  maxItems = 8,
}: ActivityFeedProps) {
  const { primaryColor } = useCustomColors()
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real activities from API endpoint
    // For now, using mock data
    const mockActivities: Activity[] = [
      {
        id: "1",
        type: "enrollment",
        title: "New Student Enrollment",
        description: "Sarah Johnson enrolled in Advanced Dance Program",
        timestamp: new Date(Date.now() - 10 * 60000),
        priority: "medium",
        status: "completed",
        link: "/user/students",
      },
      {
        id: "2",
        type: "session",
        title: "Session Starting Soon",
        description: "Guitar Class - Beginner Level starts in 30 minutes",
        timestamp: new Date(Date.now() - 20 * 60000),
        priority: "high",
        status: "pending",
        link: "/services/schedule",
      },
      {
        id: "3",
        type: "approval",
        title: "Leave Request Pending",
        description: "John Smith requested leave for Dec 5-7",
        timestamp: new Date(Date.now() - 45 * 60000),
        priority: "high",
        status: "pending",
        link: "/user/staff/instructor",
      },
      {
        id: "4",
        type: "course",
        title: "New Course Published",
        description: "Contemporary Art Workshop added to catalog",
        timestamp: new Date(Date.now() - 60 * 60000),
        priority: "low",
        status: "completed",
        link: "/services/courses",
      },
      {
        id: "5",
        type: "task",
        title: "Task Completed",
        description: "Equipment maintenance checklist finished",
        timestamp: new Date(Date.now() - 90 * 60000),
        priority: "low",
        status: "completed",
        link: "/task-management",
      },
      {
        id: "6",
        type: "enrollment",
        title: "Student Updated Profile",
        description: "Emily Davis updated emergency contact information",
        timestamp: new Date(Date.now() - 120 * 60000),
        priority: "low",
        status: "completed",
        link: "/user/students",
      },
      {
        id: "7",
        type: "session",
        title: "Session Rescheduled",
        description: "Basketball Practice moved to Friday 4:00 PM",
        timestamp: new Date(Date.now() - 150 * 60000),
        priority: "medium",
        status: "completed",
        link: "/services/schedule",
      },
      {
        id: "8",
        type: "approval",
        title: "Instructor Assignment",
        description: "New instructor assigned to Piano Advanced Level",
        timestamp: new Date(Date.now() - 180 * 60000),
        priority: "medium",
        status: "completed",
        link: "/user/staff/instructor",
      },
    ];

    setTimeout(() => {
      setActivities(mockActivities.slice(0, maxItems));
      setLoading(false);
    }, 500);
  }, [maxItems]);

  const getActivityIcon = (type: Activity["type"]) => {
    const iconMap = {
      enrollment: <UserPlus className="w-4 h-4" />,
      session: <Calendar className="w-4 h-4" />,
      approval: <AlertCircle className="w-4 h-4" />,
      leave: <Clock className="w-4 h-4" />,
      task: <CheckCircle className="w-4 h-4" />,
      course: <BookOpen className="w-4 h-4" />,
    };
    return iconMap[type];
  };

  const getPriorityColor = (priority: Activity["priority"]) => {
    const colorMap = {
      low: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      medium:
        "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      high: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    };
    return colorMap[priority];
  };

  const getTypeGradient = (type: Activity["type"]) => {
    const gradientMap = {
      enrollment: "from-purple-500 to-pink-500",
      session: "from-orange-500 to-red-500",
      approval: "from-red-500 to-orange-500",
      leave: "from-amber-500 to-yellow-500",
      task: "from-green-500 to-emerald-500",
      course: "from-blue-500 to-cyan-500",
    };
    return gradientMap[type];
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className={`${className} border-0 shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-500 overflow-hidden bg-white dark:bg-neutral-900`}>
      <CardHeader className="pb-6 relative overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
        {/* Decorative gradient orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-white">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transform hover:rotate-12 hover:scale-110 transition-all duration-300">
              <Bell className="w-6 h-6" />
            </div>
            Recent Activity
          </CardTitle>
          <a
            href="/dashboard/audit-logs"
            className="text-sm text-white/90 hover:text-white font-semibold px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
          >
            View All
          </a>
        </div>
      </CardHeader>
      <CardContent className="bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900 pt-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No recent activities</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto px-1 -mx-1 custom-scrollbar">
            {activities.map((activity) => (
              <a
                key={activity.id}
                href={activity.link || "#"}
                className="group block p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-lg transition-all duration-300"
                style={{
                  '--hover-border-color': primaryColor,
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeGradient(
                      activity.type
                    )} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 
                        className="font-semibold text-sm text-neutral-900 dark:text-white transition-colors"
                        style={{
                          '--hover-text-color': primaryColor,
                        } as React.CSSProperties}
                        onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                      >
                        {activity.title}
                      </h4>
                      {activity.status === "pending" && (
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                            activity.priority
                          )}`}
                        >
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                      {activity.priority === "high" && (
                        <>
                          <span>�</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            High Priority
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
