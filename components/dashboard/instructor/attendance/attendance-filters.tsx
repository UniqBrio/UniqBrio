"use client"

import { useState } from "react"
import { Search, Filter, X, Check, Download } from "lucide-react"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Label } from "@/components/dashboard/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { FormattedDateInput } from "@/components/dashboard/common/formatted-date-input"

// CSV export helper
const exportAttendanceCSV = (attendanceData: any[]) => {
  const headers = [
    "Student ID",
    "Student Name", 
    "Cohort Instructor",
    "Cohort Timing",
    "Date",
    "Start Time",
    "End Time",
    "Status",
    "Notes"
  ];
  const rows = attendanceData.map(row => [
    row.studentId,
    row.studentName,
    row.cohortInstructor,
    row.cohortTiming,
    row.date,
    row.startTime,
    row.endTime,
    row.status,
    row.notes
  ]);
  const csvContent = [headers, ...rows]
    .map(e => e.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "student-attendance.csv";
  link.click();
};
//TODO: The Search should be separated from the other filters to allow for independent searching without applying other filters 
interface AttendanceFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  attendanceStatus: string[];
  setAttendanceStatus: (v: string[]) => void;
  cohorts?: string[];
  setCohorts: (v: string[]) => void;
  startDate: Date | null;
  setStartDate: (v: Date | null) => void;
  endDate: Date | null;
  setEndDate: (v: Date | null) => void;
  attendanceData: any[];
  onApplyFilter: () => void;
  onClearFilter: () => void;
}

export function AttendanceFilters({
  searchTerm,
  setSearchTerm,
  attendanceStatus,
  setAttendanceStatus,
  cohorts,
  setCohorts,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  attendanceData,
  onApplyFilter,
  onClearFilter,
}: AttendanceFiltersProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"none" | "applied" | "cleared">("none");
  
  // Helper: format Date to local ISO yyyy-MM-dd for the date input value
  const dateToIso = (d: Date | null) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  
  const handleCohortChange = (cohort: string) => {
    if (cohorts?.includes(cohort)) {
      setCohorts(cohorts.filter((c: string) => c !== cohort));
    } else {
      setCohorts([...(cohorts || []), cohort]);
    }
  }

  const handleStatusChange = (status: string) => {
    if (attendanceStatus.includes(status)) {
      setAttendanceStatus(attendanceStatus.filter(s => s !== status));
    } else {
      setAttendanceStatus([...attendanceStatus, status]);
    }
    // Do not call onApplyFilter here
  }



  return (
    <TooltipProvider>
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-white" />
            <Input
              type="search"
              placeholder="Search by student ID or name..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onApplyFilter();
              }}
            />
          </div>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 flex items-center gap-1 relative"
                    aria-label="Filter options"
                  >
                    <span className="relative inline-block">
                      <Filter className="h-3.5 w-3.5 text-purple-500" />
                      {filterAction === "applied" && (
                        <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                            <Check className="w-2 h-2 text-white" />
                          </span>
                        </span>
                      )}
                      {filterAction === "cleared" && (
                        <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500">
                            <X className="w-2 h-2 text-white" />
                          </span>
                        </span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Filters</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="min-w-[9rem]">
                    <Label htmlFor="start-date">Start Date</Label>
                    <FormattedDateInput
                      id="start-date"
                      value={dateToIso(startDate)}
                      onChange={(iso) => {
                        const newDate = iso ? new Date(iso) : null;
                        setStartDate(newDate);
                        setTimeout(() => onApplyFilter(), 0);
                      }}
                      max={dateToIso(endDate) || undefined}
                      displayFormat="dd-MMM-yyyy"
                      placeholder="dd-mmm-yyyy"
                      className="py-2"
                    />
                  </div>
                  <div className="min-w-[9rem]">
                    <Label htmlFor="end-date">End Date</Label>
                    <FormattedDateInput
                      id="end-date"
                      value={dateToIso(endDate)}
                      onChange={(iso) => {
                        const newDate = iso ? new Date(iso) : null;
                        setEndDate(newDate);
                        setTimeout(() => onApplyFilter(), 0);
                      }}
                      min={dateToIso(startDate) || undefined}
                      displayFormat="dd-MMM-yyyy"
                      placeholder="dd-mmm-yyyy"
                      className="py-2"
                    />
                  </div>
                </div>
              <div>
                <Label>Status</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-present"
                      checked={attendanceStatus.includes("present")}
                      onCheckedChange={() => handleStatusChange("present")}
                    />
                    <Label htmlFor="status-present">Present</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-absent"
                      checked={attendanceStatus.includes("absent")}
                      onCheckedChange={() => handleStatusChange("absent")}
                    />
                    <Label htmlFor="status-absent">Absent</Label>
                  </div>
                  

                </div>
              </div>
              {/* Removed Cohorts name selection per requirement */}
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 flex-1"
                      aria-label="Apply filters"
                      onClick={() => {
                        onApplyFilter();
                        setFilterAction("applied");
                        setPopoverOpen(false);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Apply Filters</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 flex-1"
                      aria-label="Clear all filters"
                      onClick={() => {
                        setSearchTerm("");
                        setAttendanceStatus([]);
                        setCohorts([]);
                        setStartDate(null);
                        setEndDate(null);
                        // Just call onClearFilter, parent should handle resetting data
                        onClearFilter();
                        setFilterAction("cleared");
                        setPopoverOpen(false);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear All</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 ml-auto"
              aria-label="Export attendance data"
              onClick={() => exportAttendanceCSV(attendanceData)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export</TooltipContent>
        </Tooltip>
      </div>
      {/* Active filters display removed as per request */}
    </div>
        </TooltipProvider>
  )
}
