"use client"
import React, { useState, useMemo } from "react"
import { FileText, Download, CheckCircle, Mail, Printer, Search, List, Grid, Receipt } from "lucide-react"
import { InvoiceFiltersComponent } from "./InvoiceFilters"
import { InvoiceSort } from "./InvoiceSort"
import { PaymentFiltersComponent } from "./PaymentFilters"
import { PaymentSort } from "./PaymentSort"
import type { Invoice, InvoiceFilters, Payment, PaymentFilters } from "./invoice-types"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal"

export function Invoices() {
  // Invoice state
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("")
  const [invoiceSortBy, setInvoiceSortBy] = useState("dateIssued")
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<"asc" | "desc">("desc")
  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceFilters>({
    planType: [],
    status: [],
    paymentMethod: [],
    dateRange: { start: "", end: "" },
    amountRange: [0, 100000],
  })
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])

  // Payment state
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("")
  const [paymentSortBy, setPaymentSortBy] = useState("date")
  const [paymentSortOrder, setPaymentSortOrder] = useState<"asc" | "desc">("desc")
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({
    paymentMethod: [],
    dateRange: { start: "", end: "" },
    amountRange: [0, 100000],
  })
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([])

  // View mode states
  const [invoiceViewMode, setInvoiceViewMode] = useState<"list" | "grid">("list")
  const [paymentViewMode, setPaymentViewMode] = useState<"list" | "grid">("list")
  // Column management
  const invoiceColumns = ['Academy Name', 'Plan Type', 'Invoice Number', 'Date Issued', 'Amount', 'Status', 'Actions']
  const paymentColumns = ['Academy Name', 'Date', 'Amount', 'Payment Method', 'Transaction ID', 'Refunds/Adjustments', 'Actions']
  const defaultInvoiceColumns = ['Academy Name', 'Invoice Number', 'Date Issued', 'Amount', 'Status', 'Actions']
  const defaultPaymentColumns = ['Academy Name', 'Date', 'Amount', 'Payment Method', 'Actions']
  const [displayedInvoiceColumns, setDisplayedInvoiceColumns] = useState<string[]>(defaultInvoiceColumns)
  const [displayedPaymentColumns, setDisplayedPaymentColumns] = useState<string[]>(defaultPaymentColumns)
  const [showInvoiceColumnSelector, setShowInvoiceColumnSelector] = useState(false)
  const [showPaymentColumnSelector, setShowPaymentColumnSelector] = useState(false)  // Selection toggle functions
  const toggleInvoiceSelect = (id: string, checked: boolean) => {
    setSelectedInvoiceIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }
  const toggleInvoiceSelectAll = (checked: boolean) => {
    setSelectedInvoiceIds(checked ? filteredAndSortedInvoices.map(inv => inv.id) : [])
  }
  const togglePaymentSelect = (id: string, checked: boolean) => {
    setSelectedPaymentIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }
  const togglePaymentSelectAll = (checked: boolean) => {
    setSelectedPaymentIds(checked ? filteredAndSortedPayments.map(pay => pay.id) : [])
  }

  // Export functions
  const exportInvoicesToCSV = (invoices: Invoice[]) => {
    const columns = [
      { header: 'Invoice Number', getter: (inv: Invoice) => inv.invoiceNumber },
      { header: 'Academy Name', getter: (inv: Invoice) => inv.academyName },
      { header: 'Date Issued', getter: (inv: Invoice) => new Date(inv.dateIssued).toLocaleDateString('en-IN') },
      { header: 'Amount', getter: (inv: Invoice) => inv.amount },
      { header: 'Plan Type', getter: (inv: Invoice) => inv.planType },
      { header: 'Status', getter: (inv: Invoice) => inv.status },
      { header: 'Payment Method', getter: (inv: Invoice) => inv.paymentMethod },
      { header: 'Description', getter: (inv: Invoice) => inv.description },
    ]
    const esc = (v: any) => {
      const s = v == null ? '' : String(v)
      if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const headerLine = columns.map(c => esc(c.header)).join(',')
    const lines = [headerLine]
    invoices.forEach(inv => {
      lines.push(columns.map(c => esc(c.getter(inv))).join(','))
    })
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportPaymentsToCSV = (payments: Payment[]) => {
    const columns = [
      { header: 'Transaction ID', getter: (pay: Payment) => pay.transactionId },
      { header: 'Academy Name', getter: (pay: Payment) => pay.academyName },
      { header: 'Date', getter: (pay: Payment) => new Date(pay.date).toLocaleDateString('en-IN') },
      { header: 'Amount', getter: (pay: Payment) => pay.amount },
      { header: 'Payment Method', getter: (pay: Payment) => pay.paymentMethod },
      { header: 'Refunds/Adjustments', getter: (pay: Payment) => pay.refundsAdjustments },
    ]
    const esc = (v: any) => {
      const s = v == null ? '' : String(v)
      if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const headerLine = columns.map(c => esc(c.header)).join(',')
    const lines = [headerLine]
    payments.forEach(pay => {
      lines.push(columns.map(c => esc(c.getter(pay))).join(','))
    })
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportInvoices = () => {
    if (selectedInvoiceIds.length > 0) {
      const byId = new Map(filteredAndSortedInvoices.map(inv => [inv.id, inv]))
      const selected = selectedInvoiceIds.map(id => byId.get(id)).filter(Boolean) as Invoice[]
      exportInvoicesToCSV(selected)
    } else {
      exportInvoicesToCSV(filteredAndSortedInvoices)
    }
  }

  const handleExportPayments = () => {
    if (selectedPaymentIds.length > 0) {
      const byId = new Map(filteredAndSortedPayments.map(pay => [pay.id, pay]))
      const selected = selectedPaymentIds.map(id => byId.get(id)).filter(Boolean) as Payment[]
      exportPaymentsToCSV(selected)
    } else {
      exportPaymentsToCSV(filteredAndSortedPayments)
    }
  }
  // Mock Invoice Data
  const invoices: Invoice[] = [
    { 
      id: "1",
      academyName: "Main Academy", 
      planType: "Yearly",
      invoiceNumber: "INV-2025-001234", 
      dateIssued: "2025-01-15", 
      amount: 11988, 
      status: "Paid", 
      paymentMethod: "Card", 
      description: "Annual Subscription - Grow Plan" 
    },
    { 
      id: "2",
      academyName: "Main Academy", 
      planType: "Yearly",
      invoiceNumber: "INV-2024-005678", 
      dateIssued: "2024-01-15", 
      amount: 11988, 
      status: "Paid", 
      paymentMethod: "UPI", 
      description: "Annual Subscription - Grow Plan" 
    },
    { 
      id: "3",
      academyName: "North Branch", 
      planType: "Monthly",
      invoiceNumber: "INV-2025-001235", 
      dateIssued: "2025-02-01", 
      amount: 1199, 
      status: "Failed", 
      paymentMethod: "Card", 
      description: "Monthly Subscription - Grow Plan" 
    },
  ]

  // Mock Payment Data
  const payments: Payment[] = [
    {
      id: "1",
      academyName: "Main Academy",
      date: "2025-01-15",
      amount: 11988,
      paymentMethod: "Card",
      transactionId: "TXN-2025-ABC123",
      refundsAdjustments: "-",
    },
    {
      id: "2",
      academyName: "Main Academy",
      date: "2024-01-15",
      amount: 11988,
      paymentMethod: "UPI",
      transactionId: "TXN-2024-XYZ789",
      refundsAdjustments: "-",
    },
  ]

  // Filter and Sort Invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => {
      // Search filter
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || 
        inv.description.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        inv.academyName.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
      
      // Plan type filter
      const matchesPlanType = invoiceFilters.planType.length === 0 || 
        invoiceFilters.planType.includes(inv.planType)
      
      // Status filter
      const matchesStatus = invoiceFilters.status.length === 0 || 
        invoiceFilters.status.includes(inv.status)
      
      // Payment method filter
      const matchesPaymentMethod = invoiceFilters.paymentMethod.length === 0 || 
        invoiceFilters.paymentMethod.includes(inv.paymentMethod)
      
      // Date range filter
      const matchesDateRange = 
        (invoiceFilters.dateRange.start === "" || new Date(inv.dateIssued) >= new Date(invoiceFilters.dateRange.start)) &&
        (invoiceFilters.dateRange.end === "" || new Date(inv.dateIssued) <= new Date(invoiceFilters.dateRange.end))
      
      // Amount range filter
      const matchesAmountRange = 
        inv.amount >= invoiceFilters.amountRange[0] && 
        inv.amount <= invoiceFilters.amountRange[1]
      
      return matchesSearch && matchesPlanType && matchesStatus && matchesPaymentMethod && matchesDateRange && matchesAmountRange
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[invoiceSortBy as keyof Invoice]
      let bValue: any = b[invoiceSortBy as keyof Invoice]
      
      if (invoiceSortBy === "dateIssued") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (aValue < bValue) return invoiceSortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return invoiceSortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [invoices, invoiceSearchTerm, invoiceFilters, invoiceSortBy, invoiceSortOrder])

  // Filter and Sort Payments
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments.filter(pay => {
      // Search filter
      const matchesSearch = 
        pay.transactionId.toLowerCase().includes(paymentSearchTerm.toLowerCase()) || 
        pay.academyName.toLowerCase().includes(paymentSearchTerm.toLowerCase())
      
      // Payment method filter
      const matchesPaymentMethod = paymentFilters.paymentMethod.length === 0 || 
        paymentFilters.paymentMethod.includes(pay.paymentMethod)
      
      // Date range filter
      const matchesDateRange = 
        (paymentFilters.dateRange.start === "" || new Date(pay.date) >= new Date(paymentFilters.dateRange.start)) &&
        (paymentFilters.dateRange.end === "" || new Date(pay.date) <= new Date(paymentFilters.dateRange.end))
      
      // Amount range filter
      const matchesAmountRange = 
        pay.amount >= paymentFilters.amountRange[0] && 
        pay.amount <= paymentFilters.amountRange[1]
      
      return matchesSearch && matchesPaymentMethod && matchesDateRange && matchesAmountRange
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[paymentSortBy as keyof Payment]
      let bValue: any = b[paymentSortBy as keyof Payment]
      
      if (paymentSortBy === "date") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (aValue < bValue) return paymentSortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return paymentSortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [payments, paymentSearchTerm, paymentFilters, paymentSortBy, paymentSortOrder])

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.status === "Paid" ? inv.amount : 0), 0)
  const currentYear = new Date().getFullYear()
  const thisYearTotal = invoices
    .filter(inv => new Date(inv.dateIssued).getFullYear() === currentYear && inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <CheckCircle className="text-white" size={16} />
            </div>
            <h4 className="text-sm font-medium text-gray-700">Total Paid</h4>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="text-white" size={16} />
            </div>
            <h4 className="text-sm font-medium text-gray-700">This Year</h4>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">₹{thisYearTotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{currentYear}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <FileText className="text-white" size={16} />
            </div>
            <h4 className="text-sm font-medium text-gray-700">Total Invoices</h4>
          </div>
          <span className="text-2xl font-bold text-gray-900">{invoices.length}</span>
          <p className="text-xs text-gray-600 mt-1">All paid invoices</p>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Invoices
          </h3>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative" style={{ width: '300px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={invoiceSearchTerm}
              onChange={(e) => setInvoiceSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <InvoiceFiltersComponent
              selectedFilters={invoiceFilters}
              setSelectedFilters={setInvoiceFilters}
            />
            <InvoiceSort
              sortBy={invoiceSortBy}
              setSortBy={setInvoiceSortBy}
              sortOrder={invoiceSortOrder}
              setSortOrder={setInvoiceSortOrder}
            />
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={invoiceViewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInvoiceViewMode("list")}
                className="rounded-r-none"
                style={invoiceViewMode === "list" ? { backgroundColor: '#7C3AED', color: 'white' } : {}}
                title="List View"
              >
                <div className="flex flex-col gap-0.5 w-4 h-4">
                  <div className="bg-current h-0.5 rounded-sm"></div>
                  <div className="bg-current h-0.5 rounded-sm"></div>
                  <div className="bg-current h-0.5 rounded-sm"></div>
                </div>
              </Button>
              <Button
                variant={invoiceViewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInvoiceViewMode("grid")}
                className="rounded-l-none border-l"
                style={invoiceViewMode === "grid" ? { backgroundColor: '#7C3AED', color: 'white' } : {}}
                title="Grid View"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </Button>
            </div>
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              title={selectedInvoiceIds.length ? `Export ${selectedInvoiceIds.length} selected` : 'Export all invoices'}
              onClick={handleExportInvoices}
            >
              <Download className="mr-2 h-4 w-4" /> {selectedInvoiceIds.length ? `Export (${selectedInvoiceIds.length})` : 'Export'}
            </Button>
          </div>
        </div>

        {/* Showing Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredAndSortedInvoices.length}</span> {filteredAndSortedInvoices.length === 1 ? 'invoice' : 'invoices'}
            </span>
          </div>
          {/* Column Selector Button (only in list view) */}
          {invoiceViewMode === 'list' && (
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:shadow transition-colors"
              style={{ border: '1px solid rgba(124, 58, 237, 0.5)', backgroundColor: 'rgba(124, 58, 237, 0.08)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.08)'}
              onClick={() => setShowInvoiceColumnSelector(true)}
              title="Displayed Columns"
              aria-label="Edit displayed invoice columns"
            >
              <Grid className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </button>
          )}
        </div>

      {/* Invoices Display */}
      {invoiceViewMode === "list" ? (
        <div className="border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-center w-10">
                    <Checkbox
                      checked={filteredAndSortedInvoices.length > 0 && filteredAndSortedInvoices.every(inv => selectedInvoiceIds.includes(inv.id))}
                      onCheckedChange={(checked) => toggleInvoiceSelectAll(!!checked)}
                      aria-label="Select all invoices"
                    />
                  </th>
                  {displayedInvoiceColumns.map(column => (
                    <th key={column} className={`px-6 py-4 text-${column === 'Actions' ? 'right' : 'left'} text-xs font-semibold text-gray-700 uppercase tracking-wider`}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={displayedInvoiceColumns.length + 1} className="px-6 py-12 text-center">
                      <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                      <p className="text-gray-500 font-medium">No invoices found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedInvoices.map((inv, idx) => (
                    <tr 
                      key={inv.id} 
                      className="hover:bg-purple-50/50 transition-colors group"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-4 py-4 text-center w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedInvoiceIds.includes(inv.id)}
                          onCheckedChange={(checked) => toggleInvoiceSelect(inv.id, !!checked)}
                          aria-label={`Select invoice ${inv.invoiceNumber}`}
                        />
                      </td>
                      {displayedInvoiceColumns.map(column => (
                        <td key={column} className={`px-6 py-4 whitespace-nowrap ${column === 'Actions' ? 'text-right' : ''}`}>
                          {column === 'Academy Name' && <span className="text-sm font-semibold text-gray-900">{inv.academyName}</span>}
                          {column === 'Plan Type' && (
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                              inv.planType === "Yearly" 
                                ? "bg-purple-100 text-purple-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {inv.planType}
                            </span>
                          )}
                          {column === 'Invoice Number' && (
                            <div className="flex items-center gap-2">
                              <FileText className="text-purple-600" size={16} />
                              <span className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</span>
                            </div>
                          )}
                          {column === 'Date Issued' && (
                            <span className="text-sm text-gray-700">
                              {new Date(inv.dateIssued).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                          {column === 'Amount' && (
                            <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                              ₹{inv.amount.toLocaleString()}
                            </div>
                          )}
                          {column === 'Status' && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              inv.status === "Paid" 
                                ? "bg-emerald-100 text-emerald-700"
                                : inv.status === "Failed"
                                ? "bg-red-100 text-red-700"
                                : inv.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {inv.status === "Paid" && <CheckCircle size={12} />}
                              {inv.status}
                            </span>
                          )}
                          {column === 'Actions' && (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                className="p-2 hover:bg-purple-100 rounded-lg transition-colors group/btn"
                                title="Download PDF"
                              >
                                <Download size={16} className="text-gray-600 group-hover/btn:text-purple-600" />
                              </button>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
            {filteredAndSortedInvoices.length === 0 ? (
              <div className="w-full py-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium">No invoices found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredAndSortedInvoices.map((inv, idx) => (
                <div 
                  key={inv.id} 
                  className="bg-white border-2 border-orange-400 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex-shrink-0"
                  style={{ width: '280px', minWidth: '280px' }}
                >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-purple-600" size={20} />
                    <span className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    inv.status === "Paid" 
                      ? "bg-emerald-100 text-emerald-700"
                      : inv.status === "Failed"
                      ? "bg-red-100 text-red-700"
                      : inv.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {inv.status === "Paid" && <CheckCircle size={12} />}
                    {inv.status}
                  </span>
                </div>
                
                <h4 className="text-base font-bold text-gray-900 mb-2">{inv.academyName}</h4>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Plan Type:</span>
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                      inv.planType === "Yearly" 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {inv.planType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date Issued:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(inv.dateIssued).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-900 font-medium">{inv.paymentMethod}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">₹{inv.amount.toLocaleString()}</span>
                  </div>
                  <button 
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download size={18} className="text-gray-600 hover:text-purple-600" />
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>

      {/* Payment History Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Payment History
          </h3>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative" style={{ width: '300px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search payments..."
              value={paymentSearchTerm}
              onChange={(e) => setPaymentSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <PaymentFiltersComponent
              selectedFilters={paymentFilters}
              setSelectedFilters={setPaymentFilters}
            />
            <PaymentSort
              sortBy={paymentSortBy}
              setSortBy={setPaymentSortBy}
              sortOrder={paymentSortOrder}
              setSortOrder={setPaymentSortOrder}
            />
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={paymentViewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPaymentViewMode("list")}
                className="rounded-r-none"
                style={paymentViewMode === "list" ? { backgroundColor: '#7C3AED', color: 'white' } : {}}
                title="List View"
              >
                <div className="flex flex-col gap-0.5 w-4 h-4">
                  <div className="bg-current h-0.5 rounded-sm"></div>
                  <div className="bg-current h-0.5 rounded-sm"></div>
                  <div className="bg-current h-0.5 rounded-sm"></div>
                </div>
              </Button>
              <Button
                variant={paymentViewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPaymentViewMode("grid")}
                className="rounded-l-none border-l"
                style={paymentViewMode === "grid" ? { backgroundColor: '#7C3AED', color: 'white' } : {}}
                title="Grid View"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </Button>
            </div>
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              title={selectedPaymentIds.length ? `Export ${selectedPaymentIds.length} selected` : 'Export all payments'}
              onClick={handleExportPayments}
            >
              <Download className="mr-2 h-4 w-4" /> {selectedPaymentIds.length ? `Export (${selectedPaymentIds.length})` : 'Export'}
            </Button>
          </div>
        </div>

        {/* Showing Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredAndSortedPayments.length}</span> {filteredAndSortedPayments.length === 1 ? 'payment' : 'payments'}
            </span>
          </div>
          {/* Column Selector Button (only in list view) */}
          {paymentViewMode === 'list' && (
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:shadow transition-colors"
              style={{ border: '1px solid rgba(59, 130, 246, 0.5)', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'}
              onClick={() => setShowPaymentColumnSelector(true)}
              title="Displayed Columns"
              aria-label="Edit displayed payment columns"
            >
              <Grid className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </button>
          )}
        </div>

      {/* Payment History Display */}
      {paymentViewMode === "list" ? (
        <div className="border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-center w-10">
                    <Checkbox
                      checked={filteredAndSortedPayments.length > 0 && filteredAndSortedPayments.every(pay => selectedPaymentIds.includes(pay.id))}
                      onCheckedChange={(checked) => togglePaymentSelectAll(!!checked)}
                      aria-label="Select all payments"
                    />
                  </th>
                  {displayedPaymentColumns.map(column => (
                    <th key={column} className={`px-6 py-4 text-${column === 'Actions' ? 'right' : 'left'} text-xs font-semibold text-gray-700 uppercase tracking-wider`}>
                      {column === 'Actions' ? 'Receipt' : column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={displayedPaymentColumns.length + 1} className="px-6 py-12 text-center">
                      <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
                      <p className="text-gray-500 font-medium">No payments found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPayments.map((pay, idx) => (
                    <tr 
                      key={pay.id} 
                      className="hover:bg-blue-50/50 transition-colors group"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-4 py-4 text-center w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedPaymentIds.includes(pay.id)}
                          onCheckedChange={(checked) => togglePaymentSelect(pay.id, !!checked)}
                          aria-label={`Select payment ${pay.transactionId}`}
                        />
                      </td>
                      {displayedPaymentColumns.map(column => (
                        <td key={column} className={`px-6 py-4 whitespace-nowrap ${column === 'Actions' ? 'text-right' : ''}`}>
                          {column === 'Academy Name' && <span className="text-sm font-semibold text-gray-900">{pay.academyName}</span>}
                          {column === 'Date' && (
                            <span className="text-sm text-gray-700">
                              {new Date(pay.date).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                          {column === 'Amount' && (
                            <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                              ₹{pay.amount.toLocaleString()}
                            </div>
                          )}
                          {column === 'Payment Method' && (
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                              pay.paymentMethod === "Card" 
                                ? "bg-blue-100 text-blue-700"
                                : pay.paymentMethod === "UPI"
                                ? "bg-green-100 text-green-700"
                                : pay.paymentMethod === "Net Banking"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {pay.paymentMethod}
                            </span>
                          )}
                          {column === 'Transaction ID' && (
                            <span className="text-sm font-medium text-gray-600 font-mono">{pay.transactionId}</span>
                          )}
                          {column === 'Refunds/Adjustments' && (
                            <span className="text-sm text-gray-600">{pay.refundsAdjustments}</span>
                          )}
                          {column === 'Actions' && (
                            <button 
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors group/btn"
                              title="Download Receipt"
                            >
                              <Download size={16} className="text-gray-600 group-hover/btn:text-blue-600" />
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
            {filteredAndSortedPayments.length === 0 ? (
              <div className="w-full py-12 text-center">
                <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium">No payments found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredAndSortedPayments.map((pay, idx) => (
                <div 
                  key={pay.id} 
                  className="bg-white border-2 border-orange-400 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex-shrink-0"
                  style={{ width: '280px', minWidth: '280px' }}
                >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="text-blue-600" size={20} />
                    <span className="text-sm font-semibold text-gray-900 font-mono">{pay.transactionId}</span>
                  </div>
                </div>
                
                <h4 className="text-base font-bold text-gray-900 mb-2">{pay.academyName}</h4>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(pay.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                      pay.paymentMethod === "Card" 
                        ? "bg-blue-100 text-blue-700"
                        : pay.paymentMethod === "UPI"
                        ? "bg-green-100 text-green-700"
                        : pay.paymentMethod === "Net Banking"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {pay.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Refunds/Adjustments:</span>
                    <span className="text-gray-900 font-medium">{pay.refundsAdjustments}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">₹{pay.amount.toLocaleString()}</span>
                  </div>
                  <button 
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download Receipt"
                  >
                    <Download size={18} className="text-gray-600 hover:text-blue-600" />
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>

      {/* Column Selector Modals */}
      <ColumnSelectorModal
        open={showInvoiceColumnSelector}
        columns={invoiceColumns}
        displayedColumns={displayedInvoiceColumns}
        setDisplayedColumns={setDisplayedInvoiceColumns}
        onClose={() => setShowInvoiceColumnSelector(false)}
        onSave={() => setShowInvoiceColumnSelector(false)}
        onReset={() => setDisplayedInvoiceColumns(defaultInvoiceColumns)}
        storageKeyPrefix="invoice"
        fixedColumns={["Actions"]}
      />
      <ColumnSelectorModal
        open={showPaymentColumnSelector}
        columns={paymentColumns}
        displayedColumns={displayedPaymentColumns}
        setDisplayedColumns={setDisplayedPaymentColumns}
        onClose={() => setShowPaymentColumnSelector(false)}
        onSave={() => setShowPaymentColumnSelector(false)}
        onReset={() => setDisplayedPaymentColumns(defaultPaymentColumns)}
        storageKeyPrefix="payment"
        fixedColumns={["Actions"]}
      />
    </div>
  )
}
