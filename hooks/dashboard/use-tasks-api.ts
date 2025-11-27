import { useCallback, useEffect, useState } from "react"
import type { Task } from "@/components/dashboard/Task_Management/types"

export type ApiState = {
  loading: boolean
  error: string | null
}

export function useTasksApi() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [state, setState] = useState<ApiState>({ loading: false, error: null })

  const load = useCallback(async () => {
    setState({ loading: true, error: null })
    try {
      const res = await fetch("/api/dashboard/task-management/tasks", { 
        cache: "no-store",
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load tasks")
      setTasks(json.data)
    } catch (e: any) {
      setState({ loading: false, error: e.message || "Failed to load tasks" })
      return
    }
    setState({ loading: false, error: null })
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (task: Task) => {
    setState(s => ({ ...s, loading: true }))
    try {
      const res = await fetch("/api/dashboard/task-management/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Create failed")
      // Immediately reflect in UI (server is source of truth; keeping client format)
      setTasks(prev => [...prev, { ...task, id: json.id }])
    } catch (e: any) {
      setState({ loading: false, error: e.message || "Create failed" })
      throw e
    }
    setState({ loading: false, error: null })
  }, [])

  const update = useCallback(async (task: Task) => {
    // Optimistic update to remove visible lag
    setState(s => ({ ...s, loading: true }))
    const prevTasks = tasks
    setTasks(prev => prev.map(t => t.id === task.id ? task : t))
    try {
      const res = await fetch(`/api/dashboard/task-management/tasks/${task.id}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Update failed")
      
      // Use the returned data from server to ensure accuracy
      if (json.data) {
        setTasks(prev => prev.map(t => t.id === task.id ? json.data : t))
      }
    } catch (e: any) {
      // Revert on error
      setTasks(prevTasks)
      setState({ loading: false, error: e.message || "Update failed" })
      throw e
    }
    setState({ loading: false, error: null })
  }, [tasks])

  const remove = useCallback(async (id: string) => {
    setState(s => ({ ...s, loading: true }))
    
    try {
      const res = await fetch(`/api/dashboard/task-management/tasks/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed")
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (e: any) {
      setState({ loading: false, error: e.message || "Delete failed" })
      throw e
    }
    setState({ loading: false, error: null })
  }, [tasks])

  return { tasks, setTasks, state, load, create, update, remove }
}