export type SalesColumnId =
  | "invoiceNumber"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "productService"
  | "date"
  | "amount"
  | "paymentMethod"
  | "status"
  | "actions"

export interface SalesColumn {
  id: SalesColumnId
  label: string
}

export const SALES_TABLE_COLUMNS: SalesColumn[] = [
  { id: "invoiceNumber", label: "Invoice #" },
  { id: "customerName", label: "Customer Name" },
  { id: "customerEmail", label: "Customer Email" },
  { id: "customerPhone", label: "Customer Phone" },
  { id: "productService", label: "Product/Service" },
  { id: "date", label: "Date" },
  { id: "amount", label: "Amount" },
  { id: "paymentMethod", label: "Payment Method" },
  { id: "status", label: "Status" },
  { id: "actions", label: "Actions" },
]

export function getSalesColumnLabel(id: SalesColumnId): string {
  return SALES_TABLE_COLUMNS.find((c) => c.id === id)?.label || id
}
