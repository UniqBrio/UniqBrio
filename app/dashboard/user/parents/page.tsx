"use client"

export const dynamic = 'force-dynamic'

import React, { useMemo, useState, useCallback, useEffect } from "react"
import { useCurrency } from "@/contexts/currency-context"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import {
  LayoutDashboard,
  Plus,
  Users,
  Search,
  Grid,
  List,
  Download,
  Upload,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Check,
  ArrowUpDown,
  Bell,
  Rocket,
  CheckCircle2,
} from "lucide-react"
import { useToast as useGlobalToast } from "@/hooks/use-toast"
import { Badge } from "@/components/dashboard/ui/badge"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import MultiSelectDropdown from "@/components/dashboard/student/students/MultiSelectDropDown"
import { ParentFormModal } from "@/components/dashboard/parents/parent-form-modal"
import { ParentAnalytics } from "@/components/dashboard/parents/parent-analytics"
import { useToast } from "@/hooks/dashboard/use-toast"
import { type Parent } from "@/types/dashboard/parent"
import { staticParents } from "@/data/dashboard/parents"
import { formatDateForDisplay } from "@/lib/dashboard/student/utils"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { FileText } from "lucide-react"
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal"
import ParentHeroSection from "@/components/dashboard/parents/ParentHeroSection"
import ParentStatisticsCards from "@/components/dashboard/parents/ParentStatisticsCards"

// Grid icon component for column selector
function GridIcon({ className = "w-6 h-6", color = "#7C3AED" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="10" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="17" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="3" y="10" width="5" height="5" rx="1.5" fill={color} />
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill={color} />
      <rect x="17" y="10" width="5" height="5" rx="1.5" fill={color} />
      <rect x="3" y="17" width="5" height="5" rx="1.5" fill={color} />
      <rect x="10" y="17" width="5" height="5" rx="1.5" fill={color} />
      <rect x="17" y="17" width="5" height="5" rx="1.5" fill={color} />
    </svg>
  );
}

interface ParentFilters {
  categories: string[]
  paymentStatuses: string[]
}

export default function ParentsPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  const { currency } = useCurrency()
  const { toast } = useToast()
  const { toast: globalToast } = useGlobalToast()
  const [loading, setLoading] = useState<boolean>(false)
  const [notified, setNotified] = useState(false)
  const [isNotifyLoading, setIsNotifyLoading] = useState(false)

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const response = await fetch("/api/feature-notifications?feature=parent-management&checkStatus=true")
        if (response.ok) {
          const data = await response.json()
          if (data.isSubscribed) {
            setNotified(true)
          }
        }
      } catch (error) {
        // Silently fail - user can still subscribe
      }
    }
    checkSubscriptionStatus()
  }, [])

  const handleNotifyMe = async () => {
    if (notified || isNotifyLoading) return
    setIsNotifyLoading(true)
    try {
      const response = await fetch("/api/feature-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "parent-management" }),
      })
      const data = await response.json()
      if (response.ok) {
        setNotified(true)
        if (data.alreadySubscribed) {
          globalToast({
            title: "Already Subscribed",
            description: "You've already signed up for Parent Management updates.",
          })
        } else {
          globalToast({
            title: "🎉 You're on the list!",
            description: "We'll notify you as soon as the new Parent Management features are ready.",
          })
        }
      }
    } catch (error) {
      globalToast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsNotifyLoading(false)
    }
  }

  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [parents, setParents] = useState<Parent[]>(staticParents)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<ParentFilters>({
    categories: [],
    paymentStatuses: [],
  })
  const [pendingFilters, setPendingFilters] = useState<ParentFilters>({
    categories: [],
    paymentStatuses: [],
  })
  const [showAddParentModal, setShowAddParentModal] = useState(false)
  const [editingParent, setEditingParent] = useState<Parent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Parent | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false)
  const [draftToEdit, setDraftToEdit] = useState<Partial<Parent> | null>(null)
  const [draftIdBeingEdited, setDraftIdBeingEdited] = useState<string | null>(null)
  
  // Column management
  const parentColumns = ['Name', 'Student ID', 'Contact', 'Categories', 'Payment', 'Status', 'Actions']
  const defaultDisplayedColumns = ['Name', 'Student ID', 'Contact', 'Categories', 'Payment', 'Status', 'Actions']
  const [displayedColumns, setDisplayedColumns] = useState<string[]>(defaultDisplayedColumns)
  const [showParentColumnSelector, setShowParentColumnSelector] = useState(false)
  
  // Close column selector automatically if user switches to grid view
  React.useEffect(() => {
    if (viewMode === 'grid' && showParentColumnSelector) {
      setShowParentColumnSelector(false)
    }
  }, [viewMode, showParentColumnSelector])

  const categoriesOptions = useMemo(() => {
    const cats = new Set<string>()
    parents.forEach(p => {
      if (Array.isArray(p.categories)) {
        p.categories.forEach(cat => cats.add(cat))
      }
    })
    return Array.from(cats).sort()
  }, [parents])

  const paymentStatusOptions = ["Paid", "Pending", "Overdue"]

  const allStudentIds = useMemo(() => {
    return Array.from(new Set(parents.map(p => p.linkedStudentId))).sort()
  }, [parents])

  const filteredParents = useMemo(() => {
    let filtered = parents.filter(p => {
      const fullName = `${p.firstName}${p.middleName ? ' ' + p.middleName : ''} ${p.lastName}`.toLowerCase()
      return (
        fullName.includes(searchTerm.toLowerCase()) ||
        p.linkedStudentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    if (filters.categories.length > 0) {
      filtered = filtered.filter(p =>
        p.categories.some(cat => filters.categories.includes(cat))
      )
    }

    if (filters.paymentStatuses.length > 0) {
      filtered = filtered.filter(p => filters.paymentStatuses.includes(p.paymentStatus))
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let vA: any
      let vB: any
      switch (sortBy) {
        case 'name':
          vA = `${a.firstName}${a.middleName ? ' ' + a.middleName : ''} ${a.lastName}`.toLowerCase()
          vB = `${b.firstName}${b.middleName ? ' ' + b.middleName : ''} ${b.lastName}`.toLowerCase()
          break
        case 'joinDate':
          vA = new Date(a.joinDate).getTime()
          vB = new Date(b.joinDate).getTime()
          break
        case 'paymentStatus':
          vA = a.paymentStatus.toLowerCase()
          vB = b.paymentStatus.toLowerCase()
          break
        case 'dueAmount':
          vA = a.dueAmount
          vB = b.dueAmount
          break
        default:
          vA = a.firstName.toLowerCase()
          vB = b.firstName.toLowerCase()
      }
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [parents, searchTerm, filters, sortBy, sortOrder])

  const allVisibleIds = useMemo(() => filteredParents.map(p => p.parentId), [filteredParents])
  
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }, [])
  
  const toggleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? allVisibleIds : [])
  }, [allVisibleIds])

  const handleAddParent = useCallback((parentData: any) => {
    const newParent: Parent = {
      ...parentData,
      id: String(parents.length + 1),
      parentId: `PAR${String(parents.length + 1).padStart(4, '0')}`,
    }
    setParents(prev => [newParent, ...prev])
    setShowAddParentModal(false)
    toast({
      title: "✅ Parent Added",
      description: `${newParent.firstName} ${newParent.lastName} has been added successfully.`,
      duration: 3000,
    })
  }, [parents.length, toast])

  const handleEditParent = useCallback((parent: Parent) => {
    setEditingParent(parent)
    setIsEditing(true)
    setShowAddParentModal(true)
  }, [])

  const handleUpdateParent = useCallback((parentData: any) => {
    setParents(prev =>
      prev.map(p =>
        p.parentId === editingParent?.parentId
          ? { ...p, ...parentData }
          : p
      )
    )
    setEditingParent(null)
    setIsEditing(false)
    setShowAddParentModal(false)
    toast({
      title: "✅ Parent Updated",
      description: `${parentData.firstName} ${parentData.lastName} has been updated successfully.`,
      duration: 3000,
    })
  }, [editingParent?.parentId, toast])

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return

    setParents(prev => prev.filter(p => p.parentId !== pendingDelete.parentId))
    toast({
      title: "🗑️ Parent Deleted",
      description: `${pendingDelete.firstName} ${pendingDelete.lastName} has been deleted.`,
      duration: 3000,
    })
    setPendingDelete(null)
    setShowDeleteDialog(false)
  }, [pendingDelete, toast])

  const getPaymentStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800 dark:text-white"
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    return status === "Active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800 dark:text-white"
  }, [])

  // CSV Export helpers
  const dateToString = (date: string | Date | undefined): string => {
    if (!date) return ''
    if (typeof date === 'string') return date
    return date instanceof Date ? date.toISOString().split('T')[0] : ''
  }

  function toCSV(rows: Parent[]) {
    const columns: { header: string; getter: (p: Parent) => any }[] = [
      { header: 'Parent ID', getter: p => p.parentId || '' },
      { header: 'First Name', getter: p => p.firstName || '' },
      { header: 'Middle Name', getter: p => p.middleName || '' },
      { header: 'Last Name', getter: p => p.lastName || '' },
      { header: 'Full Name', getter: p => `${p.firstName}${p.middleName ? ' ' + p.middleName : ''} ${p.lastName}` },
      { header: 'Email', getter: p => p.email || '' },
      { header: 'Mobile Number', getter: p => p.mobile || '' },
      { header: 'Country Code', getter: p => p.countryCode || '' },
      { header: 'Country', getter: p => p.country || '' },
      { header: 'State/Province', getter: p => p.stateProvince || '' },
      { header: 'City', getter: p => p.city || '' },
      { header: 'Pincode', getter: p => p.pincode || '' },
      { header: 'Address', getter: p => p.address || '' },
      { header: 'Date of Birth', getter: p => formatDateForDisplay(dateToString(p.dob)) },
      { header: 'Linked Student ID', getter: p => p.linkedStudentId || '' },
      { header: 'Categories', getter: p => Array.isArray(p.categories) ? p.categories.join(', ') : '' },
      { header: 'Payment Status', getter: p => p.paymentStatus || '' },
      { header: 'Total Fees', getter: p => p.totalFees || '' },
      { header: 'Amount Paid', getter: p => p.amountPaid || '' },
      { header: 'Due Amount', getter: p => p.dueAmount || '' },
      { header: 'Currency', getter: p => p.currency || '' },
      { header: 'Verification Status', getter: p => p.verificationStatus || '' },
      { header: 'Status', getter: p => p.status || '' },
      { header: 'Join Date', getter: p => formatDateForDisplay(dateToString(p.joinDate)) },
      { header: 'Last Login', getter: p => formatDateForDisplay(dateToString(p.lastLogin)) },
      { header: 'Engagement Score', getter: p => p.engagementScore || '' },
    ]

    const esc = (v: any) => {
      const s = v == null ? '' : String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const headerLine = columns.map(c => esc(c.header)).join(',')
    const lines = [headerLine]
    rows.forEach(p => {
      lines.push(columns.map(c => esc(c.getter(p))).join(','))
    })
    return lines.join('\n')
  }

  function download(filename: string, content: string, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleExportAll() {
    const csv = toCSV(filteredParents)
    download(`parents-all-${format(new Date(), 'dd-MMM-yyyy')}.csv`, csv)
    toast({
      title: "✅ Export completed",
      description: `Exported ${filteredParents.length} parent(s) successfully.`,
      duration: 3000,
    })
  }

  function handleExportSelected() {
    if (!selectedIds?.length) {
      handleExportAll()
      return
    }
    const byId = new Map(filteredParents.map(p => [p.parentId, p] as const))
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as Parent[]
    const csv = toCSV(rows)
    download(`parents-selected-${format(new Date(), 'dd-MMM-yyyy')}.csv`, csv)
    toast({
      title: "✅ Export completed",
      description: `Exported ${rows.length} selected parent(s) successfully.`,
      duration: 3000,
    })
  }

  return (
    <div className="responsive-dashboard-container mx-auto p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-white">Loading parents...</p>
          </div>
        </div>
      ) : (
        <>
          <ParentHeroSection 
            onCreateParent={() => setShowAddParentModal(true)}
          />

          {/* Coming Soon Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-[2px]">
            <div className="relative rounded-[10px] bg-white dark:bg-gray-900 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      👨‍👩‍👧 Enhanced Parent Portal Is Coming Soon
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Track student progress, manage payments, communicate with instructors, and stay connected — all in one place.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      We're building the ultimate parent experience!
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleNotifyMe}
                  disabled={notified || isNotifyLoading}
                  className={`flex-shrink-0 ${
                    notified
                      ? "bg-green-500 hover:bg-green-500 cursor-default"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  } text-white`}
                >
                  {notified ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  {isNotifyLoading ? "..." : notified ? "Subscribed!" : "Notify Me"}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-transparent gap-1 sm:gap-2 p-0 h-auto">
              <TabsTrigger
                value="analytics"
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-2 bg-transparent font-medium text-xs sm:text-sm responsive-text-xs"
                style={{
                  borderColor: secondaryColor,
                  color: secondaryColor,
                  backgroundColor: 'transparent'
                }}
                data-active-style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                  borderColor: 'transparent'
                }}
              >
                <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="parents"
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-2 bg-transparent font-medium text-xs sm:text-sm responsive-text-xs"
                style={{
                  borderColor: secondaryColor,
                  color: secondaryColor,
                  backgroundColor: 'transparent'
                }}
                data-active-style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                  borderColor: 'transparent'
                }}
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                All Parents
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="space-y-4">
              <ParentStatisticsCards />
              
              {/* Parent Analytics */}
              <div className="bg-card rounded-3xl shadow-xl p-6 animate-fade-in border">
                <ParentAnalytics parents={parents} />
              </div>
            </TabsContent>

            <TabsContent value="parents">
              <div className="bg-card rounded-3xl shadow-xl p-6 animate-fade-in border">
                <div className="flex flex-col gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Parents</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white" />
                    <Input
                      type="text"
                      placeholder="Search parents, students, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 group" title="Filter">
                        <span
                          className="inline-flex text-[color:var(--filter-color)] transition-colors duration-200 group-hover:text-white"
                          style={{ "--filter-color": primaryColor } as React.CSSProperties}
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </span>
                        {(filters.categories.length > 0 || filters.paymentStatuses.length > 0) && (
                          <span className="ml-2 inline-flex items-center justify-center text-white rounded-full h-5 w-5 text-xs font-bold" style={{ backgroundColor: primaryColor }}>
                            {filters.categories.length + filters.paymentStatuses.length}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0">
                      <div className="p-4 flex flex-col gap-4 max-h-96">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Categories</h3>
                          <div className={`space-y-2 ${categoriesOptions.length > 5 ? 'max-h-40 overflow-y-auto pr-2' : ''}`}>
                            {categoriesOptions.map((option) => (
                              <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={pendingFilters.categories.includes(option)}
                                  onChange={(e) => {
                                    setPendingFilters(prev => ({
                                      ...prev,
                                      categories: e.target.checked
                                        ? [...prev.categories, option]
                                        : prev.categories.filter(c => c !== option)
                                    }))
                                  }}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700 dark:text-white">{option}</span>
                                {pendingFilters.categories.includes(option) && (
                                  <Check className="h-4 w-4 ml-auto" style={{ color: primaryColor }} />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Status</h3>
                          <div className={`space-y-2 ${paymentStatusOptions.length > 5 ? 'max-h-40 overflow-y-auto pr-2' : ''}`}>
                            {paymentStatusOptions.map((option) => (
                              <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={pendingFilters.paymentStatuses.includes(option)}
                                  onChange={(e) => {
                                    setPendingFilters(prev => ({
                                      ...prev,
                                      paymentStatuses: e.target.checked
                                        ? [...prev.paymentStatuses, option]
                                        : prev.paymentStatuses.filter(s => s !== option)
                                    }))
                                  }}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700 dark:text-white">{option}</span>
                                {pendingFilters.paymentStatuses.includes(option) && (
                                  <Check className="h-4 w-4 ml-auto" style={{ color: primaryColor }} />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => {
                              setFilters({ ...pendingFilters })
                              setFilterDropdownOpen(false)
                            }}
                          >
                            Apply Filters
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setPendingFilters({ categories: [], paymentStatuses: [] })
                              setFilters({ categories: [], paymentStatuses: [] })
                              setFilterDropdownOpen(false)
                            }}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    title="Upload Files"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9" 
                    title={selectedIds.length ? `Export ${selectedIds.length} selected` : 'Export all parents'}
                    onClick={() => selectedIds.length ? handleExportSelected() : handleExportAll()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {selectedIds.length ? `Export (${selectedIds.length})` : 'Export'}
                  </Button>

                  <div className="flex gap-2 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9"
                          title="Sort parents"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs uppercase text-gray-500 dark:text-white font-semibold">Sort By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc') }} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>Name (A-Z)</span>
                            {sortBy === 'name' && sortOrder === 'asc' && <Check className="h-4 w-4" style={{ color: primaryColor }} />}
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc') }} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>Name (Z-A)</span>
                            {sortBy === 'name' && sortOrder === 'desc' && <Check className="h-4 w-4" style={{ color: primaryColor }} />}
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => { setSortBy('joinDate'); setSortOrder('desc') }} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>Newest First</span>
                            {sortBy === 'joinDate' && sortOrder === 'desc' && <Check className="h-4 w-4" style={{ color: primaryColor }} />}
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => { setSortBy('joinDate'); setSortOrder('asc') }} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>Oldest First</span>
                            {sortBy === 'joinDate' && sortOrder === 'asc' && <Check className="h-4 w-4" style={{ color: primaryColor }} />}
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => { setSortBy('paymentStatus'); setSortOrder('asc') }} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>Payment Status</span>
                            {sortBy === 'paymentStatus' && <Check className="h-4 w-4" style={{ color: primaryColor }} />}
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => { setSortBy('dueAmount'); setSortOrder('desc') }} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>Due Amount (High-Low)</span>
                            {sortBy === 'dueAmount' && sortOrder === 'desc' && <Check className="h-4 w-4" style={{ color: primaryColor }} />}
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex border border-gray-300 rounded-md">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none h-9"
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-l-none border-l h-9"
                      title="Grid View"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Column Selector Button (hidden in grid view) */}
                  {viewMode === 'list' && (
                    <button
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm hover:shadow transition-colors"
                      style={{
                        borderColor: `${primaryColor}33`,
                        backgroundColor: `${primaryColor}15`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}25`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}15`
                      }}
                      onClick={() => setShowParentColumnSelector(true)}
                      title="Select Columns to Display"
                      aria-label="Edit displayed parent columns"
                    >
                      <GridIcon className="w-6 h-6" color={primaryColor} />
                    </button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => setOpenDraftsDialog(true)}
                    title="View Parent Drafts"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Drafts
                  </Button>

                  <Button
                    size="sm"
                    className="h-9 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => {
                      setEditingParent(null)
                      setIsEditing(false)
                      setShowAddParentModal(true)
                    }}
                    title="Add New Parent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parent
                  </Button>
                </div>
              </div>

              {/* Table View */}
              {viewMode === "list" ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white w-10">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={filteredParents.length > 0 && filteredParents.every(p => selectedIds.includes(p.parentId))}
                                onCheckedChange={checked => toggleSelectAll(!!checked)}
                                aria-label="Select all"
                              />
                            </div>
                          </th>
                          {displayedColumns.includes("Name") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Name</th>
                          )}
                          {displayedColumns.includes("Student ID") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Student ID</th>
                          )}
                          {displayedColumns.includes("Contact") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Contact</th>
                          )}
                          {displayedColumns.includes("Categories") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Categories</th>
                          )}
                          {displayedColumns.includes("Payment") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Payment</th>
                          )}
                          {displayedColumns.includes("Status") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Status</th>
                          )}
                          {displayedColumns.includes("Actions") && (
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParents.map((parent) => (
                          <tr key={parent.parentId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td onClick={(e) => e.stopPropagation()} className="px-4 py-4">
                              <Checkbox
                                checked={selectedIds.includes(parent.parentId)}
                                onCheckedChange={checked => toggleSelect(parent.parentId, !!checked)}
                                aria-label={`Select ${parent.firstName} ${parent.lastName}`}
                              />
                            </td>
                            {displayedColumns.includes("Name") && (
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                {parent.firstName} {parent.middleName ? parent.middleName + " " : ""}{parent.lastName}
                              </td>
                            )}
                            {displayedColumns.includes("Student ID") && (
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-white">{parent.linkedStudentId}</td>
                            )}
                            {displayedColumns.includes("Contact") && (
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-white">
                                <div className="flex flex-col gap-1">
                                  <div>{parent.countryCode} {parent.mobile}</div>
                                  <div className="text-xs text-gray-600 dark:text-white">{parent.email}</div>
                                </div>
                              </td>
                            )}
                            {displayedColumns.includes("Categories") && (
                              <td className="px-6 py-4 text-sm">
                                <div className="flex gap-1">
                                  {parent.categories.map((cat) => (
                                    <Badge key={cat} className="bg-blue-100 text-blue-800">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                            )}
                            {displayedColumns.includes("Payment") && (
                              <td className="px-6 py-4 text-sm">
                                <div className="flex flex-col gap-1">
                                  <Badge className={getPaymentStatusColor(parent.paymentStatus)}>
                                    {parent.paymentStatus}
                                  </Badge>
                                  <span className="text-xs text-gray-600 dark:text-white">
                                    {currency || parent.currency} {parent.dueAmount} due
                                  </span>
                                </div>
                              </td>
                            )}
                            {displayedColumns.includes("Status") && (
                              <td className="px-6 py-4">
                                <Badge className={getStatusColor(parent.status)}>{parent.status}</Badge>
                              </td>
                            )}
                            {displayedColumns.includes("Actions") && (
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditParent(parent)}
                                    title="View"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditParent(parent)}
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPendingDelete(parent)
                                      setShowDeleteDialog(true)
                                    }}
                                    title="Delete"
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredParents.map((parent) => (
                    <div
                      key={parent.parentId}
                      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {parent.firstName} {parent.middleName ? parent.middleName + " " : ""}{parent.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-white">{parent.linkedStudentId}</p>
                        </div>
                        <Badge className={getStatusColor(parent.status)}>{parent.status}</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex gap-2">
                          {parent.categories.map((cat) => (
                            <Badge key={cat} className="bg-blue-100 text-blue-800 text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-white">📧 {parent.email}</p>
                        <p className="text-xs text-gray-600 dark:text-white">📱 {parent.countryCode} {parent.mobile}</p>
                        <p className="text-sm font-medium">
                          {currency || parent.currency} {parent.totalFees} | {" "}
                          <Badge className={getPaymentStatusColor(parent.paymentStatus)} variant="outline">
                            {parent.paymentStatus}
                          </Badge>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditParent(parent)}
                          className="flex-1"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPendingDelete(parent)
                            setShowDeleteDialog(true)
                          }}
                          className="flex-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Dialogs */}
      <ParentFormModal
          open={showAddParentModal}
          onOpenChange={(open) => {
            setShowAddParentModal(open)
            if (!open) {
              setEditingParent(null)
              setIsEditing(false)
            }
          }}
          onSave={isEditing ? handleUpdateParent : handleAddParent}
          categoriesList={["Sports", "Arts", "Music", "Dance", "Academics"]}
          studentIds={allStudentIds}
          initialParent={editingParent || undefined}
          isEditing={isEditing}
        />

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Parent?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <strong>
                  {pendingDelete?.firstName} {pendingDelete?.lastName}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setPendingDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDraftsDialog} onOpenChange={setOpenDraftsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Parent Drafts</DialogTitle>
              <DialogDescription>
                View and manage your saved parent drafts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="text-sm text-gray-600 dark:text-white text-center py-8">
                Draft functionality coming soon. Continue editing a parent to save as draft.
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Column Selector Modal */}
        <ColumnSelectorModal
          open={showParentColumnSelector}
          columns={parentColumns}
          displayedColumns={displayedColumns}
          setDisplayedColumns={setDisplayedColumns}
          onClose={() => setShowParentColumnSelector(false)}
          onSave={() => setShowParentColumnSelector(false)}
          onReset={() => setDisplayedColumns(defaultDisplayedColumns)}
          storageKeyPrefix="parent"
          fixedColumns={["Name", "Actions"]}
        />
    </div>
  )
}
