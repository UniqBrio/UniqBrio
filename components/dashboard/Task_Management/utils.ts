import { parseISO } from "date-fns"
import { Task } from "./types"

/** Parse ISO only for truthy strings – otherwise return today */
export const safeParse = (iso?: string) => {
  try {
    return iso ? parseISO(iso) : new Date()
  } catch {
    return new Date()
  }
}

export const priorityVariant = (p: Task["priority"]) =>
  p === "high" ? "destructive" : p === "medium" ? "default" : "secondary"

export const statusVariant = (s: Task["status"]) => {
  switch (s) {
    case "new":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "open": 
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "inprogress":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "onhold":
      return "bg-rose-100 text-rose-700 border-rose-200"
    case "completed":
      return "bg-violet-100 text-violet-700 border-violet-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export const isTaskOverdue = (task: Task) => {
  if (task.isCompleted) return false
  try {
    const td = safeParse(task.targetDate)
    const today = new Date()
    const dateOnly = new Date(td.getFullYear(), td.getMonth(), td.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dateOnly < todayOnly
  } catch {
    return false
  }
}

export const resetFormData = () => ({
  taskName: "",
  taskDescription: "",
  assignedTo: "Self",
  targetDate: undefined,
  createdOn: new Date(),
  taskPriority: "medium" as const,
  taskStatus: "open" as const,
  taskRemarks: "",
})