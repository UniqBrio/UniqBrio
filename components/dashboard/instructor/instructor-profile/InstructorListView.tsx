"use client"

import React, { useEffect, useMemo, useState, memo, useRef } from "react"
import { INSTRUCTOR_TABLE_COLUMNS, type InstructorColumnId, getInstructorColumnLabel } from "./instructor-columns"
import { Pencil } from "lucide-react"

interface Instructor {
  instructorId: string
  name: string
  role: string
  email?: string
  phone?: string
  gender?: string
  yearsOfExperience?: number
  jobLevel?: string
  contractType?: string
  courseAssigned?: string
  cohortName?: string
  cohortNames?: string[]
  // New: denormalized IDs to display as columns
  courseIds?: string
  cohortIds?: string
}

interface InstructorListViewProps {
  viewMode: 'grid' | 'list'
  instructors: Instructor[]
  onEdit: (instructor: Instructor) => void
  onDelete: (instructor: Instructor) => void
  onViewDetails?: (instructor: Instructor) => void
  // Selection controls (list view only)
  selectedIds?: string[]
  onToggleOne?: (id: string, checked: boolean) => void
  onToggleAll?: (ids: string[], checked: boolean) => void
}

const InstructorListView = memo(function InstructorListView({ 
  viewMode, 
  instructors, 
  onEdit, 
  onDelete,
  onViewDetails,
  selectedIds = [],
  onToggleOne,
  onToggleAll,
}: InstructorListViewProps) {
  // Move useState and useEffect to the top level - hooks must always be called in the same order
  const [visibleColumns, setVisibleColumns] = useState<InstructorColumnId[]>(() => {
    if (typeof window === 'undefined') return INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
    try {
      const raw = localStorage.getItem('instructorDisplayedColumns')
      if (!raw) return INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
      const parsed = JSON.parse(raw) as string[]
      const ids = parsed.filter((id): id is InstructorColumnId => INSTRUCTOR_TABLE_COLUMNS.some(c => c.id === id))
      return ids.length ? ids : INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
    } catch {
      return INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
    }
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      if (!detail) return
      const ids = detail.filter((id): id is InstructorColumnId => INSTRUCTOR_TABLE_COLUMNS.some(c => c.id === id))
      setVisibleColumns(ids)
      localStorage.setItem('instructorDisplayedColumns', JSON.stringify(ids))
    }
    window.addEventListener('instructor-displayed-columns-changed', handler as EventListener)
    return () => window.removeEventListener('instructor-displayed-columns-changed', handler as EventListener)
  }, [])

  // Move ALL useMemo hooks to top level to avoid conditional hook calls
  const isVisible = useMemo(() => 
    (id: InstructorColumnId) => visibleColumns.includes(id), 
    [visibleColumns]
  )

  // Helper: truncate comma-separated lists to 2 items with an ellipsis and expose full string in title
  const formatListWithEllipsis = (value?: string | null) => {
    const raw = (value || '').trim()
    if (!raw) return { display: 'N/A', title: '' }
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length <= 2) {
      const joined = parts.join(', ')
      return { display: joined || 'N/A', title: joined }
    }
    const shown = parts.slice(0, 2).join(', ')
    return { display: `${shown}, ...`, title: parts.join(', ') }
  }

  // Compute header checkbox state
  const displayedIds = useMemo(() => instructors.map(i => i.instructorId), [instructors])
  const allSelected = useMemo(() => 
    displayedIds.length > 0 && displayedIds.every(id => selectedIds.includes(id)), 
    [displayedIds, selectedIds]
  )

  // Dynamically size the scroll container to show exactly 3 rows beneath the sticky header
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (viewMode !== 'list') return
    const raf = requestAnimationFrame(() => {
      const root = containerRef.current
      if (!root) return
      const thead = root.querySelector('thead') as HTMLElement | null
      const row = root.querySelector('tbody tr') as HTMLElement | null
      const headerH = thead?.offsetHeight || 48
      const rowH = row?.offsetHeight || 56
      // Show 3 rows beneath the header
      const target = headerH + rowH * 3
      setContainerHeight(target)
    })
    return () => cancelAnimationFrame(raf)
  }, [viewMode, instructors, visibleColumns])

  const containerStyle = viewMode === 'list'
    ? ({ height: containerHeight ?? 300, overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'thin' } as const)
    : {}

  const containerClass = viewMode === 'list' ? 'instructor-list-scroll' : ''

  if (instructors.length === 0) {
    return (
      <div className="px-6 pb-6">
        <div style={containerStyle} className={containerClass}>
          <div className="w-full text-center py-8 text-gray-500">
            No instructors found matching your criteria.
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    // All useMemo hooks are now at the top level
    return (
      <div className="px-6 pb-6">
        <div ref={containerRef} style={containerStyle} className={containerClass}>
          <table className="w-full min-w-max text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
              <tr className="border-b border-gray-200">
                {/* Selection column */}
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={(e) => onToggleAll?.(displayedIds, e.target.checked)}
                  />
                </th>
                {visibleColumns.map((colId) => (
                  <th key={colId} className="px-4 py-4 text-left text-sm font-medium text-gray-700">
                    {getInstructorColumnLabel(colId)}
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-700 w-12"></th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-700 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor, idx) => (
                <tr 
                  key={instructor.instructorId} 
                  className="group hover:bg-gray-50 border-b border-gray-200 cursor-pointer"
                  onClick={() => onViewDetails?.(instructor)}
                >
                  {/* Row selection */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input
                      type="checkbox"
                      aria-label={`Select ${instructor.name}`}
                      checked={selectedIds.includes(instructor.instructorId)}
                      onChange={(e) => onToggleOne?.(instructor.instructorId, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {visibleColumns.map((colId) => {
                    switch (colId) {
                      case 'id':
                        return (
                          <td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900">{instructor.instructorId}</td>
                        )
                      case 'name':
                        return (
                          <td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900">{instructor.name}</td>
                        )
                      case 'role':
                        return (
                          <td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900">{instructor.role}</td>
                        )
                      case 'courseAssigned': {
                        const f = formatListWithEllipsis(instructor.courseAssigned)
                        return (
                          <td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900" title={f.title}>{f.display}</td>
                        )
                      }
                      case 'cohortName': {
                        const list = (instructor.cohortNames && instructor.cohortNames.length)
                          ? instructor.cohortNames
                          : (instructor.cohortName ? instructor.cohortName.split(',').map(s => s.trim()).filter(Boolean) : [])
                        const shown = list.slice(0, 2).join(', ')
                        const display = list.length === 0 ? 'N/A' : (list.length > 2 ? `${shown}, ...` : shown)
                        const title = (instructor.cohortNames && instructor.cohortNames.length ? instructor.cohortNames.join(', ') : (instructor.cohortName || ''))
                        return (
                          <td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900" title={title}>{display}</td>
                        )
                      }
                      case 'courseIds': {
                        const f = formatListWithEllipsis(instructor.courseIds)
                        return (<td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900" title={f.title}>{f.display}</td>)
                      }
                      case 'cohortIds': {
                        const f = formatListWithEllipsis(instructor.cohortIds)
                        return (<td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900" title={f.title}>{f.display}</td>)
                      }
                      case 'gender':
                        return (<td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900">{instructor.gender || '-'}</td>)
                      case 'experience':
                        return (<td key={colId} className="px-4 py-4 whitespace-nowrap text-sm font-normal text-gray-900">{instructor.yearsOfExperience}</td>)
                      default:
                        return null
                    }
                  })}
                  <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
                    <button
                      className="text-purple-600 hover:text-purple-800 p-1 rounded-full focus:outline-none"
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(instructor)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(instructor)
                      }}
                      className="text-red-500 hover:text-red-600 p-1 rounded-full focus:outline-none"
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.8333 3.83333H2.16667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 6.5V10.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.5 6.5V10.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.8333 3.83333V13C12.8333 13.221 12.7455 13.433 12.5893 13.5893C12.433 13.7455 12.221 13.8333 12 13.8333H4C3.77899 13.8333 3.56703 13.7455 3.41075 13.5893C3.25447 13.433 3.16667 13.221 3.16667 13V3.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.8333 3.83333V2.83333C10.8333 2.39131 10.6577 1.96738 10.3452 1.65482C10.0326 1.34226 9.60869 1.16667 9.16667 1.16667H6.83333C6.39131 1.16667 5.96738 1.34226 5.65482 1.65482C5.34226 1.96738 5.16667 2.39131 5.16667 2.83333V3.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Grid View (standardized sizing)
  return (
    <div className="px-6 pb-6 relative">
      <div
        className="flex gap-4 pb-2 overflow-x-auto overflow-y-hidden scroll-smooth instructor-grid-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #f3f4f6', // Gray scrollbar to match list view
          minHeight: 180
        }}
      >
        {/* Right fade gradient to indicate scroll */}
        {instructors.length > 3 && (
          <div className="absolute top-0 right-6 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        )}
        {instructors.map((instructor) => (
          <div
            key={instructor.instructorId}
            className="group relative flex flex-col rounded-xl border border-orange-600 bg-white shadow-sm transition-all duration-200 hover:shadow-md p-4 h-[220px] cursor-pointer flex-shrink-0"
            style={{ minWidth: '320px', width: '320px' }}
            onClick={() => onViewDetails?.(instructor)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg text-gray-900">{instructor.name}</span>
              <span className="absolute top-2 right-2 flex items-center gap-1">
                <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-semibold">Active</span>
                <button
                  className="text-purple-600 hover:text-purple-800 p-1 rounded-full focus:outline-none"
                  title="Edit"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(instructor)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </span>
            </div>
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                {instructor.gender && instructor.gender.trim() !== '' ? instructor.gender : 'N/A'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                {instructor.instructorId}
              </span>
            </div>
            
            <div className="mb-1">
              <span className="text-xs text-gray-500 font-medium">Role:</span>
              <span className="ml-1 text-gray-900">{instructor.role}</span>
            </div>

            <div className="mb-1">
              <span className="text-xs text-gray-500 font-medium">Contract Type:</span>
              <span className="ml-1 text-gray-900">{instructor.contractType && instructor.contractType.trim() !== '' ? instructor.contractType : 'N/A'}</span>
            </div>

            <div className="mb-1">
              <span className="text-xs text-gray-500 font-medium">Job Level:</span>
              <span className="ml-1 text-gray-900">{instructor.jobLevel && instructor.jobLevel.trim() !== '' ? instructor.jobLevel : 'N/A'}</span>
            </div>

            <div className="mb-1">
              <span className="text-xs text-gray-500 font-medium">Experience:</span>
              <span className="ml-1 text-gray-900">{(instructor.yearsOfExperience ?? null) === null ? 'N/A' : `${instructor.yearsOfExperience} yrs`}</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(instructor)
              }}
              className="absolute bottom-2 right-2 text-gray-400 hover:text-red-600 p-1.5"
              title="Delete"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 hover:text-red-600">
                <path d="M13.8333 3.83333H2.16667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 6.5V10.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.5 6.5V10.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.8333 3.83333V13C12.8333 13.221 12.7455 13.433 12.5893 13.5893C12.433 13.7455 12.221 13.8333 12 13.8333H4C3.77899 13.8333 3.56703 13.7455 3.41075 13.5893C3.25447 13.433 3.16667 13.221 3.16667 13V3.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.8333 3.83333V2.83333C10.8333 2.39131 10.6577 1.96738 10.3452 1.65482C10.0326 1.34226 9.60869 1.16667 9.16667 1.16667H6.83333C6.39131 1.16667 5.96738 1.34226 5.65482 1.65482C5.34226 1.96738 5.16667 2.39131 5.16667 2.83333V3.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
})

export default InstructorListView
