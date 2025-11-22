import type { LeaveRequest, Instructor } from "@/types/dashboard/leave"

export interface CSVImportResult {
  leaveRequests: LeaveRequest[]
  newInstructors: Instructor[]
  errors: string[]
  columnValidation?: {
    isValid: boolean
    detectedHeaders: string[]
    missingRequired: string[]
    suggestions: string[]
  }
}

/**
 * Expected column structure for validation
 */
export const EXPECTED_COLUMNS = [
  { name: 'ID', required: true, key: 'id' },
  { name: 'Name', required: true, key: 'name' },
  { name: 'Job Level', required: true, key: 'job level' },
  { name: 'Contract Type', required: true, key: 'contract type' },
  { name: 'Leave Type', required: false, key: 'leave type' },
  { name: 'Reason', required: false, key: 'reason' },
  { name: 'Start Date', required: true, key: 'start date' },
  { name: 'End Date', required: true, key: 'end date' },
  { name: 'Approved Date', required: false, key: 'approved date' },
  { name: 'Status', required: false, key: 'status' },
  { name: 'No. of days', required: false, key: 'no. of days' },
  { name: 'Balance', required: false, key: 'balance' }
]

/**
 * Header mappings for flexible CSV parsing
 */
const HEADER_MAPPINGS: Record<string, string[]> = {
  'id': ['id', 'instructor id', 'employee id', 'staff id'],
  'name': ['name', 'instructor name', 'full name', 'employee name'],
  'job level': ['job level', 'position', 'level', 'grade'],
  'contract type': ['contract type', 'employment type', 'contract', 'type'],
  'leave type': ['leave type', 'type of leave', 'leave category'],
  'reason': ['reason', 'comments', 'description', 'note'],
  'start date': ['start date', 'from date', 'begin date', 'start'],
  'end date': ['end date', 'to date', 'finish date', 'end'],
  'approved date': ['approved date', 'approval date', 'date approved'],
  'status': ['status', 'approval status', 'state'],
  'no. of days': ['no. of days', 'days', 'duration', 'number of days'],
  'balance': ['balance', 'remaining', 'left', 'available']
}

/**
 * Parse a CSV line handling quoted values properly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ""
      i++
    } else {
      current += char
      i++
    }
  }
  
  // Add the last field
  result.push(current.trim())
  return result
}

/**
 * Validate CSV headers against expected format
 */
function validateCSVHeaders(rawHeaders: string[]): {
  isValid: boolean
  detectedHeaders: string[]
  missingRequired: string[]
  suggestions: string[]
} {
  const detectedHeaders = rawHeaders.map(h => h.trim())
  const missingRequired: string[] = []
  const suggestions: string[] = []
  
  // Check for required columns
  const requiredColumns = EXPECTED_COLUMNS.filter(col => col.required)
  
  for (const requiredCol of requiredColumns) {
    const found = detectedHeaders.some(header => {
      const cleanHeader = header.toLowerCase().trim().replace(/['"]/g, '')
      // Check exact match first
      if (cleanHeader === requiredCol.name.toLowerCase()) return true
      
      // Check alternatives
      const alternatives = HEADER_MAPPINGS[requiredCol.key] || []
      return alternatives.some(alt => 
        cleanHeader.includes(alt) || alt.includes(cleanHeader)
      )
    })
    
    if (!found) {
      missingRequired.push(requiredCol.name)
      suggestions.push(`Expected: "${requiredCol.name}" - Alternatives: ${HEADER_MAPPINGS[requiredCol.key]?.join(', ')}`)
    }
  }
  
  return {
    isValid: missingRequired.length === 0,
    detectedHeaders,
    missingRequired,
    suggestions
  }
}

/**
 * Create column indices mapping from headers
 */
function createColumnIndices(rawHeaders: string[]): Record<string, number> {
  const columnIndices: Record<string, number> = {}
  
  rawHeaders.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().trim().replace(/['"]/g, '')
    
    // Direct match first
    columnIndices[cleanHeader] = index
    
    // Then try mapping alternatives
    for (const [standardKey, alternatives] of Object.entries(HEADER_MAPPINGS)) {
      if (alternatives.some(alt => cleanHeader.includes(alt) || alt.includes(cleanHeader))) {
        columnIndices[standardKey] = index
        break
      }
    }
  })
  
  return columnIndices
}

/**
 * Get column value using flexible header matching
 */
function getColumnValue(cols: string[], headerName: string, columnIndices: Record<string, number>): string {
  const standardKey = headerName.toLowerCase().trim()
  let index = columnIndices[standardKey]
  
  // Debug logging for contract type
  if (standardKey === "contract type") {
    console.log("getColumnValue debug for contract type:", {
      standardKey,
      directIndex: index,
      columnIndices,
      cols
    })
  }
  
  // If no direct match, try alternatives
  if (index === undefined) {
    const alternatives = HEADER_MAPPINGS[standardKey] || []
    for (const alt of alternatives) {
      index = columnIndices[alt]
      if (index !== undefined) break
    }
    
    if (standardKey === "contract type") {
      console.log("After alternatives check:", { alternatives, index })
    }
  }
  
  // Final fallback - try partial matches
  if (index === undefined) {
    for (const [key, idx] of Object.entries(columnIndices)) {
      if (key.includes(standardKey) || standardKey.includes(key)) {
        index = idx
        break
      }
    }
    
    if (standardKey === "contract type") {
      console.log("After partial match check:", { index })
    }
  }
  
  const value = (index !== undefined && index >= 0 && cols[index] !== undefined) ? cols[index].trim() : ""
  const finalValue = value.replace(/^["']|["']$/g, '') // Remove quotes
  
  if (standardKey === "contract type") {
    console.log("Final contract type value:", { index, rawValue: value, finalValue })
  }
  
  return finalValue
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseLocalDate(dateString: string): string | undefined {
  if (!dateString || dateString.trim() === '') {
    return undefined
  }
  
  // Clean the input
  const cleaned = dateString.replace(/['"]/g, "").trim()
  
  // Already in YYYY-MM-DD format
  if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return cleaned
  }
  
  try {
    // Handle DD-MM-YYYY format
    if (cleaned.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
      const parts = cleaned.split(/[-\/]/)
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      return `${year}-${month}-${day}`
    }
    
    // Handle MM/DD/YYYY format
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = cleaned.split('/')
      const month = parts[0].padStart(2, '0')
      const day = parts[1].padStart(2, '0')
      const year = parts[2]
      return `${year}-${month}-${day}`
    }
    
    // Try to parse with Date constructor and convert to YYYY-MM-DD
    const date = new Date(cleaned)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch (e) {
    console.warn(`Failed to parse date: ${dateString}`, e)
  }
  
  return undefined
}

/**
 * Calculate number of days between dates
 */
function computeDays(start?: string, end?: string): number {
  if (!start || !end) return 1
  try {
    const s = new Date(start)
    const e = new Date(end)
    const ms = e.getTime() - s.getTime()
    if (isNaN(ms)) return 1
    return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1)
  } catch {
    return 1
  }
}

/**
 * Create instructor record from CSV data
 */
function createInstructorFromCSV(
  instructorId: string,
  instructorName: string,
  jobLevel: string,
  contractType: string
): Instructor {
  // Normalize contract type for employmentType field
  const normalizedEmploymentType = contractType.toLowerCase().includes('permanent') ? 'Permanent' : 'Temporary'
  
  return {
    id: instructorId,
    name: instructorName,
    role: "INSTRUCTOR" as const,
    department: "Unknown",
    jobLevel,
    employmentType: normalizedEmploymentType,
    roleType: "Instructor" as const,
    contractType, // Keep original contract type for reference
  }
}

/**
 * Process CSV text and return leave requests and new instructors
 */
export async function importLeaveRequestsFromCSV(
  csvText: string,
  existingInstructors: Instructor[]
): Promise<CSVImportResult> {
  const errors: string[] = []
  const newInstructors: Instructor[] = []
  const leaveRequests: LeaveRequest[] = []
  
  try {
    let lines = csvText.split("\n").filter((l) => l.trim())
    
    // Remove Excel separator line if present
    if (lines[0]?.startsWith("sep=")) {
      lines = lines.slice(1)
    }
    
    if (lines.length < 2) {
      errors.push("CSV file must have at least a header row and one data row.")
      return { leaveRequests: [], newInstructors: [], errors }
    }
    
    // Parse headers properly
    const rawHeaders = parseCSVLine(lines[0])
    console.log("CSV Headers found:", rawHeaders)
    
    // Validate headers
    const validation = validateCSVHeaders(rawHeaders)
    console.log("Header validation:", validation)
    
    // If validation fails, return early with validation info
    if (!validation.isValid) {
      return { 
        leaveRequests: [], 
        newInstructors: [], 
        errors: [`Missing required columns: ${validation.missingRequired.join(', ')}`],
        columnValidation: validation
      }
    }
    
    // Create flexible column mapping
    const columnIndices = createColumnIndices(rawHeaders)
    console.log("Column indices mapped:", columnIndices)
    console.log("Looking for contract type at index:", columnIndices["contract type"])
    console.log("Raw headers:", rawHeaders)
    
    // Process data rows only (skip header)
    const dataLines = lines.slice(1).filter(line => line.trim())
    
    for (let index = 0; index < dataLines.length; index++) {
      try {
        const line = dataLines[index]
        const cols = parseCSVLine(line)
        
        console.log(`Row ${index + 1} parsed cols:`, cols)
        
        const instructorId = getColumnValue(cols, "id", columnIndices) || "N/A"
        const instructorName = getColumnValue(cols, "name", columnIndices) || "N/A"
        const jobLevel = getColumnValue(cols, "job level", columnIndices) || ""
        
        // Try multiple ways to get contract type
        let contractType = getColumnValue(cols, "contract type", columnIndices)
        if (!contractType) {
          // Direct index lookup as fallback
          const contractTypeIndex = rawHeaders.findIndex(h => h.toLowerCase().trim() === 'contract type')
          if (contractTypeIndex >= 0 && cols[contractTypeIndex]) {
            contractType = cols[contractTypeIndex].trim()
          }
        }
        

        const leaveType = getColumnValue(cols, "leave type", columnIndices) || "Planned Leave"
        const reason = getColumnValue(cols, "reason", columnIndices) || "Imported"
        const status = (getColumnValue(cols, "status", columnIndices) || "APPROVED").toUpperCase()
        const startDateRaw = getColumnValue(cols, "start date", columnIndices)
        const endDateRaw = getColumnValue(cols, "end date", columnIndices)
        const approvedDateRaw = getColumnValue(cols, "approved date", columnIndices)
        
        console.log(`Extracted raw values for row ${index + 1}:`, {
          instructorId, instructorName, jobLevel, contractType, leaveType, reason, status,
          startDateRaw, endDateRaw, approvedDateRaw
        })
        
        const startDate = parseLocalDate(startDateRaw)
        const endDate = parseLocalDate(endDateRaw)
        const approvedDate = parseLocalDate(approvedDateRaw)
        const balance = parseInt(getColumnValue(cols, "balance", columnIndices) || "0", 10)
        
        console.log(`Date parsing for row ${index + 1}:`, {
          startDateRaw, startDate,
          endDateRaw, endDate,
          approvedDateRaw, approvedDate
        })
        
        // Validate that dates were parsed correctly
        if (!startDate && startDateRaw) {
          console.error(`Failed to parse start date: "${startDateRaw}"`)
          errors.push(`Row ${index + 1}: Failed to parse start date "${startDateRaw}"`)
        }
        if (!endDate && endDateRaw) {
          console.error(`Failed to parse end date: "${endDateRaw}"`)
          errors.push(`Row ${index + 1}: Failed to parse end date "${endDateRaw}"`)
        }
        
        const leaveRequest: LeaveRequest = {
          id: `imported_${Date.now()}_${index}`,
          instructorId,
          instructorName,
          jobLevel: jobLevel || undefined,
          contractType: contractType || undefined,
          employmentType: contractType || undefined,
          leaveType: leaveType as LeaveRequest["leaveType"],
          startDate,
          endDate,
          days: (startDate && endDate) ? computeDays(startDate, endDate) : undefined,
          reason,
          status: status as LeaveRequest["status"],
          submittedAt: new Date().toISOString().slice(0,10),
          approvedAt: approvedDate,
          registeredDate: approvedDate,
          carriedOver: 0,
          balance,
          prorated: "Full",
        }
        
        leaveRequests.push(leaveRequest)
        
        // Debug: Log the final leave request object
        console.log(`Row ${index + 1} Final LeaveRequest:`, {
          contractType: leaveRequest.contractType,
          employmentType: leaveRequest.employmentType,
          instructorId: leaveRequest.instructorId,
          instructorName: leaveRequest.instructorName
        })
        
        // Check if we need to create a new instructor record
        if (instructorId && instructorId !== "N/A") {
          const existingInstructor = existingInstructors.find(i => 
            i.id === instructorId || 
            i.externalId === instructorId ||
            i.name === instructorName
          )
          
          // Also check if we already created this instructor in this import
          const alreadyCreated = newInstructors.find(i => 
            i.id === instructorId || i.name === instructorName
          )
          
          if (!existingInstructor && !alreadyCreated && jobLevel && contractType) {
            const newInstructor = createInstructorFromCSV(instructorId, instructorName, jobLevel, contractType)
            newInstructors.push(newInstructor)
            console.log(`Will create instructor record for: ${instructorName}`)
          }
        }
        
        console.log(`Processing row ${index + 1}:`, leaveRequest)
      } catch (rowError) {
        console.error(`Error processing row ${index + 1}:`, rowError)
        errors.push(`Row ${index + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`)
      }
    }
    
    if (leaveRequests.length === 0) {
      errors.push("No valid data rows found in CSV.")
    }
    
    return { leaveRequests, newInstructors, errors }
    
  } catch (error) {
    console.error("CSV Import Error:", error)
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { leaveRequests: [], newInstructors: [], errors }
  }
}
