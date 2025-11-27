// Tour data for all pages in sidebar order
export interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  emoji: string;
  sidebarSelector?: string; // CSS selector to highlight sidebar item
}

export const tourSteps: TourStep[] = [
  {
    id: "home",
    title: "Dashboard Home",
    description: "Welcome to your dashboard! This is your central hub where you can view key metrics, financial overview, and performance analytics. Everything you need to monitor your academy's performance is right here at a glance.",
    route: "/dashboard",
    position: "center",
    emoji: "🏠",
    sidebarSelector: "[data-tour-id='home']"
  },
  
  {
    id: "notifications",
    title: "Notifications",
    description: "Stay updated with important alerts and announcements! Click the bell icon in the top navigation to view all your notifications. Never miss important updates about your academy.",
    route: "/dashboard",
    position: "center",
    emoji: "🔔",
    sidebarSelector: "[data-tour-id='notifications']"
  },
  {
    id: "courses-cohorts",
    title: "Courses & Cohorts",
    description: "Start with core academics: manage your course catalog, imports and drafts; then organize learners into cohorts to sync membership and schedules. These two sections form the backbone of your academy operations.",
    route: "/dashboard",
    position: "right",
    emoji: "📚",
    sidebarSelector: "[data-tour-id='services']"
  },
  {
    id: "payments",
    title: "Payments",
    description: "Handle all your payment transactions here! Process payments, view transaction history, and manage payment methods. This is your complete payment management center for the academy.",
    route: "/dashboard/payments",
    position: "center",
    emoji: "💳",
    sidebarSelector: "[data-tour-id='payments']"
  },
  {
    id: "financials",
    title: "Financials",
    description: "Keep track of your academy's finances! Monitor income, manage expenses, analyze profits, and generate financial reports. Everything you need for comprehensive financial management is available here.",
    route: "/dashboard/financials",
    position: "center",
    emoji: "💰",
    sidebarSelector: "[data-tour-id='financials']"
  },
  
  {
    id: "settings",
    title: "Settings",
    description: "Want to customize your application? Go to Settings to configure your academy profile, change appearance themes, manage notifications, update security preferences, and personalize your experience.",
    route: "/dashboard/settings",
    position: "center",
    emoji: "⚙️",
    sidebarSelector: "[data-tour-id='settings']"
  },
  
  {
    id: "help",
    title: "Help & Support",
    description: "Need assistance? Visit our Help section to access documentation, step-by-step tutorials, frequently asked questions, and support resources. We're here to help you with any questions or issues!",
    route: "/dashboard/help",
    position: "center",
    emoji: "❓",
    sidebarSelector: "[data-tour-id='help']"
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

export const setTourHidden = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tourHidden', 'true');
};

export const isTourHidden = () => {
  if (typeof window === 'undefined') return false;
  // Testing override: if `?showTour=1` is present or session flag set, always show
  try {
    const params = new URLSearchParams(window.location.search);
    const forceShow = params.has('showTour') || sessionStorage.getItem('tourForce') === 'true';
    if (forceShow) return false;
  } catch {}
  return localStorage.getItem('tourHidden') === 'true';
};

// Helper to force show the tour within current session (used for local testing)
export const forceShowTour = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('tourForce', 'true');
  } catch {}
};
