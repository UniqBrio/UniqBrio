"use client"

import { Button } from "@/components/dashboard/ui/button"
import { Users, Plus, Save, FileText, Trophy } from "lucide-react"

interface StudentHeroSectionProps {
  onCreateStudent: () => void;
  onOpenDrafts: () => void;
  onOpenAchievements?: () => void;
}

export default function StudentHeroSection({ 
  onCreateStudent, 
  onOpenDrafts, 
  onOpenAchievements 
}: StudentHeroSectionProps) {
  return (
    <div className="pt-1 pb-4 relative">
      <div className="w-full">
        <div className="flex items-center mb-1 flex-wrap gap-2 relative min-h-[48px]">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Student Management</h1>
        </div>
        <p className="text-lg mb-0 text-gray-700 dark:text-white">
          Comprehensive student management with performance insights, attendance tracking, and analytics.
        </p>
      </div>
    </div>
  );
}