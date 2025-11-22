import { Task, SortBy } from "./types"
import { safeParse } from "./utils"
import { useMemo } from "react"

interface DateRange {
  from?: Date
  to?: Date
}

interface UseTaskFilteringProps {
  tasks: Task[]
  selectedStatuses: string[]
  selectedPriorities: string[]
  sortBy: SortBy
  searchTerm: string
  dateRange?: DateRange
  overdueFilter?: "all" | "yes" | "no"
}

export const useTaskFiltering = ({
  tasks,
  selectedStatuses,
  selectedPriorities,
  sortBy,
  searchTerm,
  dateRange,
  overdueFilter = "all",
}: UseTaskFilteringProps) => {
  return useMemo(() => {
    return tasks
      .filter((t) => {
        if (!selectedStatuses.includes("all") && !selectedStatuses.includes(t.status)) return false
        if (!selectedPriorities.includes("all") && !selectedPriorities.includes(t.priority)) return false
        if (overdueFilter !== "all") {
          const overdue = (() => {
            const td = safeParse(t.targetDate)
            const today = new Date()
            const dateOnly = new Date(td.getFullYear(), td.getMonth(), td.getDate())
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            return !t.isCompleted && dateOnly < todayOnly
          })()
          if (overdueFilter === "yes" && !overdue) return false
          if (overdueFilter === "no" && overdue) return false
        }
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase()
          const haystack =
            `${t.name} ${t.description ?? ""} ${t.assignedTo ?? ""}`.toLowerCase()
          if (!haystack.includes(s)) return false
        }
        
        // Date range filtering
        if (dateRange?.from || dateRange?.to) {
          const taskTargetDate = safeParse(t.targetDate)
          
          if (dateRange.from) {
            const fromDate = new Date(dateRange.from)
            fromDate.setHours(0, 0, 0, 0) // Start of day
            if (taskTargetDate < fromDate) return false
          }
          
          if (dateRange.to) {
            const toDate = new Date(dateRange.to)
            toDate.setHours(23, 59, 59, 999) // End of day
            if (taskTargetDate > toDate) return false
          }
        }
        
        return true
      })
      .sort((a, b) => {
        const isAsc = sortBy.endsWith("asc")
        
        if (sortBy.startsWith("target-date")) {
          const da = safeParse(a.targetDate)
          const db = safeParse(b.targetDate)
          return isAsc ? da.getTime() - db.getTime() : db.getTime() - da.getTime()
        }
        
        if (sortBy.startsWith("created-on")) {
          const da = safeParse(a.createdOn)
          const db = safeParse(b.createdOn)
          return isAsc ? da.getTime() - db.getTime() : db.getTime() - da.getTime()
        }
        
        if (sortBy.startsWith("task-name")) {
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          return isAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        }
        
        if (sortBy.startsWith("priority")) {
          const priorityOrder = { low: 1, medium: 2, high: 3 }
          const priorityA = priorityOrder[a.priority]
          const priorityB = priorityOrder[b.priority]
          return isAsc ? priorityA - priorityB : priorityB - priorityA
        }
        
        return 0
      })
  }, [tasks, selectedStatuses, selectedPriorities, sortBy, searchTerm, dateRange, overdueFilter])
}