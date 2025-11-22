"use client"

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { Label } from "@/components/dashboard/ui/label";

interface MonthYearFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  label?: string;
  className?: string;
}

export function MonthYearFilter({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  label = "Period",
  className = ""
}: MonthYearFilterProps) {
  // Generate year options (current year and previous year - 2 years total)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1];

  // Month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label className="text-sm font-medium whitespace-nowrap">{label}</Label>
      <div className="flex gap-1">
        <Select value={selectedMonth.toString()} onValueChange={(value) => onMonthChange(parseInt(value))}>
          <SelectTrigger className="w-[110px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]" hideScrollButtons>
            <div className="max-h-[240px] overflow-y-auto">
              {monthOptions.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label.slice(0, 3)} {/* Show abbreviated month names */}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]" hideScrollButtons>
            <div className="max-h-[200px] overflow-y-auto">
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}