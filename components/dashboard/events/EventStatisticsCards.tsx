"use client"

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Calendar, Users, TrendingUp, Trophy } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"

interface EventStatisticsCardsProps {
  totalEvents?: number
  activeEvents?: number
  completedEvents?: number
  totalParticipants?: number
}

export default function EventStatisticsCards({
  totalEvents = 21,
  activeEvents = 5,
  completedEvents = 10,
  totalParticipants = 31,
  
}: EventStatisticsCardsProps) {
  const { primaryColor, secondaryColor } = useCustomColors()
  return (
    <div className="responsive-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
      {/* Total Events */}
      <Card className="stats-card dashboard-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-3 sm:p-4 responsive-p-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-600 responsive-text-xs">Total Events</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 stats-value responsive-text-xl">{totalEvents}</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Active Events */}
      <Card className="stats-card dashboard-card bg-gradient-to-br from-green-50 to-green-100 border-green-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-3 sm:p-4 responsive-p-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-600 responsive-text-xs">Active Events</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 stats-value responsive-text-xl">{activeEvents}</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Completed Events */}
      <Card className="stats-card dashboard-card border hover:shadow-lg transition-shadow" style={{ background: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}20)`, borderColor: primaryColor }}>
        <CardContent className="p-3 sm:p-4 responsive-p-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium responsive-text-xs" style={{ color: primaryColor }}>Completed Events</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold stats-value responsive-text-xl" style={{ color: primaryColor, opacity: 0.9 }}>{completedEvents}</p>
            </div>
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" style={{ color: primaryColor }} />
          </div>
        </CardContent>
      </Card>

      {/* Total Participants */}
      <Card className="stats-card dashboard-card border hover:shadow-lg transition-shadow" style={{ background: `linear-gradient(to bottom right, ${secondaryColor}10, ${secondaryColor}20)`, borderColor: secondaryColor }}>
        <CardContent className="p-3 sm:p-4 responsive-p-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium responsive-text-xs" style={{ color: secondaryColor }}>Total Participants</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold stats-value responsive-text-xl" style={{ color: secondaryColor, opacity: 0.9 }}>{totalParticipants}</p>
            </div>
            <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" style={{ color: secondaryColor }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}