"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select options" }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i: string) => i !== item))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="border rounded-md p-1 px-3 flex min-h-10 items-center text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((item: string) => (
                <Badge key={item} variant="secondary" className="flex items-center gap-1">
                  {options.find((option: MultiSelectOption) => option.value === item)?.label || item}
                  <button
                    className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
  <PopoverContent className="p-0 bg-popover" align="start">
        <Command>
          <div className="flex items-center px-3 pt-3 pb-1 gap-2">
            <CommandInput placeholder={placeholder} className="flex-1" />
            <div className="relative group">
              <button
                type="button"
                aria-label="Clear all selected types"
                onClick={() => onChange([])}
                className="p-1 rounded hover:bg-purple-100 transition-colors flex items-center justify-center"
              >
                {/* Filter icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17V13.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                {/* Red cross icon if any type is selected */}
                {selected.length > 0 && (
                  <svg className="absolute top-1 right-1 h-3 w-3 text-red-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="8" fill="currentColor" />
                    <path d="M5.5 5.5l5 5m0-5l-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              {/* Tooltip */}
              <span className="fixed px-2 py-1 text-xs text-white bg-purple-700 rounded opacity-0 group-hover:opacity-100 pointer-events-auto whitespace-nowrap z-[9999] shadow-lg" style={{ top: '60px', left: 'calc(50% + 120px)' }}>
                Deselect all selected types
              </span>
            </div>
          </div>
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto bg-popover">
              {options.map((option: MultiSelectOption) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value],
                    )
                    setOpen(true)
                  }}
                  className="focus:bg-orange-500 focus:text-white hover:bg-orange-500 hover:text-white"
                >
                  <div
                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                      selected.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50"
                    }`}
                  >
                    {selected.includes(option.value) && <X className="h-3 w-3" />}
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
