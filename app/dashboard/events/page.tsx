"use client"

// Events Management Page
import React, { useState, useMemo, useEffect } from "react"
import { useCurrency } from "@/contexts/currency-context"
import { useCustomColors } from "@/lib/use-custom-colors"
import type { Event, EventFilters } from '@/types/dashboard/events/event'
import { EventManagement, EventViewModal, EventFormModal } from "@/components/dashboard/events"
import EventHeroSection from "@/components/dashboard/events/EventHeroSection"
import EventStatisticsCards from "@/components/dashboard/events/EventStatisticsCards"
import { EventAnalytics } from "@/components/dashboard/events/event-analytics"
import EventSearchFilters from "@/components/dashboard/events/event-search-filters"
import EventColumnSelector, { type EventColumnId, allEventColumns, getEventColumnLabel } from "@/components/dashboard/events/EventColumnSelector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { LayoutDashboard, Calendar, TrendingUp, Zap, Trophy, Target, Send, Clock, Users, Plus, Search, MapPin, Grid, Grid3x3, List, Download, Upload, Eye, Edit2, Trash2, X, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, Check, BarChart3 } from "lucide-react"
import GridIcon from "@/components/dashboard/icons/grid"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { useToast } from "@/hooks/dashboard/use-toast"
import { fetchEvents } from "@/lib/dashboard/events/events-api"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"

// use shared Event and EventFilters from `types/event`

// Events will be fetched from MongoDB via API

// Helper function to calculate event status based on dates
function getEventStatus(startDate: string, endDate: string): "Upcoming" | "Ongoing" | "Completed" {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (now < start) return "Upcoming"
  if (now > end) return "Completed"
  return "Ongoing"
}

// Upcoming Events component - Card based view
function UpcomingEvents({ events, onDeleteEvent, onEditEvent }: { events: Event[]; onDeleteEvent?: (eventId: string) => void; onEditEvent?: () => void }) {
  const { toast } = useToast()
  const { primaryColor, secondaryColor } = useCustomColors()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<Partial<Event>>({})

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => getEventStatus(e.startDate, e.endDate) === "Upcoming")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [events])

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return
    
    try {
      const { deleteEvent } = await import("@/lib/dashboard/events/events-api")
      const response = await deleteEvent(eventId)
      
      if (response.success) {
        if (onDeleteEvent) onDeleteEvent(eventId)
        toast({
          title: "🗑️ Event Deleted",
          description: "Event has been successfully deleted.",
          duration: 3000,
        })
      } else {
        toast({
          title: "❌ Delete Failed",
          description: response.error || "Failed to delete event",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "❌ Error",
        description: "An error occurred while deleting the event.",
        duration: 3000,
      })
    }
  }

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowViewModal(true)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setFormData(event)
    setShowEditModal(true)
  }

  const handleSaveEvent = async () => {
    if (!editingEvent) return

    try {
      const { updateEvent } = await import("@/lib/dashboard/events/events-api")
      
      // Log the participants value being sent
      console.log("Updating event with participants:", formData.participants)
      
      const response = await updateEvent(editingEvent.id, formData)

      if (response.success) {
        console.log("Event update successful, new participants:", formData.participants)
        toast({
          title: "✅ Event Updated",
          description: "Event has been successfully updated.",
          duration: 3000,
        })
        setShowEditModal(false)
        setEditingEvent(null)
        setFormData({})
        // Refresh events to fetch updated data from backend including new participants
        if (onEditEvent) onEditEvent()
      } else {
        toast({
          title: "❌ Update Failed",
          description: response.error || "Failed to update event",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error updating event:', error)
      toast({
        title: "❌ Error",
        description: "An error occurred while updating the event.",
        duration: 3000,
      })
    }
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 dark:text-white mx-auto mb-4" />
        <p className="text-gray-600 dark:text-white text-lg">No upcoming events scheduled</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
          >
            {/* Header with Sport Badge */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{event.name}</h3>
                <Badge className="bg-blue-600 text-white">{event.sport}</Badge>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                {getEventStatus(event.startDate, event.endDate)}
              </Badge>
            </div>

            {/* Event Details Grid */}
            <div className="space-y-3 mb-4">
              {/* Date and Time */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">
                    {new Date(event.startDate).toLocaleDateString()} at {event.startTime}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white">to {new Date(event.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-700 dark:text-white">{event.venue}</p>
              </div>

              {/* Staff */}
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-700 dark:text-white">{event.staff}</p>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-700 dark:text-white">
                  {event.participants}/{event.maxParticipants} participants
                </p>
              </div>
            </div>

            {/* Type and Skill Level */}
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {event.type}
              </Badge>
              <Badge variant="outline" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}50` }}>
                {event.skillLevel}
              </Badge>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-700 dark:text-white mb-4 line-clamp-2">{event.description}</p>
            )}

            {/* Registration Deadline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 dark:text-white">Registration Deadline</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(event.registrationDeadline).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-blue-200">
              <button
                onClick={() => handleViewEvent(event)}
                className="flex-1 p-2 hover:bg-blue-200 rounded transition-colors text-sm text-blue-600 font-medium"
                title="View Details"
              >
                <Eye className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => handleEditEvent(event)}
                className="flex-1 p-2 hover:bg-amber-200 rounded transition-colors text-sm text-amber-600 font-medium"
                title="Edit"
              >
                <Edit2 className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                className="flex-1 p-2 hover:bg-red-200 rounded transition-colors text-sm text-red-600 font-medium"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <EventFormModal
          event={editingEvent}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveEvent}
          onClose={() => {
            setShowEditModal(false)
            setEditingEvent(null)
            setFormData({})
          }}
          coaches={[]}
          eventTypes={[]}
          sportsList={[]}
          skillLevels={[]}
          formats={[]}
        />
      )}
    </>
  )
}

// Dashboard component - Cards and Analytics only
function EventDashboard({ events, currency }: { events: Event[]; currency: string }) {
  const stats = {
    published: events.filter(e => e.isPublished).length,
    drafts: events.filter(e => !e.isPublished).length,
    upcoming: events.filter(e => getEventStatus(e.startDate, e.endDate) === "Upcoming").length,
    ongoing: events.filter(e => getEventStatus(e.startDate, e.endDate) === "Ongoing").length,
    completed: events.filter(e => getEventStatus(e.startDate, e.endDate) === "Completed").length,
    totalParticipants: events.reduce((sum, e) => sum + e.participants, 0),
    totalSports: new Set(events.map(e => e.sport)).size,
    // Calculate total revenue from completed events: entry fees × participants
    totalRevenue: events
      .filter(e => getEventStatus(e.startDate, e.endDate) === "Completed")
      .reduce((sum, e) => sum + ((e.entryFee || 0) * e.participants), 0),
  }

  // Calculate revenue by completed event (entry fees × participants)
  const revenueByEvent = events
    .filter(e => getEventStatus(e.startDate, e.endDate) === "Completed" && e.entryFee && e.entryFee > 0)
    .map(e => ({
      ...e,
      revenue: (e.entryFee || 0) * e.participants
    }))
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 5)

  // Log revenue calculations for debugging
  if (revenueByEvent.length > 0) {
    console.log("Dashboard revenue calculations:", revenueByEvent.map(e => ({
      name: e.name,
      entryFee: e.entryFee,
      participants: e.participants,
      calculatedRevenue: e.revenue
    })))
  }

  // Calculate events by month
  const eventsByMonth = useMemo(() => {
    const monthData: Record<string, number> = {}
    const now = new Date()
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      monthData[key] = 0
    }

    // Count events by month
    events.forEach(event => {
      const eventDate = new Date(event.startDate)
      const key = eventDate.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      if (monthData.hasOwnProperty(key)) {
        monthData[key]++
      }
    })

    return Object.entries(monthData).map(([month, count]) => ({
      month,
      events: count,
    }))
  }, [events])

  const topStatStyles = [
    { bg: "bg-gradient-to-br from-purple-50 to-purple-100", titleText: "text-purple-700", valueText: "text-purple-900" },
    { bg: "bg-gradient-to-br from-green-50 to-green-100", titleText: "text-green-700", valueText: "text-green-900" },
    { bg: "bg-gradient-to-br from-blue-50 to-blue-100", titleText: "text-blue-700", valueText: "text-blue-900" },
    { bg: "bg-gradient-to-br from-amber-50 to-amber-100", titleText: "text-amber-700", valueText: "text-amber-900" },
  ]

  const topStats = [
    {
      title: "Revenue Generated",
      value: `${currency} ${stats.totalRevenue.toLocaleString()}`,
      subtitle: "Generated",
    },
    { 
      title: "Ongoing Events", 
      value: stats.ongoing, 
      subtitle: "Active now" 
    },
    { 
      title: "Upcoming Events", 
      value: stats.upcoming, 
      subtitle: "Coming soon" 
    },
    { 
      title: "Completed Events", 
      value: stats.completed, 
      subtitle: "Finished" 
    },
  ]

  return (
    <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
      {/* Top Stats Cards - Similar to Parents Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {topStats.map((stat, index) => {
          const style = topStatStyles[index] ?? topStatStyles[0]
          return (
            <div key={index} className={`${style.bg} border rounded-xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-lg`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className={`text-xs sm:text-sm font-medium ${style.titleText} truncate`}>{stat.title}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${style.valueText} mt-1 sm:mt-2 break-words`}>{stat.value}</p>
                  <p className={`text-xs ${style.titleText} opacity-80 mt-0.5 sm:mt-1`}>{stat.subtitle}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue and Events Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue by Event - Bar Chart */}
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <span className="truncate">Revenue by Event</span>
          </h3>
          {revenueByEvent.length > 0 ? (
            <div className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByEvent} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    style={{ fontSize: '9px' }}
                    interval={0}
                    tick={{ fontSize: 9 }}
                    label={{ value: 'Events', position: 'insideBottom', offset: -10, style: { fontSize: '11px', fill: '#666' } }}
                  />
                  <YAxis 
                    tick={{ fontSize: 9 }}
                    width={50}
                    label={{ value: 'Revenue', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '11px', fill: '#666' } }}
                  />
                  <RechartsTooltip 
                    formatter={(value) => `${currency} ${(value as number).toLocaleString()}`}
                    labelStyle={{ color: '#000', fontSize: '11px' }}
                    contentStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 sm:h-80 flex items-center justify-center text-gray-500 dark:text-white">
              <p className="text-sm">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Events by Timeline - Line Chart */}
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">Events Timeline</span>
          </h3>
          {eventsByMonth.length > 0 ? (
            <div className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventsByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    style={{ fontSize: '9px' }}
                    tick={{ fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fontSize: '11px', fill: '#666' } }}
                  />
                  <YAxis 
                    tick={{ fontSize: 9 }}
                    width={50}
                    label={{ value: 'Events', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '11px', fill: '#666' } }}
                  />
                  <RechartsTooltip 
                    formatter={(value) => `${value} events`}
                    contentStyle={{ fontSize: '11px' }}
                    labelStyle={{ color: '#000', fontSize: '11px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="events" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 sm:h-80 flex items-center justify-center text-gray-500 dark:text-white">
              <p className="text-sm">No event data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { currency } = useCurrency();
  const { primaryColor, secondaryColor } = useCustomColors();
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Event>>({})
  const [filters, setFilters] = useState<EventFilters>({
    statuses: [],
    sports: [],
    eventTypes: [],
    skillLevels: [],
    formats: [],
    staffMembers: [],
    dateRange: { start: "", end: "" },
  })
  const [selectedOngoingIds, setSelectedOngoingIds] = useState<string[]>([])
  const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<string[]>([])
  const [selectedCompletedIds, setSelectedCompletedIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('startDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Column selector state
  const [visibleColumns, setVisibleColumns] = useState<EventColumnId[]>(['name', 'sport', 'startDate', 'venue', 'participants', 'status'])
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  // Load visible columns from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('eventDisplayedColumns')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setVisibleColumns(parsed)
      } catch {}
    }
  }, [])

  const handleSaveColumns = (columns: EventColumnId[]) => {
    setVisibleColumns(columns)
    localStorage.setItem('eventDisplayedColumns', JSON.stringify(columns))
  }

  // Load events from MongoDB API on component mount
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true)
      try {
        const response = await fetchEvents({ limit: 100 })
        if (response.success && response.data) {
          // Convert MongoDB documents to Event type
          const convertedEvents: Event[] = response.data.map((event: any) => ({
            id: event.eventId || event._id,
            name: event.name,
            sport: event.sport,
            type: event.type,
            description: event.description,
            startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : "",
            startTime: event.startTime || "09:00",
            endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : "",
            endTime: event.endTime || "18:00",
            registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : "",
            venue: event.venue,
            staff: event.staff,
            participants: event.participants || 0,
            maxParticipants: event.maxParticipants,
            skillLevel: event.skillLevel,
            format: event.format,
            ageGroup: event.ageGroup,
            equipment: event.equipment,
            entryFee: event.entryFee || 0,
            prizes: event.prizes,
            rules: event.rules,
            isPublished: event.isPublished,
            publishedDate: event.publishedDate ? new Date(event.publishedDate).toISOString().split('T')[0] : undefined,
            createdAt: event.createdAt ? new Date(event.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            revenue: event.revenue || 0,
            status: getEventStatus(event.startDate, event.endDate),
          }))
          setEvents(convertedEvents)
        } else {
          toast({
            title: "⚠️ Failed to Load Events",
            description: response.error || "Could not fetch events from the server.",
            duration: 3000,
          })
          setEvents([])
        }
      } catch (error) {
        console.error('Error loading events:', error)
        toast({
          title: "❌ Error",
          description: "An error occurred while loading events.",
          duration: 3000,
        })
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [toast])

  // Handle adding new event
  const handleAddEvent = (newEvent: Event) => {
    const eventWithStatus = { ...newEvent, status: getEventStatus(newEvent.startDate, newEvent.endDate) }
    setEvents([...events, eventWithStatus])
    setShowCreateEventModal(false)
  }

  // Page-level edit handler so EventManagement can delegate opening a central edit modal
  const onEditEvent = (event?: Event) => {
    if (!event) return
    setEditingEvent(event)
    setEditFormData(event)
    setShowEditModal(true)
  }

  // Save handler for the page-level edit modal
  const handleSaveEdit = async () => {
    if (!editingEvent) return
    try {
      const { updateEvent } = await import('@/lib/dashboard/events/events-api')
      const response = await updateEvent(editingEvent.id, editFormData)

      if (response.success) {
        const server = response.data || {}
        const updatedEvent: Event = {
          ...editingEvent,
          ...editFormData,
          id: server.eventId || server._id || editingEvent.id,
          name: server.name || editFormData.name || editingEvent.name,
          sport: server.sport || editFormData.sport || editingEvent.sport,
          type: server.type || editFormData.type || editingEvent.type,
          description: server.description ?? editFormData.description ?? editingEvent.description,
          startDate: server.startDate || editFormData.startDate || editingEvent.startDate,
          startTime: server.startTime || editFormData.startTime || editingEvent.startTime,
          endDate: server.endDate || editFormData.endDate || editingEvent.endDate,
          endTime: server.endTime || editFormData.endTime || editingEvent.endTime,
          registrationDeadline: server.registrationDeadline || editFormData.registrationDeadline || editingEvent.registrationDeadline,
          venue: server.venue || editFormData.venue || editingEvent.venue,
          staff: server.staff || editFormData.staff || editingEvent.staff,
          participants: server.participants ?? editFormData.participants ?? editingEvent.participants,
          maxParticipants: server.maxParticipants ?? editFormData.maxParticipants ?? editingEvent.maxParticipants,
          skillLevel: server.skillLevel || editFormData.skillLevel || editingEvent.skillLevel,
          format: server.format || editFormData.format || editingEvent.format,
          ageGroup: server.ageGroup || editFormData.ageGroup || editingEvent.ageGroup,
          equipment: server.equipment ?? editFormData.equipment ?? editingEvent.equipment,
          entryFee: server.entryFee ?? editFormData.entryFee ?? editingEvent.entryFee,
          prizes: server.prizes ?? editFormData.prizes ?? editingEvent.prizes,
          rules: server.rules ?? editFormData.rules ?? editingEvent.rules,
          isPublished: server.isPublished ?? editingEvent.isPublished,
          publishedDate: server.publishedDate ?? editingEvent.publishedDate,
          createdAt: server.createdAt || editingEvent.createdAt,
          revenue: server.revenue ?? editingEvent.revenue,
        }

        // Update local events array
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))

        // Notify toast and cleanup
        toast({ title: '✅ Event Updated', description: 'Event updated successfully.', duration: 3000 })
        setShowEditModal(false)
        setEditingEvent(null)
        setEditFormData({})
      } else {
        toast({ title: '❌ Update Failed', description: response.error || 'Failed to update event', duration: 3000 })
      }
    } catch (err) {
      console.error('Error updating event (page-level):', err)
      toast({ title: '❌ Error', description: 'An error occurred while updating the event.', duration: 3000 })
    }
  }

  // Handle deleting event
  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId))
  }

  // Handle updating event
  const handleUpdateEvent = (updatedEvent: Event) => {
    console.log('Page handleUpdateEvent called with:', updatedEvent)
    
    // Ensure dates are in correct format (YYYY-MM-DD)
    const formatDate = (dateValue: any) => {
      if (!dateValue) return dateValue
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return dateValue.split('T')[0]
      }
      return dateValue
    }
    
    const formattedEvent = {
      ...updatedEvent,
      startDate: formatDate(updatedEvent.startDate),
      endDate: formatDate(updatedEvent.endDate),
      registrationDeadline: formatDate(updatedEvent.registrationDeadline),
      createdAt: formatDate(updatedEvent.createdAt),
      publishedDate: updatedEvent.publishedDate ? formatDate(updatedEvent.publishedDate) : undefined,
      status: getEventStatus(updatedEvent.startDate, updatedEvent.endDate),
    }
    
    console.log('Formatted event for page state:', formattedEvent)
    setEvents(events.map(e => e.id === formattedEvent.id ? formattedEvent : e))
  }

  // Refresh events from database
  const refreshEvents = async () => {
    setIsLoading(true)
    try {
      const response = await fetchEvents({ limit: 100 })
      if (response.success && response.data) {
        console.log("Events refreshed from backend, count:", response.data.length)
        const convertedEvents: Event[] = response.data.map((event: any) => ({
          id: event.eventId || event._id,
          name: event.name,
          sport: event.sport,
          type: event.type,
          description: event.description,
          startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : "",
          startTime: event.startTime || "09:00",
          endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : "",
          endTime: event.endTime || "18:00",
          registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : "",
          venue: event.venue,
          staff: event.staff,
          participants: event.participants || 0,
          maxParticipants: event.maxParticipants,
          skillLevel: event.skillLevel,
          format: event.format,
          ageGroup: event.ageGroup,
          equipment: event.equipment,
          entryFee: event.entryFee || 0,
          prizes: event.prizes,
          rules: event.rules,
          isPublished: event.isPublished,
          publishedDate: event.publishedDate ? new Date(event.publishedDate).toISOString().split('T')[0] : undefined,
          createdAt: event.createdAt ? new Date(event.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          revenue: event.revenue || 0,
          status: getEventStatus(event.startDate, event.endDate),
        }))
        console.log("Converted events with participants:", convertedEvents.map(e => ({ name: e.name, participants: e.participants })))
        setEvents(convertedEvents)
      }
    } catch (error) {
      console.error('Error refreshing events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-white">Loading events...</p>
          </div>
        </div>
      ) : (
        <>
          <EventHeroSection 
            onCreateEvent={() => setShowCreateEventModal(true)}
          />

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="pb-2">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent p-0 h-auto w-full">
                {/* Analytics tab */}
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: activeTab === "dashboard" ? primaryColor : "transparent",
                    borderColor: activeTab === "dashboard" ? primaryColor : secondaryColor,
                    color: activeTab === "dashboard" ? "white" : secondaryColor
                  }}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Analytics</span>
                </TabsTrigger>

                {/* Ongoing Events tab */}
                <TabsTrigger 
                  value="events" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: activeTab === "events" ? primaryColor : "transparent",
                    borderColor: activeTab === "events" ? primaryColor : secondaryColor,
                    color: activeTab === "events" ? "white" : secondaryColor
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Ongoing</span>
                </TabsTrigger>
                {/* Upcoming Events tab */}
                <TabsTrigger 
                  value="upcoming" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: activeTab === "upcoming" ? primaryColor : "transparent",
                    borderColor: activeTab === "upcoming" ? primaryColor : secondaryColor,
                    color: activeTab === "upcoming" ? "white" : secondaryColor
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Upcoming</span>
                </TabsTrigger>

                {/* Completed Events tab */}
                <TabsTrigger 
                  value="completed" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: activeTab === "completed" ? primaryColor : "transparent",
                    borderColor: activeTab === "completed" ? primaryColor : secondaryColor,
                    color: activeTab === "completed" ? "white" : secondaryColor
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Completed</span>
                </TabsTrigger>
            </TabsList>
            </div>

          {/* Analytics Tab Content */}
          <TabsContent value="dashboard" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            {/* Event Analytics */}
            <div className="bg-card rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 md:p-6 animate-fade-in border">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-600 dark:text-white">Loading events...</p>
                  </div>
                </div>
              ) : (
                <EventDashboard events={events} currency={currency} />
              )}
            </div>
          </TabsContent>

          {/* All Events Tab - List with Filters */}
          <TabsContent value="events">
                  <div className="bg-card rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 md:p-6 animate-fade-in border">
                    {/* Top Controls Bar (sticky) */}
                    <div className="sticky top-0 z-20 bg-card pt-0 pb-3 sm:pb-4">
                      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                      {/* Title */}
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Ongoing Events</h2>
                      </div>
      
                      {/* Controls Row: Search, Filters, Import/Export, View Toggle, Add Button */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
                          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-white" />
                          <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
      
                        {/* Filter Button */}
                        <EventSearchFilters
                          events={events}
                          onFiltersChange={setFilters}
                          onApply={setFilters}
                        />
      
                        {/* Import Button - Hide on small mobile */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 hidden md:flex"
                          title="Import events from CSV"
                        >
                          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Import</span>
                        </Button>
      
                        {/* Export Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          title={selectedOngoingIds.length ? `Export ${selectedOngoingIds.length} selected` : 'Export events to CSV'}
                          onClick={() => window.dispatchEvent(new CustomEvent('events-export'))}
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{selectedOngoingIds.length ? `Export (${selectedOngoingIds.length})` : 'Export'}</span>
                        </Button>
      
                        {/* Sort Dropdown */}
                        <DropdownMenu>
                          <TooltipProvider>
                            <Tooltip>
                              <DropdownMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 sm:h-9 flex items-center gap-1">
                                    <span className="text-xs flex items-center gap-0.5 sm:gap-1">
                                      <ArrowUpDown className="h-3 w-3" />
                                      <span className="hidden sm:inline">
                                        {sortBy === "name" && "Name"}
                                        {sortBy === "startDate" && "Date"}
                                      </span>
                                      {sortOrder === "asc" ? (
                                        <ArrowUp className="h-3 w-3" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3" />
                                      )}
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                              </DropdownMenuTrigger>
                              <TooltipContent side="bottom">Sort</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            {[
                              { value: "name", label: "Name" },
                              { value: "startDate", label: "Date" },
                            ].map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => setSortBy(option.value)}
                                className={sortBy === option.value ? "bg-purple-50" : ""}
                              >
                                <span>{option.label}</span>
                                {sortBy === option.value && (
                                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Order</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSortOrder("asc")}
                              className={sortOrder === "asc" ? "bg-purple-50" : ""}
                            >
                              <span className="flex items-center gap-2">
                                Ascending
                                <ArrowUp className="h-4 w-4" />
                              </span>
                              {sortOrder === "asc" && (
                                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortOrder("desc")}
                              className={sortOrder === "desc" ? "bg-purple-50" : ""}
                            >
                              <span className="flex items-center gap-2">
                                Descending
                                <ArrowDown className="h-4 w-4" />
                              </span>
                              {sortOrder === "desc" && (
                                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
      
                        {/* View Mode Toggle */}
                        <div className="flex border border-purple-300 rounded-md">
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-r-none h-8 sm:h-9 px-2 sm:px-3 ${
                              viewMode === 'list' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'hover:bg-purple-50'
                            }`}
                            title="List View"
                            aria-label="List View"
                          >
                            <div className="flex flex-col gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <div className="bg-current h-0.5 rounded-sm" />
                              <div className="bg-current h-0.5 rounded-sm" />
                              <div className="bg-current h-0.5 rounded-sm" />
                            </div>
                          </Button>
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-l-none border-l h-8 sm:h-9 px-2 sm:px-3 ${
                              viewMode === 'grid' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'hover:bg-purple-50'
                            }`}
                            title="Grid View"
                            aria-label="Grid View"
                          >
                            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                            </div>
                          </Button>
                        </div>
      
                        {/* Add Button */}
                        <Button 
                          size="sm" 
                          title="Create Event" 
                          onClick={() => setShowCreateEventModal(true)}
                          className="h-8 sm:h-9 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-4"
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Create Event</span>
                        </Button>
                      </div>
      
                      {/* Results Summary with Column Selector */}
                      <div className="flex items-center justify-between px-0.5 sm:px-1 py-1.5 sm:py-2">
                        <span className="text-xs text-gray-600 dark:text-white">
                          {events.filter(e => e.status === 'Ongoing').length} events
                        </span>
                        <button
                          className="ml-4 w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm hover:shadow transition-colors"
                          style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                          onClick={() => setShowColumnSelector(true)}
                          title="Displayed Columns"
                          aria-label="Edit displayed event columns"
                        >
                          <GridIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
      
                  {/* Event Management Component */}
                  <EventManagement 
                      events={events}
                      onAddEvent={handleAddEvent}
                      onDeleteEvent={handleDeleteEvent}
                      onUpdateEvent={handleUpdateEvent}
                      onEditEvent={onEditEvent}
                      searchTerm={searchTerm} 
                      viewMode={viewMode}
                      showCreateModal={showCreateEventModal}
                      onCreateModalChange={setShowCreateEventModal}
                      filters={{ ...filters, statuses: ['Ongoing'] }}
                      onSelectedIdsChange={setSelectedOngoingIds}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      visibleColumns={visibleColumns}
                    />
                  </div>
                </TabsContent>
                {/* Upcoming Events Tab */}
                <TabsContent value="upcoming">
                  <div className="bg-card rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 md:p-6 animate-fade-in border">
                      {/* Top Controls Bar (sticky) */}
                      <div className="sticky top-0 z-20 bg-card pt-0 pb-3 sm:pb-4">
                        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                      {/* Title */}
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                      </div>
      
                      {/* Controls Row: Search, Filters, Import/Export, View Toggle, Add Button */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
                          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-white" />
                          <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
      
                        {/* Filter Button */}
                        <EventSearchFilters
                          events={events}
                          onFiltersChange={setFilters}
                          onApply={setFilters}
                        />
      
                        {/* Import Button - Hide on small mobile */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 hidden md:flex"
                          title="Import events from CSV"
                        >
                          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Import</span>
                        </Button>
      
                        {/* Export Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          title={selectedUpcomingIds.length ? `Export ${selectedUpcomingIds.length} selected` : 'Export events to CSV'}
                          onClick={() => window.dispatchEvent(new CustomEvent('events-export'))}
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{selectedUpcomingIds.length ? `Export (${selectedUpcomingIds.length})` : 'Export'}</span>
                        </Button>
      
                        {/* Sort Dropdown */}
                        <DropdownMenu>
                          <TooltipProvider>
                            <Tooltip>
                              <DropdownMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-9 flex items-center gap-1">
                                    <span className="text-xs flex items-center gap-1">
                                      <ArrowUpDown className="h-3 w-3" />
                                      {sortBy === "name" && "Name"}
                                      {sortBy === "startDate" && "Date"}
                                      {sortOrder === "asc" ? (
                                        <ArrowUp className="h-3 w-3" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3" />
                                      )}
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                              </DropdownMenuTrigger>
                              <TooltipContent side="bottom">Sort</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            {[
                              { value: "name", label: "Name" },
                              { value: "startDate", label: "Date" },
                            ].map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => setSortBy(option.value)}
                                className={sortBy === option.value ? "bg-purple-50" : ""}
                              >
                                <span>{option.label}</span>
                                {sortBy === option.value && (
                                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Order</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSortOrder("asc")}
                              className={sortOrder === "asc" ? "bg-purple-50" : ""}
                            >
                              <span className="flex items-center gap-2">
                                Ascending
                                <ArrowUp className="h-4 w-4" />
                              </span>
                              {sortOrder === "asc" && (
                                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortOrder("desc")}
                              className={sortOrder === "desc" ? "bg-purple-50" : ""}
                            >
                              <span className="flex items-center gap-2">
                                Descending
                                <ArrowDown className="h-4 w-4" />
                              </span>
                              {sortOrder === "desc" && (
                                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
      
                        {/* View Mode Toggle */}
                        <div className="flex border border-purple-300 rounded-md">
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-r-none h-8 sm:h-9 px-2 sm:px-3 ${
                              viewMode === 'list' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'hover:bg-purple-50'
                            }`}
                            title="List View"
                            aria-label="List View"
                          >
                            <div className="flex flex-col gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <div className="bg-current h-0.5 rounded-sm" />
                              <div className="bg-current h-0.5 rounded-sm" />
                              <div className="bg-current h-0.5 rounded-sm" />
                            </div>
                          </Button>
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-l-none border-l h-8 sm:h-9 px-2 sm:px-3 ${
                              viewMode === 'grid' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'hover:bg-purple-50'
                            }`}
                            title="Grid View"
                            aria-label="Grid View"
                          >
                            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                            </div>
                          </Button>
                        </div>
      
                        {/* Add Button */}
                        <Button 
                          size="sm" 
                          title="Create Event" 
                          onClick={() => setShowCreateEventModal(true)}
                          className="h-8 sm:h-9 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-4"
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Create Event</span>
                        </Button>
                      </div>
      
                      {/* Results Summary with Column Selector */}
                      <div className="flex items-center justify-between px-0.5 sm:px-1 py-1.5 sm:py-2">
                        <span className="text-xs text-gray-600 dark:text-white">
                          {events.filter(e => e.status === 'Upcoming').length} events
                        </span>
                        <button
                          className="ml-4 w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm hover:shadow transition-colors"
                          style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                          onClick={() => setShowColumnSelector(true)}
                          title="Displayed Columns"
                          aria-label="Edit displayed event columns"
                        >
                          <GridIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
      
                    {/* Event Management Component */}
                    <EventManagement 
                      events={events}
                      onAddEvent={handleAddEvent}
                      onDeleteEvent={handleDeleteEvent}
                      onUpdateEvent={handleUpdateEvent}
                      onEditEvent={onEditEvent}
                      searchTerm={searchTerm}
                      viewMode={viewMode}
                      showCreateModal={showCreateEventModal}
                      onCreateModalChange={setShowCreateEventModal}
                      filters={{ ...filters, statuses: ['Upcoming'] }}
                      onSelectedIdsChange={setSelectedUpcomingIds}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      visibleColumns={visibleColumns}
                    />
                  </div>
                </TabsContent>
      
                {/* Completed Events Tab */}
                <TabsContent value="completed">
                  <div className="bg-card rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 md:p-6 animate-fade-in border">
                      {/* Top Controls Bar (sticky) */}
                      <div className="sticky top-0 z-20 bg-card pt-0 pb-3 sm:pb-4">
                        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                      {/* Title */}
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Completed Events</h2>
                      </div>
      
                      {/* Controls Row: Search, Filters, Import/Export, View Toggle, Add Button */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
                          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-white" />
                          <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
      
                        {/* Filter Button */}
                        <EventSearchFilters
                          events={events}
                          onFiltersChange={setFilters}
                          onApply={setFilters}
                        />
      
                        {/* Import Button - Hide on small mobile */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 hidden md:flex"
                          title="Import events from CSV"
                        >
                          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Import</span>
                        </Button>
      
                        {/* Export Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          title={selectedCompletedIds.length ? `Export ${selectedCompletedIds.length} selected` : 'Export events to CSV'}
                          onClick={() => window.dispatchEvent(new CustomEvent('events-export'))}
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{selectedCompletedIds.length ? `Export (${selectedCompletedIds.length})` : 'Export'}</span>
                        </Button>
      
                        {/* Sort Dropdown */}
                        <DropdownMenu>
                          <TooltipProvider>
                            <Tooltip>
                              <DropdownMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-9 flex items-center gap-1">
                                    <span className="text-xs flex items-center gap-1">
                                      <ArrowUpDown className="h-3 w-3" />
                                      {sortBy === "name" && "Name"}
                                      {sortBy === "startDate" && "Date"}
                                      {sortOrder === "asc" ? (
                                        <ArrowUp className="h-3 w-3" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3" />
                                      )}
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                              </DropdownMenuTrigger>
                              <TooltipContent side="bottom">Sort</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            {[
                              { value: "name", label: "Name" },
                              { value: "startDate", label: "Date" },
                            ].map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => setSortBy(option.value)}
                                className={sortBy === option.value ? "bg-purple-50" : ""}
                              >
                                <span>{option.label}</span>
                                {sortBy === option.value && (
                                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Order</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSortOrder("asc")}
                              className={sortOrder === "asc" ? "bg-purple-50" : ""}
                            >
                              <span className="flex items-center gap-2">
                                Ascending
                                <ArrowUp className="h-4 w-4" />
                              </span>
                              {sortOrder === "asc" && (
                                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortOrder("desc")}
                              className={sortOrder === "desc" ? "bg-purple-50" : ""}
                            >
                              <span className="flex items-center gap-2">
                                Descending
                                <ArrowDown className="h-4 w-4" />
                              </span>
                              {sortOrder === "desc" && (
                                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
      
                        {/* View Mode Toggle */}
                        <div className="flex border border-purple-300 rounded-md">
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-r-none h-8 sm:h-9 px-2 sm:px-3 ${
                              viewMode === 'list' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'hover:bg-purple-50'
                            }`}
                            title="List View"
                            aria-label="List View"
                          >
                            <div className="flex flex-col gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <div className="bg-current h-0.5 rounded-sm" />
                              <div className="bg-current h-0.5 rounded-sm" />
                              <div className="bg-current h-0.5 rounded-sm" />
                            </div>
                          </Button>
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-l-none border-l h-8 sm:h-9 px-2 sm:px-3 ${
                              viewMode === 'grid' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'hover:bg-purple-50'
                            }`}
                            title="Grid View"
                            aria-label="Grid View"
                          >
                            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                              <div className="bg-current rounded-sm" />
                            </div>
                          </Button>
                        </div>
      
                        {/* Add Button */}
                        <Button 
                          size="sm" 
                          title="Create Event" 
                          onClick={() => setShowCreateEventModal(true)}
                          className="h-8 sm:h-9 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-4"
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Create Event</span>
                        </Button>
                      </div>
      
                     
      
                      {/* Results Summary with Column Selector */}
                      <div className="flex items-center justify-between px-0.5 sm:px-1 py-1.5 sm:py-2">
                        <span className="text-xs text-gray-600 dark:text-white">
                          {events.filter(e => e.status === 'Completed').length} events
                        </span>
                        <button
                          className="ml-4 w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm hover:shadow transition-colors"
                          style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                          onClick={() => setShowColumnSelector(true)}
                          title="Displayed Columns"
                          aria-label="Edit displayed event columns"
                        >
                          <GridIcon className="w-6 h-6" />
                        </button>
                      </div>
                      </div>
                    </div>
      
                    {/* Event Management Component */}
                    <EventManagement 
                      events={events}
                      onAddEvent={handleAddEvent}
                      onDeleteEvent={handleDeleteEvent}
                      onUpdateEvent={handleUpdateEvent}
                      onEditEvent={onEditEvent}
                      searchTerm={searchTerm}
                      viewMode={viewMode}
                      showCreateModal={showCreateEventModal}
                      onCreateModalChange={setShowCreateEventModal}
                      filters={{ ...filters, statuses: ['Completed'] }}
                      onSelectedIdsChange={setSelectedCompletedIds}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      visibleColumns={visibleColumns}
                    />
                  </div>
                </TabsContent>
          </Tabs>

          {/* Column Selector Modal */}
          <EventColumnSelector
            show={showColumnSelector}
            onClose={() => setShowColumnSelector(false)}
            visibleColumns={visibleColumns}
            onSave={handleSaveColumns}
          />

          {showEditModal && editingEvent && (
            <EventFormModal
              event={editingEvent}
              formData={editFormData}
              setFormData={setEditFormData}
              onSave={handleSaveEdit}
              onClose={() => {
                setShowEditModal(false)
                setEditingEvent(null)
                setEditFormData({})
              }}
              coaches={[]}
              eventTypes={[]}
              sportsList={[]}
              skillLevels={[]}
              formats={[]}
            />
          )}
        </>
      )}
    </div>
  )
}