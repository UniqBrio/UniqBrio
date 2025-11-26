// Tour data for all pages in sidebar order
export interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  emoji: string;
}

export const tourSteps: TourStep[] = [
  {
    id: "home",
    title: "Dashboard Home",
    description: "Your central hub showing key metrics, financial overview, performance analytics, and quick access to favorite pages. Get a comprehensive view of your academy's performance at a glance.",
    route: "/dashboard",
    position: "center",
    emoji: "🏠"
  },
  {
    id: "services",
    title: "Services",
    description: "Manage all your academy services including schedules and course management. This is your main hub for organizing educational offerings.",
    route: "/dashboard/services",
    position: "center",
    emoji: "🎯"
  },
  {
    id: "schedule",
    title: "Schedule Management",
    description: "Create and manage class schedules, assign instructors, set timings, and handle session planning. Keep your academy's calendar organized and efficient.",
    route: "/dashboard/services/schedule",
    position: "center",
    emoji: "📅"
  },
  {
    id: "courses",
    title: "Course Management",
    description: "Create, edit, and manage your courses. Define course details, pricing, duration, and requirements. Track enrollment and course performance.",
    route: "/dashboard/services/courses",
    position: "center",
    emoji: "📚"
  },
  {
    id: "payments",
    title: "Payments",
    description: "Process payments, view transaction history, manage payment methods. Complete payment management for your academy.",
    route: "/dashboard/payments",
    position: "center",
    emoji: "💳"
  },
  
  {
    id: "students",
    title: "Students Management",
    description: "Manage student profiles, enrollment, attendance, performance tracking, and student-related documents. Your complete student information system.",
    route: "/dashboard/user/students",
    position: "center",
    emoji: "👨‍🎓"
  },
  
  {
    id: "instructor",
    title: "Instructor Management",
    description: "Dedicated section for managing instructors. Handle profiles, leave, attendance and instructor-specific tasks.",
    route: "/dashboard/user/staff/instructor",
    position: "center",
    emoji: "👨‍🏫"
  },
  {
    id: "non-instructor",
    title: "Non-Instructor Staff",
    description: "Manage and support staff members. Handle their profiles, roles, and responsibilities within the academy.",
    route: "/dashboard/user/staff/non-instructor",
    position: "center",
    emoji: "👥"
  },
  
  {
    id: "financials",
    title: "Financials",
    description: "Comprehensive financial management including income tracking, expense management, profit analysis, and financial reporting for your academy.",
    route: "/dashboard/financials",
    position: "center",
    emoji: "💰"
  },
  {
    id: "task-management",
    title: "Task Management",
    description: "Create, assign, and track tasks for yourself. Manage workflows, set deadlines, and monitor task completion to keep operations running smoothly.",
    route: "/dashboard/task-management",
    position: "center",
    emoji: "✅"
  },
  {
    id: "events",
    title: "Events",
    description: "Plan and manage academy events, workshops, seminars, and special activities. Handle registrations, schedules, and event communications.",
    route: "/dashboard/events",
    position: "center",
    emoji: "🎉"
  },
  {
    id: "community",
    title: "Community",
    description: "Access the UniqBrio community platform to get the latest updates in arts & sports.",
    route: "https://dailybrio.uniqbrio.com/",
    position: "center",
    emoji: "🌐"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure your academy settings including profile, appearance, notifications, security, and system preferences. Customize your experience.",
    route: "/dashboard/settings",
    position: "center",
    emoji: "⚙️"
  },
  
  {
    id: "help",
    title: "Help & Support",
    description: "Access documentation, tutorials, FAQs, and support resources. Get help with any questions or issues you may encounter.",
    route: "/dashboard/help",
    position: "center",
    emoji: "❓"
  },
  
  
];

export const getTourProgress = () => {
  if (typeof window === 'undefined') return null;
  const progress = localStorage.getItem('tourProgress');
  return progress ? JSON.parse(progress) : null;
};

export const saveTourProgress = (stepIndex: number, completed: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tourProgress', JSON.stringify({ stepIndex, completed, timestamp: Date.now() }));
};

export const resetTour = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tourProgress');
};
