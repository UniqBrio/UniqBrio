
"use client"

import { useState, useEffect, useMemo } from "react"
import type { ReactNode } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Badge } from "@/components/dashboard/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/dashboard/ui/chart"
import {
  Download,
  Upload,
  Search,
  Filter,
  CalendarIcon,
  Eye,
  Users,
  Activity,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Check,
  X,
  LayoutDashboard,
  List,
  Grid3X3,
} from "lucide-react"
import MultiSelectDropdown from "@/components/dashboard/student/students/MultiSelectDropDown"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Label,
  LabelList,
} from "recharts"
import { ColumnSelectorModal } from "@/contexts/dashboard/ColumnSelectorModal"

// Helper to detect device type from userAgent
function getDeviceType(userAgent: string) {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "Mobile";
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) return "Laptop/Desktop";
  return "Other";
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "Add":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "Update":
      return <Info className="h-4 w-4 text-blue-500" />
    case "Delete":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "Login":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "Logout":
      return <XCircle className="h-4 w-4 text-orange-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500 dark:text-white" />
  }
}

// Mock data for demonstration
const generateMockAuditLogs = (count: number) => {
  const actions = ["Add", "Update", "Delete", "Login", "Logout"]
  const modules = ["Students", "Courses", "Staff", "Payments", "Settings", "Events", "Community", "Financials"]
  const roles = ["Super Admin", "Admin", "Instructor", "Student", "Parent"]
  const users = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Wilson",
    "David Brown",
    "Lisa Davis",
    "Tom Anderson",
    "Emma Taylor",
  ]

  return Array.from({ length: count }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)]
    const module = modules[Math.floor(Math.random() * modules.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const role = roles[Math.floor(Math.random() * roles.length)]
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
    const isUpdate = action === "Update"
    const fieldChanges = isUpdate
      ? [
          { field: "name", oldValue: "Old Name", newValue: "New Name" },
          { field: "email", oldValue: "old@email.com", newValue: "new@email.com" },
        ]
      : null

    return {
      id: i + 1,
      module,
      action,
      timestamp,
      previousValue: isUpdate && fieldChanges
        ? fieldChanges.map((change) => `${change.field}: ${change.oldValue}`).join(" | ")
        : null,
      currentValue: isUpdate && fieldChanges
        ? fieldChanges.map((change) => `${change.field}: ${change.newValue}`).join(" | ")
        : null,
      changedBy: user,
      role,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: {
        fieldChanges,
        metadata: {
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
        },
      },
    }
  })
}

const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
const AUDIT_LOG_COLUMNS_STORAGE_KEY = "auditLogsDisplayedColumns"

type ColumnDefinition = {
  id: string
  label: string
  isFixed?: boolean
  headerClassName?: string
  cellClassName?: string
  cell: (log: any) => ReactNode
}

export default function AuditLogsPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState<string[]>(['all'])
  const [selectedRole, setSelectedRole] = useState<string[]>(['all'])
  const [selectedModule, setSelectedModule] = useState<string[]>(['all'])
  const [dateFilter, setDateFilter] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [expandedRows, setExpandedRows] = useState<number[]>([])
  const [todayDate, setTodayDate] = useState<Date | null>(null)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState({
    actions: [] as string[],
    roles: [] as string[],
    modules: [] as string[],
    dateFilter: '' as string,
  })
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null)
  const [activeTab, setActiveTab] = useState<"analytics" | "audit-logs">("analytics")

  const columnDefinitions = useMemo<ColumnDefinition[]>(() => {
    const renderValueCell = (value: string | null, emptyLabel = "No value") => (
      <div className="text-sm text-muted-foreground max-w-[220px] truncate" title={value || emptyLabel}>
        {value ?? "—"}
      </div>
    )

    const renderDetailsCell = (log: any) => {
      const detailChanges = log.details?.fieldChanges
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                Detailed information about this audit log entry
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Module</label>
                  <p className="text-sm text-muted-foreground">{log.module}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <p className="text-sm text-muted-foreground">{log.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm text-muted-foreground">{log.changedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-muted-foreground">{log.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="text-sm text-muted-foreground">{log.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Device</label>
                  <p className="text-sm text-muted-foreground">{getDeviceType(log.userAgent)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Session ID</label>
                  <p className="text-sm text-muted-foreground">{log.details?.metadata?.sessionId ?? "—"}</p>
                </div>
              </div>
              {detailChanges && (
                <div>
                  <label className="text-sm font-medium">Field Changes</label>
                  <div className="mt-2 space-y-2">
                    {detailChanges.map((change: any, index: number) => (
                      <div key={`${change.field}-${index}`} className="p-3 bg-muted rounded-md">
                        <div className="font-medium text-sm">{change.field}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="line-through">{change.oldValue}</span> → {change.newValue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    const renderFieldChangesCell = (log: any) => {
      const changes = log.details?.fieldChanges
      if (!changes || changes.length === 0) {
        return <span className="text-sm text-muted-foreground">—</span>
      }

      return (
        <div className="space-y-1 text-xs">
          {changes.slice(0, 2).map((change: any, index: number) => (
            <div key={`${change.field}-${index}`} className="flex flex-col">
              <span className="font-medium text-gray-700 dark:text-white">{change.field}</span>
              <span className="text-muted-foreground">{change.oldValue} → {change.newValue}</span>
            </div>
          ))}
          {changes.length > 2 && (
            <span className="text-[11px] text-muted-foreground">+{changes.length - 2} more change(s)</span>
          )}
        </div>
      )
    }

    return [
      {
        id: "module",
        label: "Module",
        isFixed: true,
        cell: (log: any) => <Badge variant="outline">{log.module}</Badge>,
      },
      {
        id: "action",
        label: "Action",
        isFixed: true,
        cell: (log: any) => (
          <div className="flex items-center gap-2">
            {getActionIcon(log.action)}
            {log.action}
          </div>
        ),
      },
      {
        id: "timestamp",
        label: "Timestamp",
        isFixed: true,
        cell: (log: any) => (
          <div className="flex flex-col">
            <span>{format(log.timestamp, "MMM dd, yyyy")}</span>
            <span className="text-xs text-muted-foreground">{format(log.timestamp, "HH:mm:ss")}</span>
          </div>
        ),
      },
      {
        id: "changedBy",
        label: "Changed By",
        isFixed: true,
        cell: (log: any) => log.changedBy,
      },
      {
        id: "role",
        label: "Role",
        cell: (log: any) => <Badge variant="secondary">{log.role}</Badge>,
      },
      {
        id: "previousValue",
        label: "Old Value",
        cellClassName: "max-w-[240px]",
        cell: (log: any) => renderValueCell(log.previousValue, "No previous value"),
      },
      {
        id: "currentValue",
        label: "New Value",
        cellClassName: "max-w-[240px]",
        cell: (log: any) => renderValueCell(log.currentValue, "No current value"),
      },
      {
        id: "ipAddress",
        label: "IP Address",
        cell: (log: any) => log.ipAddress,
      },
      {
        id: "device",
        label: "Device",
        cell: (log: any) => getDeviceType(log.userAgent),
      },
      {
        id: "sessionId",
        label: "Session ID",
        cell: (log: any) => log.details?.metadata?.sessionId ?? "—",
      },
      {
        id: "fieldChanges",
        label: "Field Changes",
        cell: (log: any) => renderFieldChangesCell(log),
      },
      {
        id: "details",
        label: "Details",
        isFixed: true,
        cell: (log: any) => renderDetailsCell(log),
      },
    ]
  }, [])

  const columnLabels = useMemo(() => columnDefinitions.map((col) => col.label), [columnDefinitions])
  const fixedColumnLabels = useMemo(
    () => columnDefinitions.filter((col) => col.isFixed).map((col) => col.label),
    [columnDefinitions],
  )
  const [displayedColumnLabels, setDisplayedColumnLabels] = useState<string[]>(columnLabels)
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false)
  const [columnsHydrated, setColumnsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(AUDIT_LOG_COLUMNS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length) {
          const sanitized = parsed.filter((label: string) => columnLabels.includes(label))
          if (sanitized.length) {
            const ensuredFixed = Array.from(new Set([...fixedColumnLabels, ...sanitized]))
            setDisplayedColumnLabels(ensuredFixed)
          }
        }
      } catch (error) {
        console.warn("Failed to parse saved audit log column preferences", error)
      }
    }
    setColumnsHydrated(true)
  }, [columnLabels, fixedColumnLabels])

  useEffect(() => {
    if (!columnsHydrated || typeof window === "undefined") return
    window.localStorage.setItem(AUDIT_LOG_COLUMNS_STORAGE_KEY, JSON.stringify(displayedColumnLabels))
  }, [displayedColumnLabels, columnsHydrated])

  const visibleColumns = useMemo(
    () =>
      displayedColumnLabels
        .map((label) => columnDefinitions.find((col) => col.label === label))
        .filter((col): col is ColumnDefinition => Boolean(col)),
    [displayedColumnLabels, columnDefinitions],
  )

  const applyDisplayedColumns = (cols: string[]) => {
    setDisplayedColumnLabels(() => {
      const sanitized = cols.filter((label) => columnLabels.includes(label))
      return Array.from(new Set([...fixedColumnLabels, ...sanitized]))
    })
  }

  // Sync pending filters with current filters when opening dropdown
  useEffect(() => {
    if (filterDropdownOpen) {
      setPendingFilters({
        actions: selectedAction.includes('all') ? [] : selectedAction,
        roles: selectedRole.includes('all') ? [] : selectedRole,
        modules: selectedModule.includes('all') ? [] : selectedModule,
        dateFilter: dateFilter,
      })
    }
  }, [filterDropdownOpen, selectedAction, selectedRole, selectedModule, dateFilter])

  // Fetch real audit logs from API
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '50000'); // Fetch large amount for client-side filtering
        
        const response = await fetch(`/api/audit-logs?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AuditLogs] Failed to fetch:', response.status, errorText);
          // Fall back to empty array if API fails
          setAuditLogs([]);
          setFilteredLogs([]);
          return;
        }
        
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Transform API data to match expected format
          const transformedLogs = result.data.map((log: any, index: number) => ({
            id: index + 1,
            module: log.module,
            action: log.action,
            timestamp: new Date(log.timestamp),
            previousValue: log.previousValue,
            currentValue: log.currentValue,
            changedBy: log.changedBy,
            role: log.role,
            ipAddress: log.ipAddress || 'N/A',
            userAgent: log.userAgent || '',
            details: log.details || {},
          }));
          setAuditLogs(transformedLogs);
          setFilteredLogs(transformedLogs);
        } else {
          console.error('[AuditLogs] Invalid response format:', result);
          // Fall back to empty array if API fails
          setAuditLogs([]);
          setFilteredLogs([]);
        }
      } catch (error) {
        console.error('[AuditLogs] Error fetching audit logs:', error);
        // Fall back to empty array on error
        setAuditLogs([]);
        setFilteredLogs([]);
      }
    };

    fetchAuditLogs();
  }, [])

  // Set today's date only on client side to avoid hydration mismatch
  useEffect(() => {
    setTodayDate(new Date())
  }, [])

  // Handle date filter changes
  useEffect(() => {
    if (!dateFilter) {
      setDateRange({ from: undefined, to: undefined })
      return
    }

    let from: Date | undefined = undefined
    let to: Date | undefined = undefined
    const today = new Date()
    switch (dateFilter) {
      case "last_7_days":
        from = subDays(today, 6)
        to = today
        break
      case "last_14_days":
        from = subDays(today, 13)
        to = today
        break
      case "last_month":
        from = subDays(today, 30)
        to = today
        break
      case "last_2_months":
        from = subDays(today, 60)
        to = today
        break
      case "last_3_months":
        from = subDays(today, 90)
        to = today
        break
      case "custom":
        // Don't change dateRange, let user pick
        return
    }
    setDateRange({ from, to })
  }, [dateFilter])

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = auditLogs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.changedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Action filter
    if (!selectedAction.includes('all')) {
      filtered = filtered.filter((log) => selectedAction.includes(log.action))
    }

    // Role filter
    if (!selectedRole.includes('all')) {
      filtered = filtered.filter((log) => selectedRole.includes(log.role))
    }

    // Module filter
    if (!selectedModule.includes('all')) {
      filtered = filtered.filter((log) => selectedModule.includes(log.module))
    }

    // Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(
        (log) => log.timestamp >= startOfDay(dateRange.from!) && log.timestamp <= endOfDay(dateRange.to!),
      )
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [searchTerm, selectedAction, selectedRole, selectedModule, dateRange, auditLogs])

  // Analytics data
  const analyticsData = useMemo(() => {
    const actionCounts = filteredLogs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const userCounts = filteredLogs.reduce(
      (acc, log) => {
        acc[log.changedBy] = (acc[log.changedBy] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const roleCounts = filteredLogs.reduce(
      (acc, log) => {
        acc[log.role] = (acc[log.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Time-based activity (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      const dayLogs = filteredLogs.filter((log) => format(log.timestamp, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
      return {
        date: format(date, "MMM dd"),
        count: dayLogs.length,
      }
    }).reverse()

    return {
      actionData: Object.entries(actionCounts).map(([action, count]) => ({ action, count })),
      userData: Object.entries(userCounts)
        .slice(0, 10)
        .map(([user, count]) => ({ user, count })),
      roleData: Object.entries(roleCounts).map(([role, count], index) => ({
        role,
        count,
        fill: COLORS[index % COLORS.length],
      })),
      timeData: last7Days,
    }
  }, [filteredLogs])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLogs(paginatedLogs.map((log) => log.id))
    } else {
      setSelectedLogs([])
    }
  }

  const handleSelectLog = (logId: number, checked: boolean) => {
    if (checked) {
      setSelectedLogs((prev) => [...prev, logId])
    } else {
      setSelectedLogs((prev) => prev.filter((id) => id !== logId))
    }
  }

  const MAX_EXPORT = 100000;
  const handleExportLogs = () => {
    const logsToExport =
      selectedLogs.length > 0 ? filteredLogs.filter((log) => selectedLogs.includes(log.id)) : filteredLogs;
    if (logsToExport.length > MAX_EXPORT) {
      // Should not happen due to button disable, but extra guard
      alert(`Cannot export more than ${MAX_EXPORT} records.`);
      return;
    }
    const csvContent = [
      [
        "Module",
        "Action",
        "Timestamp",
        "Changed By",
        "Role",
        "IP Address",
        "Device",
        "Session ID",
        "Previous Value",
        "Current Value",
        "Field Changes"
      ].join(","),
      ...logsToExport.map((log) => {
        // Format field changes if they exist
        const fieldChanges = log.details.fieldChanges 
          ? log.details.fieldChanges.map((change: any) => 
              `${change.field}: ${change.oldValue} → ${change.newValue}`
            ).join("; ")
          : "";

        return [
          log.module,
          log.action,
          format(log.timestamp, "yyyy-MM-dd HH:mm:ss"),
          log.changedBy,
          log.role,
          log.ipAddress,
          getDeviceType(log.userAgent),
          log.details.metadata.sessionId,
          log.previousValue || "",
          log.currentValue || "",
          fieldChanges
        ].join(",");
      }),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const toggleRowExpansion = (logId: number) => {
    setExpandedRows((prev) => (prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]))
  }

  // List of all modules
const allModules = [
  'Home', 'Services', 'Schedule', 'Course Management', 'User Management', 
  'Students Management', 'Staff Management', 'Instructor', 'Non-Instructor', 
  'Payments', 'Financials', 'Promotions', 'Task Management', 
  'Settings', 'Audit logs', 'Help'
];

// Module filter popover content with search
const ModuleFilterContent: React.FC<{ selectedModule: string[]; setSelectedModule: (v: string[]) => void }> = ({ selectedModule, setSelectedModule }) => {
  const [search, setSearch] = useState("");
  const filteredModules = allModules.filter((m) => m.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
      <input
        type="text"
        placeholder="Search modules..."
        className="mb-2 px-2 py-1 border rounded text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={selectedModule?.includes('all')}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedModule(['all'])
            } else {
              setSelectedModule([])
            }
          }}
        />
        All Modules
      </label>
      {filteredModules.map((module) => (
        <label key={module} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={selectedModule?.includes(module)}
            onCheckedChange={(checked) => {
              let updated = selectedModule?.filter((m) => m !== 'all') || [];
              if (checked) {
                updated = [...updated, module];
              } else {
                updated = updated.filter((m) => m !== module);
              }
              setSelectedModule(updated.length === 0 ? ['all'] : updated);
            }}
          />
          {module}
        </label>
      ))}
    </div>
  );
};

  // Handler for page size changes
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number.parseInt(newPageSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleApplyFilters = () => {
    setSelectedAction(pendingFilters.actions.length === 0 ? ['all'] : pendingFilters.actions)
    setSelectedRole(pendingFilters.roles.length === 0 ? ['all'] : pendingFilters.roles)
    setSelectedModule(pendingFilters.modules.length === 0 ? ['all'] : pendingFilters.modules)
    setDateFilter(pendingFilters.dateFilter)
    setFilterAction("applied")
    setFilterDropdownOpen(false)
    setTimeout(() => setFilterAction(null), 2000)
  }

  const handleClearFilters = () => {
    setPendingFilters({
      actions: [],
      roles: [],
      modules: [],
      dateFilter: '',
    })
    setSelectedAction(['all'])
    setSelectedRole(['all'])
    setSelectedModule(['all'])
    setDateFilter('')
    setDateRange({ from: undefined, to: undefined })
    setFilterAction("cleared")
    setFilterDropdownOpen(false)
    setTimeout(() => setFilterAction(null), 2000)
  }

  const filtersActive =
    selectedAction.some((action) => action !== 'all') ||
    selectedRole.some((role) => role !== 'all') ||
    selectedModule.some((module) => module !== 'all') ||
    Boolean(dateFilter) ||
    Boolean(dateRange.from && dateRange.to)

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col items-start gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2" style={{ color: primaryColor }}>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8" />
                <span>Audit Logs & Activity Tracking</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-white mt-1">
                Monitor every action across the platform with detailed logs, analytics, and export options
              </p>
            </div>
          </div>

          {/* Main Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "analytics" | "audit-logs")}>
            <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2 p-0 h-auto">
              <TabsTrigger 
                value="analytics" 
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 bg-transparent font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                style={{
                  borderColor: secondaryColor,
                  color: secondaryColor,
                  '--hover-bg': `${secondaryColor}15`,
                  '--active-bg': primaryColor,
                  '--active-hover-bg': `${primaryColor}dd`
                } as React.CSSProperties}
              >
                <LayoutDashboard className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="audit-logs" 
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 bg-transparent font-medium data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent"
                style={{
                  borderColor: secondaryColor,
                  color: secondaryColor,
                  '--hover-bg': `${secondaryColor}15`,
                  '--active-bg': primaryColor,
                  '--active-hover-bg': `${primaryColor}dd`
                } as React.CSSProperties}
              >
                <List className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="mt-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card style={{ backgroundImage: `linear-gradient(to br, ${primaryColor}15, ${primaryColor}25)`, borderColor: primaryColor }}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: primaryColor }}>Total Logs</p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: `${primaryColor}dd` }}>{filteredLogs.length}</p>
                      </div>
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: primaryColor }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: primaryColor }}>of {auditLogs.length} total</p>
                  </CardContent>
                </Card>

                <Card style={{ backgroundImage: `linear-gradient(to br, ${secondaryColor}15, ${secondaryColor}25)`, borderColor: secondaryColor }}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: secondaryColor }}>Today's Activity</p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: `${secondaryColor}dd` }}>
                          {todayDate ? filteredLogs.filter(log => format(log.timestamp, "yyyy-MM-dd") === format(todayDate, "yyyy-MM-dd")).length : 0}
                        </p>
                      </div>
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: secondaryColor }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Active Users</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">
                          {new Set(filteredLogs.map(log => log.changedBy)).size}
                        </p>
                      </div>
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Modules</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900">
                          {new Set(filteredLogs.map(log => log.module)).size}
                        </p>
                      </div>
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundImage: `linear-gradient(to br, ${secondaryColor}15, ${secondaryColor}25)`, borderColor: secondaryColor }}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: secondaryColor }}>Actions</p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: `${secondaryColor}dd` }}>{filteredLogs.length}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: secondaryColor }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:gap-6">
                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">Activity Over Time</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Actions performed in the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <ChartContainer
                        config={{
                          count: {
                            label: "Activities",
                            color: "#a855f7",
                          },
                        }}
                        className="h-[250px] sm:h-[300px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analyticsData.timeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <XAxis 
                              dataKey="date" 
                              stroke="#888888" 
                              fontSize={10} 
                              tickMargin={5}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              stroke="#888888" 
                              fontSize={10}
                              tickMargin={5}
                            />
                            <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={{ r: 3, fill: "#a855f7" }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">Actions Distribution</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Breakdown by action type</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <ChartContainer
                        config={{
                          count: {
                            label: "Count",
                            color: "#f97316",
                          },
                        }}
                        className="h-[250px] sm:h-[300px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.actionData} margin={{ top: 20, right: 5, left: -20, bottom: 5 }}>
                            <XAxis 
                              dataKey="action" 
                              stroke="#888888" 
                              fontSize={10}
                              tickMargin={5}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              stroke="#888888" 
                              fontSize={10}
                              tickMargin={5}
                            />
                            <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]}>
                              <LabelList dataKey="count" position="top" style={{ fill: '#f97316', fontWeight: 'bold', fontSize: '10px' }} />
                            </Bar>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">Top Active Users</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Users with most activity</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <ChartContainer
                        config={{
                          count: {
                            label: "Actions",
                            color: "#9333ea",
                          },
                        }}
                        className="h-[250px] sm:h-[300px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.userData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis 
                              type="number" 
                              stroke="#888888" 
                              fontSize={10}
                              tickMargin={5}
                            />
                            <YAxis 
                              type="category" 
                              dataKey="user" 
                              stroke="#888888" 
                              fontSize={9} 
                              width={70}
                              tickMargin={5}
                            />
                            <Bar dataKey="count" fill="#9333ea" radius={[0, 8, 8, 0]}>
                              <LabelList dataKey="count" position="right" style={{ fill: '#9333ea', fontWeight: 'bold', fontSize: '10px' }} />
                            </Bar>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">Role Distribution</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Activity by user role</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <ChartContainer
                        config={{
                          count: {
                            label: "Count",
                            color: "#a855f7",
                          },
                        }}
                        className="h-[250px] sm:h-[300px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={analyticsData.roleData}
                              dataKey="count"
                              nameKey="role"
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              label={({ role, percent = 0 }) => {
                                // Shorter labels for mobile
                                const shortRole = role.length > 10 ? role.substring(0, 8) + '...' : role;
                                return `${shortRole}: ${(percent * 100).toFixed(0)}%`;
                              }}
                              labelLine={{ strokeWidth: 1 }}
                              style={{ fontSize: '10px' }}
                            >
                              {analyticsData.roleData.map((entry, index) => {
                                const colors = ["#9333ea", "#a855f7", "#c084fc", "#f97316", "#fb923c", "#fdba74"];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Audit Logs Tab Content */}
            <TabsContent value="audit-logs" className="mt-6">
              <Card style={{ borderColor: primaryColor }}>
                <CardHeader className="pb-2 border-b bg-white dark:bg-gray-900 rounded-t-lg" style={{ borderColor: primaryColor }}>
              <div className="flex flex-col gap-4">
                {/* Toolbar with Search, Filters and Export in one row */}
                <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
                  {/* Search Bar */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
                    <Input
                      placeholder="Search by user, module, action..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filter and Export Buttons */}
                  <div className="flex items-center gap-2">
                    <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 flex items-center gap-1 relative px-3 group border text-[color:var(--filter-icon-color)] hover:bg-[color:var(--filter-hover-bg)] hover:text-white"
                          title="Filter"
                          style={{
                            borderColor: primaryColor,
                            '--filter-icon-color': primaryColor,
                            '--filter-hover-bg': primaryColor,
                          } as React.CSSProperties}
                        >
                          <span className="relative inline-flex text-[color:var(--filter-icon-color)] transition-colors duration-200 group-hover:text-white">
                            <Filter className="h-3.5 w-3.5" />
                            {filtersActive && (
                              <span className="absolute -top-1 -right-1">
                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500 text-white shadow-sm ring-1 ring-white">
                                  <Check className="w-2 h-2" />
                                </span>
                              </span>
                            )}
                            {!filtersActive && filterAction === 'cleared' && (
                              <span className="absolute -top-1 -right-1">
                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-white shadow-sm ring-1 ring-white">
                                  <X className="w-2 h-2" />
                                </span>
                              </span>
                            )}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-72 p-0"
                        align="end"
                        onCloseAutoFocus={(event) => {
                          event.preventDefault();
                        }}
                        onEscapeKeyDown={() => setFilterDropdownOpen(false)}
                        onInteractOutside={() => setFilterDropdownOpen(false)}
                      >
                      <div className="max-h-96 overflow-y-auto p-4">
                        {/* Action Filter */}
                        <MultiSelectDropdown
                          label="Action"
                          options={['Add', 'Update', 'Delete', 'Login', 'Logout']}
                          selected={pendingFilters.actions}
                          onChange={(next) => setPendingFilters(prev => ({ ...prev, actions: next }))}
                          placeholder="All Actions"
                          className="mb-3"
                        />

                        {/* Role Filter */}
                        <MultiSelectDropdown
                          label="Role"
                          options={['Super Admin', 'Admin', 'Instructor', 'Student', 'Parent']}
                          selected={pendingFilters.roles}
                          onChange={(next) => setPendingFilters(prev => ({ ...prev, roles: next }))}
                          placeholder="All Roles"
                          className="mb-3"
                        />

                        {/* Module Filter */}
                        <MultiSelectDropdown
                          label="Module"
                          options={allModules}
                          selected={pendingFilters.modules}
                          onChange={(next) => setPendingFilters(prev => ({ ...prev, modules: next }))}
                          placeholder="All Modules"
                          className="mb-3"
                        />

                        {/* Date Filter */}
                        <div>
                          <div className="mb-2 font-semibold text-sm">Date Filter</div>
                          <Select value={pendingFilters.dateFilter} onValueChange={(value) => setPendingFilters(prev => ({ ...prev, dateFilter: value }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Date Filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom</SelectItem>
                              <SelectItem value="last_7_days">Last 7 days</SelectItem>
                              <SelectItem value="last_14_days">Last 14 days</SelectItem>
                              <SelectItem value="last_month">Last month</SelectItem>
                              <SelectItem value="last_2_months">Last 2 months</SelectItem>
                              <SelectItem value="last_3_months">Last 3 months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Range Picker (only if Custom) */}
                        {pendingFilters.dateFilter === "custom" && (
                          <div>
                            <div className="mb-2 font-semibold text-sm">Date Range</div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange?.from ? (
                                    dateRange.to ? (
                                      <span>
                                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                      </span>
                                    ) : (
                                      <span>{format(dateRange.from, "LLL dd, y")}</span>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">Pick a date range</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  initialFocus
                                  mode="range"
                                  defaultMonth={dateRange?.from}
                                  selected={dateRange}
                                  onSelect={(range) => {
                                    setDateRange({
                                      from: range?.from,
                                      to: range?.to ?? range?.from,
                                    })
                                  }}
                                  numberOfMonths={2}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>

                      {/* Apply and Clear Buttons */}
                      <div className="flex gap-2 mt-4 px-4 pb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleClearFilters}
                          className="flex-1"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleApplyFilters}
                          className="flex-1 text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                    {filteredLogs.length > MAX_EXPORT && (
                      <div className="bg-red-100 text-red-700 px-3 py-1 rounded font-semibold text-sm border border-red-300 whitespace-nowrap">
                        Max {MAX_EXPORT.toLocaleString()}
                      </div>
                    )}
                    
                    <Button
                      onClick={handleExportLogs}
                      className="text-white"
                      style={{ backgroundColor: secondaryColor }}
                      size="sm"
                      disabled={selectedLogs.length === 0 && filteredLogs.length === 0 || filteredLogs.length > MAX_EXPORT}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export ({selectedLogs.length || filteredLogs.length})
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl px-4 py-2" style={{ backgroundImage: `linear-gradient(to br, ${primaryColor}15, ${primaryColor}25)`, borderColor: `${primaryColor}40`, borderWidth: '1px', borderStyle: 'solid' }}>
                  <div className="flex items-center gap-2 w-full sm:w-auto" style={{ color: primaryColor }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} aria-hidden="true" />
                    <span className="text-sm font-semibold">
                      {filteredLogs.length.toLocaleString()} {filteredLogs.length === 1 ? "log" : "logs"} found
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-9 w-9 rounded-2xl bg-white dark:bg-gray-800 border"
                    style={{ 
                      color: primaryColor,
                      borderColor: `${primaryColor}40`,
                      boxShadow: `0 4px 12px ${primaryColor}40`
                    }}
                    onClick={() => setColumnSelectorOpen(true)}
                    aria-label="Choose visible columns"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Table */}
              <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedLogs.length === paginatedLogs.length && paginatedLogs.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        {visibleColumns.map((column) => (
                          <TableHead key={column.id} className={column.headerClassName}>
                            {column.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedLogs.includes(log.id)}
                              onCheckedChange={(checked) => handleSelectLog(log.id, checked as boolean)}
                            />
                          </TableCell>
                          {visibleColumns.map((column) => (
                            <TableCell key={`${log.id}-${column.id}`} className={column.cellClassName}>
                              {column.cell(log)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Show:</span>
                      <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="250">250</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="1000">1000</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>
            </TabsContent>
          </Tabs>
          <ColumnSelectorModal
            open={columnSelectorOpen}
            columns={columnLabels}
            displayedColumns={displayedColumnLabels}
            setDisplayedColumns={applyDisplayedColumns}
            onClose={() => setColumnSelectorOpen(false)}
            onSave={() => setColumnSelectorOpen(false)}
            onReset={() => applyDisplayedColumns(columnLabels)}
            storageKeyPrefix="auditLogs"
            fixedColumns={fixedColumnLabels}
          />
        </div>
      </div>)
}