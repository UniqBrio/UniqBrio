"use client"

import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/dashboard/staff/utils"

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  options: FilterOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  showSearch?: boolean
  title?: string
  // When false, the header/title row is hidden to save space
  showTitle?: boolean
}

export function FilterDropdown({
  options,
  value,
  onChange,
  placeholder = "All Items",
  className = "",
  showSearch = true,
  title = "Filter Options",
  showTitle = true
}: FilterDropdownProps) {
  const [pending, setPending] = useState<string[]>(value)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Keep local pending state in sync with external value so the
  // trigger button text stays accurate after global Apply/Clear
  useEffect(() => {
    setPending(value)
  }, [value])


  const getButtonText = () => {
    if (pending.length === 0) return placeholder
    if (pending.length === 1) {
      const option = options.find(opt => opt.value === pending[0])
      return option?.label || pending[0]
    }
    return `${pending.length} selected`
  }

  const filteredOptions = options.filter(option =>
    option.label?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DropdownMenu open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) {
        setPending(value)
        setSearchTerm("")
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "justify-between text-sm min-w-[140px]",
            // Disable default outline hover gray and other hover effects
            "hover:bg-transparent hover:text-current active:bg-transparent",
            // Prevent focus ring visual if undesired in this compact panel
            "focus-visible:ring-0 focus-visible:outline-none",
            // Keep consistent even when open (Radix sets data-state=open)
            "data-[state=open]:bg-transparent",
            className
          )}
        >
          {getButtonText()}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        {/* Title */}
        {showTitle && !!title && (
          <div className="px-3 py-2 text-sm font-semibold border-b">
            {title}
          </div>
        )}
        
        {/* Search */}
        {showSearch && (
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white" />
              <Input
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                // Prevent Radix DropdownMenu typeahead from stealing focus
                onKeyDown={(e) => e.stopPropagation()}
                className="pl-9 h-8"
              />
            </div>
          </div>
        )}

        {/* Options */}
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-white text-center">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isChecked = pending.includes(option.value)
              const toggle = () => {
                setPending((prev) => {
                  const next = prev.includes(option.value)
                    ? prev.filter((x) => x !== option.value)
                    : [...prev, option.value]
                  onChange(next)
                  return next
                })
              }

              return (
                <DropdownMenuItem
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer px-3 py-2"
                  onSelect={(e) => e.preventDefault()}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle()
                    }
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle()}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <span className="text-sm flex-1">{option.label || option.value}</span>
                </DropdownMenuItem>
              )
            })
          )}
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
