import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip";
import { CalendarDays } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";

type BaseViewMode = "grid" | "list";
type ViewModeWithCalendar = BaseViewMode | "calendar";

// Discriminated union so existing usages (without calendar) remain fully type-safe
type GridListToggleProps =
  | {
      includeCalendar?: false;
      viewMode: BaseViewMode;
      setViewMode: (mode: BaseViewMode) => void;
    }
  | {
      includeCalendar: true;
      viewMode: ViewModeWithCalendar;
      setViewMode: (mode: ViewModeWithCalendar) => void;
    };

export const GridListToggle: React.FC<GridListToggleProps> = (props) => {
  const { includeCalendar = false } = props as { includeCalendar?: boolean };
  const viewMode = props.viewMode as ViewModeWithCalendar;
  const setViewMode = props.setViewMode as (mode: ViewModeWithCalendar) => void;
  const { primaryColor } = useCustomColors();

  return (
    <TooltipProvider>
      <div className="flex border rounded-md overflow-hidden">
        {/* List button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 transition-colors rounded-l-md focus:outline-none"
              style={{
                backgroundColor: viewMode === "list" ? primaryColor : 'white',
                color: viewMode === "list" ? 'white' : 'black'
              }}
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
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

        {/* Grid button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 transition-colors border-l focus:outline-none"
              style={{
                backgroundColor: viewMode === "grid" ? primaryColor : 'white',
                color: viewMode === "grid" ? 'white' : 'black',
                borderRadius: includeCalendar ? '0' : '0 0.375rem 0.375rem 0'
              }}
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
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

        {/* Calendar button (optional) */}
        {includeCalendar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center w-9 h-9 transition-colors border-l rounded-r-md focus:outline-none"
                style={{
                  backgroundColor: viewMode === "calendar" ? primaryColor : 'white',
                  color: viewMode === "calendar" ? 'white' : 'black'
                }}
                aria-pressed={viewMode === "calendar"}
                onClick={() => setViewMode("calendar")}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Calendar view</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
