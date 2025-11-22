export interface Income {
  id: string;
  date: string;
  amount: number;
  description?: string;
  incomeCategory: string;
  sourceType?: string;
  paymentMode?: string;
  reference?: string;
  studentId?: string;
  branch?: string;
  status?: string;
  notes?: string;
  addToAccount: string;
  // Payment mode specific fields
  senderUpiId?: string;
  senderName?: string;
  receiverUpiId?: string;
  senderWalletProvider?: string;
  senderWalletMobileOrEmail?: string;
  receiverWalletProvider?: string;
  receiverWalletMobileOrEmail?: string;
  walletTransactionRef?: string;
  senderBankName?: string;
  senderAccountId?: string;
  receiverBankName?: string;
  receiverAccountId?: string;
  netbankingTransactionId?: string;
  senderCardholderName?: string;
  maskedCardNumber?: string;
  receiverMerchantName?: string;
  maskedDebitCardNumber?: string;
  chequeNumber?: string;
  bankName?: string;
  dateIssued?: string;
  receiverName?: string;
  senderAccountName?: string;
  receiverAccountName?: string;
  bankTransferTransactionId?: string;
  receivedBy?: string;
  receivedFrom?: string;
  receiptNumber?: string;
  attachments?: File | null;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  description?: string;
  expenseCategory: string;
  vendorName?: string;
  vendorType?: string;
  paymentMode?: string;
  reference?: string;
  branch?: string;
  notes?: string;
  addFromAccount: string;
  // Common fields
  receivedBy?: string;
  receivedFrom?: string;
  receiptNumber?: string;
  attachments?: File | null;
}
// Shared types and constants for financial components

export interface IncomeFormData {
  date: string
  amount: string
  description: string
  incomeCategory: string
  sourceType: string
  paymentMode: string
  addToAccount: string
  receivedBy: string
  receivedFrom: string
  receiptNumber: string
  attachments: File | null
}

export interface ExpenseFormData {
  date: string
  amount: string
  description: string
  expenseCategory: string
  vendorName: string
  vendorType: string
  paymentMode: string
  addFromAccount: string
  receivedBy: string
  receivedFrom: string
  receiptNumber: string
  attachments: File | null
}

export interface BankFormData {
  holderName: string
  accountNumber: string
  accountType: string
  bankName: string
  ifsc: string
  branch: string
  micr: string
}

export interface StatData {
  title: string
  value: string
  change: string
}

// Dashboard Metrics (API response)
export interface MetricsResponse {
  timeframe: string
  startDate: string | null
  endDate: string | null
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number | null
  financialHealth: string
  // Placeholder for comparing previous period (can be expanded later)
  changes?: {
    revenuePct?: number | null
    expensesPct?: number | null
    profitPct?: number | null
  }
}

export interface ChartData {
  name: string
  amount?: number
  roi?: number
  value?: number
}

// Add Income Form Fields
export const incomeFields = {
  // Basic Details
  date: "date",
  amount: "number",
  description: "text",
  // Category Selection
  incomeCategory: [
    "Course Fees",
    "Student Registration Fee",
    "Course Registration Fee",
    "Advance Payment",
    "Workshop Fees",
    "Equipment Rental",
    "Products Sale",
    "Merchandise",
    "Late Fees",
    
    "Event Tickets",
    "Sponsorships",
    "Miscellaneous"
  ],
  // Source Details
  sourceType: [
    "Students",
    "Parents",
    "Corporate",
    "Government"
  ],
  // Payment Details
  paymentMode: [
    "Cash",
    "UPI",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "Cheque",
    "Wallets",
    "Netbanking"
  ],
  // Additional Fields
  reference: "text", // Receipt/Transaction number
  studentId: "text", // If payment from student
  branch: "text",
  status: ["Pending", "Completed", "Failed", "Refunded"],
  notes: "textarea"
}

// Add Expense Form Fields
export const expenseFields = {
  // Basic Details
  date: "date",
  amount: "number",
  description: "text",
  // Category Selection
  expenseCategory: [
    "Staff Salary",
    "Instructor Fees",
    "Rent",
    "Utilities",
    "Equipment Purchase",
    "Equipment Maintenance",
    "Marketing",
    "Office Supplies",
    "Software Subscriptions",
    "Insurance",
    "Travel",
    "Professional Fees",
    "Taxes",
    "Miscellaneous"
  ],
  // Vendor/Payee Details
  vendorName: "text",
  vendorType: [
    "Staff",
    "Instructor",
    "Supplier",
    "Service Provider",
    "Landlord",
    "Government"
  ],
  // Payment Details
  paymentMode: [
    "Cash",
    "UPI",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "Cheque",
    "Wallets",
    "Netbanking"
  ],
  // Additional Fields
  reference: "text", // Bill/Invoice number
  branch: "text",
  status: ["Pending", "Completed", "Failed"],
  recurring: "boolean", // Is this a recurring expense?
  frequency: ["One-time", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
  notes: "textarea",
  attachments: "file" // For receipts/bills
}

// Sample data for charts
// Deprecated static sample data (kept for reference). Real charts now fetch from /api/financials/charts
// export const incomeData = [...]
// export const expenseData = [...]
export const roiData = [
  { name: "Jan'25", roi: 15 },
  { name: "Feb'25", roi: 17 },
  { name: "Mar'25", roi: 19 },
  { name: "Apr'25", roi: 18 },
  { name: "May'25", roi: 21 },
  { name: "Jun'25", roi: 23 },
]

export const courseROIData = [
  { name: "Dance", value: 35 },
  { name: "Music", value: 25 },
  { name: "Art", value: 20 },
  { name: "Sports", value: 15 },
  { name: "Language", value: 5 },
]

export const COLORS = ["#8b5cf6", "#f97316", "#10b981", "#3b82f6", "#ef4444"]

export const TIMEFRAMES = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Half Yearly", value: "halfyearly" },
  { label: "Annually", value: "annually" },
  { label: "Last Year", value: "lastyear" },
  { label: "Custom", value: "custom" },
]

export function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
}

export function validateNumber(value: string) {
  return /^\d*\.?\d*$/.test(value)
}