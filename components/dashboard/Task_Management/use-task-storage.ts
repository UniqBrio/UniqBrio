import { Task } from "./types"
import { useEffect, useState } from "react"
import { format } from "date-fns"

export const useTaskStorage = () => {
  const [tasks, setTasks] = useState<Task[]>([])

  // Load tasks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tasks")
    if (!saved) return

    const parsed: Task[] = JSON.parse(saved).map((t: any) => ({
      id: t.id ?? Date.now().toString(),
      name: t.name ?? "Untitled",
      description: t.description ?? "",
      targetDate: t.targetDate ?? format(new Date(), "yyyy-MM-dd"),
      createdOn: t.createdOn ?? format(new Date(), "yyyy-MM-dd"),
      priority: t.priority ?? "medium",
      status: t.status ?? "open", // Default to "open" instead of "new"
      remarks: t.remarks ?? "",
      isCompleted: !!t.isCompleted,
      completedAt: t.completedAt,
    }))

    setTasks(parsed)
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  return { tasks, setTasks }
}