"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import {
  CheckCircle,
  Clock,
  Zap,
  MapPin,
  Calendar as CalendarIcon,
  Heart,
} from "lucide-react";

interface Feature {
  title: string;
  description: string;
  status: "integrated" | "coming-soon" | "in-progress";
  category: string;
  releaseQuarter?: string;
  progress?: number;
}

const features: Feature[] = [
  {
    title: "Cohorts Management",
    description: "Organize learners and sync membership",
    status: "integrated",
    category: "Core Services",
  },
  {
    title: "Course Management",
    description: "Catalog, import, draft & publish curricula",
    status: "integrated",
    category: "Core Services",
  },
  {
    title: "Unified Schedule",
    description: "Session management with modification overlays",
    status: "integrated",
    category: "Core Services",
  },
  {
    title: "Student Management",
    description: "Registration, profiles, enrollment tracking",
    status: "integrated",
    category: "User Management",
  },
  {
    title: "Staff Management",
    description: "Hiring, attendance & leave",
    status: "integrated",
    category: "User Management",
  },
  {
    title: "Task Management",
    description: "Draft, manage operational tasks",
    status: "integrated",
    category: "Operations",
  },
  {
    title: "Financial Dashboard",
    description: "Income, expense, reports, ROI calculator",
    status: "integrated",
    category: "Financials",
  },
  {
    title: "Attendance System",
    description: "Track student and staff attendance",
    status: "integrated",
    category: "Operations",
  },
  {
    title: "Leave Management",
    description: "Request and approve leave for staff",
    status: "integrated",
    category: "Operations",
  },
  {
    title: "Event Management",
    description: "Organize and track academy events",
    status: "integrated",
    category: "Operations",
  },
  {
    title: "Parents Portal",
    description: "Parent profiles and student associations",
    status: "coming-soon",
    category: "User Management",
    releaseQuarter: "Q1 2026",
  },
  {
    title: "Alumni Network",
    description: "Alumni tracking and engagement",
    status: "coming-soon",
    category: "User Management",
    releaseQuarter: "Q2 2026",
  },
  {
    title: "CRM System",
    description: "Enquiries and leads management",
    status: "coming-soon",
    category: "Sales & Marketing",
    releaseQuarter: "Q1 2026",
  },
  {
    title: "Sales Dashboard",
    description: "Products & sales performance tracking",
    status: "coming-soon",
    category: "Sales & Marketing",
    releaseQuarter: "Q1 2026",
  },
  {
    title: "Promotions",
    description: "Poster designer, social media scheduler",
    status: "coming-soon",
    category: "Promotions",
    releaseQuarter: "Q2 2026",
  },
  
];

interface FeatureRoadmapProps {
  className?: string;
}

export function FeatureRoadmap({ className = "" }: FeatureRoadmapProps) {
  const [likedFeatures, setLikedFeatures] = React.useState<Set<string>>(new Set());
  
  const integrated = features.filter((f) => f.status === "integrated");
  const comingSoon = features.filter((f) => f.status === "coming-soon");
  const inProgress = features.filter((f) => f.status === "in-progress");

  const toggleLike = (featureTitle: string) => {
    setLikedFeatures((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(featureTitle)) {
        newSet.delete(featureTitle);
      } else {
        newSet.add(featureTitle);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: Feature["status"]) => {
    const badges = {
      integrated: {
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Integrated",
        className:
          "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      },
      "coming-soon": {
        icon: <Clock className="w-3 h-3" />,
        label: "Coming Soon",
        className:
          "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      },
      "in-progress": {
        icon: <Zap className="w-3 h-3" />,
        label: "In Progress",
        className:
          "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      },
    };
    return badges[status];
  };

  const getCategoryIcon = (category: string) => {
    return <MapPin className="w-3.5 h-3.5" />;
  };

  return (
    <section className={`${className}`} aria-labelledby="roadmap-heading">
      <Card className="border-0 shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-500 overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="pb-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 relative overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-white relative z-10">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transform hover:rotate-12 hover:scale-110 transition-all duration-300">
              <CalendarIcon className="w-6 h-6" />
            </div>
            Feature Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900 pt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                  Integrated
                </span>
              </div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {integrated.length}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-2 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  In Progress
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {inProgress.length}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border-2 border-amber-200 dark:border-amber-800 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {comingSoon.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Platform Completion
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {Math.round((integrated.length / features.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all"
                style={{
                  width: `${(integrated.length / features.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Integrated Features */}
            {integrated.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Live & Available
                </h3>
                <div className="grid gap-3">
                  {integrated.map((feature) => {
                    const badge = getStatusBadge(feature.status);
                    return (
                      <div
                        key={feature.title}
                        className="group p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base text-neutral-900 dark:text-white mb-1">
                              {feature.title}
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {feature.description}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${badge.className}`}
                          >
                            {badge.icon}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Right Column - Coming Soon Features */}
            {comingSoon.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Planned Features
                </h3>
                <div className="grid gap-2">
                  {comingSoon.map((feature) => {
                    const badge = getStatusBadge(feature.status);
                    return (
                      <div
                        key={feature.title}
                        className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-white mb-0.5">
                              {feature.title}
                            </h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              {feature.description}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleLike(feature.title)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-colors group ${
                              likedFeatures.has(feature.title)
                                ? 'bg-red-50 dark:bg-red-950/30'
                                : 'hover:bg-red-50 dark:hover:bg-red-950/30'
                            }`}
                            aria-label={likedFeatures.has(feature.title) ? "Unlike this feature" : "Like this feature"}
                          >
                            <Heart 
                              className={`w-5 h-5 transition-colors ${
                                likedFeatures.has(feature.title)
                                  ? 'text-red-500 fill-red-500'
                                  : 'text-neutral-400 group-hover:text-red-500 group-hover:fill-red-500'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default FeatureRoadmap;
