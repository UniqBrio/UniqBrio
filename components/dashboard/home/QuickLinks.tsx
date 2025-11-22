"use client";
import React from "react";
import { LayoutDashboard, CheckSquare, Settings, ShoppingCart, FileText } from "lucide-react";

const links: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: 'Dashboard', href: '/services', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Tasks', href: '/task-management', icon: <CheckSquare className="w-4 h-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
  { label: 'Sales', href: '/sell', icon: <ShoppingCart className="w-4 h-4" /> },
  { label: 'Audit Logs', href: '/audit-logs', icon: <FileText className="w-4 h-4" /> }
];

export function QuickLinks() {
  return (
    <nav aria-label="Quick navigation" className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Quick Links</h2>
      </div>
      <ul className="flex flex-wrap gap-3">
        {links.map(l => (
          <li key={l.href}>
            <a
              href={l.href}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-2.5 text-sm font-medium bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {l.icon}
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default QuickLinks;