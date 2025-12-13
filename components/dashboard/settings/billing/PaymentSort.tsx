"use client"

import { Button } from "@/components/dashboard/ui/button"
import { ArrowUp, ArrowDown, ArrowUpDown, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/dashboard/ui/dropdown-menu"

interface PaymentSortProps {
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
}

export function PaymentSort({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: PaymentSortProps) {
  const sortFields = [
    { value: "date", label: "Date" },
    { value: "amount", label: "Amount" },
    { value: "academyName", label: "Academy Name" },
    { value: "transactionId", label: "Transaction ID" },
  ];

  const currentSortLabel = sortFields.find(field => field.value === sortBy)?.label || "Sort By";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 flex items-center gap-1"
          title="Sort"
        >
          <ArrowUpDown className="h-3 w-3" />
          <span className="ml-1 text-xs">{currentSortLabel}</span>
          {sortOrder === "asc" ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-1 h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        {sortFields.map((field) => (
          <DropdownMenuItem
            key={field.value}
            onClick={() => setSortBy(field.value)}
            className={sortBy === field.value ? "bg-purple-50" : ""}
          >
            <span>{field.label}</span>
            {sortBy === field.value && (
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
  );
}
