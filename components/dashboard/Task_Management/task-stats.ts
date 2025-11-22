import { Task } from "./types"
import { isSameDay } from "date-fns"
import { safeParse } from "./utils"

export interface TaskStats {
  newCount: number
  openCount: number
  progCount: number
  holdCount: number
  completedToday: number
}

export const calculateTaskStats = (tasks: Task[]): TaskStats => {
  const newCount = tasks.filter((t) => t.status === "new").length
  const openCount = tasks.filter((t) => t.status === "open").length
  const progCount = tasks.filter((t) => t.status === "inprogress").length
  const holdCount = tasks.filter((t) => t.status === "onhold").length
  // Changed: now shows all completed tasks instead of just today's
  const completedToday = tasks.filter((t) => t.isCompleted).length

  return {
    newCount,
    openCount,
    progCount,
    holdCount,
    completedToday,
  }
}