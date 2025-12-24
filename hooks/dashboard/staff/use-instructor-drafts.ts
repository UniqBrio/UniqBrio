import { useState, useEffect, useCallback } from 'react'
import { apiPut, apiDelete, apiGet, apiPost } from '@/lib/dashboard/staff/api'

// Define the draft interface
export interface InstructorDraft {
  id: string
  name: string
  instructorName: string
  role: string
  level: string
  lastUpdated: string
  formData: any // The complete form data
}

// Generate unique ID for drafts
const generateDraftId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Generate readable name from form data
const generateDraftName = (formData: any): string => {
  const firstName = formData.firstName || ''
  const lastName = formData.lastName || ''
  const role = formData.role || ''
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim()
  } else if (firstName || lastName) {
    return `${firstName}${lastName}`.trim()
  } else if (role) {
    return role
  } else {
    return 'Untitled Draft'
  }
}

// Generate level from form data (for display)
const generateDraftLevel = (formData: any): string => {
  // You can customize this logic based on how you determine the level
  if (formData.role) {
    if (formData.role.toLowerCase().includes('senior') || formData.role.toLowerCase().includes('head')) {
      return 'Advanced'
    } else if (formData.role.toLowerCase().includes('assistant') || formData.role.toLowerCase().includes('junior')) {
      return 'Beginner'
    } else {
      return 'Intermediate'
    }
  }
  return 'Beginner'
}

export const useInstructorDrafts = () => {
  const [drafts, setDrafts] = useState<InstructorDraft[]>([])
  const DRAFTS_CHANGED_EVENT = 'instructor-drafts:changed'

  // Utility: broadcast to other hook instances that drafts changed
  const broadcastDraftsChanged = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try { window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT)) } catch {}
    }
  }, [])

  // Load drafts from backend
  const loadDrafts = useCallback(async () => {
    try {
      const serverDrafts = await apiGet<any[]>("/api/dashboard/staff/instructor/instructor_drafts")
      // Map database documents to UI format
      const mappedDrafts: InstructorDraft[] = serverDrafts.map(draft => ({
        id: draft.externalId || draft._id,
        name: draft.name || 'Untitled Draft',
        instructorName: draft.instructorName || 'Unknown',
        role: draft.role || 'Not specified',
        level: draft.level || 'Beginner',
        lastUpdated: draft.lastUpdated || new Date().toISOString(),
        formData: draft.formData || {}
      }))
      setDrafts(mappedDrafts)
      return mappedDrafts
    } catch (error) {
      console.error('Error loading drafts:', error)
      setDrafts([])
      return []
    }
  }, [])

  // Load drafts only once on mount
  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  // Listen for cross-component updates and refresh from backend
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { loadDrafts() }
    window.addEventListener(DRAFTS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DRAFTS_CHANGED_EVENT, handler)
  }, [loadDrafts])

  // Persist a single draft via API (fire-and-forget handled per method)
  const saveDraftsToStorage = useCallback((_draftsToSave: InstructorDraft[]) => {
    // No-op now; persistence handled per operation
  }, [])

  // Save a new draft
  const saveDraft = useCallback(async (formData: any, customName?: string): Promise<string> => {
    const draftId = generateDraftId()
    const instructorName = generateDraftName(formData)
    const draftName = customName || instructorName
    const level = generateDraftLevel(formData)
    
    const newDraft: InstructorDraft = {
      id: draftId,
      name: draftName,
      instructorName: instructorName,
      role: formData.role || 'Not specified',
      level: level,
      lastUpdated: new Date().toISOString(),
      formData: { ...formData }
    }

    setDrafts(prev => {
      const updated = [newDraft, ...prev]
      // Broadcast immediately after state update is queued
      setTimeout(() => broadcastDraftsChanged(), 0)
      return updated
    })
    
    // Persist to instructor_drafts collection - ensure it's saved properly
    try {
      await apiPut(`/api/dashboard/staff/instructor/instructor_drafts/by-external/${encodeURIComponent(draftId)}`, { externalId: draftId, ...newDraft })
    } catch (error) {
      console.error('Failed to save draft to backend:', error)
      // Try alternative method
      try {
        await apiPost('/api/dashboard/staff/instructor/instructor_drafts', { externalId: draftId, ...newDraft })
      } catch (secondError) {
        console.error('Failed to save draft with POST as well:', secondError)
      }
    }

    return draftId
  }, [saveDraftsToStorage, broadcastDraftsChanged])

  // Update existing draft
  const updateDraft = useCallback((draftId: string, formData: any, customName?: string): boolean => {
    const instructorName = generateDraftName(formData)
    const draftName = customName || instructorName
    const level = generateDraftLevel(formData)

    setDrafts(prev => {
      const updated = prev.map(draft => draft.id === draftId ? {
        ...draft,
        name: draftName,
        instructorName,
        role: formData.role || 'Not specified',
        level,
        lastUpdated: new Date().toISOString(),
        formData: { ...formData }
      } : draft)
      // Broadcast immediately after state update is queued
      setTimeout(() => broadcastDraftsChanged(), 0)
      return updated
    })

    apiPut(`/api/dashboard/staff/instructor/instructor_drafts/by-external/${encodeURIComponent(draftId)}`, { externalId: draftId, name: draftName, instructorName, role: formData.role || 'Not specified', level, lastUpdated: new Date().toISOString(), formData: { ...formData } }).catch((error) => {
      console.error('Failed to update draft in backend:', error)
    })

    return true
  }, [saveDraftsToStorage, broadcastDraftsChanged])

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    // Remove from UI immediately
    setDrafts(prev => {
      const updated = prev.filter(draft => draft.id !== draftId)
      // Broadcast immediately after state update is queued
      setTimeout(() => broadcastDraftsChanged(), 0)
      return updated
    })
    
    // Delete from backend - try both by ID and by externalId
    try {
      // First try by externalId (current approach)
      await apiDelete(`/api/dashboard/staff/instructor/instructor_drafts/by-external/${encodeURIComponent(draftId)}`)
    } catch (error: any) {
      try {
        // If that fails, try direct ID deletion (in case it's stored differently)
        await apiDelete(`/api/dashboard/staff/instructor/instructor_drafts/${encodeURIComponent(draftId)}`)
      } catch (secondError: any) {
        console.log('Backend deletion failed with both methods:', error?.message, secondError?.message)
        // Draft removed from UI anyway, which is the main goal
      }
    }
    
    return true
  }, [broadcastDraftsChanged])

  // Get draft by ID
  const getDraft = useCallback((draftId: string): InstructorDraft | undefined => {
    return drafts.find(draft => draft.id === draftId)
  }, [drafts])

  // Update draft name
  const updateDraftName = useCallback((draftId: string, newName: string): boolean => {
    setDrafts(prev => {
      const updated = prev.map(draft => draft.id === draftId ? { ...draft, name: newName, lastUpdated: new Date().toISOString() } : draft)
      // Broadcast immediately after state update is queued
      setTimeout(() => broadcastDraftsChanged(), 0)
      return updated
    })
    
    apiPut(`/api/dashboard/staff/instructor/instructor_drafts/by-external/${encodeURIComponent(draftId)}`, { externalId: draftId, name: newName }).catch((error) => {
      console.error('Failed to update draft name in backend:', error)
    })

    return true
  }, [saveDraftsToStorage, broadcastDraftsChanged])

  return {
    drafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    getDraft,
    updateDraftName,
    loadDrafts,
    draftsCount: drafts.length
  }
}
