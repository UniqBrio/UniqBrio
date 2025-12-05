"use client"
 
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Button } from "@/components/dashboard/ui/button"
import { ChevronDown } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"
 
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
  const { primaryColor } = useCustomColors()
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
    // Use 'value' (applied state) instead of 'pending' for the count display
    const displayValue = showFooterActions ? pending : value
    if (displayValue.length === 0) return placeholder
    if (displayValue.length === 1) {
      const option = options.find(opt => opt.value === displayValue[0])
      return option?.label || displayValue[0]
    }
    return `${displayValue.length} selected`
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
            className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 border-none shadow-none"
            onSelect={(e) => e.preventDefault()}
            onClick={() => {
              const isCurrentlySelected = pending.includes(option.value);
              setPending((prev) => {
                const updated = !isCurrentlySelected 
                  ? [...prev, option.value] 
                  : prev.filter((x) => x !== option.value)
                if (!showFooterActions) {
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
                    setTimeout(() => onChange(updated), 0)
                  }
                  return updated
                })
              }}
              className="mr-2 border-gray-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 h-4 w-4 rounded"
            />
            <span className="text-sm flex-1">{option.label}</span>
          </DropdownMenuItem>
        ))}
        {showFooterActions && (
          <div className="flex gap-2 p-2 pt-3 border-t">
            <Button size="sm" variant="outline" className="flex-1" onClick={handleClear}>
              Clear All
            </Button>
            <Button 
              size="sm" 
              className="flex-1 text-white" 
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}