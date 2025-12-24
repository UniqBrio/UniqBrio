/**
 * PERFORMANCE OPTIMIZATION: Static Menu Items
 * 
 * This file contains the static menu structure that was previously
 * recreated on every sidebar render. By moving it outside the component:
 * 
 * Benefits:
 * - Created once when app starts (not on every render)
 * - Reduces JavaScript heap allocations
 * - Eliminates object recreation overhead
 * - Faster subsequent sidebar renders
 * 
 * The menu items are exported as a frozen array to prevent accidental mutations.
 */

import type React from "react"
import {
  Home,
  Briefcase,
  Calendar,
  BookOpen,
  ClipboardCheck,
  Users,
  MessageSquare,
  CreditCard,
  TrendingUp,
  CalendarClock,
  Users2,
  Settings,
  HelpCircle,
  ScrollText,
  UserCircle,
  ShoppingCart,
  DollarSign,
  GraduationCap,
} from "lucide-react"

export interface MenuItem {
  id: string
  name: string
  icon: React.ReactNode
  href: string
  tooltip: string
  submenu?: MenuItem[]
  isFavorite?: boolean
  external?: boolean
  badge?: {
    text: string
    variant: "comingSoon" | "integrated"
  }
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "home",
    name: "Home",
    icon: <Home className="h-5 w-5" />,
    href: "/dashboard",
    tooltip: "Home",
  },
  {
    id: "services",
    name: "Services",
    icon: <Briefcase className="h-5 w-5" />,
    href: "/dashboard/services",
    tooltip: "Manage services",
    submenu: [
      {
        id: "schedule",
        name: "Schedule",
        icon: <Calendar className="h-5 w-5" />,
        href: "/dashboard/services/schedule",
        tooltip: "Manage schedules",
      },
      {
        id: "courses",
        name: "Course Management",
        icon: <BookOpen className="h-5 w-5" />,
        href: "/dashboard/services/courses",
        tooltip: "Manage courses",
      },
    ],
  },
  {
    id: "payments",
    name: "Payments",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/dashboard/payments",
    tooltip: "Payments",
  },
  {
    id: "user",
    name: "User Management",
    icon: <UserCircle className="h-5 w-5" />,
    href: "/dashboard/user",
    tooltip: "Manage users",
    submenu: [
      {
        id: "students",
        name: "Students Management",
        icon: <Users className="h-5 w-5" />,
        href: "/dashboard/user/students",
        tooltip: "Manage students",
      },
      {
        id: "staff",
        name: "Staff Management",
        icon: <Users className="h-5 w-5" />,
        href: "/dashboard/user/staff",
        tooltip: "Manage staff",
        submenu: [
          {
            id: "instructor",
            name: "Instructor",
            icon: <Users className="h-5 w-5" />,
            href: "/dashboard/user/staff/instructor",
            tooltip: "Manage instructors",
          },
          {
            id: "non-instructor",
            name: "Non-Instructor",
            icon: <Users className="h-5 w-5" />,
            href: "/dashboard/user/staff/non-instructor",
            tooltip: "Manage non-instructors",
          },
        ],
      },
      {
        id: "parents",
        name: "Parent Management",
        icon: <Users className="h-5 w-5" />,
        href: "/dashboard/user/parents",
        tooltip: "Manage parents",
        badge: {
          text: "Coming Soon",
          variant: "comingSoon",
        },
      },
      {
        id: "alumni",
        name: "Alumni Management",
        icon: <GraduationCap className="h-5 w-5" />,
        href: "/dashboard/user/alumni",
        tooltip: "Manage alumni",
        badge: {
          text: "Coming Soon",
          variant: "comingSoon",
        },
      },
    ],
  },
  {
    id: "financials",
    name: "Financials",
    icon: <DollarSign className="h-5 w-5" />,
    href: "/dashboard/financials",
    tooltip: "Manage financials",
  },
  {
    id: "task-management",
    name: "Task Management",
    icon: <ClipboardCheck className="h-5 w-5" />,
    href: "/dashboard/task-management",
    tooltip: "Manage tasks and workflows",
  },
  {
    id: "community",
    name: "Community",
    icon: <Users2 className="h-5 w-5" />,
    href: "https://dailybrio.uniqbrio.com/",
    tooltip: "Community (Opens in new tab)",
    external: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/dashboard/settings",
    tooltip: "Settings",
  },
  {
    id: "audit-logs",
    name: "Audit logs",
    icon: <ScrollText className="h-5 w-5" />,
    href: "/dashboard/audit-logs",
    tooltip: "View audit logs",
  },
  {
    id: "help",
    name: "Help",
    icon: <HelpCircle className="h-5 w-5" />,
    href: "/dashboard/help",
    tooltip: "Help",
  },
  {
    id: "events",
    name: "Events",
    icon: <CalendarClock className="h-5 w-5" />,
    href: "/dashboard/events",
    tooltip: "Manage events",
    badge: {
      text: "🎯 Coming Soon",
      variant: "comingSoon",
    },
  },
  {
    id: "enquiries",
    name: "Enquiries and Leads (CRM)",
    icon: <MessageSquare className="h-5 w-5" />,
    href: "/dashboard/crm",
    tooltip: "Enquiries and leads",
    badge: {
      text: "Coming Soon",
      variant: "comingSoon",
    },
  },
  {
    id: "sell-services-products",
    name: "Sell Products & Services",
    icon: <ShoppingCart className="h-5 w-5" />,
    href: "/dashboard/sell",
    tooltip: "Sell products & services",
    badge: {
      text: "Coming Soon",
      variant: "comingSoon",
    },
  },
  {
    id: "promotions",
    name: "Promotions",
    icon: <TrendingUp className="h-5 w-5" />,
    href: "/dashboard/promotion",
    tooltip: "Manage promotions",
    badge: {
      text: "Coming Soon",
      variant: "comingSoon",
    },
  },
]

// Freeze the array to prevent mutations
Object.freeze(MENU_ITEMS)
