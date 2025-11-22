import { useCallback, useEffect, useState } from "react"
import { toast } from "@/components/dashboard/ui/use-toast"

export type TaskDraft<TData = any> = {
  id: string
  title: string
  data: TData
  type: string
  createdAt: string // ISO
  updatedAt: string // ISO
}

export function useTaskDraftsApi(type: string = "task") {
  const [drafts, setDrafts] = useState<TaskDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/task-management/task-drafts?type=${encodeURIComponent(type)}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load drafts")
      setDrafts(json.data)
    } catch (e: any) {
      setError(e.message || "Failed to load drafts")
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (title: string, data: any, id?: string) => {
    setLoading(true); setError(null)
    try {
      if (id) {
        const res = await fetch(`/api/dashboard/task-management/task-drafts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, data, type }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to update draft")
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, title, data, type, updatedAt: new Date().toISOString() } : d))
        toast({
          title: "Draft Updated Successfully",
          description: `Draft "${title}" has been successfully updated.`,
        })
      } else {
        const res = await fetch(`/api/dashboard/task-management/task-drafts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, data, type }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to create draft")
        setDrafts(prev => [{ id: json.id, title, data, type, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev])
        toast({
          title: "Draft Saved Successfully", 
          description: `Draft "${title}" has been successfully saved.`,
        })
      }
    } catch (e: any) {
      setError(e.message || "Failed to save draft")
      toast({
        title: "Error Saving Draft",
        description: e.message || "Failed to save draft",
        variant: "destructive"
      })
      throw e
    } finally {
      setLoading(false)
    }
  }, [type])

  const remove = useCallback(async (id: string) => {
    setLoading(true); setError(null)
    // Get draft title before deletion for toast message
    const draftToDelete = drafts.find(d => d.id === id)
    const draftTitle = draftToDelete?.title || "Draft"
    
    try {
      const res = await fetch(`/api/dashboard/task-management/task-drafts/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete draft")
      setDrafts(prev => prev.filter(d => d.id !== id))
      toast({
        title: "Draft Deleted Successfully",
        description: `Draft "${draftTitle}" has been successfully deleted.`,
        variant: "destructive"
      })
    } catch (e: any) {
      setError(e.message || "Failed to delete draft")
      toast({
        title: "Error Deleting Draft",
        description: e.message || "Failed to delete draft",
        variant: "destructive"
      })
      throw e
    } finally {
      setLoading(false)
    }
  }, [drafts])

  return { drafts, loading, error, load, save, remove, setDrafts }
}
