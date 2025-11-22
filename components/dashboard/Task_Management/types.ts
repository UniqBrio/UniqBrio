// Task Management Types and Interfaces

export interface Task {
  id: string
  name: string
  description?: string
  assignedTo?: string
  targetDate: string // YYYY-MM-DD
  createdOn: string // YYYY-MM-DD
  priority: "low" | "medium" | "high"
  status: "new" | "open" | "inprogress" | "onhold" | "completed"
  remarks?: string
  isCompleted: boolean
  completedAt?: string // ISO timestamp
}

export type SortBy = "target-date-asc" | "target-date-desc" | "created-on-asc" | "created-on-desc" | "task-name-asc" | "task-name-desc" | "priority-asc" | "priority-desc"

export interface TaskFormData {
  taskName: string
  taskDescription: string
  assignedTo: string
  targetDate?: Date
  createdOn?: Date
  taskPriority: "low" | "medium" | "high"
  taskStatus: "new" | "open" | "inprogress" | "onhold" | "completed"
  taskRemarks: string
}