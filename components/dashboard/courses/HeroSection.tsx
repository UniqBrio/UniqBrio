"use client"

import { Button } from "@/components/dashboard/ui/button"
import { GraduationCap, Plus, Save, FileText, Megaphone } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"

interface HeroSectionProps {
  onCreateCourse: () => void;
  onOpenDrafts: () => void;
  onOpenMarketing: () => void;
}

export default function HeroSection({ 
  onCreateCourse, 
  onOpenDrafts, 
  onOpenMarketing 
}: HeroSectionProps) {
  const { primaryColor } = useCustomColors();
  return (
    <div className="pt-1 pb-4 relative">
      <div className="w-full">
        <div className="flex items-center mb-1 flex-wrap gap-2 relative min-h-[48px]">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>Course Management</h1>
        </div>
  <p className="text-lg mb-0 text-gray-700 dark:text-white">
          Comprehensive course management with AI-powered insights, and advanced analytics.
        </p>
      </div>
    </div>
  );
}
