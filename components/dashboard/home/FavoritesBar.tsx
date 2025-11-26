"use client";
import React, { useState, useEffect } from "react";
import { useCustomColors } from "@/lib/use-custom-colors";
import { useRouter } from "next/navigation";
import {
  Home,
  Briefcase,
  Calendar,
  BookOpen,
  CreditCard,
  DollarSign,
  Users,
  UserPlus,
  GraduationCap,
  Settings,
  CalendarClock,
  Users2,
  ClipboardCheck,
  UserCircle,
  ScrollText,
  HelpCircle,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="w-5 h-5 text-white" />,
  services: <Briefcase className="w-5 h-5 text-white" />,
  schedule: <Calendar className="w-5 h-5 text-white" />,
  courses: <BookOpen className="w-5 h-5 text-white" />,
  payments: <CreditCard className="w-5 h-5 text-white" />,
  financials: <DollarSign className="w-5 h-5 text-white" />,
  user: <Users className="w-5 h-5 text-white" />,
  students: <GraduationCap className="w-5 h-5 text-white" />,
  staff: <UserPlus className="w-5 h-5 text-white" />,
  instructor: <Users className="w-5 h-5 text-white" />,
  "non-instructor": <UserCircle className="w-5 h-5 text-white" />,
  parents: <Users2 className="w-5 h-5 text-white" />,
  alumni: <GraduationCap className="w-5 h-5 text-white" />,
  settings: <Settings className="w-5 h-5 text-white" />,
  "audit-logs": <ScrollText className="w-5 h-5 text-white" />,
  help: <HelpCircle className="w-5 h-5 text-white" />,
  enquiries: <MessageSquare className="w-5 h-5 text-white" />,
  "sell-services-products": <ShoppingCart className="w-5 h-5 text-white" />,
  promotions: <TrendingUp className="w-5 h-5 text-white" />,
  events: <CalendarClock className="w-5 h-5 text-white" />,
  "task-management": <ClipboardCheck className="w-5 h-5 text-white" />,
  community: <Users2 className="w-5 h-5 text-white" />,
};

const menuItemsData: Record<string, { name: string; href: string; external?: boolean }> = {
  home: { name: "Home", href: "/dashboard" },
  services: { name: "Services", href: "/dashboard/services" },
  schedule: { name: "Schedule", href: "/dashboard/services/schedule" },
  courses: { name: "Courses", href: "/dashboard/services/courses" },
  payments: { name: "Payments", href: "/dashboard/payments" },
  financials: { name: "Financials", href: "/dashboard/financials" },
  user: { name: "Users", href: "/dashboard/user" },
  students: { name: "Students", href: "/dashboard/user/students" },
  staff: { name: "Staff", href: "/dashboard/user/staff" },
  instructor: { name: "Instructor", href: "/dashboard/user/staff/instructor" },
  "non-instructor": { name: "Non-Instructor", href: "/dashboard/user/staff/non-instructor" },
  parents: { name: "Parents", href: "/dashboard/user/parents" },
  alumni: { name: "Alumni", href: "/dashboard/user/alumni" },
  settings: { name: "Settings", href: "/dashboard/settings" },
  "audit-logs": { name: "Audit Logs", href: "/dashboard/audit-logs" },
  help: { name: "Help", href: "/dashboard/help" },
  enquiries: { name: "CRM", href: "/dashboard/crm" },
  "sell-services-products": { name: "Sell", href: "/dashboard/sell" },
  promotions: { name: "Promotions", href: "/dashboard/promotion" },
  events: { name: "Events", href: "/dashboard/events" },
  "task-management": { name: "Task", href: "/dashboard/task-management" },
  community: { name: "Community", href: "https://dailybrio.uniqbrio.com/", external: true },
};

export function FavoritesBar() {
  const { primaryColor } = useCustomColors();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem("favorites");
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    };

    loadFavorites();

    // Poll for changes
    const interval = setInterval(loadFavorites, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  return (
    <div className="flex gap-4 sm:gap-6 items-start">
      {favorites.map((favId) => {
        const item = menuItemsData[favId];
        if (!item) return null;

        return (
          <div
            key={favId}
            onClick={() => handleClick(item.href, item.external)}
            className="flex flex-col items-center gap-2 cursor-pointer group animate-bounce-subtle"
          >
            <div
              className="p-3 rounded-lg transition-all duration-300 group-hover:scale-110 shadow-md group-hover:shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {iconMap[favId]}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center whitespace-nowrap">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
