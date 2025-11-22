"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/dashboard/staff/utils"
import { buttonVariants } from "@/components/dashboard/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showTodayButton?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showTodayButton = true,
  ...props
}: CalendarProps) {
  // Footer actions: Clear and Today
  const isRangeMode = (props as any)?.mode === "range"
  const isMultipleMode = (props as any)?.mode === "multiple"

  const handleClear = () => {
    const clearValue: any = isMultipleMode ? [] : undefined
    ;(props as any)?.onSelect?.(clearValue)
  }

  const handleToday = () => {
    const today = new Date()
    let value: any = today
    if (isRangeMode) {
      value = { from: today, to: today }
    } else if (isMultipleMode) {
      value = [today]
    }
    ;(props as any)?.onSelect?.(value)
  }

  return (
    <div className={cn("", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3")}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
      <div className="px-3 pb-3 pt-0 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleClear}
          className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3")}
        >
          Clear
        </button>
        {showTodayButton && (
          <button
            type="button"
            onClick={handleToday}
            className={cn(buttonVariants({ variant: "outline" }), "h-8 px-3")}
          >
            Today
          </button>
        )}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
