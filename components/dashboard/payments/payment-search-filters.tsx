"use client";

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu";
import { ArrowUpDown, ArrowUp, ArrowDown, Check, Download, Filter, Search, X } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors"; // Added custom colors hook
import { sortButtonClass, getSortButtonStyle } from "@/lib/dashboard/sort-button-style"; // Added shared styling helpers
import MultiSelectDropdown from "@/components/dashboard/payments/multi-select-dropdown";
import { FormattedDateInput } from "@/components/dashboard/common/formatted-date-input";
import type { Payment } from "@/types/dashboard/payment";
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal";
import { useCurrency } from "@/contexts/currency-context";

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
  paymentCategories: string[];
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
  const { currency } = useCurrency();
  const { primaryColor } = useCustomColors();
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
    `Course Fee (${currency})`,
    `Course Reg Fee (${currency})`,
    `Student Reg Fee (${currency})`,
    `Total To Be Paid (${currency})`,
    `Total Paid (${currency})`,
    `Balance (${currency})`,
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
  const defaultDisplayedColumns = ['Student ID', 'Student Name', 'Enrolled Course', 'Cohort', 'Payment Category', `Course Fee (${currency})`, `Course Reg Fee (${currency})`, `Student Reg Fee (${currency})`, `Total To Be Paid (${currency})`, `Total Paid (${currency})`, `Balance (${currency})`, 'Status', 'Start Date', 'End Date', 'Next Due Date', 'Invoice', 'Send Reminder', 'Actions'];
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

  // Predefined statuses
  const statuses = ['Completed', 'Partial', 'Recurring', 'Pending'];

  // Predefined payment categories
  const paymentCategories = [
    'Monthly subscription',
    'Monthly subscription with discounts',
    'One-time',
    'One-time with installments',
    'Recurring'
  ];

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    courses: [],
    statuses: [],
    paymentCategories: [],
    dateRange: { start: "", end: "" },
  });
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    courses: [],
    statuses: [],
    paymentCategories: [],
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

    // Payment Category filter
    if (selectedFilters.paymentCategories.length) {
      data = data.filter(p => {
        return selectedFilters.paymentCategories.includes(p.studentCategory || "");
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
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
              <MultiSelectDropdown
                label="Enrolled Course"
                options={courses}
                selected={pendingFilters.courses}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, courses: next }))}
                className="mb-3"
              />

              <MultiSelectDropdown
                label="Filter by Status"
                options={statuses}
                selected={pendingFilters.statuses}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, statuses: next }))}
                className="mb-3"
              />

              <MultiSelectDropdown
                label="Filter by Payment Category"
                options={paymentCategories}
                selected={pendingFilters.paymentCategories}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, paymentCategories: next }))}
                className="mb-3"
              />

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
                    displayFormat="dd-MMM-yy"
                    placeholder="dd-mm-yyyy"
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
                    displayFormat="dd-MMM-yy"
                    placeholder="dd-mm-yyyy"
                    className="text-xs py-1"
                  />
                </div>
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
                    setPendingFilters({ courses: [], statuses: [], paymentCategories: [], dateRange: { start: "", end: "" } });
                    setSelectedFilters({ courses: [], statuses: [], paymentCategories: [], dateRange: { start: "", end: "" } });
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
            <Button
              variant="outline"
              title="Sort"
              size="sm"
              className={sortButtonClass}
              style={getSortButtonStyle(primaryColor)}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span className="ml-1 text-xs">
                {(() => {
                  const label = [
                    { value: "studentId", label: "Student ID" },
                    { value: "studentName", label: "Student Name" },
                    { value: "course", label: "Course" },
                    { value: "status", label: "Status" },
                    { value: "paidDate", label: "Paid Date" },
                  ].find(o => o.value === sortBy)?.label;
                  return label || "Sort";
                })()}
              </span>
              {sortOrder === "asc" ? (
                <ArrowUp className="ml-2 h-3 w-3" />
              ) : (
                <ArrowDown className="ml-2 h-3 w-3" />
              )}
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
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortOrder("asc")}>
              <span className="flex items-center gap-2">
                Ascending
                <ArrowUp className="h-4 w-4" />
              </span>
              {sortOrder === "asc" && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("desc")}>
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
