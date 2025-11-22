import React from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { CalendarIcon } from "./icons/calendar-icon"
import { cn } from "@/lib/dashboard/utils"

interface CalendarToggleButtonProps {
  isCalendarView: boolean
  onToggleCalendar: () => void
}

export const CalendarToggleButton: React.FC<CalendarToggleButtonProps> = ({
  isCalendarView,
  onToggleCalendar,
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "px-3 h-9 transition-colors gap-2",
            isCalendarView 
              ? "bg-purple-500 text-white hover:bg-purple-600 border-purple-500" 
              : "bg-white text-black hover:bg-gray-100"
          )}
          onClick={onToggleCalendar}
          aria-pressed={isCalendarView}
        >
          <CalendarIcon className="w-4 h-4" />
          Calendar
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isCalendarView ? "Exit calendar view" : "Calendar view"}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)