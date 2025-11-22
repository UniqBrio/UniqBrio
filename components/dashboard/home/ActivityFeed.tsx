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
    <Card className={`${className} border-neutral-200 dark:border-neutral-800`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <Bell className="w-4 h-4" />
            </div>
            Recent Activity
          </CardTitle>
          <a
            href="/dashboard/audit-logs"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View All
          </a>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((activity) => (
              <a
                key={activity.id}
                href={activity.link || "#"}
                className="group block p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeGradient(
                      activity.type
                    )} text-white flex items-center justify-center shadow-sm`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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

        {/* Quick Action Button */}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <a
              href="/dashboard/audit-logs"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Users className="w-4 h-4" />
              View Complete Activity Log
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
