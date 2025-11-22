import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"

interface GridListToggleProps {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  isCalendarView?: boolean
  setIsCalendarView?: (isCalendarView: boolean) => void
}

export const GridListToggle: React.FC<GridListToggleProps> = ({
  viewMode,
  setViewMode,
  isCalendarView,
  setIsCalendarView,
}) => (
  <TooltipProvider>
    <div className="flex border rounded-md overflow-hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              viewMode === "list"
                ? "bg-purple-500 text-white"
                : "bg-white text-black hover:bg-gray-100"
            } rounded-l-md focus:outline-none border-r`}
            aria-pressed={viewMode === "list"}
            onClick={() => {
              setViewMode("list")
              if (setIsCalendarView) {
                setIsCalendarView(false)
              }
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
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              viewMode === "grid"
                ? "bg-purple-500 text-white"
                : "bg-white text-black hover:bg-gray-100"
            } rounded-r-md focus:outline-none`}
            aria-pressed={viewMode === "grid"}
            onClick={() => {
              setViewMode("grid")
              if (setIsCalendarView) {
                setIsCalendarView(false)
              }
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
    </div>
  </TooltipProvider>
)