"use client"

import { useState, useMemo } from "react"
import { useToast } from "@/hooks/dashboard/use-toast"

export interface Instructor {
  instructorId: string
  name: string
  role: string
  email?: string
  phone?: string
  gender?: string
  yearsOfExperience?: number
  contractType?: string
  jobLevel?: string
  courseAssigned?: string
  cohortName?: string
  cohortNames?: string[]
  // New: denormalized IDs from cohorts (comma-separated)
  courseIds?: string
  cohortIds?: string
  specializations?: string[]
  skillset?: string[]
  bio?: string
  dateOfBirth?: string
  joiningDate?: string
  department?: string
  status?: string
  qualifications?: string[]
  paymentInfo?: {
    classCount: number
    frequency: string
    hourlyRate: number
  }
  availability?: {
    days: string[]
    branches: string[]
    locationPreferences: string[]
    timeSlots?: string[]
    upcomingClasses?: Array<{ title: string; date: string; time: string; location: string }>
  }
  employmentHistory?: Array<{
    position: string
    institution: string
    startDate?: string
    endDate?: string
    duration?: string
    responsibilities?: string
  }>
}

interface FilterState {
  role: string[]
  gender: string[]
  experience: [number, number]
  courseAssigned: string[]
}

interface UseInstructorFilteringProps {
  instructors: Instructor[]
  searchTerm: string
  selectedFilters: FilterState
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function useInstructorFiltering({
  instructors,
  searchTerm,
  selectedFilters,
  sortBy,
  sortOrder,
}: UseInstructorFilteringProps) {
  const filteredAndSortedInstructors = useMemo(() => {
    let filtered = instructors

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(instructor =>
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (instructor.courseAssigned && instructor.courseAssigned.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply filters
    if (selectedFilters.role.length > 0) {
      filtered = filtered.filter(instructor => 
        selectedFilters.role.includes(instructor.role)
      )
    }

    if (selectedFilters.gender.length > 0) {
      filtered = filtered.filter(instructor => 
        instructor.gender && selectedFilters.gender.includes(instructor.gender)
      )
    }

    // Apply experience range filter
    if (selectedFilters.experience[0] > 0 || selectedFilters.experience[1] < 50) {
      filtered = filtered.filter(instructor => 
        (instructor.yearsOfExperience || 0) >= selectedFilters.experience[0] && 
        (instructor.yearsOfExperience || 0) <= selectedFilters.experience[1]
      )
    }

    // Apply course filter
    if (selectedFilters.courseAssigned.length > 0) {
      filtered = filtered.filter(instructor => 
        instructor.courseAssigned && selectedFilters.courseAssigned.includes(instructor.courseAssigned)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: string | number, bVal: string | number
      
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case "role":
          aVal = a.role.toLowerCase()
          bVal = b.role.toLowerCase()
          break
        case "experience":
          aVal = a.yearsOfExperience || 0
          bVal = b.yearsOfExperience || 0
          break
        case "gender":
          aVal = (a.gender || '').toLowerCase()
          bVal = (b.gender || '').toLowerCase()
          break
        case "courseAssigned":
          aVal = (a.courseAssigned || '').toLowerCase()
          bVal = (b.courseAssigned || '').toLowerCase()
          break
        default:
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
      }

      if (sortOrder === "asc") {
        return (aVal || '') < (bVal || '') ? -1 : (aVal || '') > (bVal || '') ? 1 : 0
      } else {
        return (aVal || '') > (bVal || '') ? -1 : (aVal || '') < (bVal || '') ? 1 : 0
      }
    })

    return filtered
  }, [instructors, searchTerm, selectedFilters, sortBy, sortOrder])

  return filteredAndSortedInstructors
}

interface UseInstructorActionsProps {
  instructors: Instructor[]
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>
}

export function useInstructorActions({ instructors, setInstructors }: UseInstructorActionsProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null)

  // Delete helper functions
  const handleDeleteClick = (instructor: Instructor) => {
    setInstructorToDelete(instructor)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (instructorToDelete) {
      setInstructors(instructors.filter(instructor => instructor.instructorId !== instructorToDelete.instructorId))
      setDeleteDialogOpen(false)
      setInstructorToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setInstructorToDelete(null)
  }

  // Export functionality (exports selected rows if provided, else all filtered)
  const handleExport = (filteredInstructors: Instructor[], selectedIds?: string[]) => {
    if (!filteredInstructors.length) {
        toast({ title: 'Nothing to export', description: 'No instructors to export.' })
      return
    }

    const rows = (selectedIds && selectedIds.length)
      ? filteredInstructors.filter(inst => selectedIds.includes(inst.instructorId))
      : filteredInstructors

    if (!rows.length) {
        toast({ title: 'Nothing selected', description: 'No selected instructors to export.' })
      return
    }

    const csvHeader = "ID,Instructor Name,Role,Gender,Experience (years),Email,Phone,Contract Type,Job Level,Date of Birth,Joining Date\n"
    const fmtDate = (val?: string) => {
      if (!val) return ''
      const d = new Date(val)
      if (isNaN(d.getTime())) return val
      const day = String(d.getDate()).padStart(2, '0')
      const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
      const yr = d.getFullYear()
      return `${day}-${mon}-${yr}`
    }
    const q = (s?: string) => `"${(s ?? '').replace(/"/g, '""')}"`
    const csvData = rows.map(inst => {
      return [
        inst.instructorId,
        q(inst.name),
        q(inst.role),
        q(inst.gender || ''),
        inst.yearsOfExperience ?? '',
        q(inst.email || ''),
        q(inst.phone || ''),
        q(inst.contractType || ''),
        q(inst.jobLevel || ''),
        q(fmtDate(inst.dateOfBirth)),
        q(fmtDate(inst.joiningDate)),
      ].join(',')
    }).join('\n')
    
    const csvContent = csvHeader + csvData
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]
    const yr = now.getFullYear()
    const date = `${day}-${mon}-${yr}`
    a.download = `instructors_export_${date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Import functionality
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvData = e.target?.result as string
        const lines = csvData.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const headersLower = headers.map(h => h.toLowerCase())
        const findIdx = (options: string[]): number => {
          for (const opt of options) {
            const idx = headersLower.indexOf(opt.toLowerCase())
            if (idx !== -1) return idx
          }
          return -1
        }
        
        const newInstructors: Instructor[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const instructor: Instructor = {
            instructorId: values[findIdx(['ID'])] || `INSTR${String(Date.now()).slice(-3)}`,
            name: values[findIdx(['Instructor Name','Name'])] || '',
            role: values[findIdx(['Role'])] || '',
            gender: values[findIdx(['Gender'])] || '',
            yearsOfExperience: (() => {
              const idx = findIdx(['Experience (years)','Experience (Years)','Experience'])
              const parsed = idx >= 0 ? parseInt(values[idx]) : NaN
              return Number.isNaN(parsed) ? 0 : parsed
            })(),
            email: values[headers.indexOf('Email')] || '',
            phone: values[headers.indexOf('Phone')] || '',
            // Default required fields
            specializations: [],
            skillset: [],
            bio: '',
            paymentInfo: { classCount: 0, frequency: 'Monthly', hourlyRate: 0 },
            availability: { days: [], branches: [], locationPreferences: [] },
            employmentHistory: [],
          }
          newInstructors.push(instructor)
        }
        
        setInstructors(prev => [...prev, ...newInstructors])
          toast({ title: 'Import complete', description: `Imported ${newInstructors.length} instructors.` })
      }
      reader.readAsText(file)
    } else {
        toast({ title: 'Unsupported file', description: 'Only CSV files are supported.', variant: 'destructive' })
    }
    // Reset input
    event.target.value = ''
  }

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    instructorToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleExport,
    handleImport,
  }
}
