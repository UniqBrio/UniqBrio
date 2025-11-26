import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { CalendarIcon } from "./icons/calendar-icon"
import { useCustomColors } from "@/lib/use-custom-colors"

interface ViewModeToggleProps {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  isCalendarView: boolean
  setIsCalendarView: (isCalendar: boolean) => void
  showCalendarOption?: boolean
}

// Unified segmented toggle with three options: List, Grid, Calendar
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  setViewMode,
  isCalendarView,
  setIsCalendarView,
  showCalendarOption = true,
}) => {
  const { primaryColor } = useCustomColors()
  const activeSegment = isCalendarView ? "calendar" : viewMode

  return (
    <TooltipProvider>
      <div className="flex border rounded-md overflow-hidden">
        {/* List */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`flex items-center justify-center w-9 h-9 transition-colors ${
                activeSegment === "list"
                  ? "text-white"
                  : "bg-white text-black hover:bg-gray-100"
              } rounded-l-md focus:outline-none border-r`}
              style={activeSegment === "list" ? { backgroundColor: primaryColor } : {}}
              aria-pressed={activeSegment === "list"}
              onClick={() => {
                setIsCalendarView(false)
                setViewMode("list")
              }}
            >
              <div className="flex flex-col gap-0.5 w-4 h-4 justify-center">
                <div className="bg-current h-0.5 w-full rounded-sm" />
                <div className="bg-current h-0.5 w-full rounded-sm" />
                <div className="bg-current h-0.5 w-full rounded-sm" />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">List view</TooltipContent>
        </Tooltip>

        {/* Grid */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`flex items-center justify-center w-9 h-9 transition-colors ${
                activeSegment === "grid"
                  ? "text-white"
                  : "bg-white text-black hover:bg-gray-100"
              } ${showCalendarOption ? "" : "rounded-r-md"} focus:outline-none ${
                showCalendarOption ? "border-r" : ""
              }`}
              style={activeSegment === "grid" ? { backgroundColor: primaryColor } : {}}
              aria-pressed={activeSegment === "grid"}
              onClick={() => {
                setIsCalendarView(false)
                setViewMode("grid")
              }}
            >
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Grid view</TooltipContent>
        </Tooltip>

        {/* Calendar */}
        {showCalendarOption && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`flex items-center justify-center w-9 h-9 transition-colors ${
                  activeSegment === "calendar"
                    ? "text-white"
                    : "bg-white text-black hover:bg-gray-100"
                } rounded-r-md focus:outline-none`}
                style={activeSegment === "calendar" ? { backgroundColor: primaryColor } : {}}
                aria-pressed={activeSegment === "calendar"}
                aria-label="Calendar view"
                onClick={() => {
                  setIsCalendarView(true)
                }}
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Calendar view</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

export default ViewModeToggle