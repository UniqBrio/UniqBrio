"use client"

import { useCustomColors } from "@/lib/use-custom-colors"

interface EventHeroSectionProps {
  onCreateEvent?: () => void
  onOpenDrafts?: () => void
  onOpenMarketing?: () => void
}

export default function EventHeroSection({ 
  onCreateEvent, 
  onOpenDrafts, 
  onOpenMarketing 
}: EventHeroSectionProps) {
  const { primaryColor } = useCustomColors()
  
  return (
    <div className="pt-1 pb-4 relative">
      <div className="w-full">
        <div className="flex items-center mb-1 flex-wrap gap-2 relative min-h-[48px]">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>Event Management Hub</h1>
        </div>
        <p className="text-lg mb-0 text-gray-700 dark:text-white">
          Manage, track, and organize sports events and activities for your academy
        </p>
      </div>
    </div>
  )
}