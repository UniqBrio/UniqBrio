"use client"
import React, { useState, useMemo } from "react"
import { Search, Filter, Download, FileText, Grid3X3, List, ChevronDown, Check, X } from "lucide-react"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator 
} from "@/components/dashboard/ui/dropdown-menu"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { IndianRupee } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { 
  Invoice, 
  PaymentHistory, 
  InvoiceColumnId, 
  PaymentColumnId,
  INVOICE_COLUMNS,
  PAYMENT_COLUMNS 
} from "./invoice-payment-types"

// Sample data
const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "1",
    academyName: "Main Academy",
    planType: "yearly",
    invoiceNumber: "INV-2025-001234",
    dateIssued: "2025-01-15",
    amount: 11988,
    status: "Paid"
  },
  {
    id: "2",
    academyName: "Main Academy",
    planType: "yearly",
    invoiceNumber: "INV-2024-005678",
    dateIssued: "2024-01-15",
    amount: 11988,
    status: "Paid"
  },
  {
    id: "3",
    academyName: "North Branch",
    planType: "monthly",
    invoiceNumber: "INV-2025-001235",
    dateIssued: "2025-02-01",
    amount: 1199,
    status: "Failed"
  },
]

const SAMPLE_PAYMENTS: PaymentHistory[] = [
  {
    id: "1",
    academyName: "Main Academy",
    date: "2025-01-15",
    amount: 11988,
    paymentMethod: "Card",
    transactionId: "TXN-2025-ABC123",
  },
  {
    id: "2",
    academyName: "Main Academy",
    date: "2024-01-15",
    amount: 11988,
    paymentMethod: "Bank Transfer",
    transactionId: "TXN-2024-XYZ789",
  },
  {
    id: "3",
    academyName: "North Branch",
    date: "2025-02-10",
    amount: 1199,
    paymentMethod: "Card",
    transactionId: "TXN-2025-DEF456",
    refunds: "Partial refund: ₹500 (Service issue)",
  },
]

export function InvoicePaymentHistory() {
  const { primaryColor } = useCustomColors()
  
  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  
  // Search states
  const [invoiceSearch, setInvoiceSearch] = useState("")
  const [paymentSearch, setPaymentSearch] = useState("")
  
  // Filter states
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string[]>([])
  const [invoicePlanFilter, setInvoicePlanFilter] = useState<string[]>([])
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([])
  
  // Sort states
  const [invoiceSort, setInvoiceSort] = useState<{ field: string; order: "asc" | "desc" } | null>(null)
  const [paymentSort, setPaymentSort] = useState<{ field: string; order: "asc" | "desc" } | null>(null)
  
  // Column visibility states
  const [visibleInvoiceColumns, setVisibleInvoiceColumns] = useState<InvoiceColumnId[]>(
    INVOICE_COLUMNS.map(c => c.id as InvoiceColumnId)
  )
  const [visiblePaymentColumns, setVisiblePaymentColumns] = useState<PaymentColumnId[]>(
    PAYMENT_COLUMNS.map(c => c.id as PaymentColumnId)
  )

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = SAMPLE_INVOICES.filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        invoice.academyName.toLowerCase().includes(invoiceSearch.toLowerCase())
      
      const matchesStatus = invoiceStatusFilter.length === 0 || invoiceStatusFilter.includes(invoice.status)
      const matchesPlan = invoicePlanFilter.length === 0 || invoicePlanFilter.includes(invoice.planType)
      
      return matchesSearch && matchesStatus && matchesPlan
    })

    if (invoiceSort) {
      result.sort((a, b) => {
        const aVal = a[invoiceSort.field as keyof Invoice]
        const bVal = b[invoiceSort.field as keyof Invoice]
        
        // Handle undefined values
        if (aVal === undefined && bVal === undefined) return 0
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1
        
        if (aVal < bVal) return invoiceSort.order === "asc" ? -1 : 1
        if (aVal > bVal) return invoiceSort.order === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [invoiceSearch, invoiceStatusFilter, invoicePlanFilter, invoiceSort])

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let result = SAMPLE_PAYMENTS.filter(payment => {
      const matchesSearch = 
        payment.transactionId.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        payment.academyName.toLowerCase().includes(paymentSearch.toLowerCase())
      
      const matchesMethod = paymentMethodFilter.length === 0 || paymentMethodFilter.includes(payment.paymentMethod)
      
      return matchesSearch && matchesMethod
    })

    if (paymentSort) {
      result.sort((a, b) => {
        const aVal = a[paymentSort.field as keyof PaymentHistory]
        const bVal = b[paymentSort.field as keyof PaymentHistory]
        
        // Handle undefined values
        if (aVal === undefined && bVal === undefined) return 0
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1
        
        if (aVal < bVal) return paymentSort.order === "asc" ? -1 : 1
        if (aVal > bVal) return paymentSort.order === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [paymentSearch, paymentMethodFilter, paymentSort])

  const toggleInvoiceColumn = (columnId: InvoiceColumnId) => {
    setVisibleInvoiceColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const togglePaymentColumn = (columnId: PaymentColumnId) => {
    setVisiblePaymentColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const handleInvoiceSort = (field: string) => {
    setInvoiceSort(prev => {
      if (prev?.field === field) {
        return prev.order === "asc" ? { field, order: "desc" } : null
      }
      return { field, order: "asc" }
    })
  }

  const handlePaymentSort = (field: string) => {
    setPaymentSort(prev => {
      if (prev?.field === field) {
        return prev.order === "asc" ? { field, order: "desc" } : null
      }
      return { field, order: "asc" }
    })
  }

  const downloadInvoice = (invoiceNumber: string) => {
    console.log("Downloading invoice:", invoiceNumber)
    // TODO: Implement actual download
  }

  const downloadReceipt = (transactionId: string) => {
    console.log("Downloading receipt:", transactionId)
    // TODO: Implement actual download
  }

  return (
    <div className="space-y-8">
      {/* Invoices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        </div>

        {/* Invoice Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(invoiceStatusFilter.length > 0 || invoicePlanFilter.length > 0) && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                    {invoiceStatusFilter.length + invoicePlanFilter.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Checkbox
                  checked={invoiceStatusFilter.includes("Paid")}
                  onCheckedChange={(checked) => {
                    setInvoiceStatusFilter(prev =>
                      checked ? [...prev, "Paid"] : prev.filter(s => s !== "Paid")
                    )
                  }}
                />
                <span className="ml-2">Paid</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Checkbox
                  checked={invoiceStatusFilter.includes("Failed")}
                  onCheckedChange={(checked) => {
                    setInvoiceStatusFilter(prev =>
                      checked ? [...prev, "Failed"] : prev.filter(s => s !== "Failed")
                    )
                  }}
                />
                <span className="ml-2">Failed</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Plan Type</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Checkbox
                  checked={invoicePlanFilter.includes("monthly")}
                  onCheckedChange={(checked) => {
                    setInvoicePlanFilter(prev =>
                      checked ? [...prev, "monthly"] : prev.filter(p => p !== "monthly")
                    )
                  }}
                />
                <span className="ml-2">Monthly</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Checkbox
                  checked={invoicePlanFilter.includes("yearly")}
                  onCheckedChange={(checked) => {
                    setInvoicePlanFilter(prev =>
                      checked ? [...prev, "yearly"] : prev.filter(p => p !== "yearly")
                    )
                  }}
                />
                <span className="ml-2">Yearly</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Columns
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {INVOICE_COLUMNS.filter(col => col.id !== "actions").map((column) => (
                <DropdownMenuItem key={column.id} onSelect={(e) => e.preventDefault()}>
                  <Checkbox
                    checked={visibleInvoiceColumns.includes(column.id as InvoiceColumnId)}
                    onCheckedChange={() => toggleInvoiceColumn(column.id as InvoiceColumnId)}
                  />
                  <span className="ml-2">{column.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-gray-100" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-gray-100" : ""}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Table/Grid */}
        {viewMode === "list" ? (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    {visibleInvoiceColumns.includes("academyName") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handleInvoiceSort("academyName")}
                      >
                        Academy Name
                      </th>
                    )}
                    {visibleInvoiceColumns.includes("planType") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handleInvoiceSort("planType")}
                      >
                        Plan Type
                      </th>
                    )}
                    {visibleInvoiceColumns.includes("invoiceNumber") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handleInvoiceSort("invoiceNumber")}
                      >
                        Invoice Number
                      </th>
                    )}
                    {visibleInvoiceColumns.includes("dateIssued") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handleInvoiceSort("dateIssued")}
                      >
                        Date Issued
                      </th>
                    )}
                    {visibleInvoiceColumns.includes("amount") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handleInvoiceSort("amount")}
                      >
                        Amount
                      </th>
                    )}
                    {visibleInvoiceColumns.includes("status") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handleInvoiceSort("status")}
                      >
                        Status
                      </th>
                    )}
                    <th className="py-4 px-6 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-gray-100 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-orange-50/30 transition-colors duration-200">
                      {visibleInvoiceColumns.includes("academyName") && (
                        <td className="py-4 px-6 text-gray-700 font-medium">{invoice.academyName}</td>
                      )}
                      {visibleInvoiceColumns.includes("planType") && (
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {invoice.planType.charAt(0).toUpperCase() + invoice.planType.slice(1)}
                          </span>
                        </td>
                      )}
                      {visibleInvoiceColumns.includes("invoiceNumber") && (
                        <td className="py-4 px-6 flex items-center gap-2 text-gray-700">
                          <FileText size={16} className="text-purple-600" />
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </td>
                      )}
                      {visibleInvoiceColumns.includes("dateIssued") && (
                        <td className="py-4 px-6 text-gray-700">{new Date(invoice.dateIssued).toLocaleDateString()}</td>
                      )}
                      {visibleInvoiceColumns.includes("amount") && (
                        <td className="py-4 px-6 text-gray-700">
                          <span className="flex items-center font-semibold">
                            <IndianRupee size={14} /> {invoice.amount.toLocaleString()}
                          </span>
                        </td>
                      )}
                      {visibleInvoiceColumns.includes("status") && (
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "Paid" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {invoice.status === "Paid" ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            {invoice.status}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => downloadInvoice(invoice.invoiceNumber)}
                        >
                          <Download size={14} /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{invoice.academyName}</h3>
                    <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    invoice.status === "Paid" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{invoice.planType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(invoice.dateIssued).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold flex items-center">
                      <IndianRupee size={14} /> {invoice.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => downloadInvoice(invoice.invoiceNumber)}
                >
                  <Download size={14} /> Download PDF
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
        </div>

        {/* Payment Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search payments..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {paymentMethodFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                    {paymentMethodFilter.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Payment Method</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Checkbox
                  checked={paymentMethodFilter.includes("Card")}
                  onCheckedChange={(checked) => {
                    setPaymentMethodFilter(prev =>
                      checked ? [...prev, "Card"] : prev.filter(m => m !== "Card")
                    )
                  }}
                />
                <span className="ml-2">Card</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Checkbox
                  checked={paymentMethodFilter.includes("Bank Transfer")}
                  onCheckedChange={(checked) => {
                    setPaymentMethodFilter(prev =>
                      checked ? [...prev, "Bank Transfer"] : prev.filter(m => m !== "Bank Transfer")
                    )
                  }}
                />
                <span className="ml-2">Bank Transfer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Columns
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {PAYMENT_COLUMNS.filter(col => col.id !== "actions").map((column) => (
                <DropdownMenuItem key={column.id} onSelect={(e) => e.preventDefault()}>
                  <Checkbox
                    checked={visiblePaymentColumns.includes(column.id as PaymentColumnId)}
                    onCheckedChange={() => togglePaymentColumn(column.id as PaymentColumnId)}
                  />
                  <span className="ml-2">{column.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-gray-100" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-gray-100" : ""}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Payment Table/Grid */}
        {viewMode === "list" ? (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    {visiblePaymentColumns.includes("academyName") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePaymentSort("academyName")}
                      >
                        Academy Name
                      </th>
                    )}
                    {visiblePaymentColumns.includes("date") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePaymentSort("date")}
                      >
                        Date
                      </th>
                    )}
                    {visiblePaymentColumns.includes("amount") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePaymentSort("amount")}
                      >
                        Amount
                      </th>
                    )}
                    {visiblePaymentColumns.includes("paymentMethod") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePaymentSort("paymentMethod")}
                      >
                        Payment Method
                      </th>
                    )}
                    {visiblePaymentColumns.includes("transactionId") && (
                      <th 
                        className="py-4 px-6 font-semibold cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePaymentSort("transactionId")}
                      >
                        Transaction ID
                      </th>
                    )}
                    {visiblePaymentColumns.includes("refunds") && (
                      <th className="py-4 px-6 font-semibold">
                        Refunds/Adjustments
                      </th>
                    )}
                    <th className="py-4 px-6 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-gray-100 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-orange-50/30 transition-colors duration-200">
                      {visiblePaymentColumns.includes("academyName") && (
                        <td className="py-4 px-6 text-gray-700 font-medium">{payment.academyName}</td>
                      )}
                      {visiblePaymentColumns.includes("date") && (
                        <td className="py-4 px-6 text-gray-700">{new Date(payment.date).toLocaleDateString()}</td>
                      )}
                      {visiblePaymentColumns.includes("amount") && (
                        <td className="py-4 px-6 text-gray-700">
                          <span className="flex items-center font-semibold">
                            <IndianRupee size={14} /> {payment.amount.toLocaleString()}
                          </span>
                        </td>
                      )}
                      {visiblePaymentColumns.includes("paymentMethod") && (
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {payment.paymentMethod}
                          </span>
                        </td>
                      )}
                      {visiblePaymentColumns.includes("transactionId") && (
                        <td className="py-4 px-6 text-gray-700 font-mono text-xs">{payment.transactionId}</td>
                      )}
                      {visiblePaymentColumns.includes("refunds") && (
                        <td className="py-4 px-6 text-gray-700 text-xs">
                          {payment.refunds || payment.adjustments ? (
                            <span className="text-orange-600">{payment.refunds || payment.adjustments}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => downloadReceipt(payment.transactionId)}
                        >
                          <Download size={14} /> Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{payment.academyName}</h3>
                    <p className="text-xs text-gray-600 font-mono">{payment.transactionId}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {payment.paymentMethod}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold flex items-center">
                      <IndianRupee size={14} /> {payment.amount.toLocaleString()}
                    </span>
                  </div>
                  {(payment.refunds || payment.adjustments) && (
                    <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-50 rounded">
                      {payment.refunds || payment.adjustments}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => downloadReceipt(payment.transactionId)}
                >
                  <Download size={14} /> Download Receipt
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
