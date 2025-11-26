"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useCustomColors } from '@/lib/use-custom-colors'
import { useCurrency } from "@/contexts/currency-context"
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Edit2, 
  Trash2, 
  Eye,
  X,
  Bell,
  TrendingUp,
  Clock,
  Trophy,
  Target,
  Zap,
  Send
} from "lucide-react"
import { Badge } from "@/components/dashboard/ui/badge"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/dashboard/ui/dialog"
import { useToast } from "@/hooks/dashboard/use-toast"
import { createEvent, updateEvent, deleteEvent, fetchEvents, updateParticipants } from "@/lib/dashboard/events/events-api"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { format } from "date-fns"
import { fetchCourses, Course } from "@/data/dashboard/courses"

import type { Event } from '@/types/dashboard/events/event'
import type { EventColumnId } from './EventColumnSelector'

type EventManagementProps = {
  events?: Event[]
  onAddEvent?: (event: Event) => void
  onDeleteEvent?: (eventId: string) => void
  onUpdateEvent?: (event: Event) => void
  onEditEvent?: (event: Event) => void
  excludeUpcoming?: boolean
  searchTerm?: string
  viewMode?: 'list' | 'grid'
  onCreateClick?: () => void
  showCreateModal?: boolean
  onCreateModalChange?: (show: boolean) => void
  filters?: { statuses: string[]; sports: string[]; eventTypes: string[]; skillLevels: string[]; formats: string[]; staffMembers: string[]; dateRange: { start: string; end: string } }
  onSelectedIdsChange?: (ids: string[]) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  visibleColumns?: EventColumnId[]
}
import ColumnSelectorModal from '@/contexts/dashboard/ColumnSelectorModal'

// Static data removed - events are now fetched from MongoDB via API
// Initialize with empty array; events will be loaded via fetchEvents() on component mount

const sportsList = ["Cricket", "Tennis", "Badminton", "Volleyball", "Basketball", "Kabaddi", "Chess", "Swimming", "Athletics", "Football", "Hockey", "Gymnastics"]
const artsList = ["Painting", "Sculpture", "Music", "Dance", "Drama", "Photography", "Literature", "Crafts"]
const categoryList = [...sportsList, ...artsList]
const eventTypes = ["Tournament", "Workshop", "Coaching Session", "Friendly Match", "Training Camp", "Championship", "Seminar", "Tryout"]
const skillLevels = ["Beginner", "Intermediate", "Advanced", "All Levels"]
const formats = ["Individual", "Team", "Mixed"]
const mockStaff = ["Ravi Kumar", "Priya Sharma", "Arjun Singh", "Sneha Patel", "Vikram Desai", "Ananya Nair"]

// Helper function to calculate event status based on dates
function getEventStatus(startDate: string, endDate: string): "Upcoming" | "Ongoing" | "Completed" {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (now < start) return "Upcoming"
  if (now > end) return "Completed"
  return "Ongoing"
}

export const EventManagement: React.FC<EventManagementProps> = (props) => {
  const { primaryColor, secondaryColor } = useCustomColors();
  const { currency } = useCurrency();
  const {
    events: externalEvents,
    onAddEvent,
    onDeleteEvent,
    onUpdateEvent,
    onEditEvent,
    excludeUpcoming = false,
    searchTerm = "",
    viewMode = "list",
    onCreateClick,
    showCreateModal = false,
    onCreateModalChange,
    filters = { statuses: [], sports: [], eventTypes: [], skillLevels: [], formats: [], staffMembers: [], dateRange: { start: "", end: "" } },
    onSelectedIdsChange,
    sortBy = 'startDate',
    sortOrder = 'desc',
    visibleColumns = ['name', 'sport', 'type', 'startDate', 'venue', 'participants', 'status'],
  } = props
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>(externalEvents || [])
  const [isLoading, setIsLoading] = useState(!externalEvents)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<"All" | "Upcoming" | "Ongoing" | "Completed">("All")
  const [sportFilter, setSportFilter] = useState<"All" | Event["sport"]>("All")
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const allColumns = [
    'Event Name',
    'Sport',
    'Type',
    'Staff',
    'Dates',
    'Participants',
    'Status',
    'Actions',
  ]
  const defaultDisplayed = ['Event Name','Sport','Type','Staff','Dates','Participants','Status','Actions']
  const [displayedColumns, setDisplayedColumns] = useState<string[]>(defaultDisplayed)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<Partial<Event>>({})

  // Sync external events with internal state whenever parent events change
  useEffect(() => {
    if (externalEvents && externalEvents.length > 0) {
      setEvents(externalEvents)
    }
  }, [externalEvents])

  // Load events from API on component mount (only if externalEvents not provided)
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true)
      try {
        const response = await fetchEvents({ limit: 100 })
        if (response.success && response.data) {
          setEvents(response.data)
        } else {
          toast({
            title: "? Failed to Load Events",
            description: response.error || "Could not fetch events from the server.",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('Failed to load events:', error)
        toast({
          title: "? Failed to Load Events",
          description: "An error occurred while fetching events.",
          duration: 3000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!externalEvents) {
      loadEvents()
    } else {
      setEvents(externalEvents)
      setIsLoading(false)
    }
  }, [externalEvents, toast])

  // Sync parent's showCreateModal state with internal showAddModal
  React.useEffect(() => {
    if (showCreateModal) {
      setFormData({
        isPublished: false,
        createdAt: new Date().toISOString().split('T')[0],
        participants: 0,
      })
      setEditingEvent(null)
      setShowAddModal(true)
    } else {
      setShowAddModal(false)
    }
  }, [showCreateModal])

  // Notify parent when selectedIds change
  React.useEffect(() => {
    if (onSelectedIdsChange) {
      onSelectedIdsChange(selectedIds)
    }
  }, [selectedIds, onSelectedIdsChange])

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const matchesSearch = 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.staff.toLowerCase().includes(searchTerm.toLowerCase())
      
      const eventStatus = getEventStatus(event.startDate, event.endDate)
      const matchesStatus = statusFilter === "All" || eventStatus === statusFilter
      const matchesSport = sportFilter === "All" || event.sport === sportFilter
      
      // Exclude upcoming events if requested (for All Events tab)
      const isNotUpcoming = !excludeUpcoming || eventStatus !== "Upcoming"

      // Apply filter criteria from the filter popover
      const matchesFilterStatus = filters.statuses.length === 0 || filters.statuses.includes(eventStatus)
      const matchesFilterSport = filters.sports.length === 0 || filters.sports.includes(event.sport)
      const matchesFilterEventType = filters.eventTypes.length === 0 || filters.eventTypes.includes(event.type || '')
      const matchesFilterSkillLevel = filters.skillLevels.length === 0 || filters.skillLevels.includes(event.skillLevel)
      const matchesFilterFormat = filters.formats.length === 0 || filters.formats.includes(event.format)
      const matchesFilterStaff = filters.staffMembers.length === 0 || filters.staffMembers.includes(event.staff)
      
      // Apply date range filter
      const matchesDateRange = 
        (!filters.dateRange.start || new Date(event.startDate) >= new Date(filters.dateRange.start)) &&
        (!filters.dateRange.end || new Date(event.endDate) <= new Date(filters.dateRange.end))
      
      return matchesSearch && matchesStatus && matchesSport && isNotUpcoming && 
             matchesFilterStatus && matchesFilterSport && matchesFilterEventType && 
             matchesFilterSkillLevel && matchesFilterFormat && matchesFilterStaff && 
             matchesDateRange
    })

    // Apply sorting
    return filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'startDate':
          aVal = new Date(a.startDate).getTime()
          bVal = new Date(b.startDate).getTime()
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [events, searchTerm, statusFilter, sportFilter, excludeUpcoming, filters, sortBy, sortOrder])

  // Selection helpers similar to Parents management
  const allVisibleIds = useMemo(() => filteredEvents.map(e => e.id), [filteredEvents])
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? allVisibleIds : [])
  }

  // CSV Export helpers
  function toCSV(rows: Event[]) {
    const columns: { header: string; getter: (p: Event) => any }[] = [
      { header: 'Event ID', getter: p => p.id },
      { header: 'Name', getter: p => p.name },
      { header: 'Sport', getter: p => p.sport },
      { header: 'Type', getter: p => p.type },
      { header: 'Start Date', getter: p => p.startDate },
      { header: 'End Date', getter: p => p.endDate },
      { header: 'Start Time', getter: p => p.startTime },
      { header: 'End Time', getter: p => p.endTime },
      { header: 'Venue', getter: p => p.venue },
      { header: 'Staff', getter: p => p.staff },
      { header: 'Participants', getter: p => p.participants },
      { header: 'Max Participants', getter: p => p.maxParticipants },
      { header: 'Skill Level', getter: p => p.skillLevel },
      { header: 'Format', getter: p => p.format },
      { header: 'Status', getter: p => getEventStatus(p.startDate, p.endDate) },
      { header: 'Entry Fee', getter: p => p.entryFee },
      { header: 'Prizes', getter: p => p.prizes },
      { header: 'Created At', getter: p => p.createdAt },
    ]

    const esc = (v: any) => {
      const s = v == null ? '' : String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const headerLine = columns.map(c => esc(c.header)).join(',')
    const lines = [headerLine]
    rows.forEach(p => {
      lines.push(columns.map(c => esc(c.getter(p))).join(','))
    })
    return lines.join('\n')
  }

  function download(filename: string, content: string, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    const csv = toCSV(filteredEvents)
    download(`events-all-${format(new Date(), 'dd-MMM-yyyy')}.csv`, csv)
    toast({
      title: "? Export completed",
      description: `Exported ${filteredEvents.length} event(s) successfully.`,
      duration: 3000,
    })
  }

  const handleExportSelected = () => {
    if (!selectedIds?.length) {
      handleExportAll()
      return
    }
    const byId = new Map(filteredEvents.map(e => [e.id, e] as const))
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as Event[]
    const csv = toCSV(rows)
    download(`events-selected-${format(new Date(), 'dd-MMM-yyyy')}.csv`, csv)
    toast({
      title: "? Export completed",
      description: `Exported ${rows.length} selected event(s) successfully.`,
      duration: 3000,
    })
  }

  // Listen for parent-triggered export event (dispatched by Events page)
  useEffect(() => {
    const handler = () => {
      // prefer exporting selected if any
      if (selectedIds.length) handleExportSelected()
      else handleExportAll()
    }
    window.addEventListener('events-export', handler)
    return () => window.removeEventListener('events-export', handler)
  }, [selectedIds, filteredEvents])

  // Load persisted displayed columns from localStorage on mount
  useEffect(() => {
    try {
      const key = 'eventsDisplayedColumns'
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setDisplayedColumns(parsed)
      }
    } catch (err) {
      // ignore
    }
  }, [])

  // Persist displayed columns when changed
  useEffect(() => {
    try {
      const key = 'eventsDisplayedColumns'
      localStorage.setItem(key, JSON.stringify(displayedColumns))
    } catch (err) {
      // ignore
    }
  }, [displayedColumns])

  // Summary statistics
  const stats = {
    published: events.filter(e => e.isPublished).length,
    drafts: events.filter(e => !e.isPublished).length,
    ongoing: events.filter(e => getEventStatus(e.startDate, e.endDate) === "Ongoing").length,
    completed: events.filter(e => getEventStatus(e.startDate, e.endDate) === "Completed").length,
    totalParticipants: events.reduce((sum, e) => sum + e.participants, 0),
    totalSports: new Set(events.map(e => e.sport)).size,
  }

  const handleAddEvent = () => {
    setFormData({
      isPublished: false,
      createdAt: new Date().toISOString().split('T')[0],
      participants: 0,
    })
    setEditingEvent(null)
    setShowAddModal(true)
  }

  const handleEditEvent = (event: Event) => {
    // If parent provided an edit handler (page-level edit modal), delegate to it
    if (onEditEvent) {
      onEditEvent(event)
      return
    }

    setFormData(event)
    setEditingEvent(event)
    setShowAddModal(true)
  }

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowViewModal(true)
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      console.log('=== HANDLE DELETE START ===');
      console.log('Deleting event with ID:', id);
      
      const response = await deleteEvent(id)
      console.log('Delete response received:', response);
      
      if (response.success) {
        console.log('Delete was successful, updating UI');
        const updatedEvents = events.filter(e => e.id !== id)
        setEvents(updatedEvents)
        console.log('UI updated, remaining events:', updatedEvents.length);
        
        // Call parent callback to sync parent state
        if (onDeleteEvent) {
          console.log('Calling onDeleteEvent callback');
          onDeleteEvent(id)
        }
        
        toast({
          title: "??? Event Deleted",
          description: "Event has been successfully deleted from the database.",
          duration: 3000,
        })
        console.log('=== HANDLE DELETE END (SUCCESS) ===');
      } else {
        console.error('Delete failed with error:', response.error);
        toast({
          title: "? Delete Failed",
          description: response.error || "Failed to delete event",
          duration: 3000,
        })
        console.log('=== HANDLE DELETE END (FAILED) ===');
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "? Delete Error",
        description: "An error occurred while deleting the event.",
        duration: 3000,
      })
      console.log('=== HANDLE DELETE END (EXCEPTION) ===');
    }
  }

  // Delete confirmation dialog state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const openDeleteDialog = (id: string) => {
    setPendingDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    setIsDeleting(pendingDeleteId)
    try {
      await handleDeleteEvent(pendingDeleteId)
    } finally {
      setIsDeleting(null)
      setPendingDeleteId(null)
      setShowDeleteDialog(false)
    }
  }

  // Increment / decrement participants using API helper
  const changeParticipants = async (eventId: string, action: 'inc' | 'dec', amount = 1) => {
    try {
      const response = await updateParticipants(eventId, action, amount)
      if (response.success && response.data) {
        const updatedEvent = response.data
        setEvents(prev => prev.map(e => (e.id === updatedEvent.eventId || e.id === updatedEvent._id) ? ({ ...e, participants: updatedEvent.participants }) : e))
        if (onUpdateEvent) onUpdateEvent(updatedEvent)
      } else {
        toast({ title: '? Update Failed', description: response.error || 'Failed to update participants', duration: 3000 })
      }
    } catch (err) {
      console.error('Error changing participants:', err)
      toast({ title: '? Error', description: 'Could not change participants', duration: 3000 })
    }
  }

  const handleSaveEvent = async (updatedFormData?: Partial<Event>) => {
    // Use the passed formData or fall back to component state
    const dataToSave = updatedFormData || formData
    
    console.log('=== handleSaveEvent called ===')
    console.log('updatedFormData:', updatedFormData)
    console.log('component formData:', formData)
    console.log('dataToSave:', dataToSave)
    console.log('editingEvent:', editingEvent)
    
    if (editingEvent) {
      // Update existing event
      try {
        console.log('Calling updateEvent API with:', { id: editingEvent.id, data: dataToSave })
        const response = await updateEvent(editingEvent.id, dataToSave)
        console.log('Update response:', response)
        if (response.success) {
          // Prefer server-returned updated data when available
          const serverData = response.data || {}
          
          // Convert server Date objects to date strings (YYYY-MM-DD format)
          const formatDate = (dateValue: any) => {
            if (!dateValue) return dateValue
            if (typeof dateValue === 'string' && dateValue.includes('T')) {
              // ISO string from server
              return dateValue.split('T')[0]
            }
            return dateValue
          }
          
          const updatedEvent: Event = {
            ...editingEvent,
            ...dataToSave,
            id: serverData.eventId || serverData._id || editingEvent.id,
            name: serverData.name || dataToSave.name || editingEvent.name,
            sport: serverData.sport || dataToSave.sport || editingEvent.sport,
            type: serverData.type || dataToSave.type || editingEvent.type,
            description: serverData.description ?? dataToSave.description ?? editingEvent.description,
            startDate: formatDate(serverData.startDate) || dataToSave.startDate || editingEvent.startDate,
            startTime: serverData.startTime || dataToSave.startTime || editingEvent.startTime,
            endDate: formatDate(serverData.endDate) || dataToSave.endDate || editingEvent.endDate,
            endTime: serverData.endTime || dataToSave.endTime || editingEvent.endTime,
            registrationDeadline: formatDate(serverData.registrationDeadline) || dataToSave.registrationDeadline || editingEvent.registrationDeadline,
            venue: serverData.venue || dataToSave.venue || editingEvent.venue,
            staff: serverData.staff || dataToSave.staff || editingEvent.staff,
            participants: serverData.participants ?? dataToSave.participants ?? editingEvent.participants,
            maxParticipants: serverData.maxParticipants ?? dataToSave.maxParticipants ?? editingEvent.maxParticipants,
            skillLevel: serverData.skillLevel || dataToSave.skillLevel || editingEvent.skillLevel,
            format: serverData.format || dataToSave.format || editingEvent.format,
            ageGroup: serverData.ageGroup || dataToSave.ageGroup || editingEvent.ageGroup,
            equipment: serverData.equipment ?? dataToSave.equipment ?? editingEvent.equipment,
            entryFee: serverData.entryFee ?? dataToSave.entryFee ?? editingEvent.entryFee,
            prizes: serverData.prizes ?? dataToSave.prizes ?? editingEvent.prizes,
            rules: serverData.rules ?? dataToSave.rules ?? editingEvent.rules,
            isPublished: serverData.isPublished ?? editingEvent.isPublished,
            publishedDate: serverData.publishedDate ?? editingEvent.publishedDate,
            createdAt: formatDate(serverData.createdAt) || editingEvent.createdAt,
            revenue: serverData.revenue ?? editingEvent.revenue,
          }

          // Ensure status reflects dates after update
          updatedEvent.status = getEventStatus(updatedEvent.startDate, updatedEvent.endDate)

          setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e))

          // Call parent callback to allow page to refresh or sync
          if (onUpdateEvent) {
            console.log('EventManagement: calling onUpdateEvent with', { id: updatedEvent.id, participants: updatedEvent.participants })
            onUpdateEvent(updatedEvent)
          }

          toast({
            title: "?? Event Updated",
            description: "Event has been successfully updated in the database.",
            duration: 3000,
          })

          // close modal and reset
          setShowAddModal(false)
          setFormData({})
          setEditingEvent(null)
          console.log('Event updated locally and modal closed. Updated participants:', updatedEvent.participants)
        } else {
          toast({
            title: "? Update Failed",
            description: response.error || "Failed to update event",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('Error updating event:', error)
        toast({
          title: "? Update Error",
          description: "An error occurred while updating the event.",
          duration: 3000,
        })
      }
    } else {
      // Add new event
      // Generate unique ID with timestamp to ensure uniqueness
      const timestamp = Date.now()
      const randomSuffix = Math.floor(Math.random() * 1000)
      const eventId = `EVT${timestamp}${randomSuffix}`
      
      const newEvent: Event = {
        id: eventId,
        name: dataToSave.name?.trim() || "",
        sport: dataToSave.sport || "Cricket",
        type: dataToSave.type || "Other",
        description: dataToSave.description || "",
        startDate: dataToSave.startDate || "",
        startTime: dataToSave.startTime || "09:00",
        endDate: dataToSave.endDate || "",
        endTime: dataToSave.endTime || "18:00",
        registrationDeadline: dataToSave.registrationDeadline || "",
        venue: dataToSave.venue?.trim() || "",
        staff: dataToSave.staff || "",
        participants: 0,
        maxParticipants: dataToSave.maxParticipants || 100,
        skillLevel: dataToSave.skillLevel || "All Levels",
        format: dataToSave.format || "Individual",
        ageGroup: dataToSave.ageGroup?.trim() || "",
        equipment: dataToSave.equipment || "",
        entryFee: dataToSave.entryFee || 0,
        prizes: dataToSave.prizes || "",
        rules: dataToSave.rules || "",
        isPublished: false,
        createdAt: new Date().toISOString().split('T')[0],
        revenue: 0,
      }

      // Validate all required fields have actual values (not defaults)
      if (!newEvent.name || !newEvent.sport || !newEvent.startDate || 
          !newEvent.endDate || !newEvent.registrationDeadline || !newEvent.venue || 
          !newEvent.staff || !newEvent.skillLevel || !newEvent.format || !newEvent.ageGroup ||
          newEvent.maxParticipants <= 0) {
        toast({
          title: "? Validation Error",
          description: "Please fill all required fields before saving.",
          duration: 3000,
        })
        return
      }

      // Send to API
      const response = await createEvent({
        eventId: newEvent.id,
        name: newEvent.name,
        sport: newEvent.sport,
        type: newEvent.type,
        description: newEvent.description,
        startDate: newEvent.startDate,
        startTime: newEvent.startTime,
        endDate: newEvent.endDate,
        endTime: newEvent.endTime,
        registrationDeadline: newEvent.registrationDeadline,
        venue: newEvent.venue,
        staff: newEvent.staff,
        participants: newEvent.participants,
        maxParticipants: newEvent.maxParticipants,
        skillLevel: newEvent.skillLevel,
        format: newEvent.format,
        ageGroup: newEvent.ageGroup,
        equipment: newEvent.equipment,
        entryFee: newEvent.entryFee,
        prizes: newEvent.prizes,
        rules: newEvent.rules,
        isPublished: newEvent.isPublished,
        revenue: newEvent.revenue,
      })

      if (response.success) {
        // compute status before adding so it appears in correct tab immediately
        newEvent.status = getEventStatus(newEvent.startDate, newEvent.endDate)
        setEvents([...events, newEvent])
        // Call parent callback if provided to sync with parent component
        if (onAddEvent) {
          onAddEvent(newEvent)
        }
        toast({
          title: "? Event Created Successfully",
          description: `"${newEvent.name}" has been posted and saved to the database.`,
          duration: 3000,
        })
        // Reset form data after successful creation
        setShowAddModal(false)
        setFormData({})
      } else {
        toast({
          title: "? Creation Failed",
          description: response.error || "Failed to create event",
          duration: 3000,
        })
        // Keep modal open so user can fix the issue
        return
      }
    }

    // Close modal if update was successful
    if (editingEvent) {
      setShowAddModal(false)
      setFormData({})
    }
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Ongoing":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Events View - List or Grid */}
      {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: primaryColor }}></div>
            <p className="text-gray-600 dark:text-white text-sm">Loading events...</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-h-[400px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white w-10">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={filteredEvents.length > 0 && filteredEvents.every(e => selectedIds.includes(e.id))}
                      onCheckedChange={checked => toggleSelectAll(!!checked)}
                      aria-label="Select all"
                      />
                    </div>
                  </th>
                  {visibleColumns.includes('name') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Event Name</th>}
                  {visibleColumns.includes('sport') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Sport</th>}
                  {visibleColumns.includes('type') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Type</th>}
                  {visibleColumns.includes('staff') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Staff</th>}
                  {visibleColumns.includes('venue') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Venue</th>}
                  {(visibleColumns.includes('startDate') || visibleColumns.includes('endDate')) && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Dates</th>}
                  {visibleColumns.includes('participants') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Participants</th>}
                  {visibleColumns.includes('maxParticipants') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Max Participants</th>}
                  {visibleColumns.includes('skillLevel') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Skill Level</th>}
                  {visibleColumns.includes('format') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Format</th>}
                  {visibleColumns.includes('ageGroup') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Age Group</th>}
                  {visibleColumns.includes('entryFee') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Entry Fee</th>}
                  {visibleColumns.includes('revenue') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Revenue</th>}
                  {visibleColumns.includes('status') && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider">Status</th>}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td onClick={(e) => e.stopPropagation()} className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.includes(event.id)}
                        onCheckedChange={checked => toggleSelect(event.id, !!checked)}
                        aria-label={`Select ${event.name}`}
                      />
                    </td>
                    {visibleColumns.includes('name') && <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{event.name}</td>}
                    {visibleColumns.includes('sport') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                      <Badge variant="outline" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderColor: `${primaryColor}40` }}>{event.sport}</Badge>
                    </td>}
                    {visibleColumns.includes('type') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{event.type}</td>}
                    {visibleColumns.includes('staff') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{event.staff}</td>}
                    {visibleColumns.includes('venue') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{event.venue}</td>}
                    {(visibleColumns.includes('startDate') || visibleColumns.includes('endDate')) && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </td>}
                    {visibleColumns.includes('participants') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                      <span>{event.participants}/{event.maxParticipants}</span>
                    </td>}
                    {visibleColumns.includes('maxParticipants') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                      <span>{event.maxParticipants}</span>
                    </td>}
                    {visibleColumns.includes('skillLevel') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{event.skillLevel}</td>}
                    {visibleColumns.includes('format') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{event.format}</td>}
                    {visibleColumns.includes('ageGroup') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{event.ageGroup}</td>}
                    {visibleColumns.includes('entryFee') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{currency} {event.entryFee}</td>}
                    {visibleColumns.includes('revenue') && <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">{currency} {(event.entryFee || 0) * (event.participants || 0)}</td>}
                    {visibleColumns.includes('status') && <td className="px-6 py-4 text-sm">
                      <Badge className={getStatusColor(getEventStatus(event.startDate, event.endDate))}>
                        {getEventStatus(event.startDate, event.endDate)}
                      </Badge>
                    </td>}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewEvent(event) }}
                          className="p-1 rounded transition-colors"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" style={{ color: primaryColor }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditEvent(event) }}
                          className="p-1 rounded transition-colors"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" style={{ color: primaryColor }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(event.id) }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-white text-sm">No events found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 pb-6 relative">
          <div
            className="flex gap-4 pb-2 overflow-x-auto overflow-y-hidden scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9ca3af #f3f4f6',
              minHeight: 180
            }}
          >
            {/* Right fade gradient to indicate scroll */}
            {filteredEvents.length > 3 && (
              <div className="absolute top-0 right-6 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            )}
            {filteredEvents.map((event) => {
              const eventStatus = getEventStatus(event.startDate, event.endDate)
              return (
                <div
                  key={event.id}
                  className="group relative flex flex-col rounded-xl bg-background dark:bg-gray-900 shadow-sm transition-all duration-200 hover:shadow-md p-4 h-[220px] cursor-pointer flex-shrink-0"
                  style={{ minWidth: '320px', width: '320px', border: `1px solid ${secondaryColor}` }}
                  onClick={() => handleViewEvent(event)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{event.name}</span>
                    <span className="absolute top-2 right-2 flex items-center gap-1">
                      <Badge className={getStatusColor(eventStatus)}>
                        {eventStatus}
                      </Badge>
                      <button
                        className="p-1 rounded-full focus:outline-none transition-colors"
                        style={{ color: primaryColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = `${primaryColor}cc`}
                        onMouseLeave={(e) => e.currentTarget.style.color = primaryColor}
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditEvent(event)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                      {event.sport}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                      {event.type}
                    </span>
                  </div>
                  
                  <div className="mb-1">
                    <span className="text-xs text-gray-500 dark:text-white font-medium">Staff:</span>
                    <span className="ml-1 text-gray-900 dark:text-white">{event.staff}</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-xs text-gray-500 dark:text-white font-medium">Dates:</span>
                    <span className="ml-1 text-gray-900 dark:text-white">{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-xs text-gray-500 dark:text-white font-medium">Venue:</span>
                    <span className="ml-1 text-gray-900 dark:text-white">{event.venue || 'N/A'}</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-xs text-gray-500 dark:text-white font-medium">Participants:</span>
                    <span className="ml-1 text-gray-900 dark:text-white">{event.participants}/{event.maxParticipants}</span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteDialog(event.id)
                    }}
                    className="absolute bottom-2 right-2 text-gray-400 dark:text-white hover:text-red-600 p-1.5"
                    title="Delete"
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 hover:text-red-600">
                      <path d="M13.8333 3.83333H2.16667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6.5 6.5V10.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 6.5V10.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12.8333 3.83333V13C12.8333 13.221 12.7455 13.433 12.5893 13.5893C12.433 13.7455 12.221 13.8333 12 13.8333H4C3.77899 13.8333 3.56703 13.7455 3.41075 13.5893C3.25447 13.433 3.16667 13.221 3.16667 13V3.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.8333 3.83333V2.83333C10.8333 2.39131 10.6577 1.96738 10.3452 1.65482C10.0326 1.34226 9.60869 1.16667 9.16667 1.16667H6.83333C6.39131 1.16667 5.96738 1.34226 5.65482 1.65482C5.34226 1.96738 5.16667 2.39131 5.16667 2.83333V3.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )
            })}

            {filteredEvents.length === 0 && (
              <div className="w-full text-center py-12">
                <p className="text-gray-500 dark:text-white text-sm">No events found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <EventFormModal
          event={editingEvent}
          onSave={(updatedFormData) => handleSaveEvent(updatedFormData)}
          onClose={() => {
            setShowAddModal(false)
            if (onCreateModalChange) onCreateModalChange(false)
          }}
          formData={formData}
          setFormData={setFormData}
          coaches={mockStaff}
          eventTypes={eventTypes}
          sportsList={sportsList}
          skillLevels={skillLevels}
          formats={formats}
        />
      )}

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
              {pendingDeleteId ? ` "${events.find(e => e.id === pendingDeleteId)?.name}"` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!!isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column selector modal (list columns) */}
      <ColumnSelectorModal
        open={showColumnSelector}
        columns={allColumns}
        displayedColumns={displayedColumns}
        setDisplayedColumns={(cols) => setDisplayedColumns(cols)}
        onClose={() => setShowColumnSelector(false)}
        onSave={() => setShowColumnSelector(false)}
        onReset={() => setDisplayedColumns(defaultDisplayed)}
        storageKeyPrefix="events"
        fixedColumns={["Actions"]}
      />
    </div>
  )
}

// Enhanced Event Form Modal with all sports academy fields
export function EventFormModal({
  event,
  onSave,
  onClose,
  formData: initialFormData,
  setFormData: setParentFormData,
  coaches,
  eventTypes,
  sportsList,
  skillLevels,
  formats,
}: {
  event: Event | null
  onSave: (formData: Partial<Event>) => void
  onClose: () => void
  formData: Partial<Event>
  setFormData: (data: Partial<Event>) => void
  coaches: string[]
  eventTypes: string[]
  sportsList: string[]
  skillLevels: string[]
  formats: string[]
}) {
  // Create local form state to prevent re-renders from parent affecting input fields
  const [formData, setFormData] = useState<Partial<Event>>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [courses, setCourses] = useState<Course[]>([])

  // Fetch available courses to include in the category dropdown
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await fetchCourses()
        if (mounted) setCourses(data)
      } catch (err) {
        // silently ignore - dropdown will still show default categories
        console.error('Failed to load courses for category dropdown', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Update local form data whenever initial form data changes (e.g., when switching between events)
  useEffect(() => {
    setFormData(initialFormData)
  }, [initialFormData])

  // Real-time validation for registration deadline
  useEffect(() => {
    if (formData.registrationDeadline && formData.startDate) {
      const regDeadline = new Date(formData.registrationDeadline)
      const startDate = new Date(formData.startDate)
      if (regDeadline > startDate) {
        setValidationErrors(prev => ({
          ...prev,
          registrationDeadline: "Registration deadline cannot be after the event start date"
        }))
      } else {
        // Clear the error if it was previously set and now dates are valid
        setValidationErrors(prev => {
          const { registrationDeadline, ...rest } = prev
          return rest
        })
      }
    }
  }, [formData.registrationDeadline, formData.startDate])

  // Real-time validation for start date vs end date
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (startDate > endDate) {
        setValidationErrors(prev => ({
          ...prev,
          startDate: "Start date cannot be after the end date",
          endDate: ""
        }))
      } else {
        // Clear the start date error if it was previously set and now dates are valid
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          if (newErrors.startDate === "Start date cannot be after the end date") {
            delete newErrors.startDate
          }
          if (newErrors.endDate === "") {
            delete newErrors.endDate
          }
          return newErrors
        })
      }
    }
  }, [formData.startDate, formData.endDate])

  // Detect if form has been modified
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData)
  }, [formData, initialFormData])

  // Validate form before submission
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name || !formData.name.trim()) errors.name = "Event name is required"
    if (!formData.sport || formData.sport.trim() === "") errors.sport = "Sport is required"
    // Event type is optional now; backend will default to 'Other' if omitted
    if (!formData.venue || !formData.venue.trim()) errors.venue = "Venue is required"
    if (!formData.staff || formData.staff.trim() === "") errors.staff = "Staff member is required"
    if (!formData.startDate || formData.startDate.trim() === "") errors.startDate = "Start date is required"
    if (!formData.endDate || formData.endDate.trim() === "") errors.endDate = "End date is required"
    
    // Validate start date vs end date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (startDate > endDate) {
        errors.startDate = "Start date cannot be after the end date"
      }
    }
    
    if (!formData.registrationDeadline || formData.registrationDeadline.trim() === "") {
      errors.registrationDeadline = "Registration deadline is required"
    } else if (formData.startDate && formData.registrationDeadline) {
      // Check if registration deadline is after start date
      const regDeadline = new Date(formData.registrationDeadline)
      const startDate = new Date(formData.startDate)
      if (regDeadline > startDate) {
        errors.registrationDeadline = "Registration deadline cannot be after the event start date"
      }
    }
    if (!formData.ageGroup || !formData.ageGroup.trim()) errors.ageGroup = "Age group is required"
    if (!formData.maxParticipants || formData.maxParticipants <= 0) errors.maxParticipants = "Max participants must be greater than 0"
    if (!formData.skillLevel || formData.skillLevel.trim() === "") errors.skillLevel = "Skill level is required"
    if (!formData.format || formData.format.trim() === "") errors.format = "Format is required"
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveClick = () => {
    if (validateForm()) {
      console.log('EventFormModal saving formData:', formData)
      // Pass formData directly to onSave to avoid async state issues
      onSave(formData)
    } else {
      // Show a toast message indicating validation errors
      const errorList = Object.values(validationErrors).join(", ")
      console.error("Form validation errors:", validationErrors)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-background dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {event ? "Edit Event" : "Create New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Event Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Annual Cricket Championship"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  value={formData.sport || ""}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.sport ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select category (arts or sports)</option>
                  {(() => {
                    const courseNames = courses.map(c => c.name).filter(Boolean)
                    const combined = Array.from(new Set([...categoryList, ...courseNames]))
                    return combined.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  })()}
                </select>
                {validationErrors.sport && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.sport}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Event Type</label>
                <select
                  value={formData.type || ""}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Event["type"] })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.type ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select event type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {validationErrors.type && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.type}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Staff Incharge <span className="text-red-500">*</span></label>
                <select
                  value={formData.staff || ""}
                  onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.staff ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select a staff member</option>
                  {mockStaff.map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
                {validationErrors.staff && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.staff}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description & Details */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description & Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Description</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Rules & Regulations</label>
                <textarea
                  value={formData.rules || ""}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="Rules for the event..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Equipment Required</label>
                <input
                  type="text"
                  value={formData.equipment || ""}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  placeholder="e.g., Cricket bats, balls, stumps"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Dates & Deadlines */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dates & Deadlines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Start Date & Time <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <input
                    type="time"
                    value={formData.startTime || "09:00"}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {validationErrors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">End Date & Time <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <input
                    type="time"
                    value={formData.endTime || "18:00"}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {validationErrors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.endDate}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Registration Deadline <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.registrationDeadline || ""}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.registrationDeadline ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.registrationDeadline && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.registrationDeadline}</p>
              )}
            </div>
          </div>

          {/* Venue & Participation */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Venue & Participation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Venue <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.venue || ""}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g., Main Ground"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.venue ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.venue && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.venue}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Age Group <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.ageGroup || ""}
                  onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                  placeholder="e.g., U-15 to U-19"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.ageGroup ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.ageGroup && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.ageGroup}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Max Participants <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.maxParticipants || ""}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  placeholder="0"
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.maxParticipants ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.maxParticipants && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.maxParticipants}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Participants <span className="text-amber-600">(for revenue calculation)</span></label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, participants: Math.max(0, (formData.participants || 0) - 1) })}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                    title="Decrease participants"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={String(formData.participants ?? 0)}
                    className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, participants: (formData.participants || 0) + 1 })}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                    title="Increase participants"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-white mt-1">Revenue = Entry Fee � Participants</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Skill Level <span className="text-red-500">*</span></label>
                <select
                  value={formData.skillLevel || ""}
                  onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as Event["skillLevel"] })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.skillLevel ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select skill level</option>
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {validationErrors.skillLevel && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.skillLevel}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Format <span className="text-red-500">*</span></label>
                <select
                  value={formData.format || ""}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as Event["format"] })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${validationErrors.format ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select format</option>
                  {formats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
                {validationErrors.format && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.format}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fees & Prizes */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fees & Prizes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Entry Fee <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.entryFee || ""}
                  onChange={(e) => setFormData({ ...formData, entryFee: e.target.value ? parseInt(e.target.value, 10) : 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Prizes</label>
                <input
                  type="text"
                  value={formData.prizes || ""}
                  onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                  placeholder="e.g., Trophy + Certificate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveClick}
              disabled={event ? !hasChanges || Object.keys(validationErrors).length > 0 : Object.keys(validationErrors).length > 0}
              className="text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = `${primaryColor}dd` }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = primaryColor }}
            >
              {event ? "Update Event" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Event Details View Modal
export function EventViewModal({
  event,
  onClose,
}: {
  event: Event
  onClose: () => void
}) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const { currency } = useCurrency();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 text-white p-6 flex items-center justify-between" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
          <div>
            <h2 className="text-2xl font-bold">{event.name}</h2>
            <p className="mt-1" style={{ color: '#ffffff99' }}>{event.sport} � {event.type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-1">Status</p>
              {event && (
                <Badge className={`${
                  getEventStatus(event.startDate, event.endDate) === "Upcoming" ? "bg-blue-100 text-blue-800" :
                  getEventStatus(event.startDate, event.endDate) === "Ongoing" ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {getEventStatus(event.startDate, event.endDate)}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-1">Coach Incharge</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.staff}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-1">Skill Level</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.skillLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-1">Format</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.format}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-1">Age Group</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.ageGroup}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-1">Max Participants</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.maxParticipants}</p>
            </div>
          </div>

          {event.description && (
            <div>
              <p className="text-sm text-gray-600 dark:text-white mb-2">Description</p>
              <p className="text-gray-900 dark:text-white">{event.description}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-1" style={{ color: primaryColor }} />
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Event Dates & Times</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(event.startDate).toLocaleDateString()} {event.startTime} - {new Date(event.endDate).toLocaleDateString()} {event.endTime}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-1" style={{ color: primaryColor }} />
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Registration Deadline</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(event.registrationDeadline).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1" style={{ color: primaryColor }} />
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Venue</p>
                <p className="font-semibold text-gray-900 dark:text-white">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(event.equipment || event.entryFee || event.prizes || event.rules) && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.equipment && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white mb-1">Equipment Required</p>
                    <p className="text-gray-900 dark:text-white">{event.equipment}</p>
                  </div>
                )}
                {event.entryFee ? (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white mb-1">Entry Fee</p>
                    <p className="font-semibold" style={{ color: primaryColor }}>{currency} {event.entryFee}</p>
                  </div>
                ) : null}
                {event.prizes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white mb-1">Prizes</p>
                    <p className="text-gray-900 dark:text-white">{event.prizes}</p>
                  </div>
                )}
                {event.rules && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white mb-1">Rules & Regulations</p>
                    <p className="text-gray-900 dark:text-white">{event.rules}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
