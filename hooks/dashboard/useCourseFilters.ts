import { useState, useMemo } from 'react'
import { Course } from '@/types/dashboard/course'

export function useCourseFilters(courses: Course[], currency: string) {
  // Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    level: [] as string[],
    type: [] as string[],
    status: [] as string[],
    priceRange: [0, 100000] as [number, number],
    category: [] as string[],
  })

  const [pendingFilters, setPendingFilters] = useState({ ...selectedFilters })
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!Array.isArray(courses)) {
      return [];
    }

    return courses.filter((course) => {
      const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.tags && Array.isArray(course.tags) && course.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesLevel = selectedFilters.level.length === 0 || selectedFilters.level.includes(course.level)
      const matchesType = selectedFilters.type.length === 0 || selectedFilters.type.includes(course.type)
      const matchesStatus = selectedFilters.status.length === 0 || selectedFilters.status.includes(course.status)

      // Note: priceINR is a legacy field name, but it now stores price in the academy's selected currency
      const price = course.priceINR || course.price || 0
      const matchesPrice = price >= selectedFilters.priceRange[0] && price <= selectedFilters.priceRange[1]

      const matchesTab = activeTab === "all" || course.status?.toLowerCase() === activeTab.toLowerCase()

      return matchesSearch && matchesLevel && matchesType && matchesStatus && matchesPrice && matchesTab
    }).sort((a, b) => {
      const aValue = a[sortBy as keyof Course]
      const bValue = b[sortBy as keyof Course]

      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortOrder === "asc") {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      }
      return 0
    })
  }, [courses, searchTerm, selectedFilters, activeTab, currency, sortBy, sortOrder])

  return {
    // Filter states
    selectedFilters,
    setSelectedFilters,
    pendingFilters,
    setPendingFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,

    // Computed
    filteredAndSortedCourses,
  }
}