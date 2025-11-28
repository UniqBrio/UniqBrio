"use client"

import React, { useState, useRef, useMemo } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Filter, X } from "lucide-react"
import MultiSelectDropdown from "./MultiSelectDropDown"
import { useCustomColors } from "@/lib/use-custom-colors"

interface EventFilters {
  statuses: string[]
  sports: string[]
  eventTypes: string[]
  skillLevels: string[]
  formats: string[]
  staffMembers: string[]
  dateRange: { start: string; end: string }
}

interface EventSearchFiltersProps {
  events: any[]
  onFiltersChange: (filters: EventFilters) => void
  onApply: (filters: EventFilters) => void
}

export default function EventSearchFilters({
  events,
  onFiltersChange,
  onApply,
}: EventSearchFiltersProps) {
  const { primaryColor } = useCustomColors()
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [permanentFilterIcon, setPermanentFilterIcon] = useState<"apply" | "clear" | null>(null)
  const [pendingFilters, setPendingFilters] = useState<EventFilters>({
    statuses: [],
    sports: [],
    eventTypes: [],
    skillLevels: [],
    formats: [],
    staffMembers: [],
    dateRange: { start: "", end: "" },
  })
  const [selectedFilters, setSelectedFilters] = useState<EventFilters>({
    statuses: [],
    sports: [],
    eventTypes: [],
    skillLevels: [],
    formats: [],
    staffMembers: [],
    dateRange: { start: "", end: "" },
  })

  // Helper function to get event status
  function getEventStatus(startDate: string, endDate: string): "Upcoming" | "Ongoing" | "Completed" {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return "Upcoming"
    if (now > end) return "Completed"
    return "Ongoing"
  }

  // Extract available filter options from events
  const availableFilters = useMemo(() => {
    const statuses = new Set<string>()
    const sports = new Set<string>()
    const eventTypes = new Set<string>()
    const skillLevels = new Set<string>()
    const formats = new Set<string>()
    const staffMembers = new Set<string>()

    events.forEach(event => {
      const status = getEventStatus(event.startDate, event.endDate)
      statuses.add(status)
      sports.add(event.sport)
      eventTypes.add(event.type)
      skillLevels.add(event.skillLevel)
      formats.add(event.format)
      staffMembers.add(event.staff)
    })

    return {
      statuses: Array.from(statuses).sort(),
      sports: Array.from(sports).sort(),
      eventTypes: Array.from(eventTypes).sort(),
      skillLevels: Array.from(skillLevels).sort((a, b) => {
        const order = ["Beginner", "Intermediate", "Advanced", "All Levels"]
        return order.indexOf(a) - order.indexOf(b)
      }),
      formats: Array.from(formats).sort(),
      staffMembers: Array.from(staffMembers).sort(),
    }
  }, [events])

  const activeFilterCount = useMemo(() => {
    const count =
      selectedFilters.statuses.length +
      selectedFilters.sports.length +
      selectedFilters.eventTypes.length +
      selectedFilters.skillLevels.length +
      selectedFilters.formats.length +
      selectedFilters.staffMembers.length +
      (selectedFilters.dateRange.start ? 1 : 0) +
      (selectedFilters.dateRange.end ? 1 : 0)
    return count
  }, [selectedFilters])

  const handleApplyFilters = () => {
    setSelectedFilters({ ...pendingFilters })
    onApply({ ...pendingFilters })
    setFilterDropdownOpen(false)
    setPermanentFilterIcon("apply")
  }

  const clearFilters = () => {
    const emptyFilters: EventFilters = {
      statuses: [],
      sports: [],
      eventTypes: [],
      skillLevels: [],
      formats: [],
      staffMembers: [],
      dateRange: { start: "", end: "" },
    }
    setPendingFilters(emptyFilters)
    setSelectedFilters(emptyFilters)
    onApply(emptyFilters)
    setFilterDropdownOpen(false)
    setPermanentFilterIcon("clear")
  }

  return (
    <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Filter events"
          className="h-9 relative"
        >
          <span className="relative inline-block">
            <Filter className="h-4 w-4" />
            {permanentFilterIcon === "apply" && (
              <div className="absolute -top-2 -right-2 z-20">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#22C55E"/>
                  <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            {permanentFilterIcon === "clear" && (
              <div className="absolute -top-2 -right-2 z-20">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#EF4444"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[600px] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => setFilterDropdownOpen(false)}
        onInteractOutside={() => setFilterDropdownOpen(false)}
      >
        <div className="max-h-[32rem] overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Event Status Filter */}
            {availableFilters.statuses.length > 0 && (
              <MultiSelectDropdown
                label="Event Status"
                options={availableFilters.statuses}
                selected={pendingFilters.statuses}
                onChange={(next) => setPendingFilters((prev) => ({ ...prev, statuses: next }))}
                placeholder="All Statuses"
              />
            )}

            {/* Sport Type Filter */}
            {availableFilters.sports.length > 0 && (
              <MultiSelectDropdown
                label="Sport Type"
                options={availableFilters.sports}
                selected={pendingFilters.sports}
                onChange={(next) => setPendingFilters((prev) => ({ ...prev, sports: next }))}
                placeholder="All Sports"
              />
            )}

            {/* Event Type Filter */}
            {availableFilters.eventTypes.length > 0 && (
              <MultiSelectDropdown
                label="Event Type"
                options={availableFilters.eventTypes}
                selected={pendingFilters.eventTypes}
                onChange={(next) => setPendingFilters((prev) => ({ ...prev, eventTypes: next }))}
                placeholder="All Types"
              />
            )}

            {/* Skill Level Filter */}
            {availableFilters.skillLevels.length > 0 && (
              <MultiSelectDropdown
                label="Skill Level"
                options={availableFilters.skillLevels}
                selected={pendingFilters.skillLevels}
                onChange={(next) => setPendingFilters((prev) => ({ ...prev, skillLevels: next }))}
                placeholder="All Levels"
              />
            )}

            {/* Format Filter */}
            {availableFilters.formats.length > 0 && (
              <MultiSelectDropdown
                label="Format"
                options={availableFilters.formats}
                selected={pendingFilters.formats}
                onChange={(next) => setPendingFilters((prev) => ({ ...prev, formats: next }))}
                placeholder="All Formats"
              />
            )}

            {/* Staff Filter */}
            {availableFilters.staffMembers.length > 0 && (
              <MultiSelectDropdown
                label="Staff"
                options={availableFilters.staffMembers}
                selected={pendingFilters.staffMembers}
                onChange={(next) => setPendingFilters((prev) => ({ ...prev, staffMembers: next }))}
                placeholder="All Staff"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
            <Button
              size="sm"
              variant="default"
              className="flex-1 text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
