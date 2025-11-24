"use client";

import React, { useMemo, useRef, useState } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu";
import { ArrowUpDown, Check, Download, Filter, Search, X } from "lucide-react";

import type { CoursePaymentSummary } from "@/types/dashboard/payment";
import { format as formatDateFns } from 'date-fns';
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal";

// Grid icon component for column selector
function GridIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="10" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="17" y="3" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="3" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="17" y="10" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="3" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="10" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
      <rect x="17" y="17" width="5" height="5" rx="1.5" fill="#7C3AED" />
    </svg>
  );
}

interface CourseCohortFiltersProps {
  courseSummaries: CoursePaymentSummary[];
  setFilteredCourseSummaries?: React.Dispatch<React.SetStateAction<CoursePaymentSummary[]>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  onExport?: () => void;
  displayedColumns?: string[];
  setDisplayedColumns?: (cols: string[]) => void;
  viewMode?: 'list' | 'grid';
  setViewMode?: React.Dispatch<React.SetStateAction<'list' | 'grid'>>;
}

type Filters = {
  statuses: string[];
  collectionRateRanges: string[];
  studentCountRanges: string[];
  outstandingAmountRanges: string[];
};

export default function CourseCohortFilters({
  courseSummaries,
  setFilteredCourseSummaries,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onExport,
  displayedColumns,
  setDisplayedColumns,
  viewMode = 'list',
  setViewMode,
}: CourseCohortFiltersProps) {
  const { currency } = useCurrency();
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Column management
  const courseColumns = [
    'CourseID',
    'Course Name',
    'Students',
    `Total Amount (${currency})`,
    `Received (${currency})`,
    `Outstanding (${currency})`,
    'Collection Rate',
    'Status'
  ];
  const defaultDisplayedColumns = ['CourseID', 'Course Name', 'Students', `Total Amount (${currency})`, `Received (${currency})`, `Outstanding (${currency})`, 'Collection Rate', 'Status'];
  const currentDisplayedColumns = displayedColumns || defaultDisplayedColumns;
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Hydrate persisted column selections
  React.useEffect(() => {
    if (typeof window === 'undefined' || !setDisplayedColumns) return;
    try {
      const raw = localStorage.getItem('courseDisplayedColumns');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const sanitized = arr.filter((c: string) => courseColumns.includes(c));
          
          // Always ensure fixed columns are included
          const startFixed = ['CourseID', 'Course Name'];
          
          [...startFixed].forEach(col => {
            if (!sanitized.includes(col) && courseColumns.includes(col)) {
              sanitized.push(col);
            }
          });
          
          // Reorder: start fixed + user columns
          const userColumns = sanitized.filter(col => !startFixed.includes(col));
          const reordered = [
            ...startFixed.filter(col => sanitized.includes(col)),
            ...userColumns
          ];
          
          setDisplayedColumns(reordered);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute filter options from current dataset
  const statuses = useMemo(() => {
    const set = new Set<string>();
    courseSummaries.forEach(c => {
      if (c.status) {
        set.add(c.status);
      }
    });
    return Array.from(set);
  }, [courseSummaries]);

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    statuses: [],
    collectionRateRanges: [],
    studentCountRanges: [],
    outstandingAmountRanges: [],
  });
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    statuses: [],
    collectionRateRanges: [],
    studentCountRanges: [],
    outstandingAmountRanges: [],
  });

  // Filtering + sorting logic
  const filtered = useMemo(() => {
    let data = courseSummaries || [];
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(c => {
        const courseIdMatch = c.courseId?.toLowerCase().includes(q);
        const courseNameMatch = c.courseName?.toLowerCase().includes(q);
        
        // Also search in cohorts
        const cohortMatch = c.cohorts?.some(cohort => 
          cohort.cohortId?.toLowerCase().includes(q) || 
          cohort.cohortName?.toLowerCase().includes(q)
        );
        
        return courseIdMatch || courseNameMatch || cohortMatch;
      });
    }

    // Status filter
    if (selectedFilters.statuses.length) {
      data = data.filter(c => {
        return selectedFilters.statuses.includes(c.status || "");
      });
    }

    // Collection Rate filter
    if (selectedFilters.collectionRateRanges.length) {
      data = data.filter(c => {
        const rate = c.collectionRate || 0;
        return selectedFilters.collectionRateRanges.some(range => {
          if (range === '80-100') return rate >= 80;
          if (range === '50-80') return rate >= 50 && rate < 80;
          if (range === '0-50') return rate >= 0 && rate < 50;
          return false;
        });
      });
    }

    // Student Count filter
    if (selectedFilters.studentCountRanges.length) {
      data = data.filter(c => {
        const count = c.totalStudents || 0;
        return selectedFilters.studentCountRanges.some(range => {
          if (range === '50+') return count >= 50;
          if (range === '20-49') return count >= 20 && count < 50;
          if (range === '10-19') return count >= 10 && count < 20;
          if (range === '1-9') return count >= 1 && count < 10;
          return false;
        });
      });
    }

    // Outstanding Amount filter
    if (selectedFilters.outstandingAmountRanges.length) {
      data = data.filter(c => {
        const amount = c.outstandingAmount || 0;
        return selectedFilters.outstandingAmountRanges.some(range => {
          if (range === '100000+') return amount >= 100000;
          if (range === '50000-99999') return amount >= 50000 && amount < 100000;
          if (range === '10000-49999') return amount >= 10000 && amount < 50000;
          if (range === '0-9999') return amount >= 0 && amount < 10000;
          return false;
        });
      });
    }

    // Sort
    const sorted = [...data].sort((a, b) => {
      let vA: any;
      let vB: any;
      switch (sortBy) {
        case "courseId":
          vA = a.courseId; vB = b.courseId; break;
        case "courseName":
          vA = a.courseName; vB = b.courseName; break;
        case "totalStudents":
          vA = a.totalStudents; vB = b.totalStudents; break;
        case "totalAmount":
          vA = a.totalAmount; vB = b.totalAmount; break;
        case "receivedAmount":
          vA = a.receivedAmount; vB = b.receivedAmount; break;
        case "outstandingAmount":
          vA = a.outstandingAmount; vB = b.outstandingAmount; break;
        case "collectionRate":
          vA = a.collectionRate; vB = b.collectionRate; break;
        case "status":
          vA = a.status; vB = b.status; break;
        default:
          vA = (a as any)[sortBy];
          vB = (b as any)[sortBy];
      }
      if (typeof vA === "string") vA = vA.toLowerCase();
      if (typeof vB === "string") vB = vB.toLowerCase();
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [courseSummaries, searchTerm, selectedFilters, sortBy, sortOrder]);

  React.useEffect(() => {
    if (setFilteredCourseSummaries) setFilteredCourseSummaries(filtered);
  }, [filtered, setFilteredCourseSummaries]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students, courses, cohorts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
        {/* Filter Button and Panel */}
        <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
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
            className="w-96 p-0 bg-white border border-gray-200 shadow-lg z-50"
            onCloseAutoFocus={e => e.preventDefault()}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
            onOpenAutoFocus={e => { e.preventDefault(); firstCheckboxRef.current?.focus(); }}
          >
            <div className="max-h-96 overflow-y-auto p-4 bg-white">
              {!!statuses.length && (
                <>
                  <div className="mb-2 font-semibold text-sm">Filter by Status</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {statuses.map(status => (
                      <label key={status} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pendingFilters.statuses.includes(String(status))}
                          onChange={() => {
                            setPendingFilters(prev => ({
                              ...prev,
                              statuses: prev.statuses.includes(String(status))
                                ? prev.statuses.filter(s => s !== String(status))
                                : [...prev.statuses, String(status)],
                            }));
                          }}
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Collection Rate Filter */}
              <div className="mb-2 font-semibold text-sm">Filter by Collection Rate</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['80-100', '50-80', '0-50'].map(range => (
                  <label key={range} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pendingFilters.collectionRateRanges.includes(range)}
                      onChange={() => {
                        setPendingFilters(prev => ({
                          ...prev,
                          collectionRateRanges: prev.collectionRateRanges.includes(range)
                            ? prev.collectionRateRanges.filter(r => r !== range)
                            : [...prev.collectionRateRanges, range],
                        }));
                      }}
                    />
                    {range === '80-100' && '≥80% (Excellent)'}
                    {range === '50-80' && '50-79% (Good)'}
                    {range === '0-50' && '<50% (Needs Attention)'}
                  </label>
                ))}
              </div>

              {/* Student Count Filter */}
              <div className="mb-2 font-semibold text-sm">Filter by Student Count</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['50+', '20-49', '10-19', '1-9'].map(range => (
                  <label key={range} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pendingFilters.studentCountRanges.includes(range)}
                      onChange={() => {
                        setPendingFilters(prev => ({
                          ...prev,
                          studentCountRanges: prev.studentCountRanges.includes(range)
                            ? prev.studentCountRanges.filter(r => r !== range)
                            : [...prev.studentCountRanges, range],
                        }));
                      }}
                    />
                    {range === '50+' && '50+ students'}
                    {range === '20-49' && '20-49 students'}
                    {range === '10-19' && '10-19 students'}
                    {range === '1-9' && '1-9 students'}
                  </label>
                ))}
              </div>

              {/* Outstanding Amount Filter */}
              <div className="mb-2 font-semibold text-sm">Filter by Outstanding Amount ({currency})</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['100000+', '50000-99999', '10000-49999', '0-9999'].map(range => (
                  <label key={range} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pendingFilters.outstandingAmountRanges.includes(range)}
                      onChange={() => {
                        setPendingFilters(prev => ({
                          ...prev,
                          outstandingAmountRanges: prev.outstandingAmountRanges.includes(range)
                            ? prev.outstandingAmountRanges.filter(r => r !== range)
                            : [...prev.outstandingAmountRanges, range],
                        }));
                      }}
                    />
                    <span>
                      {range === '100000+' && '1L+'}
                      {range === '50000-99999' && '50K-99K'}
                      {range === '10000-49999' && '10K-49K'}
                      {range === '0-9999' && '<10K'}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between gap-2 mt-4">
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
                    setPendingFilters({ 
                      statuses: [], 
                      collectionRateRanges: [], 
                      studentCountRanges: [], 
                      outstandingAmountRanges: [] 
                    });
                    setSelectedFilters({ 
                      statuses: [], 
                      collectionRateRanges: [], 
                      studentCountRanges: [], 
                      outstandingAmountRanges: [] 
                    });
                    setFilterDropdownOpen(false);
                    setFilterAction("cleared");
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Field Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" title="Sort" size="sm" className="h-9 flex items-center gap-1 group">
                         <ArrowUpDown className="mr-2 h-4 w-4 group-hover:text-white" />
              <span className="ml-1 text-xs text-gray-600 group-hover:text-white">{(() => {
                const label = [
                  { value: "courseId", label: "Course ID" },
                  { value: "courseName", label: "Course Name" },
                  { value: "totalStudents", label: "Students" },
                  { value: "totalAmount", label: "Total Amount" },
                  { value: "receivedAmount", label: "Received" },
                  { value: "outstandingAmount", label: "Outstanding" },
                  { value: "collectionRate", label: "Collection Rate" },
                  { value: "status", label: "Status" },
                ].find(o => o.value === sortBy)?.label;
                return label || "Sort";
              })()}</span>
              <span className="ml-2 text-xs text-gray-500 group-hover:text-white">{sortOrder === "asc" ? "↑" : "↓"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "courseId", label: "Course ID" },
              { value: "courseName", label: "Course Name" },
              { value: "totalStudents", label: "Students" },
              { value: "totalAmount", label: "Total Amount" },
              { value: "receivedAmount", label: "Received" },
              { value: "outstandingAmount", label: "Outstanding" },
              { value: "collectionRate", label: "Collection Rate" },
              { value: "status", label: "Status" },
            ].map(option => (
              <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                {option.label}
                {sortBy === option.value && <span className="ml-2">✔</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSortOrder("asc")}>Ascending ↑ {sortOrder === "asc" && <span className="ml-2">✔</span>}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOrder("desc")}>Descending ↓ {sortOrder === "desc" && <span className="ml-2">✔</span>}</DropdownMenuItem>
                      </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle (match Achievements segmented buttons) */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode?.('list')}
            className={`rounded-r-none ${viewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            title="List View"
            aria-label="List View"
          >
            <div className="flex flex-col gap-0.5 w-4 h-4">
              <div className="bg-current h-0.5 rounded-sm" />
              <div className="bg-current h-0.5 rounded-sm" />
              <div className="bg-current h-0.5 rounded-sm" />
            </div>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode?.('grid')}
            className={`rounded-l-none border-l ${viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            title="Grid View"
            aria-label="Grid View"
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
            </div>
          </Button>
        </div>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          title="Export course & cohort data"
          onClick={onExport}
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>
      {/* End of top controls (search + actions) */}
      </div>

      {/* Course count */}
      <div className="flex items-center justify-between mb-4 bg-purple-50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-purple-600 font-medium text-sm">
            {filtered.length}
          </span>
          <span className="text-purple-600 text-sm">
            course{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        {/* Column Selector Button */}
        <button
          className="w-10 h-10 rounded-xl border border-purple-200 bg-[#fef2ff] hover:bg-purple-100 flex items-center justify-center shadow-sm hover:shadow transition-colors"
          onClick={() => setShowColumnSelector(true)}
          title="Displayed Columns"
          aria-label="Edit displayed course columns"
        >
          <GridIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Column Selector Modal */}
      <ColumnSelectorModal
        open={showColumnSelector}
        columns={courseColumns}
        displayedColumns={currentDisplayedColumns}
        setDisplayedColumns={(cols) => {
          if (setDisplayedColumns) {
            setDisplayedColumns(cols);
          }
        }}
        onClose={() => setShowColumnSelector(false)}
        onSave={() => setShowColumnSelector(false)}
        onReset={() => {
          if (setDisplayedColumns) {
            setDisplayedColumns(defaultDisplayedColumns);
          }
        }}
        storageKeyPrefix="course"
        fixedColumns={["CourseID", "Course Name"]}
      />
    </div>
  );
}

