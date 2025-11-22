// Profile type reflecting the structure used in the instructor profile system
export interface ProfileData {
  avatar?: string
  instructorId: string
  name: string
  role: string
  email: string
  phone: string
  address: string
  joinDate: string
  paymentInfo: {
    classCount: number
    frequency: string
    hourlyRate: number
    bankName?: string
    accountHolder?: string
    accountNumber?: string
    ifsc?: string
    branchAddress?: string
    paymentType?: string
    rate?: string
    overtimeRate?: string
    deductions?: string
    taxId?: string
    paymentMethod?: string
    payrollEmail?: string
    payrollPhone?: string
    upiProvider?: string
    upiId?: string
  }
  availability: {
    days: string[]
    timeOffRequests?: Array<{ startDate: string; endDate: string; reason: string; status: "Pending" | "Approved" | "Rejected" }>
    substituteHistory?: Array<{ date: string; className: string; substituteName: string }>
    overtimeTracking?: Array<{ date: string; hours: number; note?: string }>
  }
  // New professional information fields
  yearsOfExperience?: number
  maritalStatus?: string
  dob?: string
  gender?: string
  genderOther?: string
  timeZone?: string
}
