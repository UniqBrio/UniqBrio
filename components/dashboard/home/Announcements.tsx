"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import {
  Megaphone,
  Trophy,
  AlertCircle,
  Info,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";

interface Announcement {
  id: string;
  type: "update" | "achievement" | "alert" | "info";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  priority: "low" | "medium" | "high";
}

interface AnnouncementsProps {
  className?: string;
  maxItems?: number;
}

export function Announcements({
  className = "",
  maxItems = 4,
}: AnnouncementsProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      type: "achievement",
      title: "New Milestone Reached!",
      message: "Our academy has successfully enrolled 500+ students this semester!",
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
      isRead: false,
      priority: "high",
    },
    {
      id: "2",
      type: "update",
      title: "Platform Update v2.5",
      message: "New features added: Enhanced scheduling, improved attendance tracking, and financial analytics dashboard.",
      timestamp: new Date(Date.now() - 24 * 60 * 60000),
      isRead: false,
      
      priority: "medium",
    },
    {
      id: "3",
      type: "alert",
      title: "System Maintenance Notice",
      message: "Scheduled maintenance on Sunday, Nov 24 from 2:00 AM - 4:00 AM. Some services may be temporarily unavailable.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000),
      isRead: true,
      priority: "high",
    },
    
  ]);

  const getAnnouncementIcon = (type: Announcement["type"]) => {
    const iconMap = {
      update: <Sparkles className="w-4 h-4" />,
      achievement: <Trophy className="w-4 h-4" />,
      alert: <AlertCircle className="w-4 h-4" />,
      info: <Info className="w-4 h-4" />,
    };
    return iconMap[type];
  };

  const getAnnouncementColor = (type: Announcement["type"]) => {
    const colorMap = {
      update: {
        bg: "bg-purple-100 dark:bg-purple-950",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
        gradient: "from-purple-500 to-pink-500",
      },
      achievement: {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
        gradient: "from-green-500 to-emerald-500",
      },
      alert: {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
        gradient: "from-red-500 to-orange-500",
      },
      info: {
        bg: "bg-blue-100 dark:bg-blue-950",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
        gradient: "from-blue-500 to-cyan-500",
      },
    };
    return colorMap[type];
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (60 * 60000));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const dismissAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const markAsRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const displayedAnnouncements = announcements.slice(0, maxItems);

  return (
    <Card className={`${className} border-0 shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-500 overflow-hidden bg-white dark:bg-neutral-900`}>
      <CardHeader
        className="pb-6 relative overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-white">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transform hover:rotate-12 hover:scale-110 transition-all duration-300">
              <Megaphone className="w-6 h-6" />
            </div>
            Latest Updates
          </CardTitle>
          <span className="text-xs px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm font-bold shadow-lg"
                style={{ color: primaryColor }}>
            {announcements.filter((a) => !a.isRead).length} New
          </span>
        </div>
      </CardHeader>
      <CardContent className="bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900 pt-6">
        {displayedAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No announcements at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAnnouncements.map((announcement) => {
              const colors = getAnnouncementColor(announcement.type);

              return (
                <div
                  key={announcement.id}
                  className={`group relative p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                    announcement.isRead
                      ? "border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 opacity-70"
                      : `${colors.border} ${colors.bg} shadow-md`
                  }`}
                >
                  {/* Dismiss Button */}
                  <button
                    onClick={() => dismissAnnouncement(announcement.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 backdrop-blur-sm"
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </button>

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                    >
                      {getAnnouncementIcon(announcement.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                          {announcement.title}
                        </h4>
                        {!announcement.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                        {announcement.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {formatTimestamp(announcement.timestamp)}
                        </span>

                        {announcement.link && (
                          <a
                            href={announcement.link}
                            onClick={() => markAsRead(announcement.id)}
                            className="text-xs hover:underline font-medium flex items-center gap-1"
                            style={{ color: primaryColor }}
                          >
                            Learn More
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Link */}
        {announcements.length > maxItems && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <button className="text-sm hover:underline font-medium" style={{ color: primaryColor }}>
              View All Announcements ({announcements.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Announcements;
