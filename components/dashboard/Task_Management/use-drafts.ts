import { useState, useEffect, useCallback } from 'react'
/**
 * Generic localStorage-backed drafts management hook.
 * Keeps an array of draft objects (with timestamps) under a provided storage key.
 * Designed to be framework-agnostic for reuse across forms (tasks, policies, etc.).
 */

export interface DraftItem<TData = any> {
  id: string
  title: string
  data: TData
  createdAt: Date
  updatedAt: Date
  type: string // e.g., 'task'
}

// Safe random id for environments without crypto.randomUUID
const makeId = () => {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return Math.random().toString(36).slice(2, 11)
}

export function useDrafts<TData = any>(storageKey: string = 'app-drafts') {
  const [drafts, setDrafts] = useState<DraftItem<TData>[]>([])

  // Load drafts from localStorage on mount (client side only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedDrafts = window.localStorage.getItem(storageKey)
      if (savedDrafts) {
        const parsed: DraftItem<TData>[] = JSON.parse(savedDrafts).map((draft: any) => ({
          ...draft,
            createdAt: draft.createdAt ? new Date(draft.createdAt) : new Date(),
            updatedAt: draft.updatedAt ? new Date(draft.updatedAt) : new Date(),
        }))
        setDrafts(parsed)
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }, [storageKey])

  // Persist drafts
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(drafts))
    } catch (error) {
      console.error('Error saving drafts:', error)
    }
  }, [drafts, storageKey])

  /** Create or update a draft. Pass an id to update existing */
  const saveDraft = useCallback((title: string, data: TData, type: string, id?: string) => {
    const now = new Date()
    setDrafts(prev => {
      if (id) {
        return prev.map(d => d.id === id ? { ...d, title, data, updatedAt: now } : d)
      }
      const newDraft: DraftItem<TData> = {
        id: makeId(),
        title,
        data,
        createdAt: now,
        updatedAt: now,
        type,
      }
      return [newDraft, ...prev]
    })
  }, [])

  /** Remove a draft permanently */
  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }, [])

  /** Remove every draft (danger – no confirmation here) */
  const clearAllDrafts = useCallback(() => setDrafts([]), [])

  const getDraftsByType = useCallback((type: string) => drafts.filter(d => d.type === type), [drafts])

  return { drafts, saveDraft, deleteDraft, clearAllDrafts, getDraftsByType }
}

export type { DraftItem as TaskDraftItem }
