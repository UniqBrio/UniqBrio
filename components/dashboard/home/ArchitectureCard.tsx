"use client";
import React from "react";
import { Code2, Database, Zap, FileCode } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";

export function ArchitectureCard() {
  const { primaryColor, secondaryColor } = useCustomColors();
  return (
    <section aria-labelledby="arch-heading" className="mt-20">
      <h2 id="arch-heading" className="text-2xl font-bold tracking-tight mb-6">Architecture Snapshot</h2>
      <div
        className="relative rounded-3xl border border-neutral-200 dark:border-neutral-800 backdrop-blur p-8 flex flex-col gap-6 shadow-xl overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}22, #ffffff, ${secondaryColor}22)` }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl rounded-full -mr-32 -mt-32"
          style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        />
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg"
              style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <Code2 className="w-6 h-6" />
            </div>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 flex-1">
              UniqBrio runs on <strong>Next.js (App Router)</strong> with modular API routes, <strong>MongoDB + Redis</strong> for persistence & caching, and a unified schedule modification overlay. Explore data models, workflows and optimization strategies in the full help guide.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs mb-6">
            {[
              { label: 'Next.js', icon: <FileCode className="w-3 h-3" /> },
              { label: 'TypeScript', icon: <Code2 className="w-3 h-3" /> },
              { label: 'MongoDB', icon: <Database className="w-3 h-3" /> },
              { label: 'Redis', icon: <Zap className="w-3 h-3" /> },
              { label: 'R2 Storage', icon: null },
              { label: 'Tailwind', icon: null },
              { label: 'Unified Sessions', icon: null },
              { label: 'Task Drafts', icon: null }
            ].map(t => (
              <span key={t.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm font-medium">
                {t.icon}
                {t.label}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <a
              href="/docs/UniqBrio-Help-Guide"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all focus-visible:outline-none"
              style={{
                backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 10px 20px ${primaryColor}33`
              }}
            >
              <FileCode className="w-4 h-4" />
              Read Guide
            </a>
            <a href="/dashboard/services/schedule" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow transition-all">
              View Schedules
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ArchitectureCard;