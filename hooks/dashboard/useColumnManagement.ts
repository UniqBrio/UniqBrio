import { useState, useMemo } from 'react'

// Column definitions for different contexts
const columnDefinitions = {
  courses: {
    all: [
      { id: 'courseId', label: 'Course ID' },
      { id: 'name', label: 'Course Name' },
      { id: 'instructor', label: 'Instructor' },
      { id: 'location', label: 'Location' },
      { id: 'type', label: 'Type' },
      { id: 'level', label: 'Level' },
      { id: 'priceINR', label: 'Price' },
      { id: 'status', label: 'Status' },
      { id: 'courseCategory', label: 'Category' },
      { id: 'maxStudents', label: 'Max Students' },
      { id: 'duration', label: 'Duration' },
      { id: 'description', label: 'Description' },
      { id: 'tags', label: 'Tags' },
      { id: 'skills', label: 'Skills' },
      { id: 'prerequisites', label: 'Prerequisites' }
    ],
    default: ['courseId', 'name', 'instructor', 'location', 'type', 'level', 'priceINR', 'status']
  },
  cohorts: {
    all: [
      { id: 'cohortId', label: 'Cohort ID' },
      { id: 'name', label: 'Cohort Name' },
      { id: 'courseName', label: 'Course Name' },
      { id: 'status', label: 'Status' },
      { id: 'capacity', label: 'Capacity' },
      { id: 'members', label: 'Members' },
      { id: 'startDate', label: 'Start Date' },
      { id: 'endDate', label: 'End Date' },
      { id: 'instructorName', label: 'Instructor' },
      { id: 'location', label: 'Location' },
      { id: 'startTime', label: 'Start Time' },
      { id: 'endTime', label: 'End Time' },
      { id: 'notes', label: 'Notes' }
    ],
    default: ['cohortId', 'name', 'courseName', 'status', 'capacity', 'members']
  },
  schedules: {
    all: [
      { id: 'title', label: 'Course' },
      { id: 'cohortName', label: 'Cohort' },
      { id: 'date', label: 'Date' },
      { id: 'timePeriod', label: 'Time Period' },
      { id: 'status', label: 'Status' },
      { id: 'location', label: 'Location' },
      { id: 'instructor', label: 'Instructor' },
      { id: 'instructorAvailability', label: 'Instructor Availability' },
      { id: 'maxCapacity', label: 'Capacity' },
      { id: 'students', label: 'Enrolled' },
      { id: 'sessionNotes', label: 'Notes' }
    ],
    default: ['title', 'cohortName', 'date', 'timePeriod', 'status', 'location', 'instructor', 'instructorAvailability']
  }
}

export function useColumnManagement(context: 'courses' | 'cohorts' | 'schedules' = 'courses') {
  const contextConfig = columnDefinitions[context]
  const allColumns = contextConfig.all
  const defaultDisplayedColumns = contextConfig.default
  const storageKey = `${context}TableColumns`
  const versionKey = `${context}TableColumnsVersion`
  const currentVersion = '3.2' // Increment this when column definitions change

  const [displayedColumns, setDisplayedColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedVersion = localStorage.getItem(versionKey)
      const saved = localStorage.getItem(storageKey)
      
      // Force clear old data for debugging
      if (context === 'courses') {
        localStorage.removeItem('coursesTableColumns')
        localStorage.removeItem('coursesTableColumnsVersion')
      }
      
      // Force clear schedules data to ensure instructor availability column appears
      if (context === 'schedules') {
        console.log('[ColumnManagement] Force clearing schedules table columns to add instructor availability')
        localStorage.removeItem('schedulesTableColumns')
        localStorage.removeItem('schedulesTableColumnsVersion')
      }
      
      // If version mismatch or no version, reset to defaults
      if (savedVersion !== currentVersion || !saved) {
        console.log(`[ColumnManagement] Resetting columns for ${context}. Version: ${savedVersion} -> ${currentVersion}`)
        console.log(`[ColumnManagement] Default columns for ${context}:`, defaultDisplayedColumns)
        localStorage.setItem(versionKey, currentVersion)
        localStorage.setItem(storageKey, JSON.stringify(defaultDisplayedColumns))
        return defaultDisplayedColumns
      }
      
      // Validate that saved columns still exist in current column definitions
      const parsedColumns = JSON.parse(saved)
      const validColumns = parsedColumns.filter((col: string) => 
        allColumns.some(availableCol => availableCol.id === col)
      )
      
      // If some columns were invalid, save the filtered list
      if (validColumns.length !== parsedColumns.length) {
        const finalColumns = validColumns.length > 0 ? validColumns : defaultDisplayedColumns
        localStorage.setItem(storageKey, JSON.stringify(finalColumns))
        return finalColumns
      }
      
      return parsedColumns
    }
    return defaultDisplayedColumns
  })

  const [isColumnSelectionOpen, setIsColumnSelectionOpen] = useState(false)
  const [selectedAvailableColumns, setSelectedAvailableColumns] = useState<string[]>([])
  const [selectedDisplayedColumns, setSelectedDisplayedColumns] = useState<string[]>([])

  const availableColumns = useMemo(() =>
    allColumns.filter((col: { id: string; label: string }) => !displayedColumns.includes(col.id)),
    [displayedColumns, allColumns]
  )

  const moveColumnsToDisplayed = () => {
    const newDisplayed = [...displayedColumns, ...selectedAvailableColumns]
    setDisplayedColumns(newDisplayed)
    setSelectedAvailableColumns([])
  }

  const moveColumnsToAvailable = () => {
    const newDisplayed = displayedColumns.filter(col => !selectedDisplayedColumns.includes(col))
    setDisplayedColumns(newDisplayed)
    setSelectedDisplayedColumns([])
  }

  const moveColumnUp = (index: number) => {
    if (index > 0) {
      const newDisplayed = [...displayedColumns]
      const temp = newDisplayed[index]
      newDisplayed[index] = newDisplayed[index - 1]
      newDisplayed[index - 1] = temp
      setDisplayedColumns(newDisplayed)
    }
  }

  const moveColumnDown = (index: number) => {
    if (index < displayedColumns.length - 1) {
      const newDisplayed = [...displayedColumns]
      const temp = newDisplayed[index]
      newDisplayed[index] = newDisplayed[index + 1]
      newDisplayed[index + 1] = temp
      setDisplayedColumns(newDisplayed)
    }
  }

  const saveColumnConfiguration = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(displayedColumns))
      localStorage.setItem(versionKey, currentVersion)
    }
    setIsColumnSelectionOpen(false)
    setSelectedAvailableColumns([])
    setSelectedDisplayedColumns([])
  }

  const resetColumnConfiguration = () => {
    setDisplayedColumns(defaultDisplayedColumns)
    setSelectedAvailableColumns([])
    setSelectedDisplayedColumns([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(versionKey)
    }
  }

  // For ColumnSelectorModal integration
  const openColumnSelector = () => setIsColumnSelectionOpen(true)
  const closeColumnSelector = () => setIsColumnSelectionOpen(false)
  const onSaveColumns = () => {
    saveColumnConfiguration()
  }
  const onResetColumns = () => {
    resetColumnConfiguration()
  }

  // Get all column IDs for ColumnSelectorModal
  const allColumnIds = allColumns.map(col => col.id)

  // Function to get column label by ID
  const getColumnLabel = (columnId: string) => {
    const column = allColumns.find(col => col.id === columnId)
    return column ? column.label : columnId
  }

  return {
    // Column data
    allColumns,
    allColumnIds,
    displayedColumns,
    availableColumns,
    context,
    storageKeyPrefix: context,
    getColumnLabel,

    // Dialog state
    isColumnSelectionOpen,
    setIsColumnSelectionOpen,
    openColumnSelector,
    closeColumnSelector,

    // Selection state
    selectedAvailableColumns,
    setSelectedAvailableColumns,
    selectedDisplayedColumns,
    setSelectedDisplayedColumns,

    // Actions
    moveColumnsToDisplayed,
    moveColumnsToAvailable,
    moveColumnUp,
    moveColumnDown,
    saveColumnConfiguration,
    resetColumnConfiguration,
    onSaveColumns,
    onResetColumns,
    setDisplayedColumns,
  }
}