"use client"

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Calendar, Users, TrendingUp, Trophy } from "lucide-react"

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
      <Card className="stats-card dashboard-card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-3 sm:p-4 responsive-p-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-purple-600 responsive-text-xs">Completed Events</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900 stats-value responsive-text-xl">{completedEvents}</p>
            </div>
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Total Participants */}
      <Card className="stats-card dashboard-card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-3 sm:p-4 responsive-p-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-orange-600 responsive-text-xs">Total Participants</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900 stats-value responsive-text-xl">{totalParticipants}</p>
            </div>
            <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}