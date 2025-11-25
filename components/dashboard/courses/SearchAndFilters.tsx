"use client"

import React, { useState, useRef, useMemo } from "react"
import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Upload, Download, Check, X, Plus, FileText } from "lucide-react"
import { format } from "date-fns"
import "./SearchAndFilters.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/dashboard/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { FilterDropdownWithCheckboxes } from "@/components/dashboard/ui/filter-dropdown-with-checkboxes"
import CourseImportDialog from "./CourseImportDialog"
import type { Course } from "@/types/dashboard/course"

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  selectedFilters: {
    level: string[];
    type: string[];
    status: string[];
    priceRange: [number, number];
    category: string[];
  };
  setSelectedFilters: (filters: any) => void;
  pendingFilters: {
    level: string[];
    type: string[];
    status: string[];
    priceRange: [number, number];
    category: string[];
  };
  setPendingFilters: (filters: any) => void;
  courses?: Course[];
  setCourses: (courses: Course[] | ((prev: Course[]) => Course[])) => void;
  filteredCourses?: Course[];
  courseTypeOptions: string[];
  onCreateCourse?: () => void;
  onOpenDrafts?: () => void;
  onExport?: () => void;
  selectedCount?: number;
  draftsCount?: number;
}

export default function SearchAndFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  selectedFilters,
  setSelectedFilters,
  pendingFilters,
  setPendingFilters,
  courses = [],
  setCourses,
  filteredCourses,
  courseTypeOptions,
  onCreateCourse,
  onOpenDrafts,
  onExport,
  selectedCount = 0,
  draftsCount = 0
}: SearchAndFiltersProps) {
  const { currency } = useCurrency()
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Dynamic filter options based on actual course data with default fallbacks
  const availableLevels = useMemo(() => {
    const defaultLevels = ["Beginner", "Intermediate", "Advanced"];
    if (!courses || !Array.isArray(courses)) {
      return defaultLevels;
    }
    const courseLevels = courses.map(course => course.level).filter(Boolean);
    const allLevels = new Set([...defaultLevels, ...courseLevels]);
    return Array.from(allLevels).sort();
  }, [courses]);

  const availableStatuses = useMemo(() => {
    const defaultStatuses = ["Active", "Draft", "Upcoming", "Completed"];
    if (!courses || !Array.isArray(courses)) {
      return defaultStatuses;
    }
    const courseStatuses = courses.map(course => course.status).filter(Boolean);
    const allStatuses = new Set([...defaultStatuses, ...courseStatuses]);
    return Array.from(allStatuses).sort();
  }, [courses]);

  const availableCategories = useMemo(() => {
    const defaultCategories = ["Regular", "Special"];
    if (!courses || !Array.isArray(courses)) {
      return defaultCategories;
    }
    const courseCategories: string[] = [];
    courses.forEach(course => {
      if (course.courseCategory) courseCategories.push(course.courseCategory);
    });
    const allCategories = new Set([...defaultCategories, ...courseCategories]);
    return Array.from(allCategories).sort();
  }, [courses]);

  return (
    <div className="flex flex-col lg:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
        <Input
          placeholder="Search courses, instructors, tags..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Filter Button and Panel */}
        <Popover 
          open={filterDropdownOpen} 
          onOpenChange={setFilterDropdownOpen}
        >
          <PopoverTrigger asChild>
            <Button
                                     variant="outline"
                                     size="sm"
                                     className="h-9 flex items-center gap-1 relative group"
                                     aria-label="Filter options"
                                     title="Filter"
                                     tabIndex={0}
                                   >
                                     <span className="relative inline-block">
                                       <Filter className="h-3.5 w-3.5 text-purple-500 group-hover:text-white transition-colors" />
                                       {filterAction === "applied" && (
                                         <span className="absolute -top-1 -right-1">
                                           <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                                             <Check className="w-2 h-2 text-white" />
                                           </span>
                                         </span>
                                       )}
                                       {filterAction === "cleared" && (
                                         <span className="absolute -top-1 -right-1">
                                           <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500">
                                             <X className="w-2 h-2 text-white" />
                                           </span>
                                         </span>
                                       )}
                                     </span>
                                   </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-4 bg-white border border-gray-200 shadow-lg z-50" 
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 font-semibold text-sm">Filter by Type</div>
                <FilterDropdownWithCheckboxes
                  options={courseTypeOptions.map(type => ({ value: type, label: type }))}
                  value={pendingFilters.type}
                  onChange={(values) => setPendingFilters((prev: typeof pendingFilters) => ({ ...prev, type: values }))}
                  placeholder="All Types"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Filter by Level</div>
                <FilterDropdownWithCheckboxes
                  options={availableLevels.map(level => ({ value: level, label: level }))}
                  value={pendingFilters.level}
                  onChange={(values) => setPendingFilters((prev: typeof pendingFilters) => ({ ...prev, level: values }))}
                  placeholder="All Levels"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Filter by Status</div>
                <FilterDropdownWithCheckboxes
                  options={availableStatuses.map(status => ({ value: status, label: status }))}
                  value={pendingFilters.status}
                  onChange={(values) => setPendingFilters((prev: typeof pendingFilters) => ({ ...prev, status: values }))}
                  placeholder="All Statuses"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Course Category</div>
                <FilterDropdownWithCheckboxes
                  options={availableCategories.map(category => ({ value: category, label: category }))}
                  value={pendingFilters.category || []}
                  onChange={(values) => setPendingFilters((prev: typeof pendingFilters) => ({ ...prev, category: values }))}
                  placeholder="All Categories"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Price Range ({currency})</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    className="flex-1 px-3 py-2 text-sm border rounded-md"
                    placeholder="Min"
                    value={pendingFilters.priceRange[0]}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      setPendingFilters((prev: any) => ({
                        ...prev,
                        priceRange: [value, prev.priceRange[1]],
                      }));
                    }}
                  />
                  <span className="text-sm text-gray-500 dark:text-white">to</span>
                  <input
                    type="number"
                    min="0"
                    className="flex-1 px-3 py-2 text-sm border rounded-md"
                    placeholder="Max"
                    value={pendingFilters.priceRange[1]}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      setPendingFilters((prev: any) => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], value],
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                size="sm"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  setSelectedFilters({ ...pendingFilters });
                  setFilterDropdownOpen(false);
                  setFilterAction("applied");
                }}
              >
                Apply Filters
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const clearedFilters = { 
                    type: [], 
                    level: [], 
                    status: [], 
                    category: [], 
                    priceRange: [0, 100000] as [number, number] 
                  };
                  setPendingFilters(clearedFilters);
                  setSelectedFilters(clearedFilters);
                  setFilterDropdownOpen(false);
                  setFilterAction("cleared");
                }}
              >
                Clear All
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Field Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" title="Sort" size="sm" className="h-9 flex items-center gap-1 group">
              <ArrowUpDown className="mr-2 h-4 w-4 group-hover:text-white" />
              <span className="ml-1 text-xs text-gray-600 dark:text-white group-hover:text-white">
              {(() => {
                const label = [
                  { value: "courseId", label: "Course ID" },
                  { value: "name", label: "Course Name" },
                  { value: "priceINR", label: `Price (${currency})` },
                  { value: "duration", label: "Duration" },
                ].find(o => o.value === sortBy)?.label;
                return label ? <span className="ml-1 text-xs text-gray-600 dark:text-white group-hover:text-white">{label}</span> : null;
              })()}</span>
             <span className="ml-2 text-xs text-gray-500 dark:text-white group-hover:text-white">{sortOrder === "asc" ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />}
            </span></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "courseId", label: "Course ID" },
              { value: "name", label: "Course Name" },
              { value: "priceINR", label: `Price (${currency})` },                                
              { value: "duration", label: "Duration" },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                }}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setSortOrder("asc")}
            >
              Ascending
              <ArrowUp className="h-4 w-4 mr-2" />
              
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOrder("desc")}
            >
              Descending
              <ArrowDown className="h-4 w-4 mr-2" />
              
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle */}
        <div className="flex border rounded-md">
          
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={`rounded-r-none ${viewMode === "list" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
            title="List View"
          >
            <div className="flex flex-col gap-0.5 w-4 h-4">
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
            </div>
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`rounded-l-none border-l ${viewMode === "grid" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
            title="Grid View"
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </Button>
        </div>
      </div>

      {/* Import/Export Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          title='Upload'
          onClick={() => setImportDialogOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" size="sm" title='Download' onClick={() => {
          if (onExport) { onExport(); return; }
          // Export only the currently shown (filtered/searched) courses
          const shownCourses = typeof filteredCourses !== 'undefined' && filteredCourses.length ? filteredCourses : courses;
          if (!shownCourses.length) return;
          // Define user-friendly column headers and their corresponding field keys
          const exportColumns = [
            { header: 'Course ID', key: 'id' },
            { header: 'Course Name', key: 'name' },
            { header: 'Status', key: 'status' },
            { header: 'Instructor Name', key: 'instructor' },
            { header: 'Category', key: 'courseCategory' },
            { header: 'Level', key: 'level' },
            { header: 'Course Type', key: 'type' },
            { header: 'Topics/Tags', key: 'tags' },
            { header: 'Skills Covered', key: 'skills' },
            { header: 'Prerequisites', key: 'prerequisites' },
            { header: 'Learning Outcomes', key: 'learningOutcomes' },
            { header: 'Max Students', key: 'maxStudents' },
            { header: 'Description', key: 'description' },
            // Schedule related fields
            { header: 'Total Weeks', key: 'schedulePeriod.totalWeeks' },
            { header: 'Session Duration (minutes)', key: 'sessionDetails.sessionDuration' },
            { header: 'Max Classes', key: 'sessionDetails.maxClasses' },
            { header: 'Class Days', key: 'frequencies' },
            { header: 'Start Date', key: 'schedulePeriod.startDate' },
            { header: 'End Date', key: 'schedulePeriod.endDate' },
            { header: 'Location', key: 'location' },
            { header: 'Virtual Classroom URL', key: 'virtualClassroomUrl' },
            // Pricing and referral related fields
            { header: `Price (${currency})`, key: 'priceINR' },
            { header: `Discount Price (${currency})`, key: 'discountPrice' },
            { header: 'Referral Code', key: 'referralCode' },
            { header: 'Commission Rate (%)', key: 'commissionRate' },
            { header: 'Referral Start Date', key: 'referralStart' },
            { header: 'Referral End Date', key: 'referralEnd' },
            // Reminder settings
            { header: 'Push Notifications', key: 'reminderSettings.pushEnabled' },
            { header: 'Email Notifications', key: 'reminderSettings.emailEnabled' },
            { header: 'SMS Notifications', key: 'reminderSettings.smsEnabled' },
            { header: 'Reminder Frequency', key: 'reminderSettings.frequency' }
          ];

          const formatValue = (value: any, key: string) => {
            if (value === null || value === undefined) return '';
            
            // Handle nested object paths
            if (key.includes('.')) {
              const [obj, prop] = key.split('.');
              const nestedValue = value[obj]?.[prop];
              
              // Special handling for specific nested fields
              if (obj === 'reminderSettings') {
                if (prop.endsWith('Enabled')) {
                  return nestedValue ? 'Yes' : 'No';
                }
                if (prop === 'frequency') {
                  return nestedValue || 'Not set';
                }
              }
              
              if (obj === 'schedulePeriod') {
                if (prop === 'startDate' || prop === 'endDate') {
                  return nestedValue ? format(new Date(nestedValue), 'dd-MMM-yy') : '';
                }
                if (prop === 'totalWeeks') {
                  return nestedValue || '0';
                }
              }
              
              if (obj === 'sessionDetails') {
                if (prop === 'sessionDuration') {
                  return nestedValue || '0';
                }
                if (prop === 'maxClasses') {
                  return nestedValue || '0';
                }
              }
              
              return nestedValue || '';
            }
            
            // Handle dates
            if (key === 'referralStart' || key === 'referralEnd') {
              return value ? format(new Date(value), 'dd-MMM-yy') : '';
            }
            
            // Handle arrays
            if (Array.isArray(value)) {
              if (key === 'frequencies') {
                // Format frequencies array in a readable way
                return value.map(f => {
                  if (typeof f === 'object') {
                    const days = f.selectedDays || [];
                    const times = f.dayTimes || {};
                    return days.map((day: string) => `${day}: ${times[day] || 'TBD'}`).join('; ');
                  }
                  return f;
                }).join('; ');
              }
              return value.filter(v => v).join('; ');
            }
            
            // Handle prices
            if (key === 'priceINR' || key === 'discountPrice') {
              return typeof value === 'number' ? value.toLocaleString('en-IN') : '';
            }
            
            // Handle commission rate
            if (key === 'commissionRate' && value) {
              const rate = parseFloat(value);
              return isNaN(rate) ? value : rate.toFixed(2) + '%';
            }
            
            // Handle boolean values
            if (typeof value === 'boolean') {
              return value ? 'Yes' : 'No';
            }
            
            // Default string conversion
            return String(value).trim();
          };
          // Create CSV header row with user-friendly column names
          const headerRow = exportColumns.map(col => col.header).join(',');
          
          // Create data rows
          const dataRows = shownCourses.map(course => {
            return exportColumns.map(col => {
              let value = col.key === 'id' && course.id 
                ? `COURSE${course.id.slice(-4)}`
                : formatValue(course[col.key as keyof Course], col.key);
              
              // Escape the formatted value for CSV
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = '"' + value.replace(/"/g, '""') + '"';
              }
              return value;
            }).join(',');
          });

          // Combine header and data rows
          const csvStr = [headerRow, ...dataRows].join('\n');
          
          // Create and trigger download
          const date = format(new Date(), 'dd-MMM-yy');
          const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvStr);
          const dlAnchor = document.createElement('a');
          dlAnchor.setAttribute("href", dataStr);
          dlAnchor.setAttribute("download", `courses_export_${date}.csv`);
          document.body.appendChild(dlAnchor);
          dlAnchor.click();
          document.body.removeChild(dlAnchor);
        }}>
          <Download className="mr-2 h-4 w-4" />
          Export
          <span className="text-xs text-gray-600 dark:text-white ml-1">({selectedCount})</span>
        </Button>
        <Button
          size="sm"
          title='Create Course'
          onClick={onCreateCourse}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
        <Button
          size="sm"
          title='Drafts'
          onClick={onOpenDrafts}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Drafts ({draftsCount})
        </Button>
      </div>

      {/* Course Import Dialog */}
      <CourseImportDialog
        isOpen={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={(importedCount: number) => {
          // Refresh courses list after import
          window.location.reload();
        }}
      />
    </div>
  );
}