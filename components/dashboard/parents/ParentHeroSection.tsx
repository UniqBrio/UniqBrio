"use client"

import { Button } from "@/components/dashboard/ui/button"
import { Users, Plus, Save, FileText, UserPlus } from "lucide-react"

interface ParentHeroSectionProps {
  onCreateParent: () => void;
  onOpenReports?: () => void;
  onOpenCommunication?: () => void;
}

export default function ParentHeroSection({ 
  onCreateParent, 
  onOpenReports, 
  onOpenCommunication 
}: ParentHeroSectionProps) {
  return (
    <div className="pt-1 pb-4 relative">
      <div className="w-full">
        <div className="flex items-center mb-1 flex-wrap gap-2 relative min-h-[48px]">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Parent Management</h1>
        </div>
        <p className="text-lg mb-0 text-gray-700">
          Manage parent profiles, track engagement, payment status, and communication preferences.
        </p>
      </div>
    </div>
  );
}