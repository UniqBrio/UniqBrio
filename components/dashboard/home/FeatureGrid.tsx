"use client";
import React from "react";
import { Users, BookOpen, Calendar, GraduationCap, UserCog, CheckSquare, Briefcase, ShoppingCart, Settings as SettingsIcon } from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}

const features: FeatureItem[] = [
  {
    title: "Cohorts",
    description: "Organize learners and sync membership.",
    href: "/services/cohorts",
    icon: <Users className="w-5 h-5" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Courses",
    description: "Catalog, import, draft and add courses.",
    href: "/services/courses",
    icon: <BookOpen className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Schedules",
    description: "Unified sessions with modification overlays.",
    href: "/services/schedule",
    icon: <Calendar className="w-5 h-5" />,
    gradient: "from-orange-500 to-red-500"
  },
  {
    title: "Instructor",
    description: "Hiring, attendance & leave management.",
    href: "/user/staff/instructor",
    icon: <GraduationCap className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500"
  },
  {
    title: "Non-Instructor",
    description: "Operational attendance, leave requests & task execution.",
    href: "/user/staff/non-instructor",
    icon: <UserCog className="w-5 h-5" />,
    gradient: "from-amber-500 to-yellow-500"
  },
  {
    title: "Tasks",
    description: "Draft, manage and publish operational tasks.",
    href: "/task-management",
    icon: <CheckSquare className="w-5 h-5" />,
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    title: "Services",
    description: "Provision & manage internal service offerings.",
    href: "/services",
    icon: <Briefcase className="w-5 h-5" />,
    gradient: "from-teal-500 to-cyan-500"
  },
  {
    title: "Settings",
    description: "Profile, security, appearance & system ops.",
    href: "/dashboard/settings",
    icon: <SettingsIcon className="w-5 h-5" />,
    gradient: "from-slate-500 to-gray-500"
  }
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="mt-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"></div>
        <h2 id="features-heading" className="text-2xl font-bold tracking-tight flex items-center gap-3 text-neutral-800 dark:text-neutral-200">
          <div className="p-2.5 rounded-xl text-white shadow-lg"
            style={{ backgroundImage: `linear-gradient(135deg, var(--custom-color-1), var(--custom-color-2))` }}>
            <SettingsIcon className="w-5 h-5" />
          </div>
          Platform Modules
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(f => (
          <a
            key={f.title}
            href={f.href}
            className="group relative rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-6 bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700"
            aria-label={`${f.title} module`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.gradient} opacity-10 blur-3xl group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 rounded-full -mr-16 -mt-16`} />
            <div className={`relative inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
              {f.icon}
            </div>
            <h3 className="relative font-bold text-lg mb-2 text-neutral-900 dark:text-white transition-all duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundImage = `linear-gradient(90deg, var(--custom-color-1), var(--custom-color-2))`;
                e.currentTarget.style.backgroundClip = 'text';
                e.currentTarget.style.webkitBackgroundClip = 'text';
                e.currentTarget.style.color = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundImage = '';
                e.currentTarget.style.backgroundClip = '';
                e.currentTarget.style.webkitBackgroundClip = '';
                e.currentTarget.style.color = '';
              }}>
              {f.title}
            </h3>
            <p className="relative text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

export default FeatureGrid;