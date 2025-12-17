"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/dashboard/ui/command"
import { ScrollArea } from "@/components/dashboard/ui/scroll-area"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/dashboard/staff/utils"
import { useCustomLeaveTypes } from "@/hooks/dashboard/staff/use-custom-leave-types"

export default function LeaveTypeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { getAllLeaveTypes, addCustomLeaveType, loading } = useCustomLeaveTypes()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showError, setShowError] = useState(false)
  const options = getAllLeaveTypes()
  const selected = options.find(o => o.value === value)

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
  const exists = options.some(o => o.label.toLowerCase() === query.trim().toLowerCase())

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery("") }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <span className="truncate">
            {selected ? selected.label : "Select leave type"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or add leave types..." value={query} onValueChange={(value) => {
            // Only allow letters and spaces - reject numbers and symbols
            const hasInvalidChars = /[^a-zA-Z\s]/.test(value)
            if (hasInvalidChars) {
              setShowError(true)
              // Hide error after 2 seconds
              setTimeout(() => setShowError(false), 2000)
            }
            const filtered = value.replace(/[^a-zA-Z\s]/g, '')
            setQuery(filtered)
          }}
            onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
              const q = query.trim()
              if (e.key === 'Enter' && q && !exists) {
                const created = await addCustomLeaveType(q)
                if (created) { onChange(created); setOpen(false); setQuery(""); setShowError(false) }
              }
            }}
            className="h-9"
          />
          {showError && (
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 border-b border-red-200 dark:border-red-800">
              Only letters and spaces are allowed in leave type names
            </div>
          )}
          <ScrollArea type="always" className="max-h-[260px]">
            <CommandList className="max-h-[260px]" style={{ scrollBehavior: 'smooth' }}>
              {loading ? (
                <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading leave types...</div>
              ) : (
                <>
                  <CommandEmpty>No leave type found.</CommandEmpty>
                  {(() => {
                    const q = query.trim()
                    if (!q || exists) return null
                    return (
                      <CommandItem
                        onSelect={async () => {
                          const created = await addCustomLeaveType(q)
                          if (created) { onChange(created); setOpen(false); setQuery("") }
                        }}
                        className="text-blue-600 font-medium"
                      >
                        <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                        Add "{q}" as new leave type
                      </CommandItem>
                    )
                  })()}
                  <CommandGroup>
                    {filtered.map(opt => (
                      <CommandItem key={opt.value} value={opt.value} onSelect={() => { onChange(opt.value); setOpen(false) }}>
                        <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                        <span className="flex-1">{opt.label}</span>
                        {/* Deletion removed per request */}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
