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
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Events */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Events</p>
              <p className="text-2xl font-bold text-blue-900">{totalEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Active Events */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Events</p>
              <p className="text-2xl font-bold text-green-900">{activeEvents}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Completed Events */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Completed Events</p>
              <p className="text-2xl font-bold text-purple-900">{completedEvents}</p>
            </div>
            <Trophy className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* Total Participants */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total Participants</p>
              <p className="text-2xl font-bold text-orange-900">{totalParticipants}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}