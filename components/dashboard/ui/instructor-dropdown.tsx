"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Search, User } from "lucide-react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Badge } from "@/components/dashboard/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/dashboard/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/dashboard/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dashboard/ui/dropdown-menu"
import { useInstructorOptions, type Instructor } from "@/hooks/dashboard/useInstructors"
import { cn } from "@/lib/dashboard/utils"
import { useCustomColors } from "@/lib/use-custom-colors"

interface InstructorDropdownProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  disabled?: boolean
  showAvatar?: boolean
  showExpertise?: boolean
}

export default function InstructorDropdown({
  value,
  onValueChange,
  placeholder = "Select instructor",
  label,
  required = false,
  className,
  disabled = false,
  showAvatar = false,
  showExpertise = false
}: InstructorDropdownProps) {
  const { primaryColor } = useCustomColors()
  const { instructorOptions, loading, error } = useInstructorOptions()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Find selected instructor
  const selectedInstructor = instructorOptions.find(inst => inst.id === value)

  // Filter instructors based on search term
  const filteredInstructors = instructorOptions.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (instructor.instructorId && instructor.instructorId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelect = (instructorId: string) => {
    onValueChange(instructorId)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {label && (
        <Label htmlFor="instructor-dropdown" className="font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="instructor-dropdown"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between border-2 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none",
              !selectedInstructor && "text-gray-400 dark:text-white"
            )}
            style={open ? { borderColor: primaryColor, boxShadow: `0 0 0 2px ${primaryColor}` } : {}}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = primaryColor
              e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}`
            }}
            onBlur={(e) => {
              if (!open) {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }
            }}
            disabled={disabled || loading}
          >
            <div className="flex items-center gap-2">
              {selectedInstructor ? (
                <>
                  <User className="h-4 w-4" />
                  <span>{selectedInstructor.name}</span>
                </>
              ) : (
                <span>{loading ? "Loading..." : placeholder}</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-2" align="start">
          <Command>
            <div className="flex items-center border-b px-3 mb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search instructors..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  Loading instructors...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-6 text-sm text-destructive">
                  Error: {error}
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No instructors found.
                      </p>
                    </div>
                  </CommandEmpty>

                  <CommandGroup>
                    {filteredInstructors.map((instructor) => (
                      <CommandItem
                        key={instructor.id}
                        value={instructor.id}
                        onSelect={() => handleSelect(instructor.id)}
                        className={cn(
                          "cursor-pointer px-4 py-2 hover:bg-gray-100"
                        )}
                        style={value === instructor.id ? { backgroundColor: `${primaryColor}20` } : {}}
                        onMouseEnter={(e) => {
                          if (value !== instructor.id) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (value !== instructor.id) {
                            e.currentTarget.style.backgroundColor = ''
                          } else {
                            e.currentTarget.style.backgroundColor = `${primaryColor}20`
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{instructor.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {instructor.instructorId || instructor.email}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              value === instructor.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>


                </>
              )}
            </CommandList>
          </Command>


        </PopoverContent>
      </Popover>

      {/* Show selected instructor details */}
      {selectedInstructor && showExpertise && (
        <div className="text-xs text-muted-foreground">
          {selectedInstructor.instructorId || selectedInstructor.email}
        </div>
      )}
    </div>
  )
}

// Simplified version for basic use cases
interface SimpleInstructorDropdownProps {
  value?: string
  onChange: (instructorId: string, instructorName: string) => void
  placeholder?: string
  className?: string
}

export function SimpleInstructorDropdown({
  value,
  onChange,
  placeholder = "Select instructor",
  className
}: SimpleInstructorDropdownProps) {
  const { primaryColor } = useCustomColors()
  const { instructorOptions, loading } = useInstructorOptions()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between border-2 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none",
            !value && "text-gray-400 dark:text-white",
            className
          )}
          style={{ '--primary-color': primaryColor } as React.CSSProperties}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = primaryColor
            e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = ''
            e.currentTarget.style.boxShadow = ''
          }}
        >
          {value ? (
            instructorOptions.find(inst => inst.id === value)?.name || "Unknown"
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full p-2">
        {loading ? (
          <DropdownMenuItem disabled className="px-4 py-2">Loading...</DropdownMenuItem>
        ) : (
          instructorOptions.map(instructor => (
            <DropdownMenuItem
              key={instructor.id}
              onClick={() => onChange(instructor.id, instructor.name)}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-gray-100"
              )}
              style={value === instructor.id ? { backgroundColor: `${primaryColor}20` } : {}}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <div>
                  <div>{instructor.name}</div>
                  <div className="text-xs text-muted-foreground">{instructor.instructorId || instructor.email}</div>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}