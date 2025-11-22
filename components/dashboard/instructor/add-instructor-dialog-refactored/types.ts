export interface InstructorFormData {
  // Basic Info
  avatar: string
  firstName: string
  middleName: string
  lastName: string
  role: string
  roleOther: string // added (used when role === 'custom')
  email: string
  phone: string
  phoneCountryCode?: string // added: selected dialing code (e.g. +1)
  maritalStatus: string
  dob: string
  // Employment Tab Fields
  joiningDate: string
  contractType: string
  contractTypeOther: string // added (used when contractType === 'custom')
  jobLevel: string // added
  jobLevelOther: string // added (used when jobLevel === 'Others')
  gender: string
  genderOther: string
  address: string
  country: string
  state: string
  // Professional
  yearsOfExperience: string
  paymentInfo: {
    classCount: string
    frequency: string
    hourlyRate: string
    // Bank Details
    bankName: string
    accountHolder: string
    accountNumber: string
    ifsc: string
    branchAddress: string
    // Payment Structure
    paymentType: string
    rate: string
    overtimeRate: string
    deductions: string
    // Tax & Compliance
    taxId: string
    // Other Payment Preference
    paymentMethod: string
    // Payroll Contact
    payrollEmail: string
    payrollPhone: string
    // Supporting Documents
    idProof: File | null
    // Added for UI
    rateType: string
    // UPI / Online Payments
    upiProvider?: string
    upiId?: string
  }
}

export interface AddInstructorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draftData?: any
  onSave?: (form: InstructorFormData) => void
  mode?: "add" | "edit"
  title?: string
  saveLabel?: string
  currentId?: string
  draftId?: string
}
