"use client";

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu";
import { ArrowUpDown, Check, Download, Filter, Search, X } from "lucide-react";
import MultiSelectDropdown from "@/components/dashboard/payments/multi-select-dropdown";
import { FormattedDateInput } from "@/components/dashboard/common/formatted-date-input";
import type { Payment } from "@/types/dashboard/payment";
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

interface PaymentSearchFiltersProps {
  payments: Payment[];
  setFilteredPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
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
  selectedIds?: string[];
  toggleSelect?: (id: string, checked: boolean) => void;
  toggleSelectAll?: (checked: boolean) => void;
}

type Filters = {
  courses: string[];
  statuses: string[];
  dateRange: { start: string; end: string };
};

export default function PaymentSearchFilters({
  payments,
  setFilteredPayments,
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
  selectedIds = [],
  toggleSelect,
  toggleSelectAll,
}: PaymentSearchFiltersProps) {
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Column management
  const paymentColumns = [
    'Student ID',
    'Student Name',
    'Enrolled Course',
    'Payment Category',
    'Cohort',
    'Course Type',
    'Course Reg Fee',
    'Student Reg Fee',
    'Course Fee (INR)',
    'Course Reg Fee (INR)',
    'Student Reg Fee (INR)',
    'Total To Be Paid (INR)',
    'Total Paid (INR)',
    'Balance (INR)',
    'Status',
    'Paid Date',
    'Start Date',
    'End Date',
    'Next Reminder Date',
    'Next Due Date',
    'Invoice',
    'Send Reminder',
    'Actions'
  ];
  const defaultDisplayedColumns = ['Student ID', 'Student Name', 'Enrolled Course', 'Cohort', 'Payment Category', 'Course Fee (INR)', 'Course Reg Fee (INR)', 'Student Reg Fee (INR)', 'Total To Be Paid (INR)', 'Total Paid (INR)', 'Balance (INR)', 'Status', 'Start Date', 'End Date', 'Next Due Date', 'Invoice', 'Send Reminder', 'Actions'];
  const currentDisplayedColumns = displayedColumns || defaultDisplayedColumns;
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Hydrate persisted column selections
  React.useEffect(() => {
    if (typeof window === 'undefined' || !setDisplayedColumns) return;
    try {
      const raw = localStorage.getItem('paymentDisplayedColumns');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const sanitized = arr.filter((c: string) => paymentColumns.includes(c));
          
          // Always ensure fixed columns are included
          const startFixed = ['Student ID', 'Student Name'];
          const endFixed = ['Actions'];
          
          [...startFixed, ...endFixed].forEach(col => {
            if (!sanitized.includes(col) && paymentColumns.includes(col)) {
              sanitized.push(col);
            }
          });
          
          // Reorder: start fixed + user columns + end fixed
          const userColumns = sanitized.filter(col => !startFixed.includes(col) && !endFixed.includes(col));
          const reordered = [
            ...startFixed.filter(col => sanitized.includes(col)),
            ...userColumns,
            ...endFixed.filter(col => sanitized.includes(col))
          ];
          
          setDisplayedColumns(reordered);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute filter options from current dataset
  const courses = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => {
      if (p.enrolledCourseName) {
        set.add(p.enrolledCourseName);
      }
    });
    return Array.from(set);
  }, [payments]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => {
      if (p.status) {
        set.add(p.status);
      }
    });
    return Array.from(set);
  }, [payments]);

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    courses: [],
    statuses: [],
    dateRange: { start: "", end: "" },
  });
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    courses: [],
    statuses: [],
    dateRange: { start: "", end: "" },
  });

  // Filtering + sorting logic
  const filtered = useMemo(() => {
    let data = payments || [];
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(p => {
        const nameMatch = p.studentName?.toLowerCase().includes(q);
        const courseMatch = p.enrolledCourseName?.toLowerCase().includes(q);
        const studentIdMatch = p.studentId?.toLowerCase().includes(q);
        return nameMatch || courseMatch || studentIdMatch;
      });
    }

    // Course filter
    if (selectedFilters.courses.length) {
      data = data.filter(p => {
        return selectedFilters.courses.includes(p.enrolledCourseName || "");
      });
    }

    // Status filter
    if (selectedFilters.statuses.length) {
      data = data.filter(p => {
        return selectedFilters.statuses.includes(p.status || "");
      });
    }

    // Date range on lastPaymentDate
    if (selectedFilters.dateRange.start || selectedFilters.dateRange.end) {
      const start = selectedFilters.dateRange.start ? new Date(selectedFilters.dateRange.start) : null;
      const end = selectedFilters.dateRange.end ? new Date(selectedFilters.dateRange.end) : null;
      data = data.filter(p => {
        if (!p.lastPaymentDate) return false;
        const d = new Date(p.lastPaymentDate);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    // Sort
    const sorted = [...data].sort((a, b) => {
      let vA: any;
      let vB: any;
      switch (sortBy) {
        case "studentId":
          vA = a.studentId; vB = b.studentId; break;
        case "studentName":
          vA = a.studentName; vB = b.studentName; break;
        case "course":
          vA = a.enrolledCourseName; vB = b.enrolledCourseName; break;
        case "status":
          vA = a.status; vB = b.status; break;
        case "paidDate":
          vA = a.lastPaymentDate; vB = b.lastPaymentDate; break;
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
  }, [payments, searchTerm, selectedFilters, sortBy, sortOrder]);

  React.useEffect(() => {
    if (setFilteredPayments) setFilteredPayments(filtered);
  }, [filtered, setFilteredPayments]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by student name or course name"
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
              className="h-9 flex items-center gap-1 relative"
              aria-label="Filter options"
              title="Filter"
              tabIndex={0}
            >
              <span className="relative inline-block">
                <Filter className="h-3.5 w-3.5 text-purple-500" />
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
            className="w-96 p-0"
            onCloseAutoFocus={e => e.preventDefault()}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
            onOpenAutoFocus={e => { e.preventDefault(); firstCheckboxRef.current?.focus(); }}
          >
            <div className="max-h-96 overflow-y-auto p-4">
              <MultiSelectDropdown
                label="Enrolled Course"
                options={courses}
                selected={pendingFilters.courses}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, courses: next }))}
                className="mb-3"
              />

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

              <div className="mb-2 font-semibold text-sm">Paid Date</div>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <FormattedDateInput
                    id="dateRangeStart"
                    value={pendingFilters.dateRange.start}
                    onChange={(isoDate) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: isoDate } }))}
                    max={(pendingFilters.dateRange.end && pendingFilters.dateRange.end < todayIso)
                      ? pendingFilters.dateRange.end
                      : todayIso}
                    displayFormat="dd-MMM-yyyy"
                    placeholder="From date"
                    className="text-xs py-1"
                  />
                </div>
                <span className="text-xs">to</span>
                <div className="w-32">
                  <FormattedDateInput
                    id="dateRangeEnd"
                    value={pendingFilters.dateRange.end}
                    onChange={(isoDate) => setPendingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: isoDate } }))}
                    min={pendingFilters.dateRange.start || undefined}
                    max={todayIso}
                    displayFormat="dd-MMM-yyyy"
                    placeholder="To date"
                    className="text-xs py-1"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 mt-4">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
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
                    setPendingFilters({ courses: [], statuses: [], dateRange: { start: "", end: "" } });
                    setSelectedFilters({ courses: [], statuses: [], dateRange: { start: "", end: "" } });
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
            <Button variant="outline" title="Sort" size="sm" className="h-9 flex items-center gap-1">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span className="ml-1 text-xs text-gray-600">{(() => {
                const label = [
                  { value: "studentId", label: "Student ID" },
                  { value: "studentName", label: "Student Name" },
                  { value: "course", label: "Course" },
                  { value: "status", label: "Status" },
                  { value: "paidDate", label: "Paid Date" },
                ].find(o => o.value === sortBy)?.label;
                return label || "Sort";
              })()}</span>
              <span className="ml-2 text-xs text-gray-500">{sortOrder === "asc" ? "↑" : "↓"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "studentId", label: "Student ID" },
              { value: "studentName", label: "Student Name" },
              { value: "course", label: "Course" },
              { value: "status", label: "Status" },
              { value: "paidDate", label: "Paid Date" },
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
          title={selectedIds.length ? `Export ${selectedIds.length} selected` : 'Export all payments'}
          onClick={onExport}
        >
          <Download className="mr-2 h-4 w-4" /> {selectedIds.length ? `Export (${selectedIds.length})` : 'Export'}
        </Button>
      </div>
      {/* End of top controls (search + actions) */}
      </div>

      {/* Payment count */}
      <div className="flex items-center justify-between mb-4 bg-purple-50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-purple-600 font-medium text-sm">
            {filtered.length}
          </span>
          <span className="text-purple-600 text-sm">
            payment{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        {/* Column Selector Button */}
        <button
          className="w-10 h-10 rounded-xl border border-purple-200 bg-[#fef2ff] hover:bg-purple-100 flex items-center justify-center shadow-sm hover:shadow transition-colors"
          onClick={() => setShowColumnSelector(true)}
          title="Displayed Columns"
          aria-label="Edit displayed payment columns"
        >
          <GridIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Column Selector Modal */}
      <ColumnSelectorModal
        open={showColumnSelector}
        columns={paymentColumns}
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
        storageKeyPrefix="payment"
        fixedColumns={["Student ID", "Student Name", "Actions"]}
      />
    </div>
  );
}
