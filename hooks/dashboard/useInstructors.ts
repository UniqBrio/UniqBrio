import { useState, useEffect } from 'react'

export interface Instructor {
  id: string
  name: string
  instructorId?: string
  email: string
  avatar?: string
  phone?: string
  bio?: string
  expertise?: string[]
  experience?: number
  rating?: number
  totalStudents?: number
  specializations?: string[]
}

interface UseInstructorsOptions {
  search?: string
  expertise?: string
  sortBy?: 'name' | 'rating' | 'experience'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  autoFetch?: boolean
  fields?: 'minimal' | 'full'
}

interface UseInstructorsReturn {
  instructors: Instructor[]
  loading: boolean
  error: string | null
  total: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  fetchInstructors: () => Promise<void>
  refresh: () => Promise<void>
}

export function useInstructors(options: UseInstructorsOptions = {}): UseInstructorsReturn {
  const {
    search = '',
    expertise,
    sortBy = 'name',
    sortOrder = 'asc',
    limit = 50,
    autoFetch = true,
    fields = 'full'
  } = options

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: limit,
    total: 0,
    pages: 0
  })

  const fetchInstructors = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        fields
      })

      if (search) params.append('search', search)
      if (expertise) params.append('expertise', expertise)

      const response = await fetch(`/api/dashboard/services/user-management/instructors?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch instructors')
      }

      if (data.success) {
        setInstructors(data.instructors)
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch instructors')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching instructors:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => fetchInstructors(pagination.page)

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchInstructors(1)
    }
  }, [search, expertise, sortBy, sortOrder, limit, autoFetch])

  return {
    instructors,
    loading,
    error,
    total: pagination.total,
    pagination,
    fetchInstructors: () => fetchInstructors(1),
    refresh
  }
}

// Helper hook for minimal instructor data (just id and name) - perfect for dropdowns
export function useInstructorOptions() {
  const { instructors, loading, error, fetchInstructors } = useInstructors({
    fields: 'minimal',
    sortBy: 'name',
    sortOrder: 'asc',
    limit: 200, // Get more for dropdowns
    autoFetch: true
  })

  // Transform to simple options format
  const options = instructors.map(instructor => ({
    id: instructor.id,
    name: instructor.name,
    instructorId: instructor.instructorId,
    email: instructor.email
  }))

  return {
    instructorOptions: options,
    loading,
    error,
    refresh: fetchInstructors
  }
}
