import { Task } from "./types"
import { format } from "date-fns"
import { safeParse } from "./utils"

// CSV utility functions for task management
export const toCSV = (data: Record<string, string | number>[], headers: readonly string[]): string => {
  const escapeCSV = (field: string | number): string => {
    const str = String(field)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerRow = headers.map(escapeCSV).join(',')
  const dataRows = data.map(row => 
    headers.map(header => escapeCSV(row[header] || '')).join(',')
  )
  
  return [headerRow, ...dataRows].join('\n')
}

export const downloadCSV = (filename: string, csvContent: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const parseCSVRow = (row: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n').filter(line => line.trim())
  return lines.map(parseCSVRow)
}

export const importTasksFromCSV = (csvText: string): {
  tasks: Task[]
  errors: string[]
} => {
  const errors: string[] = []
  const tasks: Task[] = []
  
  try {
    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      errors.push("CSV file is empty")
      return { tasks, errors }
    }
    
    const headers = rows[0].map(h => h.toLowerCase().trim())
    const dataRows = rows.slice(1)
    
    // Expected headers mapping
    const headerMap = {
      name: ['name', 'task name', 'title'],
      description: ['description', 'desc', 'details'],
      targetDate: ['target date', 'targetdate', 'end date', 'enddate', 'due date'],
      priority: ['priority'],
      status: ['status', 'state'],
      remarks: ['remarks', 'notes', 'comments']
    }
    
    // Find header indices
    const getHeaderIndex = (field: keyof typeof headerMap): number => {
      for (const possibleName of headerMap[field]) {
        const index = headers.findIndex(h => h === possibleName)
        if (index !== -1) return index
      }
      return -1
    }
    
    const nameIndex = getHeaderIndex('name')
    const descIndex = getHeaderIndex('description')
    const targetDateIndex = getHeaderIndex('targetDate')
    const priorityIndex = getHeaderIndex('priority')
    const statusIndex = getHeaderIndex('status')
    const remarksIndex = getHeaderIndex('remarks')
    
    if (nameIndex === -1) {
      errors.push("Required column 'Name' or 'Task Name' not found")
      return { tasks, errors }
    }
    
    dataRows.forEach((row, index) => {
      const rowNum = index + 2 // +2 because array is 0-indexed and we skipped header
      
      try {
        const name = row[nameIndex]?.trim()
        if (!name) {
          errors.push(`Row ${rowNum}: Task name is required`)
          return
        }
        
        // Parse dates
        const parseDate = (dateStr: string): string => {
          if (!dateStr) return format(new Date(), 'yyyy-MM-dd')
          
          try {
            // Try different date formats
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date')
            }
            return format(date, 'yyyy-MM-dd')
          } catch {
            errors.push(`Row ${rowNum}: Invalid date format "${dateStr}"`)
            return format(new Date(), 'yyyy-MM-dd')
          }
        }
        
        const targetDate = targetDateIndex !== -1 ? parseDate(row[targetDateIndex]) : format(new Date(), 'yyyy-MM-dd')
        
        // Parse priority
        let priority: "low" | "medium" | "high" = "medium"
        if (priorityIndex !== -1) {
          const priorityStr = row[priorityIndex]?.toLowerCase().trim()
          if (['low', 'medium', 'high'].includes(priorityStr)) {
            priority = priorityStr as "low" | "medium" | "high"
          }
        }
        
        // Parse status
        let status: "new" | "open" | "inprogress" | "onhold" | "completed" = "new"
        if (statusIndex !== -1) {
          const statusStr = row[statusIndex]?.toLowerCase().trim()
          const statusMapping: Record<string, "new" | "open" | "inprogress" | "onhold" | "completed"> = {
            'new': 'new',
            'open': 'open',
            'in progress': 'inprogress',
            'inprogress': 'inprogress',
            'on hold': 'onhold',
            'onhold': 'onhold',
            'completed': 'completed',
            'done': 'completed'
          }
          if (statusMapping[statusStr]) {
            status = statusMapping[statusStr]
          }
        }
        
        const task: Task = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          description: descIndex !== -1 ? row[descIndex]?.trim() : '',
          targetDate,
          createdOn: format(new Date(), 'yyyy-MM-dd'),
          priority,
          status,
          remarks: remarksIndex !== -1 ? row[remarksIndex]?.trim() : '',
          isCompleted: status === 'completed'
        }
        
        tasks.push(task)
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })
    
  } catch (error) {
    errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return { tasks, errors }
}

export const exportTasksToCSV = (tasks: Task[]): string => {
  const headers = [
    'Name',
    'Description',
    'Target Date',
    'Created On',
    'Priority',
    'Status',
    'Remarks',
    'Completed'
  ] as const
  
  const rows = tasks.map(task => ({
    ['Name']: task.name,
    ['Description']: task.description || '',
    ['Target Date']: format(safeParse(task.targetDate), 'dd-MMM-yyyy'),
    ['Created On']: format(safeParse(task.createdOn), 'dd-MMM-yyyy'),
    ['Priority']: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
    ['Status']: task.status === 'inprogress' ? 'In Progress' : 
               task.status === 'onhold' ? 'On hold' : 
               task.status.charAt(0).toUpperCase() + task.status.slice(1),
    ['Remarks']: task.remarks || '',
    ['Completed']: task.isCompleted ? 'Yes' : 'No'
  }))
  
  return toCSV(rows, headers)
}