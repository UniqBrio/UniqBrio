"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs";
import { Card, CardContent } from "@/components/dashboard/ui/card";
import {
  LayoutDashboard,
  Table2,
  RefreshCcw,
  Calendar,
  BookOpen,
  User,
  Trash2,
  NotepadText,
  X,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/dashboard/use-toast";
import { LeaveAnalytics } from "@/components/dashboard/student/leave/leave-analytics";
import { LeaveTable } from "@/components/dashboard/student/leave/leave-table";
import LeaveSearchFilters from "@/components/dashboard/student/leave/leave-search-filters";

import type { LeaveRecord } from "@/components/dashboard/student/leave/types";
import { formatDateForDisplay } from "@/lib/dashboard/student/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/dashboard/ui/dialog";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";

export function LeaveManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [displayedColumns, setDisplayedColumns] = useState<string[]>([]);
  // Quick date window for table (Today / Past 7 days / Past 15 days)
  const [leaveDateWindow, setLeaveDateWindow] = useState<'today' | '7d' | '15d'>('today');

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<LeaveRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LeaveRecord | null>(null);

  // Settings state
  const [leaveSettings, setLeaveSettings] = useState({
    display: {
      defaultView: "list",
      dateWindow: "today",
      showCohortInfo: true,
      showDuration: true,
      colorCodeByStatus: true,
      compactMode: false,
      highlightToday: true,
    },
    filters: {
      rememberLastFilters: true,
      autoApplyFilters: true,
      showAdvancedFilters: false,
      defaultDateRange: "all",
      defaultStatus: "all",
    },
    notifications: {
      leaveSubmitted: true,
      leaveApproved: true,
      leaveRejected: true,
      leaveCancelled: true,
      upcomingLeave: true,
      reminderTime: 24,
      soundEnabled: true,
    },
    export: {
      defaultFormat: "csv",
      includeMetadata: true,
      includeReason: true,
      autoDownload: true,
    },
    automation: {
      autoRefresh: false,
      refreshInterval: 5,
      confirmBeforeDelete: true,
      showDeletedCount: true,
    },
    advanced: {
      enableDebugMode: false,
      cacheEnabled: true,
      maxCacheSize: 100,
      showRecordIds: false,
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('leaveSettings');
    if (savedSettings) {
      try {
        setLeaveSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse leave settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('leaveSettings', JSON.stringify(leaveSettings));
  }, [leaveSettings]);

  const updateSetting = (category: string, key: string, value: any) => {
    setLeaveSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const resetSettings = () => {
    const defaultSettings = {
      display: {
        defaultView: "list",
        dateWindow: "today",
        showCohortInfo: true,
        showDuration: true,
        colorCodeByStatus: true,
        compactMode: false,
        highlightToday: true,
      },
      filters: {
        rememberLastFilters: true,
        autoApplyFilters: true,
        showAdvancedFilters: false,
        defaultDateRange: "all",
        defaultStatus: "all",
      },
      notifications: {
        leaveSubmitted: true,
        leaveApproved: true,
        leaveRejected: true,
        leaveCancelled: true,
        upcomingLeave: true,
        reminderTime: 24,
        soundEnabled: true,
      },
      export: {
        defaultFormat: "csv",
        includeMetadata: true,
        includeReason: true,
        autoDownload: true,
      },
      automation: {
        autoRefresh: false,
        refreshInterval: 5,
        confirmBeforeDelete: true,
        showDeletedCount: true,
      },
      advanced: {
        enableDebugMode: false,
        cacheEnabled: true,
        maxCacheSize: 100,
        showRecordIds: false,
      },
    };
    setLeaveSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to their default values.",
    });
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  // Helper function to enrich leave data with cohort names
  const enrichWithCohortNames = async (records: LeaveRecord[]) => {
    try {
      // Fetch all cohorts
      const cohortResponse = await fetch('/api/dashboard/student/cohorts');
      if (!cohortResponse.ok) return records;
      
      const cohorts = await cohortResponse.json();
      if (!Array.isArray(cohorts)) return records;
      
      // Create a map of cohortId to cohort details
      const cohortMap = new Map();
      cohorts.forEach((cohort: any) => {
        const id = cohort.id || cohort.cohortId;
        if (id) {
          cohortMap.set(String(id).trim().toUpperCase(), {
            name: cohort.name,
            instructor: cohort.instructor || cohort.instructorName,
            timing: cohort.timing
          });
        }
      });
      
      // Enrich records with cohort names (override if name missing or equals ID)
      return records.map(record => {
        const cid = record.cohortId;
        if (cid) {
          const normalizedCid = String(cid).trim().toUpperCase();
          if (cohortMap.has(normalizedCid)) {
            const cohortDetails = cohortMap.get(normalizedCid);
            const currentName = record.cohortName;
            const needsNameOverride = !currentName || currentName.trim() === '' || currentName.trim().toUpperCase() === normalizedCid;
            return {
              ...record,
              cohortName: needsNameOverride ? (cohortDetails.name || currentName) : currentName,
              cohortInstructor: record.cohortInstructor || cohortDetails.instructor,
              cohortTiming: record.cohortTiming || cohortDetails.timing
            };
          }
        }
        return record;
      });
    } catch (error) {
      console.error('Failed to enrich cohort data:', error);
      return records;
    }
  };

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/student/attendance");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          let absentRecords = result.data
            .filter((record: any) => record.status === "absent")
            .map((record: any) => ({
              ...record,
              id: record?._id ? String(record._id) : (record?.id != null ? String(record.id) : undefined),
            }));
          
          // Enrich with cohort names
          absentRecords = await enrichWithCohortNames(absentRecords);
          
          setLeaveData(absentRecords);
        } else {
          console.error("Failed to fetch attendance data:", result.error);
          toast({
            title: "Error",
            description: "Failed to load leave data",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("Failed to fetch attendance data");
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast({
        title: "Error",
        description: "Failed to load leave data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const allVisibleIds = useMemo(() => filteredLeaves.map((r) => r.id.toString()), [filteredLeaves]);
  const needsHorizontalScroll = filteredLeaves.length > 3;

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? allVisibleIds : []);
  };

  // Apply quick date window before search/filter/sort
  const leaveDataWindowed = useMemo(() => {
    if (!leaveData?.length) return [] as LeaveRecord[];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const inToday = (d: Date) => d >= startOfToday && d < startOfTomorrow;
    const inLastNDays = (d: Date, n: number) => {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - (n - 1)); // inclusive of today
      return d >= start && d < startOfTomorrow;
    };

    return leaveData.filter(r => {
      const rd = new Date(r.date);
      if (isNaN(rd.getTime())) return false;
      switch (leaveDateWindow) {
        case '7d': return inLastNDays(rd, 7);
        case '15d': return inLastNDays(rd, 15);
        case 'today':
        default: return inToday(rd);
      }
    });
  }, [leaveData, leaveDateWindow]);

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      const targetId = recordToDelete.id;
      console.debug('[LeaveManagement] Deleting attendance (leave) record id:', targetId);
      const response = await fetch(`/api/dashboard/student/attendance/${targetId}` , {
        method: 'DELETE'
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[LeaveManagement] Delete failed status:', response.status, 'body:', text);
        throw new Error(`Failed to delete leave record (status ${response.status})`);
      }

      let result: any = {};
      try {
        result = await response.json();
      } catch (e) {
        console.error('[LeaveManagement] Failed parsing delete JSON:', e);
        throw new Error('Failed to delete leave record (invalid JSON response)');
      }

      if (!result.success) {
        console.error('[LeaveManagement] Delete response indicates failure:', result);
        throw new Error(result.error || 'Failed to delete leave record');
      }

      setLeaveData((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      setFilteredLeaves((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== recordToDelete.id.toString()));

      toast({
        title: "Leave Deleted",
        description: "Leave record removed successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting leave record:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete leave record",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="pt-1">
        <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-primary md:text-4xl">
              Student Leave Management
            </h2>
            <p className="text-lg text-foreground/70">
              Track, manage, and analyze student leave patterns across cohorts
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
          <TabsTrigger
            value="analytics"
            className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none shadow-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            Analytics
          </TabsTrigger>

          <TabsTrigger
            value="table"
            className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none shadow-sm"
          >
            <Table2 className="h-4 w-4" />
            Leave Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-3">
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 dark:text-white">Loading leave data...</p>
                  </div>
                </div>
              ) : (
                <LeaveAnalytics leaveData={leaveData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="mt-3">
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 dark:text-white">Loading leave data...</p>
                  </div>
                </div>
              ) : (
                <>
                  <LeaveSearchFilters
                    leaveRecords={leaveDataWindowed}
                    setFilteredLeaves={setFilteredLeaves}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedIds={selectedIds}
                    displayedColumns={displayedColumns}
                    setDisplayedColumns={setDisplayedColumns}
                    dateWindow={leaveDateWindow}
                    setDateWindow={(v: 'today'|'7d'|'15d') => setLeaveDateWindow(v)}
                  />

                  {viewMode === "list" ? (
                    <>
                      <LeaveTable
                        leaveData={filteredLeaves}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={toggleSelectAll}
                        displayedColumns={displayedColumns}
                        onSelectRecord={(record) => {
                          setRecordToView(record);
                          setViewDialogOpen(true);
                        }}
                        onDeleteRecord={(record) => {
                          setRecordToDelete(record);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    </>
                  ) : (
                    <div className={needsHorizontalScroll ? "overflow-x-auto" : ""}>
                      <div
                        className={needsHorizontalScroll ? "flex gap-6 px-4 pb-4" : "flex flex-wrap gap-6 px-4 pb-4"}
                        style={needsHorizontalScroll ? { minWidth: "max-content" } : undefined}
                      >
                        {filteredLeaves.map((record) => (
                          <Card
                            key={record.id}
                            className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-orange-400 bg-white transition-all duration-200 hover:border-orange-500 hover:shadow-lg"
                            style={{ width: "280px", minWidth: "280px" }}
                            onClick={() => {
                              setRecordToView(record);
                              setViewDialogOpen(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="mb-3 flex items-start justify-between pr-6">
                                <div className="min-w-0 flex-1">
                                  <h3
                                    className="truncate text-lg font-semibold text-gray-900 dark:text-white"
                                    title={record.studentName}
                                  >
                                    {record.studentName}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-white">{record.studentId}</p>
                                </div>
                                <Badge className="bg-red-100 text-red-800">Absent</Badge>
                              </div>

                              <div className="space-y-2 text-sm text-gray-600 dark:text-white">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-gray-400 dark:text-white" />
                                  {record.date ? formatDateForDisplay(record.date) : "-"}
                                </div>

                                {record.courseName && (
                                  <div className="flex items-start">
                                    <BookOpen className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-white" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-medium" title={record.courseName}>
                                        {record.courseName}
                                      </p>
                                      {record.courseId && (
                                        <p className="truncate text-xs text-gray-500 dark:text-white" title={record.courseId}>
                                          {record.courseId}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {record.cohortName && (
                                  <div className="flex items-start">
                                    <User className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-white" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-medium" title={record.cohortName}>
                                        {record.cohortName}
                                      </p>
                                      {record.cohortId && (
                                        <p className="truncate text-xs text-gray-500 dark:text-white" title={record.cohortId}>
                                          {record.cohortId}
                                        </p>
                                      )}
                                      {record.cohortInstructor && (
                                        <p
                                          className="truncate text-xs text-gray-500 dark:text-white"
                                          title={record.cohortInstructor}
                                        >
                                          {record.cohortInstructor}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {record.notes && (
                                  <div className="flex items-start">
                                    <NotepadText className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-white" />
                                    <p className="line-clamp-2 text-xs text-gray-600 dark:text-white" title={record.notes}>
                                      {record.notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="absolute bottom-3 right-3">
                                <button
                                  className="rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-red-50"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setRecordToDelete(record);
                                    setDeleteDialogOpen(true);
                                  }}
                                  aria-label="Delete leave record"
                                  title="Delete leave record"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Leave Details</DialogTitle>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          {recordToView && (
            <div className="space-y-6 p-2">
              <div>
                <h3 className="text-lg font-semibold">{recordToView.studentName}</h3>
                <p className="text-sm text-gray-500 dark:text-white">{recordToView.studentId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-white">Date:</span>
                      <span className="ml-2 font-medium">
                        {formatDateForDisplay(recordToView.date)}
                      </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-white">Status:</span>
                    <span className="ml-2 font-medium capitalize text-red-600">Absent</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-white">Course Name:</span>
                    <span className="ml-2 font-medium">{recordToView.courseName || "-"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-white">Course ID:</span>
                    <span className="ml-2 font-medium">{recordToView.courseId || "-"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-white">Cohort:</span>
                    <span className="ml-2 font-medium">{recordToView.cohortName && recordToView.cohortId ? `${recordToView.cohortName} (${recordToView.cohortId})` : recordToView.cohortName || recordToView.cohortId || "-"}</span>
                  </div>
                </div>
              </div>

              {recordToView.notes && (
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-white">Remarks:</span>
                  <p className="mt-1 font-medium">{recordToView.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Delete Leave</DialogTitle>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="p-2">
            <p className="mb-3 text-sm text-gray-600 dark:text-white">
              Are you sure you want to delete this leave record? This action cannot be undone.
            </p>
            {recordToDelete && (
              <div className="rounded-lg border bg-rose-50 p-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-rose-900">{recordToDelete.studentName}</span>
                  <span className="text-rose-700">ID: {recordToDelete.studentId}</span>
                    <span className="text-rose-700">
                      Date: {formatDateForDisplay(recordToDelete.date)}
                    </span>
                  {recordToDelete.courseName && (
                    <span className="text-rose-700">
                      Course: {recordToDelete.courseName}
                      {recordToDelete.courseId ? ` (${recordToDelete.courseId})` : ""}
                    </span>
                  )}
                  {recordToDelete.cohortName && (
                    <span className="text-rose-700">
                      Cohort: {recordToDelete.cohortName}
                      {recordToDelete.cohortId ? ` (${recordToDelete.cohortId})` : ""}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setRecordToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
