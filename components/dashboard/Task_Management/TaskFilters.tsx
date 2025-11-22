import React from "react"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Label } from "@/components/dashboard/ui/label"
import { Search, Filter, SortAsc } from "lucide-react"
import { SortBy } from "./types"

interface TaskFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedStatuses: string[]
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>
  selectedPriorities: string[]
  setSelectedPriorities: React.Dispatch<React.SetStateAction<string[]>>
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
}

export function TaskFilters({
  searchTerm,
  setSearchTerm,
  selectedStatuses,
  setSelectedStatuses,
  selectedPriorities,
  setSelectedPriorities,
  sortBy,
  setSortBy,
}: TaskFiltersProps) {
  // Ensure clicking on the label text toggles the checkbox reliably inside popovers
  const toggleStatus = (status: string) => {
    if (status === "all") {
      setSelectedStatuses(["all"]) 
      return
    }
    setSelectedStatuses((prev: string[]) => {
      const filtered = prev.filter((s: string) => s !== "all")
      return filtered.includes(status)
        ? filtered.filter((s: string) => s !== status)
        : [...filtered, status]
    })
  }

  const togglePriority = (priority: string) => {
    if (priority === "all") {
      setSelectedPriorities(["all"]) 
      return
    }
    setSelectedPriorities((prev: string[]) => {
      const filtered = prev.filter((p: string) => p !== "all")
      return filtered.includes(priority)
        ? filtered.filter((p: string) => p !== priority)
        : [...filtered, priority]
    })
  }
  return (
    <div className="mb-6 flex flex-wrap gap-4 items-center">
      {/* search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or description..."
          className="pl-8 w-full"
        />
      </div>

      {/* filters */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start bg-transparent">
            <Filter className="mr-2 h-4 w-4" />
            Filters 
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Status</h4>
              <div className="space-y-2">
                {["all", "open", "inprogress", "onhold"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        if (status === "all") {
                          setSelectedStatuses(checked ? ["all"] : [])
                        } else {
                          setSelectedStatuses((prev: string[]) => {
                            const filtered = prev.filter((s: string) => s !== "all")
                            return checked ? [...filtered, status] : filtered.filter((s: string) => s !== status)
                          })
                        }
                      }}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm cursor-pointer select-none"
                      onClick={(e) => { e.preventDefault(); toggleStatus(status) }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {status === "all"
                        ? "All Statuses"
                        : status === "inprogress"
                          ? "In Progress"
                          : status[0].toUpperCase() + status.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Priority</h4>
              <div className="space-y-2">
                {["all", "low", "medium", "high"].map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={selectedPriorities.includes(priority)}
                      onCheckedChange={(checked) => {
                        if (priority === "all") {
                          setSelectedPriorities(checked ? ["all"] : [])
                        } else {
                          setSelectedPriorities((prev) => {
                            const filtered = prev.filter((p) => p !== "all")
                            return checked ? [...filtered, priority] : filtered.filter((p) => p !== priority)
                          })
                        }
                      }}
                    />
                    <Label
                      htmlFor={`priority-${priority}`}
                      className="text-sm cursor-pointer select-none"
                      onClick={(e) => { e.preventDefault(); togglePriority(priority) }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {priority === "all" ? "All Priorities" : priority[0].toUpperCase() + priority.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* sort */}
      <div className="flex items-center gap-2 ml-auto">
        <SortAsc className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Sort by:</span>
      </div>
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="target-date-asc">Target Date (Asc)</SelectItem>
          <SelectItem value="target-date-desc">Target Date (Desc)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}