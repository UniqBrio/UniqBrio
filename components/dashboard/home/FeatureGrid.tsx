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
    description: "Catalog, import, draft & publish curricula.",
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
    description: "Session modifications, attendance & leave management.",
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
    href: "/settings",
    icon: <SettingsIcon className="w-5 h-5" />,
    gradient: "from-slate-500 to-gray-500"
  }
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 id="features-heading" className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
            <SettingsIcon className="w-4 h-4" />
          </div>
          Platform Modules
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(f => (
          <a
            key={f.title}
            href={f.href}
            className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 overflow-hidden"
            aria-label={`${f.title} module`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${f.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity rounded-full -mr-12 -mt-12`} />
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${f.gradient} text-white mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {f.title}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

export default FeatureGrid;