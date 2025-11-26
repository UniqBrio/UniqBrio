"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { FilterDropdown } from "@/components/dashboard/ui/staff/filter-dropdown"
import { useCustomColors } from "@/lib/use-custom-colors"

interface FilterState {
  status: string[]
  paymentMethod: string[]
}

interface SalesFilterDropdownProps {
  filters: FilterState
  onApply: (filters: FilterState) => void
  onClear: () => void
  sales: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesFilterDropdown({
  filters,
  onApply,
  onClear,
  sales,
  open,
  onOpenChange,
}: SalesFilterDropdownProps) {
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters)
  const [permanentFilterIcon, setPermanentFilterIcon] = useState<"apply" | "clear" | null>(null)
  const { primaryColor } = useCustomColors()

  // Sync pending filters with selected filters when they change
  useEffect(() => {
    setPendingFilters(filters)
  }, [filters])

  // Get unique values from data
  const uniqueStatuses = Array.from(new Set(sales.map(s => s.status).filter(Boolean))).sort()
  const uniquePaymentMethods = Array.from(new Set(sales.map(s => s.paymentMethod).filter(Boolean))).sort()

  const handleApply = () => {
    onApply(pendingFilters)
    onOpenChange(false)
    setPermanentFilterIcon("apply")
  }

  const handleClear = () => {
    const cleared: FilterState = {
      status: [],
      paymentMethod: [],
    }
    setPendingFilters(cleared)
    onClear()
    onOpenChange(false)
    setPermanentFilterIcon("clear")
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex items-center gap-1 relative"
              >
                <span className="relative inline-block">
                  <Filter className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                  {permanentFilterIcon === "apply" && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="#22C55E"/>
                        <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {permanentFilterIcon === "clear" && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="#EF4444"/>
                        <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Filter</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 p-4 filter-panel">
        {/* Status Filter */}
        <div className="mb-4">
          <div className="mb-2 font-semibold text-sm">Filter by Status</div>
          <FilterDropdown
            options={uniqueStatuses.map(status => ({ value: status, label: status }))}
            value={pendingFilters.status}
            onChange={(values) => setPendingFilters({ ...pendingFilters, status: values })}
            placeholder="Select statuses..."
            title="Status"
            showTitle={false}
            className="w-full"
          />
        </div>

        {/* Payment Method Filter */}
        <div className="mb-4">
          <div className="mb-2 font-semibold text-sm">Filter by Payment Method</div>
          <FilterDropdown
            options={uniquePaymentMethods.map(method => ({ value: method, label: method }))}
            value={pendingFilters.paymentMethod}
            onChange={(values) => setPendingFilters({ ...pendingFilters, paymentMethod: values })}
            placeholder="Select payment methods..."
            title="Payment Methods"
            showTitle={false}
            className="w-full"
          />
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleClear} className="text-xs">
            Clear All
          </Button>
          <Button size="sm" onClick={handleApply} className="text-white text-xs" style={{ backgroundColor: primaryColor }}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
