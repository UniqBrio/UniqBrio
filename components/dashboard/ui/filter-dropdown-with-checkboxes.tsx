"use client"
 
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Button } from "@/components/dashboard/ui/button"
import { ChevronDown } from "lucide-react"
 
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
  /**
   * If false, hides the footer Apply / Clear buttons and commits selection immediately.
   * Default: true (show footer actions, use pending state until Apply)
   */
  showFooterActions?: boolean
}
 
export function FilterDropdownWithCheckboxes({
  options,
  value,
  onChange,
  placeholder = "All Items",
  className = "",
  showFooterActions = true
}: FilterDropdownProps) {
  const [pending, setPending] = useState<string[]>(value)
  const [open, setOpen] = useState(false)
 
  const handleApply = () => {
    onChange(pending)
    setOpen(false)
  }
 
  const handleClear = () => {
    setPending([])
    onChange([])
    setOpen(false)
  }
 
  const getButtonText = () => {
    if (pending.length === 0) return placeholder
    if (pending.length === 1) {
      const option = options.find(opt => opt.value === pending[0])
      return option?.label || pending[0]
    }
    return `${pending.length} selected`
  }
 
  return (
    <DropdownMenu open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) setPending(value)
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`justify-between text-sm ${className}`}>
          {getButtonText()}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="flex items-center gap-2 cursor-pointer"
            onSelect={(e) => e.preventDefault()}
            onClick={() => {
              const isCurrentlySelected = pending.includes(option.value);
              setPending((prev) => {
                const updated = !isCurrentlySelected 
                  ? [...prev, option.value] 
                  : prev.filter((x) => x !== option.value)
                if (!showFooterActions) {
                  // Defer the onChange call to avoid calling setState during render
                  setTimeout(() => onChange(updated), 0)
                }
                return updated
              })
            }}
          >
            <Checkbox
              checked={pending.includes(option.value)}
              onCheckedChange={(checked) => {
                setPending((prev) => {
                  const updated = checked 
                    ? [...prev, option.value] 
                    : prev.filter((x) => x !== option.value)
                  if (!showFooterActions) {
                    // Defer the onChange call to avoid calling setState during render
                    setTimeout(() => onChange(updated), 0)
                  }
                  return updated
                })
              }}
              className="data-[state=checked]:bg-purple-600 border-purple-500"
            />
            <span className="text-sm">{option.label}</span>
          </DropdownMenuItem>
        ))}
        {showFooterActions && (
          <div className="flex gap-2 p-2 pt-3 border-t">
            <Button size="sm" variant="outline" className="flex-1" onClick={handleClear}>
              Clear All
            </Button>
            <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleApply}>
              Apply
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}