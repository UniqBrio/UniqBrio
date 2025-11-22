/**
 * Custom Contract Types Hook with Backend Integration
 * 
 * This hook manages custom contract types by integrating with the existing instructors collection
 * instead of using a separate collection. Here's how it works:
 * 
 * 1. LOADING CUSTOM TYPES:
 *    - Fetches all unique contractType values from instructors collection via /api/contract-types?action=unique-contract-types
 *    - Filters out default types (full-time, part-time, guest-faculty, temporary)
 *    - Returns only custom contract types that users have created
 * 
 * 2. ADDING CUSTOM TYPES:
 *    - When user creates a new custom type, it's immediately added to dropdown (optimistic update)
 *    - The custom type gets saved to database when the instructor form is submitted
 *    - Auto-refreshes when instructors are updated via 'instructors-updated' event
 * 
 * 3. DELETING CUSTOM TYPES:
 *    - Checks if the custom type is being used by any instructor via /api/contract-types?action=check-usage
 *    - If in use, shows confirmation dialog with usage count
 *    - Bulk updates all affected instructors to remove the deleted contract type via /api/contract-types (POST with action=bulk-update)
 *    - Immediately updates dropdown to reflect the change
 * 
 * 4. PERSISTENCE:
 *    - Primary storage: MongoDB instructors collection (contractType field)
 *    - Fallback: localStorage (for offline support)
 *    - Real-time sync: Listens to instructor changes and refreshes automatically
 * 
 * 5. BENEFITS:
 *    - No new collections needed - uses existing instructor data
 *    - Shared across all admin users
 *    - Automatically cleans up unused contract types
 *    - Maintains data integrity with instructor records
 */
"use client"
import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost } from "@/lib/dashboard/staff/api"

const STORAGE_KEY = "custom-contract-types"

// Default contract types
const DEFAULT_CONTRACT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "guest-faculty", label: "Guest Faculty" },
  { value: "temporary", label: "Temporary" },
]

export interface ContractType {
  value: string
  label: string
  isCustom?: boolean
}

export const useCustomContractTypes = () => {
  const [customContractTypes, setCustomContractTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Helper: detect NI context (explicit flag, or path contains non-instructor)
  const isNIContext = () => {
    try {
      const w: any = typeof window !== 'undefined' ? window : undefined
      if (!w) return false
      if (w.__NI_SCOPE === true) return true
      if (w.__LEAVE_SCOPE === 'non-instructor') return true
      if (typeof w.location?.pathname === 'string' && w.location.pathname.includes('non-instructor')) return true
    } catch {}
    return false
  }

  // Load custom contract types from instructors collection via API
  const loadCustomContractTypes = useCallback(async () => {
    setLoading(true)
    try {
      console.log('Loading custom contract types from backend...')
  const url = isNIContext() ? '/api/dashboard/staff/non-instructor/contract-types?action=unique-contract-types' : '/api/dashboard/staff/instructor/contract-types?action=unique-contract-types'
      const response = await apiGet<{ customContractTypes: string[] }>(url)
      
      setCustomContractTypes(response.customContractTypes || [])
      console.log('Loaded custom contract types:', response.customContractTypes)
    } catch (error) {
      console.error('Error loading custom contract types from backend:', error)
      // Fallback to localStorage for offline support
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const customTypeStrings = parsed.map((t: any) => typeof t === 'string' ? t : t.label)
          setCustomContractTypes(customTypeStrings)
        }
      } catch (localError) {
        console.error("Error loading from localStorage fallback:", localError)
        setCustomContractTypes([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Save custom contract types to localStorage as fallback
  const saveToLocalStorage = useCallback((types: string[]) => {
    try {
      const contractTypeObjects = types.map(type => ({ value: type, label: type, isCustom: true }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contractTypeObjects))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }, [])

  // Add a new custom contract type
  const addCustomContractType = useCallback(async (label: string): Promise<string | null> => {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) return null

    // Check if already exists (case-insensitive)
    const allContractTypes = [...DEFAULT_CONTRACT_TYPES.map(t => t.label), ...customContractTypes]
    const exists = allContractTypes.some(type => 
      type.toLowerCase() === trimmedLabel.toLowerCase()
    )

    if (exists) {
      console.log('Contract type already exists:', trimmedLabel)
      return trimmedLabel
    }

    try {
      console.log('Adding custom contract type:', trimmedLabel)
      
      // Add to local state immediately for better UX (optimistic update)
      setCustomContractTypes(prev => [...prev, trimmedLabel])
      
      // Save to localStorage as fallback
      saveToLocalStorage([...customContractTypes, trimmedLabel])
      
      // The custom type will be automatically saved when the instructor form is submitted
      // because the contractType field will contain this custom value
      
      return trimmedLabel
    } catch (error) {
      console.error('Error adding custom contract type:', error)
      // Remove from local state if there was an error
      setCustomContractTypes(prev => prev.filter(t => t !== trimmedLabel))
      return null
    }
  }, [customContractTypes, saveToLocalStorage])

  // Delete a custom contract type
  const deleteCustomContractType = useCallback(async (contractTypeToDelete: string) => {
    try {
      console.log('Deleting custom contract type:', contractTypeToDelete)
      // Check if this contract type is being used by any instructor / non-instructor
      const usageResponse = await apiGet<{ inUse: boolean; usageCount: number }>(
        `${isNIContext() ? '/api/dashboard/staff/non-instructor/contract-types' : '/api/dashboard/staff/instructor/contract-types'}?action=check-usage&contractType=${encodeURIComponent(contractTypeToDelete)}`
      )
      
      if (usageResponse.inUse) {
        const confirmDelete = confirm(
          `This contract type "${contractTypeToDelete}" is currently being used by ${usageResponse.usageCount} instructor(s). ` +
          `Deleting it will remove it from those instructor profiles. Do you want to continue?`
        )
        
        if (!confirmDelete) return
        
        // Update all instructors/non-instructors using this contract type
  await apiPost(isNIContext() ? '/api/dashboard/staff/non-instructor/contract-types' : '/api/dashboard/staff/instructor/contract-types', {
          action: 'bulk-update',
          contractType: contractTypeToDelete,
          newContractType: '' // Reset to empty string
        })
      }
      
      // Remove from local state
      const updatedTypes = customContractTypes.filter(type => type !== contractTypeToDelete)
      setCustomContractTypes(updatedTypes)
      
      // Update localStorage fallback
      saveToLocalStorage(updatedTypes)
      
      console.log('Successfully deleted custom contract type:', contractTypeToDelete)
    } catch (error) {
      console.error('Error deleting custom contract type:', error)
      // Reload custom types to ensure consistency
      loadCustomContractTypes()
    }
  }, [customContractTypes, saveToLocalStorage, loadCustomContractTypes])

  // Get all contract types (default + custom)
  const getAllContractTypes = useCallback((): ContractType[] => {
    const customTypes: ContractType[] = customContractTypes.map(type => ({
      value: type,
      label: type,
      isCustom: true
    }))

    return [
      ...DEFAULT_CONTRACT_TYPES,
      ...customTypes
    ]
  }, [customContractTypes])

  // Load custom contract types from backend on mount
  useEffect(() => {
    loadCustomContractTypes()
  }, [loadCustomContractTypes])

  // Listen for instructor updates to refresh custom contract types
  useEffect(() => {
    const handleInstructorUpdate = () => {
      console.log('Instructors updated, refreshing custom contract types...')
      // Small delay to ensure backend is updated
      setTimeout(() => {
        loadCustomContractTypes()
      }, 1000)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('instructors-updated', handleInstructorUpdate)
      return () => {
        window.removeEventListener('instructors-updated', handleInstructorUpdate)
      }
    }
  }, [loadCustomContractTypes])

  return {
    customContractTypes,
    loading,
    addCustomContractType,
    deleteCustomContractType,
    getAllContractTypes,
    refreshCustomContractTypes: loadCustomContractTypes,
  }
}
