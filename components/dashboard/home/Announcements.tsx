"use client";
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Megaphone, Trophy, AlertCircle, Info, Sparkles, X, Bell, BellRing, Loader2 } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";

// Validate URL to prevent XSS via javascript: or data: URLs
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface Announcement {
  id: string;
  type: "update" | "achievement" | "alert" | "info" | "payment";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  priority: "low" | "medium" | "high";
  paymentId?: string;
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
  const [isHovered, setIsHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        // Fetch both announcements and payment updates
        const [announcementsResponse, paymentsResponse] = await Promise.all([
          fetch("/api/announcements").catch(() => null),
          fetch("/api/payment-updates").catch(() => null),
        ]);

        const allAnnouncements: Announcement[] = [];

        // Process regular announcements
        if (announcementsResponse?.ok) {
          const announcementData = await announcementsResponse.json();
          if (announcementData.success && announcementData.data) {
            allAnnouncements.push(
              ...announcementData.data.map((ann: any) => ({
                ...ann,
                timestamp: new Date(ann.timestamp),
                isRead: false,
              }))
            );
          }
        }

        // Process payment updates
        if (paymentsResponse?.ok) {
          const paymentData = await paymentsResponse.json();
          if (paymentData.success && paymentData.data) {
            const paymentAnnouncements = paymentData.data.map((payment: any) => {
              // Custom message for beta plan
              const isBeta = payment.plan?.toLowerCase() === "beta";
              const title = isBeta ? "Beta Access Approved" : "Payment Received";
              const message = isBeta
                ? "You can now access this app as a beta user approved by Sugumar"
                : `Your payment of INR ${payment.amount.toFixed(2)} for ${payment.plan} plan has been successfully processed.`;

              return {
                id: payment._id,
                paymentId: payment._id,
                type: "payment" as const,
                title,
                message,
                timestamp: new Date(payment.updatedAt || payment.createdAt),
                isRead: payment.isRead || false,
                priority: "high" as const,
                link: undefined,
              };
            });
            allAnnouncements.push(...paymentAnnouncements);
          }
        }

        // Sort by timestamp (newest first)
        allAnnouncements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setAnnouncements(allAnnouncements.length > 0 ? allAnnouncements : [
          {
            id: "1",
            type: "info",
            title: "Welcome to UniqBrio",
            message: "Stay tuned for the latest updates.",
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
        // Fallback to default announcements if API fails
        setAnnouncements([
          {
            id: "1",
            type: "info",
            title: "Welcome to UniqBrio",
            message: "Stay tuned for the latest updates.",
            timestamp: new Date(),
            isRead: false,
            priority: "medium",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const getAnnouncementIcon = (type: Announcement["type"]) => {
    const iconMap = {
      update: <Sparkles className="w-4 h-4" />,
      achievement: <Trophy className="w-4 h-4" />,
      alert: <AlertCircle className="w-4 h-4" />,
      info: <Info className="w-4 h-4" />,
      payment: <Bell className="w-4 h-4" />,
    };
    return iconMap[type];
  };

  const getAnnouncementColor = (type: Announcement["type"]) => {
    const colorMap = {
      update: {
        bg: "bg-purple-100 dark:bg-purple-950",
        border: "border-purple-200 dark:border-purple-800",
        gradient: "from-purple-500 to-pink-500",
      },
      achievement: {
        bg: "bg-green-100 dark:bg-green-950",
        border: "border-green-200 dark:border-green-800",
        gradient: "from-green-500 to-emerald-500",
      },
      alert: {
        bg: "bg-red-100 dark:bg-red-950",
        border: "border-red-200 dark:border-red-800",
        gradient: "from-red-500 to-orange-500",
      },
      info: {
        bg: "bg-blue-100 dark:bg-blue-950",
        border: "border-blue-200 dark:border-blue-800",
        gradient: "from-blue-500 to-cyan-500",
      },
      payment: {
        bg: "bg-emerald-100 dark:bg-emerald-950",
        border: "border-emerald-200 dark:border-emerald-800",
        gradient: "from-emerald-500 to-teal-500",
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

  const markAsRead = async (id: string) => {
    const announcement = announcements.find((a) => a.id === id);
    
    // Update UI immediately for better UX
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );

    // If it's a payment announcement, update the backend
    if (announcement?.type === "payment" && announcement.paymentId) {
      try {
        await fetch("/api/payment-updates/mark-read", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId: announcement.paymentId }),
        });
      } catch (error) {
        console.error("Failed to mark payment as read:", error);
        // Revert UI update on error
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: false } : a))
        );
      }
    }
  };

  const displayedAnnouncements = announcements.slice(0, maxItems);
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setIsHovered(false);
      }
    };

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowPopup(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClick = () => {
    setShowPopup((prev) => !prev);
  };

  return (
    <div className={`${className} relative`}>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="group relative w-full overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_50px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
        style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ backgroundImage: `linear-gradient(225deg, ${primaryColor}, ${secondaryColor})` }}
        />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
        <div className="absolute -top-1 -right-1 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />

        <div className="relative z-10 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="relative flex-shrink-0">
            <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transition-all duration-300 ${isHovered ? "rotate-12 scale-110" : ""}`}>
              {unreadCount > 0 ? (
                <BellRing className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white animate-pulse" />
              ) : (
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              )}
            </div>
            {unreadCount > 0 && <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/30 animate-ping" />}
          </div>

          <div className="text-left flex-1 min-w-0">
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 sm:gap-2">Latest Updates</div>
            <div className="text-[10px] sm:text-xs text-white/90 font-medium truncate">
              {unreadCount > 0 ? `${unreadCount} new announcement${unreadCount > 1 ? "s" : ""}` : "No new updates"}
            </div>
          </div>

          {unreadCount > 0 && (
            <div
              className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm font-bold text-[10px] sm:text-xs shadow-lg animate-bounce flex-shrink-0"
              style={{ color: primaryColor }}
            >
              {unreadCount}
            </div>
          )}
        </div>
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          className="absolute top-full right-0 mt-3 z-50 w-[480px] max-w-[90vw] animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <Card className="border-0 shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden bg-white dark:bg-neutral-900 backdrop-blur-xl">
            <CardHeader
              className="pb-4 pt-4 relative overflow-hidden"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />

              <div className="flex items-center justify-between relative z-10">
                <CardTitle className="text-base font-bold flex items-center gap-2.5 text-white">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm shadow-lg">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  All Announcements
                </CardTitle>
                <button
                  onClick={() => setShowPopup(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900 pt-4 pb-4 max-h-[400px] overflow-y-auto">
              {displayedAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No latest updates</p>
                  <p className="text-xs mt-1 opacity-70">Check back later for announcements</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedAnnouncements.map((announcement) => {
                    const colors = getAnnouncementColor(announcement.type);

                    return (
                      <div
                        key={announcement.id}
                        className={`group relative p-3.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
                          announcement.isRead
                            ? "border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 opacity-70"
                            : `${colors.border} ${colors.bg} shadow-sm`
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`}
                          >
                            {getAnnouncementIcon(announcement.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                {announcement.title}
                              </h4>
                              {!announcement.isRead && (
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                              )}
                            </div>

                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1.5 leading-relaxed overflow-hidden text-ellipsis line-clamp-1">
                              {announcement.message}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-medium">
                                {formatTimestamp(announcement.timestamp)}
                              </span>

                              <div className="flex items-center gap-2">
                                {isValidUrl(announcement.link) && (
                                  <a
                                    href={announcement.link}
                                    onClick={() => markAsRead(announcement.id)}
                                    className="text-[10px] hover:underline font-semibold"
                                    style={{ color: primaryColor }}
                                    rel="noopener noreferrer"
                                  >
                                    Learn More
                                  </a>
                                )}

                                {!announcement.isRead && (
                                  <button
                                    onClick={() => markAsRead(announcement.id)}
                                    className="text-[10px] px-2 py-1 rounded-md font-semibold transition-all duration-200 hover:scale-105"
                                    style={{ backgroundColor: primaryColor, color: "white" }}
                                  >
                                    Mark Read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => dismissAnnouncement(announcement.id)}
                            className="self-start w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {announcements.length > maxItems && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-center">
                  <button className="text-xs hover:underline font-semibold transition-colors" style={{ color: primaryColor }}>
                    View All Announcements ({announcements.length})
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Announcements;
