export interface Invoice {
  id: string
  academyName: string
  planType: "monthly" | "yearly"
  invoiceNumber: string
  dateIssued: string
  amount: number
  status: "Paid" | "Failed"
}

export interface PaymentHistory {
  id: string
  academyName: string
  date: string
  amount: number
  paymentMethod: "Card" | "Bank Transfer"
  transactionId: string
  refunds?: string
  adjustments?: string
}

export type InvoiceColumnId = 
  | "academyName"
  | "planType"
  | "invoiceNumber"
  | "dateIssued"
  | "amount"
  | "status"
  | "actions"

export type PaymentColumnId = 
  | "academyName"
  | "date"
  | "amount"
  | "paymentMethod"
  | "transactionId"
  | "refunds"
  | "actions"

export interface ColumnConfig {
  id: string
  label: string
  sortable?: boolean
}

export const INVOICE_COLUMNS: ColumnConfig[] = [
  { id: "academyName", label: "Academy Name", sortable: true },
  { id: "planType", label: "Plan Type", sortable: true },
  { id: "invoiceNumber", label: "Invoice Number", sortable: true },
  { id: "dateIssued", label: "Date Issued", sortable: true },
  { id: "amount", label: "Amount", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "actions", label: "Actions", sortable: false },
]

export const PAYMENT_COLUMNS: ColumnConfig[] = [
  { id: "academyName", label: "Academy Name", sortable: true },
  { id: "date", label: "Date", sortable: true },
  { id: "amount", label: "Amount", sortable: true },
  { id: "paymentMethod", label: "Payment Method", sortable: true },
  { id: "transactionId", label: "Transaction ID", sortable: true },
  { id: "refunds", label: "Refunds/Adjustments", sortable: false },
  { id: "actions", label: "Actions", sortable: false },
]
