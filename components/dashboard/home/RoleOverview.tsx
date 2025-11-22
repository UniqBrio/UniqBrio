"use client";
import React from "react";
import { Shield, Briefcase, GraduationCap, UserCog, User } from "lucide-react";

interface RoleCardProps {
  role: string;
  highlights: string[];
  icon: React.ReactNode;
  gradient: string;
}

const roles: RoleCardProps[] = [
  {
    role: "Admin",
    highlights: ["User & role management", "System health & indexes", "Security & policies"],
    icon: <Shield className="w-5 h-5" />,
    gradient: "from-red-500 to-orange-500"
  },
  {
    role: "Staff",
    highlights: ["Scheduling oversight", "Services & sales dashboards", "Task lifecycle"],
    icon: <Briefcase className="w-5 h-5" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    role: "Instructor",
    highlights: ["Session modifications", "Attendance & leave", "Course involvement"],
    icon: <GraduationCap className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    role: "Non-Instructor",
    highlights: ["Operational attendance", "Leave requests", "Task execution"],
    icon: <UserCog className="w-5 h-5" />,
    gradient: "from-green-500 to-teal-500"
  },
  {
    role: "Student",
    highlights: ["Attendance tracking", "Achievements", "Leave management"],
    icon: <User className="w-5 h-5" />,
    gradient: "from-amber-500 to-yellow-500"
  }
];

export function RoleOverview() {
  return (
    <section aria-labelledby="roles-heading" className="mt-20">
      <h2 id="roles-heading" className="text-2xl font-bold tracking-tight mb-6">Role Overview</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {roles.map(r => (
          <div
            key={r.role}
            className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
            aria-label={`${r.role} role summary`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${r.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity rounded-full -mr-12 -mt-12`} />
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${r.gradient} text-white mb-3 shadow-md`}>
              {r.icon}
            </div>
            <h3 className="font-semibold text-base mb-3">{r.role}</h3>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              {r.highlights.map(h => (
                <li key={h} className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RoleOverview;