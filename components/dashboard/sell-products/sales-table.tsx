"use client"

import { useState, useEffect, useMemo } from "react"
import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Input } from "@/components/dashboard/ui/input"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dashboard/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dashboard/ui/table"
import { FileText, Mail, Download, Upload, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { SALES_TABLE_COLUMNS, type SalesColumnId } from "./sales-columns"
import { ColumnSelectorModal } from "./column-selector"
import { SalesFilterDropdown } from "./sales-filter-dropdown"
import { GridListToggle } from "@/components/dashboard/GridListToggle"
import GridIcon from "@/components/dashboard/icons/grid"

interface Sale {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  invoiceNumber: string
  date: string
  finalAmount: number
  paymentMethod: string
  status: "Completed" | "Pending" | "Failed"
  items?: { productId: string; productName?: string; quantity: number; price: number }[]
}

interface SalesTableProps {
  sales: Sale[]
}

interface FilterState {
  status: string[]
  paymentMethod: string[]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export function SalesTable({ sales }: SalesTableProps) {
  const { currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    paymentMethod: [],
  })
  const [sortBy, setSortBy] = useState<string>('invoiceNumber')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  
  const [visibleColumns, setVisibleColumns] = useState<SalesColumnId[]>(() => {
    if (typeof window === 'undefined') return SALES_TABLE_COLUMNS.map(c => c.id)
    try {
      const raw = localStorage.getItem('salesDisplayedColumns')
      if (!raw) return SALES_TABLE_COLUMNS.map(c => c.id)
      const parsed = JSON.parse(raw) as string[]
      const ids = parsed.filter((id): id is SalesColumnId => SALES_TABLE_COLUMNS.some(c => c.id === id))
      return ids.length ? ids : SALES_TABLE_COLUMNS.map(c => c.id)
    } catch {
      return SALES_TABLE_COLUMNS.map(c => c.id)
    }
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      if (!detail) return
      const ids = detail.filter((id): id is SalesColumnId => SALES_TABLE_COLUMNS.some(c => c.id === id))
      setVisibleColumns(ids)
    }
    window.addEventListener('sales-displayed-columns-changed', handler as EventListener)
    return () => window.removeEventListener('sales-displayed-columns-changed', handler as EventListener)
  }, [])

  const isVisible = (id: SalesColumnId) => visibleColumns.includes(id)

  // Filter and search
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerPhone.includes(searchTerm)
      
      const matchesStatus = filters.status.length === 0 || filters.status.includes(sale.status)
      const matchesPayment = filters.paymentMethod.length === 0 || filters.paymentMethod.includes(sale.paymentMethod)
      
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [sales, searchTerm, filters])

  // Sort
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let aValue: any = a[sortBy as keyof Sale]
      let bValue: any = b[sortBy as keyof Sale]

      if (sortBy === 'date') {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      } else if (sortBy === 'finalAmount') {
        aValue = a.finalAmount
        bValue = b.finalAmount
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredSales, sortBy, sortOrder])

  const handleExport = () => {
    const headers = ['Invoice #', 'Customer Name', 'Customer Email', 'Customer Phone', 'Date', 'Amount', 'Payment Method', 'Status']
    const csvData = sortedSales.map(sale => [
      sale.invoiceNumber,
      sale.customerName,
      sale.customerEmail,
      sale.customerPhone,
      sale.date,
      sale.finalAmount,
      sale.paymentMethod,
      sale.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sales-invoices-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClearFilters = () => {
    setFilters({
      status: [],
      paymentMethod: [],
    })
  }

  const toggleSale = (saleId: string) => {
    setSelectedSales(prev => {
      const newSet = new Set(prev)
      if (newSet.has(saleId)) {
        newSet.delete(saleId)
      } else {
        newSet.add(saleId)
      }
      return newSet
    })
  }

  const toggleAllSales = () => {
    if (selectedSales.size === sortedSales.length) {
      setSelectedSales(new Set())
    } else {
      setSelectedSales(new Set(sortedSales.map(s => s.id)))
    }
  }

  const allSelected = sortedSales.length > 0 && selectedSales.size === sortedSales.length
  const someSelected = selectedSales.size > 0 && selectedSales.size < sortedSales.length

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-purple-700">Recent Sales & Invoices</h2>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white" />
            <Input
              placeholder="Search by customer, email, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <SalesFilterDropdown
            filters={filters}
            onApply={setFilters}
            onClear={handleClearFilters}
            sales={sales}
            open={filterDropdownOpen}
            onOpenChange={setFilterDropdownOpen}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-1">
                <span className="text-xs flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {sortBy === 'invoiceNumber' && 'Invoice'}
                  {sortBy === 'customerName' && 'Name'}
                  {sortBy === 'date' && 'Date'}
                  {sortBy === 'finalAmount' && 'Amount'}
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="overflow-x-hidden">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <div className="max-h-40 overflow-y-auto pr-1">
                {[
                  { value: 'invoiceNumber', label: 'Invoice Number' },
                  { value: 'customerName', label: 'Name' },
                  { value: 'date', label: 'Date' },
                  { value: 'finalAmount', label: 'Amount' },
                ].map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={sortBy === option.value ? "bg-purple-50" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                Descending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Results Summary with Column Selector */}
        <div className="text-sm mb-2 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-[#7C3AED]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#7C3AED] opacity-80" aria-hidden="true" />
            <span>
              Showing <span className="font-semibold">{sortedSales.length}</span> of <span className="font-semibold">{sales.length}</span> sales
            </span>
          </div>
          <span
            className="ml-2 px-2 py-1 bg-purple-100 rounded border border-purple-300 flex items-center justify-center cursor-pointer"
            onClick={() => setColumnSelectorOpen(true)}
            title="Select displayed columns"
          >
            <GridIcon className="w-7 h-7" />
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <TableHead className="w-[44px]">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAllSales}
                />
              </TableHead>
              {isVisible("invoiceNumber") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">
                  Invoice #
                </TableHead>
              )}
              {isVisible("customerName") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">
                  Customer
                </TableHead>
              )}
              {isVisible("customerEmail") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">Customer Email</TableHead>
              )}
              {isVisible("customerPhone") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">Phone</TableHead>
              )}
              {isVisible("productService") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">Product/Service</TableHead>
              )}
              {isVisible("date") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">
                  Date
                </TableHead>
              )}
              {isVisible("amount") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">
                  Amount ({currency})
                </TableHead>
              )}
              {isVisible("paymentMethod") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">Payment</TableHead>
              )}
              {isVisible("status") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">Status</TableHead>
              )}
              {isVisible("actions") && (
                <TableHead className="text-gray-700 dark:text-white font-semibold">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500 dark:text-white">
                  No sales found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              sortedSales.map((sale) => {
                const productNames = sale.items?.map(item => item.productName || item.productId).join(', ') || 'N/A'
                return (
                  <TableRow key={sale.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-smooth">
                    <TableCell className="w-[44px]" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select ${sale.customerName}`}
                        checked={selectedSales.has(sale.id)}
                        onCheckedChange={() => toggleSale(sale.id)}
                      />
                    </TableCell>
                    {isVisible("invoiceNumber") && (
                      <TableCell className="font-mono text-gray-700 dark:text-white">{sale.invoiceNumber}</TableCell>
                    )}
                    {isVisible("customerName") && (
                      <TableCell>
                        <div className="font-semibold text-gray-900 dark:text-white">{sale.customerName}</div>
                      </TableCell>
                    )}
                    {isVisible("customerEmail") && (
                      <TableCell>
                        <div className="text-sm text-gray-600 dark:text-white">{sale.customerEmail}</div>
                      </TableCell>
                    )}
                    {isVisible("customerPhone") && (
                      <TableCell className="text-sm text-gray-600 dark:text-white">{sale.customerPhone}</TableCell>
                    )}
                    {isVisible("productService") && (
                      <TableCell className="text-gray-700 dark:text-white">
                        <div className="max-w-xs truncate" title={productNames}>
                          {productNames}
                        </div>
                      </TableCell>
                    )}
                    {isVisible("date") && (
                      <TableCell className="text-gray-700 dark:text-white">{formatDate(sale.date)}</TableCell>
                    )}
                    {isVisible("amount") && (
                      <TableCell className="font-bold text-purple-600">{currency} {sale.finalAmount}</TableCell>
                    )}
                    {isVisible("paymentMethod") && (
                      <TableCell>
                        <Badge variant="outline" className="border-purple-300 text-purple-600">
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                    )}
                    {isVisible("status") && (
                      <TableCell>
                        <Badge
                          className={`${
                            sale.status === "Completed"
                              ? "bg-green-500/80 text-white"
                              : sale.status === "Pending"
                                ? "bg-yellow-500/80 text-white"
                                : "bg-red-500/80 text-white"
                          } transition-smooth`}
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                    )}
                    {isVisible("actions") && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" title="View Invoice" className="hover:bg-gray-200">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Email" className="hover:bg-orange-100">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download" className="hover:bg-orange-100">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ColumnSelectorModal
        open={columnSelectorOpen}
        onOpenChange={setColumnSelectorOpen}
        storageKey="salesDisplayedColumns"
      />
    </div>
  )
}
