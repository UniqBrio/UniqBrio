"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Upload, Download, Check, X, Plus } from "lucide-react"
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

interface Cohort {
  id: string;
  name: string;
  courseId: string;
  notes: string;
  status: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  capacity: number;
  members: { id: string; name: string }[];
  instructorName?: string;
  location?: string;
}

interface Course {
  id: string;
  name: string;
  courseId?: string;
}

interface CohortSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  selectedFilters: {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  };
  setSelectedFilters: (filters: {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  } | ((prev: {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  }) => {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  })) => void;
  pendingFilters: {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  };
  setPendingFilters: (filters: {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  } | ((prev: {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  }) => {
    course: string[];
    location: string[];
    capacity: string[];
    status: string[];
  })) => void;
  cohorts: Cohort[];
  setCohorts: (cohorts: Cohort[] | ((prev: Cohort[]) => Cohort[])) => void;
  courses: Course[];
  onAddCohort?: () => void;
  onExport?: () => void;
  selectedCount?: number;
}

const LOCATION_OPTIONS = [
  "Studio A",
  "Pool Area", 
  "Music Room",
  "Classroom 101",
  "Basketball Court",
  "Dance Studio",
  "Virtual - Zoom",
  "Virtual - Microsoft Teams",
  "Virtual - Google Meet",
  "Virtual - WebEx",
  "Virtual - Other"
];

const CAPACITY_OPTIONS = ["1-10", "11-20", "21-30", "31-50", "50+"];
const STATUS_OPTIONS = ["Active", "Upcoming", "Completed", "Cancelled", "On Hold"];

export default function CohortSearchAndFilters({
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
  cohorts,
  setCohorts,
  courses,
  onAddCohort,
  onExport,
  selectedCount = 0
}: CohortSearchAndFiltersProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Only CSV files are allowed.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
        const rows = text.split('\n').map(r => r.trim()).filter(Boolean);
        const header = rows[0].split(',').map(h => h.trim());
        
        const normalize = (obj: Record<string, any>, keys: string[], fallback: string = '') => {
          for (const k of keys) {
            if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return String(obj[k]).trim();
          }
          return fallback;
        };

        const importedCohorts: Cohort[] = [];
        for (const row of rows.slice(1)) {
          const values = row.split(',');
          const raw: any = {};
          header.forEach((h, i) => { raw[h] = values[i] || ''; });

          // Read flexible headers
          const name = normalize(raw, ['name', 'Name', 'Cohort Name', 'cohort name']);
          const rawCourse = normalize(raw, ['courseId', 'Course ID', 'course id', 'course', 'Course', 'Course Name', 'course name']);
          const notes = normalize(raw, ['notes', 'Notes', 'description', 'Description']);
          const status = normalize(raw, ['status', 'Status'], 'Active') || 'Active';
          const startDate = normalize(raw, ['startDate', 'Start Date', 'start date']);
          const endDate = normalize(raw, ['endDate', 'End Date', 'end date']);
          const startTime = normalize(raw, ['startTime', 'Start Time', 'start time']);
          const endTime = normalize(raw, ['endTime', 'End Time', 'end time']);
          const location = normalize(raw, ['location', 'Location']);
          const instructorName = normalize(raw, ['instructorName', 'Instructor', 'instructor']);
          const capacityStr = normalize(raw, ['capacity', 'Capacity'], '0');
          const idFromCsv = normalize(raw, ['id', 'ID', 'Cohort ID', 'cohort id', 'cohortId']);

          if (!name || !rawCourse) {
            console.warn('Skipping row - missing name or course:', { name, rawCourse, row });
            continue;
          }

          // Resolve course by id, courseId, or name
          const resolvedCourse = courses.find(c =>
            c.id === rawCourse ||
            c.courseId === rawCourse ||
            (c.name && c.name.toLowerCase() === rawCourse.toLowerCase())
          );
          if (!resolvedCourse) {
            console.warn('Skipping row - course not found for:', rawCourse);
            continue;
          }
          const normalizedCourseId = resolvedCourse.courseId || resolvedCourse.id;

          // Build final cohort object and assign sequential ID if missing
          const base: Cohort = {
            id: idFromCsv || '',
            name,
            courseId: normalizedCourseId || '',
            notes,
            status: status || 'Active',
            startDate,
            endDate,
            startTime,
            endTime,
            capacity: parseInt(capacityStr || '0', 10) || 0,
            members: [],
            instructorName,
            location
          };

          if (!base.id) {
            // Sequential ID by course prefix (first 4 chars of course name, padded)
            let prefix = (resolvedCourse.name || '').replace(/\s/g, '').toUpperCase().slice(0, 4);
            if (prefix.length < 4) prefix = prefix.padEnd(4, 'X');

            // Consider existing + already imported in this batch
            const existing = [...cohorts, ...importedCohorts].filter(c =>
              (c.courseId === normalizedCourseId) && typeof c.id === 'string' && c.id.startsWith(prefix)
            );
            let maxSeq = 0;
            existing.forEach(c => {
              const m = c.id.match(new RegExp(`^${prefix}(\\\d{4})$`));
              if (m) {
                const n = parseInt(m[1], 10);
                if (!isNaN(n) && n > maxSeq) maxSeq = n;
              }
            });
            const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
            base.id = `${prefix}${nextSeq}`;
          }

          importedCohorts.push(base);
        }

        setCohorts((prev: Cohort[]) => [...prev, ...importedCohorts]);
        
        // Persist to backend
        for (const cohort of importedCohorts) {
          try {
            await fetch('/api/dashboard/services/cohorts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cohort),
              credentials: 'include'
            });
          } catch (error) {
            console.error('Failed to save cohort:', error);
          }
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    };

  const handleExport = () => {
    const csvData = cohorts.map(cohort => ({
      'Cohort ID': cohort.id,
      'Cohort Name': cohort.name,
      'Course ID': cohort.courseId,
      'Status': cohort.status || 'Active',
      'Start Date': cohort.startDate || '',
      'End Date': cohort.endDate || '',
      'Location': cohort.location || '',
      'Instructor': cohort.instructorName || '',
      'Capacity': cohort.capacity,
      'Members': cohort.members.length,
      'Start Time': cohort.startTime || '',
      'End Time': cohort.endTime || '',
      'Notes': cohort.notes || ''
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'cohorts.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
        <Input
          placeholder="Search cohorts, courses, instructors..."
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
              <span
                className="relative inline-flex text-[color:var(--filter-color)] transition-colors duration-200 group-hover:text-white"
                style={{ "--filter-color": primaryColor } as React.CSSProperties}
              >
                <Filter className="h-3.5 w-3.5" />
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
          <PopoverContent 
            className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg z-50" 
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 font-semibold text-sm">Filter by Course</div>
                <FilterDropdownWithCheckboxes
                  options={(() => {
                    const uniqueCourses = courses.reduce((acc: Course[], course) => {
                      const identifier = course.courseId || course.id;
                      const existingCourse = acc.find(c => 
                        (c.courseId || c.id) === identifier || c.name === course.name
                      );
                      if (!existingCourse) {
                        acc.push(course);
                      }
                      return acc;
                    }, []);
                    return uniqueCourses.map(course => ({ 
                      value: course.name, 
                      label: course.name 
                    }));
                  })()}
                  value={pendingFilters.course}
                  onChange={(values) => setPendingFilters(prev => ({ ...prev, course: values }))}
                  placeholder="All Courses"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Filter by Location</div>
                <FilterDropdownWithCheckboxes
                  options={(() => {
                    const cohortLocations = cohorts
                      .map(cohort => cohort.location)
                      .filter((location): location is string => Boolean(location));
                    
                    const courseLocations = courses
                      .map(course => (course as any).location)
                      .filter((location): location is string => Boolean(location));
                    
                    const allLocations = Array.from(new Set([...cohortLocations, ...courseLocations]));
                    
                    const fallbackLocations = [
                      "Studio A", "Pool Area", "Music Room", "Classroom 101", 
                      "Basketball Court", "Dance Studio", "Virtual - Zoom",
                      "Virtual - Microsoft Teams", "Virtual - Google Meet", 
                      "Virtual - WebEx", "Virtual - Other"
                    ];
                    
                    const availableLocations = allLocations.length > 0 ? allLocations : fallbackLocations;
                    return availableLocations.map(location => ({ 
                      value: location, 
                      label: location 
                    }));
                  })()}
                  value={pendingFilters.location}
                  onChange={(values) => setPendingFilters(prev => ({ ...prev, location: values }))}
                  placeholder="All Locations"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Filter by Status</div>
                <FilterDropdownWithCheckboxes
                  options={STATUS_OPTIONS.map(status => ({ value: status, label: status }))}
                  value={pendingFilters.status}
                  onChange={(values) => setPendingFilters(prev => ({ ...prev, status: values }))}
                  placeholder="All Statuses"
                  className="w-full"
                  showFooterActions={false}
                />
              </div>

              <div>
                <div className="mb-2 font-semibold text-sm">Capacity Range</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 text-sm border rounded-md"
                    placeholder="Min"
                    min="0"
                    value={pendingFilters.capacity[0] || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setPendingFilters((prev: any) => ({
                        ...prev,
                        capacity: [value.toString(), prev.capacity[1] || '999'],
                      }));
                    }}
                  />
                  <span className="text-sm text-gray-500 dark:text-white">to</span>
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 text-sm border rounded-md"
                    placeholder="Max"
                    min="0"
                    value={pendingFilters.capacity[1] || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 999;
                      setPendingFilters((prev: any) => ({
                        ...prev,
                        capacity: [prev.capacity[0] || '0', value.toString()],
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                size="sm"
                className="flex-1 text-white"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                onClick={() => {
                  console.log('Applying filters:', pendingFilters);
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
                  const clearedFilters = { course: [], location: [], capacity: [], status: [] };
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
              {(() => {
                const label = [
                  { value: "cohortId", label: "Cohort ID" },
                  { value: "name", label: "Cohort Name" },
                  { value: "courseName", label: "Course Name" },
                  { value: "capacity", label: "Capacity" },
                  { value: "members", label: "Members Count" },
                ].find(o => o.value === sortBy)?.label;
                return label ? <span className="ml-1 text-xs text-gray-600 dark:text-white group-hover:text-white">{label}</span> : null;
              })()}
              {sortOrder === "asc" ? <ArrowUp className="ml-2 h-3 w-3 group-hover:text-white" /> : <ArrowDown className="ml-2 h-3 w-3 group-hover:text-white" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "cohortId", label: "Cohort ID" },
              { value: "name", label: "Cohort Name" },
              { value: "courseName", label: "Course Name" },
              { value: "capacity", label: "Capacity" },                              
              { value: "members", label: "Members Count" },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                }}
                className="flex items-center justify-between"
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
              className="flex items-center justify-between"
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
              className="flex items-center justify-between"
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
        <div className="flex border rounded-md">
           <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-r-none"
            style={viewMode === "list" ? { backgroundColor: primaryColor, color: 'white' } : {}}
            onMouseEnter={(e) => viewMode === "list" ? e.currentTarget.style.backgroundColor = `${primaryColor}dd` : null}
            onMouseLeave={(e) => viewMode === "list" ? e.currentTarget.style.backgroundColor = primaryColor : null}
           
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
            className="rounded-l-none border-l"
            style={viewMode === "grid" ? { backgroundColor: primaryColor, color: 'white' } : {}}
            onMouseEnter={(e) => viewMode === "grid" ? e.currentTarget.style.backgroundColor = `${primaryColor}dd` : null}
            onMouseLeave={(e) => viewMode === "grid" ? e.currentTarget.style.backgroundColor = primaryColor : null}
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

        {/* Import/Export Buttons */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            id="import-cohort-csv-input"
            type="file"
            accept="text/csv,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-cohort-csv-input')?.click()}
            title="Upload"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExport ? onExport : handleExport}
            title="Download"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
            <span className="text-xs text-gray-600 dark:text-white ml-1">({selectedCount})</span>
          </Button>

          {/* Add Cohorts Button */}
          <Button
            size="sm"
            onClick={onAddCohort}
            title="Add New Cohort"
            className="w-full sm:w-auto"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Cohorts
          </Button>
        </div>
      </div>
    </div>
  )
}
