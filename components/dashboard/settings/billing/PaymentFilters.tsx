"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Filter, Check, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import type { PaymentFilters } from "./invoice-types"
import MultiSelectDropdown from "./MultiSelectDropdown"

interface PaymentFiltersProps {
  selectedFilters: PaymentFilters;
  setSelectedFilters: (filters: PaymentFilters) => void;
  paymentMethodOptions?: string[];
}

export function PaymentFiltersComponent({
  selectedFilters,
  setSelectedFilters,
  paymentMethodOptions = ["Card", "UPI", "Net Banking", "Bank Transfer"],
}: PaymentFiltersProps) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [pendingFilters, setPendingFilters] = useState<PaymentFilters>(selectedFilters);

  // Sync pendingFilters when popover opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPendingFilters(selectedFilters);
    }
    setFilterDropdownOpen(open);
  };

  const hasActiveFilters = () => {
    return (
      selectedFilters.paymentMethod.length > 0 ||
      selectedFilters.dateRange.start !== "" ||
      selectedFilters.dateRange.end !== "" ||
      selectedFilters.amountRange[0] > 0 ||
      selectedFilters.amountRange[1] < 100000
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedFilters.paymentMethod.length > 0) count++;
    if (selectedFilters.dateRange.start !== "" || selectedFilters.dateRange.end !== "") count++;
    if (selectedFilters.amountRange[0] > 0 || selectedFilters.amountRange[1] < 100000) count++;
    return count;
  };

  const applyFilters = () => {
    setSelectedFilters(pendingFilters);
    setFilterDropdownOpen(false);
    setFilterAction("apply");
  };

  const clearFilters = () => {
    const clearedFilters: PaymentFilters = {
      paymentMethod: [],
      dateRange: { start: "", end: "" },
      amountRange: [0, 100000],
    };
    setPendingFilters(clearedFilters);
    setSelectedFilters(clearedFilters);
    setFilterDropdownOpen(false);
    setFilterAction("clear");
  };

  const toggleSelection = (
    list: string[],
    value: string
  ) => {
    const exists = list.includes(value);
    setPendingFilters({
      ...pendingFilters,
      paymentMethod: exists ? list.filter(v => v !== value) : [...list, value]
    });
  };

  return (
    <Popover 
      open={filterDropdownOpen} 
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex items-center gap-1 relative"
          aria-label="Filter options"
          title="Filter"
          tabIndex={0}
        >
          <span className="relative inline-flex">
            <Filter className="h-3.5 w-3.5 text-purple-500" />
            {filterAction === "apply" && (
              <span className="absolute -top-1 -right-1">
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                  <Check className="w-2 h-2 text-white" />
                </span>
              </span>
            )}
            {filterAction === "clear" && (
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
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={() => setFilterDropdownOpen(false)}
        onInteractOutside={() => setFilterDropdownOpen(false)}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div className="max-h-[32rem] overflow-y-auto p-4">
          {/* Payment Method Filter */}
          <MultiSelectDropdown
            label="Payment Method"
            options={paymentMethodOptions}
            selected={pendingFilters.paymentMethod}
            onChange={(next) => setPendingFilters({ ...pendingFilters, paymentMethod: next })}
            className="mb-3"
          />

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700">Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="payment-startDate" className="text-xs text-gray-600">From</Label>
                <Input
                  id="payment-startDate"
                  type="date"
                  value={pendingFilters.dateRange.start}
                  onChange={(e) => setPendingFilters({
                    ...pendingFilters,
                    dateRange: { ...pendingFilters.dateRange, start: e.target.value }
                  })}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <Label htmlFor="payment-endDate" className="text-xs text-gray-600">To</Label>
                <Input
                  id="payment-endDate"
                  type="date"
                  value={pendingFilters.dateRange.end}
                  onChange={(e) => setPendingFilters({
                    ...pendingFilters,
                    dateRange: { ...pendingFilters.dateRange, end: e.target.value }
                  })}
                  className="text-xs h-8"
                />
              </div>
            </div>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700">
              Amount Range: ₹{pendingFilters.amountRange[0].toLocaleString()} - ₹{pendingFilters.amountRange[1].toLocaleString()}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={pendingFilters.amountRange[0]}
                onChange={(e) => setPendingFilters({
                  ...pendingFilters,
                  amountRange: [Number(e.target.value), pendingFilters.amountRange[1]]
                })}
                className="text-xs h-8"
              />
              <Input
                type="number"
                placeholder="Max"
                value={pendingFilters.amountRange[1]}
                onChange={(e) => setPendingFilters({
                  ...pendingFilters,
                  amountRange: [pendingFilters.amountRange[0], Number(e.target.value)]
                })}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={applyFilters}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
