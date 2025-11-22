"use client"

import React, { useState } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Filter, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { Label } from "@/components/dashboard/ui/label";

interface FilterButtonProps {
  selectedYear?: number;
  setSelectedYear?: (year: number) => void;
  disabled?: boolean;
}

export default function FilterButton({
  selectedYear,
  setSelectedYear,
  disabled = false,
}: FilterButtonProps) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);

  // Explicit toggle handler
  const toggleFilterDropdown = React.useCallback(() => {
    setFilterDropdownOpen(prev => !prev);
  }, []);

  const applyFilters = () => {
    setFilterDropdownOpen(false);
    setFilterAction("applied");
  };

  const clearFilters = () => {
    // Reset to current year
    setSelectedYear?.(new Date().getFullYear());
    setFilterDropdownOpen(false);
    setFilterAction("cleared");
  };

  return (
    <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex items-center gap-1 relative"
          aria-label="Filter options"
          title="Filter"
          tabIndex={0}
          onClick={(e) => { e.preventDefault(); toggleFilterDropdown(); }}
          disabled={disabled}
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
      <PopoverContent
        className="w-60 p-0 filter-panel"
        onCloseAutoFocus={e => e.preventDefault()}
        onEscapeKeyDown={() => setFilterDropdownOpen(false)}
        onInteractOutside={() => setFilterDropdownOpen(false)}
      >
        <div className="p-4">
          {/* Year Filter Only */}
          <div className="mb-4">
            <Label htmlFor="year-select" className="text-sm font-medium">Select Year</Label>
            <Select value={selectedYear?.toString()} onValueChange={(value) => setSelectedYear?.(parseInt(value))}>
              <SelectTrigger className="h-9 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                  Last Year ({new Date().getFullYear() - 1})
                </SelectItem>
                <SelectItem value={new Date().getFullYear().toString()}>
                  Current Year ({new Date().getFullYear()})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between gap-2 mt-4">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              tabIndex={0}
              role="button"
              aria-label="Apply selected filters"
              onClick={applyFilters}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              tabIndex={0}
              role="button"
              aria-label="Clear filters"
              onClick={clearFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}