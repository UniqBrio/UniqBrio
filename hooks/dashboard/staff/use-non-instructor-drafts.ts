import { useState, useEffect, useCallback } from 'react'
import { apiPut, apiDelete, apiGet, apiPost } from '@/lib/dashboard/staff/api'

export interface NonInstructorDraft {
  id: string
  name: string
  instructorName: string
  role: string
  level: string
  lastUpdated: string
  formData: any
}

const generateDraftId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const generateDraftName = (formData: any): string => {
  const firstName = formData.firstName || ''
  const lastName = formData.lastName || ''
  const role = formData.role || ''
  if (firstName && lastName) return `${firstName} ${lastName}`.trim()
  if (firstName || lastName) return `${firstName}${lastName}`.trim()
  if (role) return role
  return 'Untitled Draft'
}

const generateDraftLevel = (formData: any): string => {
  if (formData.role) {
    const r = String(formData.role).toLowerCase()
    if (r.includes('senior') || r.includes('head')) return 'Advanced'
    if (r.includes('assistant') || r.includes('junior')) return 'Beginner'
    return 'Intermediate'
  }
  return 'Beginner'
}

export const useNonInstructorDrafts = () => {
  const [drafts, setDrafts] = useState<NonInstructorDraft[]>([])
  const DRAFTS_CHANGED_EVENT = 'non-instructor-drafts:changed'

  // Broadcast helper that can optimistically sync other hook instances without waiting for server
  const broadcastDraftsChanged = useCallback((action: 'add' | 'update' | 'delete' | 'reload', payload?: Partial<NonInstructorDraft> & { id: string }) => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const evt = new CustomEvent(DRAFTS_CHANGED_EVENT, { detail: { action, draft: payload } })
        window.dispatchEvent(evt)
      } catch {
        // Fallback to plain Event for older browsers (detail will be lost � listeners should reload)
        try { window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT)) } catch {}
      }
    }
  }, [])

  const loadDrafts = useCallback(async () => {
    try {
      const serverDrafts = await apiGet<any[]>("/api/dashboard/staff/non-instructor/drafts")
      const mapped: NonInstructorDraft[] = serverDrafts.map((d) => ({
        id: d.externalId || d._id,
        name: d.name,
        instructorName: d.instructorName,
        role: d.role,
        level: d.level,
        lastUpdated: d.lastUpdated,
        formData: d.formData,
      }))
      setDrafts(mapped)
      return mapped
    } catch (e) {
      console.error('Error loading non-instructor drafts:', e)
      setDrafts([])
      return []
    }
  }, [])

  useEffect(() => { loadDrafts() }, [loadDrafts])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: any) => {
      const detail = e?.detail as { action?: string; draft?: Partial<NonInstructorDraft> & { id: string } } | undefined
      const action = detail?.action
      const draft = detail?.draft
      if (!action) {
        // Unknown event type � perform safe reload
        void loadDrafts()
        return
      }

      if (action === 'add' && draft) {
        // Optimistically add locally if not already present
        setDrafts(prev => (prev.some(d => d.id === draft.id)
          ? prev
          : [{
              id: draft.id,
              name: (draft as any).name || 'Untitled Draft',
              instructorName: (draft as any).instructorName || (draft as any).name || 'Untitled Draft',
              role: (draft as any).role || 'Not specified',
              level: (draft as any).level || 'Beginner',
              lastUpdated: (draft as any).lastUpdated || new Date().toISOString(),
              formData: (draft as any).formData || {},
            }, ...prev]))
        return
      }
      if (action === 'update' && draft) {
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, ...draft, lastUpdated: new Date().toISOString() } as NonInstructorDraft : d))
        return
      }
      if (action === 'delete' && draft) {
        setDrafts(prev => prev.filter(d => d.id !== draft.id))
        return
      }
      // Fallback: reload from server
      void loadDrafts()
    }
    window.addEventListener(DRAFTS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DRAFTS_CHANGED_EVENT, handler)
  }, [loadDrafts])

  const saveDraft = useCallback(async (formData: any, customName?: string): Promise<string> => {
    const draftId = generateDraftId()
    const instructorName = generateDraftName(formData)
    const draftName = customName || instructorName
    const level = generateDraftLevel(formData)

    const newDraft: NonInstructorDraft = {
      id: draftId,
      name: draftName,
      instructorName,
      role: formData.role || 'Not specified',
      level,
      lastUpdated: new Date().toISOString(),
      formData: { ...formData },
    }

  setDrafts(prev => [newDraft, ...prev])
  // Optimistically notify other consumers with the new draft so counts update instantly
  broadcastDraftsChanged('add', newDraft)

    try {
      await apiPut(`/api/dashboard/staff/non-instructor/drafts/by-external/${encodeURIComponent(draftId)}`, { externalId: draftId, ...newDraft })
    } catch (error) {
      console.error('Failed to save non-instructor draft via PUT:', error)
      try {
        await apiPost('/api/dashboard/staff/non-instructor/drafts', { externalId: draftId, ...newDraft })
      } catch (secondError) {
        console.error('Failed to save non-instructor draft via POST as well:', secondError)
      }
    }

    return draftId
  }, [broadcastDraftsChanged])

  const updateDraft = useCallback((draftId: string, formData: any, customName?: string): boolean => {
    const instructorName = generateDraftName(formData)
    const draftName = customName || instructorName
    const level = generateDraftLevel(formData)

    setDrafts(prev => prev.map(d => d.id === draftId ? {
      ...d,
      name: draftName,
      instructorName,
      role: formData.role || 'Not specified',
      level,
      lastUpdated: new Date().toISOString(),
      formData: { ...formData },
    } : d))
    broadcastDraftsChanged('update', { id: draftId, name: draftName, instructorName, role: formData.role || 'Not specified', level })
    apiPut(`/api/dashboard/staff/non-instructor/drafts/by-external/${encodeURIComponent(draftId)}`, { externalId: draftId, name: draftName, instructorName, role: formData.role || 'Not specified', level, lastUpdated: new Date().toISOString(), formData: { ...formData } }).catch((error) => {
      console.error('Failed to update non-instructor draft in backend:', error)
    })
    return true
  }, [broadcastDraftsChanged])

  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    setDrafts(prev => prev.filter(d => d.id !== draftId))
    try {
      await apiDelete(`/api/dashboard/staff/non-instructor/drafts/by-external/${encodeURIComponent(draftId)}`)
      broadcastDraftsChanged('delete', { id: draftId })
    } catch (error: any) {
      try {
        await apiDelete(`/api/dashboard/staff/non-instructor/drafts/${encodeURIComponent(draftId)}`)
        broadcastDraftsChanged('delete', { id: draftId })
      } catch (secondError: any) {
        console.log('Backend deletion failed for non-instructor draft with both methods:', error?.message, secondError?.message)
      }
    }
    return true
  }, [broadcastDraftsChanged])

  const getDraft = useCallback((draftId: string): NonInstructorDraft | undefined => {
    return drafts.find(d => d.id === draftId)
  }, [drafts])

  const updateDraftName = useCallback((draftId: string, newName: string): boolean => {
  setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, name: newName, lastUpdated: new Date().toISOString() } : d))
  broadcastDraftsChanged('update', { id: draftId, name: newName })
    apiPut(`/api/dashboard/staff/non-instructor/drafts/by-external/${encodeURIComponent(draftId)}`, { externalId: draftId, name: newName }).catch((error) => {
      console.error('Failed to update non-instructor draft name in backend:', error)
    })
    return true
  }, [broadcastDraftsChanged])

  return {
    drafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    getDraft,
    updateDraftName,
    loadDrafts,
    draftsCount: drafts.length,
  }
}
