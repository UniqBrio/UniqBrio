"use client"

import React, { useMemo, useRef, useState } from "react"
import { AddAttendanceDialog, StudentAttendanceRecord } from "./add-attendance-dialog"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { AttendanceTable } from "./attendance-table"
import { AttendanceSummary } from "./attendance-summary"
import { AttendanceFilters } from "./attendance-filters"
import AttendanceSearchFilters from "./attendance-search-filters"
import { AttendanceGrid } from "./attendance-grid"
import AttendanceDrafts, { AttendanceDraftsHandle } from "./attendance-drafts"
import { AttendanceAnalytics } from "./attendance-analytics"
import { AttendanceSettings } from "./attendance-settings"

import { AttendanceGamification } from "./attendance-gamification"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/dashboard/ui/dialog"
import Image from "next/image"
import { formatDateForDisplay, formatTimeTo12Hour, formatTimesInTextTo12Hour } from "@/lib/dashboard/student/utils";
import { LayoutDashboard,Download, Upload, Settings, Plus, X, BarChart3, Camera, Table2, Calendar, Trophy, Bell, FileText, RefreshCcw, Pencil, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Label } from "@/components/dashboard/ui/label"
import { useToast } from "@/hooks/dashboard/use-toast"
 

interface AttendanceManagementProps {
  preloadedData?: any[];
  preloadedDataLoading?: boolean;
}

function AttendanceManagementInner({ preloadedData = [], preloadedDataLoading }: AttendanceManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analytics");
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | number | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | number | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<StudentAttendanceRecord> | null>(null);

  // Move attendance data and filter state here
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(preloadedDataLoading ?? true);

  // New search filter states
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [displayedColumns, setDisplayedColumns] = useState<string[]>([]);
  // New: Quick date window for table (Today / Past 7 days / Past 15 days)
  const [tableDateWindow, setTableDateWindow] = useState<'today' | '7d' | '15d'>('today');

  // Settings state
  const [attendanceSettings, setAttendanceSettings] = useState({
    display: {
      defaultView: "list",
      dateWindow: "today",
      showCohortInfo: true,
      showTimeInfo: true,
      colorCodeByStatus: true,
      compactMode: false,
      highlightToday: true,
      showSelfiePreview: true,
    },
    filters: {
      rememberLastFilters: true,
      autoApplyFilters: true,
      showAdvancedFilters: false,
      defaultDateRange: "all",
      defaultStatus: "all",
    },
    notifications: {
      attendanceMarked: true,
      attendanceUpdated: true,
      attendanceDeleted: true,
      lateArrival: true,
      missedAttendance: true,
      reminderTime: 1,
      soundEnabled: true,
    },
    export: {
      defaultFormat: "csv",
      includeMetadata: true,
      includeSelfies: false,
      includeNotes: true,
      autoDownload: true,
    },
    automation: {
      autoDraftSave: true,
      autoDraftInterval: 3,
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
      enableSelfieCapture: true,
      selfieQuality: "medium",
    },
  });

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('attendanceSettings');
    if (savedSettings) {
      try {
        setAttendanceSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse attendance settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('attendanceSettings', JSON.stringify(attendanceSettings));
  }, [attendanceSettings]);

  const updateSetting = (category: string, key: string, value: any) => {
    setAttendanceSettings(prev => ({
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
        showTimeInfo: true,
        colorCodeByStatus: true,
        compactMode: false,
        highlightToday: true,
        showSelfiePreview: true,
      },
      filters: {
        rememberLastFilters: true,
        autoApplyFilters: true,
        showAdvancedFilters: false,
        defaultDateRange: "all",
        defaultStatus: "all",
      },
      notifications: {
        attendanceMarked: true,
        attendanceUpdated: true,
        attendanceDeleted: true,
        lateArrival: true,
        missedAttendance: true,
        reminderTime: 1,
        soundEnabled: true,
      },
      export: {
        defaultFormat: "csv",
        includeMetadata: true,
        includeSelfies: false,
        includeNotes: true,
        autoDownload: true,
      },
      automation: {
        autoDraftSave: true,
        autoDraftInterval: 3,
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
        enableSelfieCapture: true,
        selfieQuality: "medium",
      },
    };
    setAttendanceSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to their default values.",
    });
  };

  const attendanceDataWindowed = useMemo(() => {
    if (!attendanceData?.length) return [] as StudentAttendanceRecord[];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const inToday = (d: Date) => d >= startOfToday && d < startOfTomorrow;
    const inLastNDays = (d: Date, n: number) => {
      // include today as day 1
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - (n - 1));
      return d >= start && d < startOfTomorrow;
    };

    return attendanceData.filter(r => {
      const rd = new Date(r.date);
      if (isNaN(rd.getTime())) return false;
      switch (tableDateWindow) {
        case '7d': return inLastNDays(rd, 7);
        case '15d': return inLastNDays(rd, 15);
        case 'today':
        default: return inToday(rd);
      }
    });
  }, [attendanceData, tableDateWindow]);
  const draftsRef = React.useRef<AttendanceDraftsHandle | null>(null);
  const [draftsCount, setDraftsCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<StudentAttendanceRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<StudentAttendanceRecord | null>(null);

  // Initial data fetch on mount if no preloaded data
  React.useEffect(() => {
    // If no preloaded data is provided at all, fetch immediately
    if (!preloadedData || (Array.isArray(preloadedData) && preloadedData.length === 0)) {
      if (preloadedDataLoading === undefined) {
        fetchAttendanceData();
      }
    }
  }, []); // Only run on mount

  // Helper function to enrich attendance data with cohort names
  const enrichWithCohortNames = async (records: StudentAttendanceRecord[]) => {
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

  // Use preloaded data if available, otherwise fetch on mount
  React.useEffect(() => {
    let cancelled = false;
    const applyPreloadedData = async () => {
      if (preloadedData && preloadedData.length > 0) {
        const enriched = await enrichWithCohortNames(preloadedData as StudentAttendanceRecord[]);
        if (!cancelled) {
          setAttendanceData(enriched);
          setLoading(false);
        }
        return;
      }

      if (!preloadedDataLoading || preloadedDataLoading === undefined) {
        fetchAttendanceData();
      } else {
        setLoading(preloadedDataLoading);
      }
    };

    applyPreloadedData();
    return () => {
      cancelled = true;
    };
  }, [preloadedData, preloadedDataLoading]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/student/attendance');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Map MongoDB _id to id for frontend compatibility
          let mappedData = result.data.map((record: any) => ({
            ...record,
            id: record?._id ? String(record._id) : (record?.id != null ? String(record.id) : undefined)
          }));
          
          // Enrich with cohort names
          mappedData = await enrichWithCohortNames(mappedData);
          
          setAttendanceData(mappedData);
        } else {
          console.error('Failed to fetch attendance data:', result.error);
          toast({
            title: 'Error',
            description: 'Failed to load attendance data',
            variant: 'destructive'
          });
        }
      } else {
        throw new Error('Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (recordData: Partial<StudentAttendanceRecord>) => {
    try {
      if (editingRecordId != null) {
        // Update existing record
        const response = await fetch(`/api/dashboard/student/attendance/${editingRecordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Update local state
            setAttendanceData((prev: StudentAttendanceRecord[]) => {
              return prev.map(r => {
                if (r.id !== editingRecordId) return r;
                return {
                  ...result.data,
                  id: result.data?._id ? String(result.data._id) : (result.data?.id != null ? String(result.data.id) : undefined)
                };
              });
            });
            toast({
              title: 'Success',
              description: 'Attendance record updated successfully',
            });
            return true; // Indicate success
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Failed to update attendance record');
        }
      } else {
        // Create new record
        const response = await fetch('/api/dashboard/student/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Add to local state
            const newRecord = {
              ...result.data,
              id: result.data?._id ? String(result.data._id) : (result.data?.id != null ? String(result.data.id) : undefined)
            };
            setAttendanceData(prev => [newRecord, ...prev]);
            
            // If this attendance was created from a draft, delete the draft
            if (editingDraftId != null && draftsRef.current) {
              try {
                console.log('??? Attempting to delete draft with ID:', editingDraftId);
                // Use the draftsRef to delete, which handles both API and state
                await draftsRef.current.deleteDraft(editingDraftId);
                console.log('? Draft deleted successfully');
              } catch (draftError) {
                console.error('? Error deleting draft after attendance creation:', draftError);
                // Don't throw error - attendance was created successfully
              }
            } else {
              console.log('?? No draft to delete. editingDraftId:', editingDraftId, 'draftsRef:', draftsRef.current);
            }
            
            toast({
              title: 'Success',
              description: 'Attendance record created successfully',
            });
            return true; // Indicate success
          } else {
            throw new Error(result.error);
          }
        } else {
          const errorResult = await response.json();
          
          // Handle specific error cases with better messaging
          if (response.status === 409) {
            throw new Error(`Attendance record already exists for this student on ${recordData.date}. Please edit the existing record or choose a different date.`);
          }
          
          throw new Error(errorResult.error || 'Failed to create attendance record');
        }
      }
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance record',
        variant: 'destructive'
      });
      return false; // Indicate failure
    } finally {
      setEditingRecordId(null);
      setEditingDraftId(null);
      setEditingDraft(null);
    }
  };

  const openEditAttendance = (record: StudentAttendanceRecord) => {
    setIsAttendanceModalOpen(true);
    setEditingRecordId(record.id);
  };

  const handleSaveDraft = async (recordData: Partial<StudentAttendanceRecord>) => {
    try {
      if (editingDraftId != null) {
        // Update existing draft
        const response = await fetch(`/api/dashboard/student/attendance-drafts/${editingDraftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Update through drafts component
            draftsRef.current?.updateDraft({
              ...result.data,
              id: result.data._id
            } as any);
            toast({
              title: 'Success',
              description: 'Draft updated successfully',
            });
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Failed to update draft');
        }
      } else {
        // Create new draft
        const response = await fetch('/api/dashboard/student/attendance-drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Add through drafts component
            draftsRef.current?.addDraft({
              ...result.data,
              id: result.data._id
            } as any);
            toast({
              title: 'Success',
              description: 'Draft saved successfully',
            });
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Failed to create draft');
        }
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft',
        variant: 'destructive'
      });
    }
    setEditingDraftId(null);
    setEditingDraft(null);
  };

  
  
      // UI
      return (
    <div className="w-full space-y-5">
      <AddAttendanceDialog
        isOpen={isAttendanceModalOpen}
        onOpenChange={(open) => {
          setIsAttendanceModalOpen(open);
          if (!open) {
            setEditingRecordId(null);
            setEditingDraftId(null);
            setEditingDraft(null);
          }
        }}
        editingRecord={editingRecordId != null ? attendanceData.find(r => r.id === editingRecordId) : null}
        editingDraftId={editingDraftId}
        editingDraft={editingDraft}
        attendanceData={attendanceData}
        onSaveAttendance={handleSaveAttendance}
        onSaveDraft={handleSaveDraft}
      />

      {/* Drafts Modal (centralized component) */}
      <AttendanceDrafts
        ref={draftsRef}
        onContinue={(d) => {
          setIsAttendanceModalOpen(true);
          setEditingDraftId(d.id);
          setEditingDraft(d);
        }}
        onCountChange={(n)=> setDraftsCount(n)}
      />

      <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-primary md:text-4xl">
          Student Attendance Management
        </h2>
        <p className="mt-2 text-lg text-foreground/70">
          Track, manage, and analyze attendance for all students across cohorts
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full gap-2 bg-transparent h-auto p-0">
          <TabsTrigger
            value="analytics"
            className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4 mr-2 inline-block" />
            Analytics
          </TabsTrigger>
          
          <TabsTrigger
            value="table"
            className="text-[#DE7D14] bg-white border-2 border-[#DE7D14] rounded-lg transition-all duration-150 font-semibold px-5 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-[#8B5CF6] hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] hover:border-[#8B5CF6] focus:outline-none shadow-sm"
          >
            <Table2 className="w-4 h-4 mr-2 inline-block" />
            Attendance Table
          </TabsTrigger>
          
          <TabsTrigger
            value="notifications"
            className={
              `border-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
              data-[state=active]:bg-gray-400 data-[state=active]:text-white
              data-[state=active]:border-gray-600
              bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50`
            }
          >
            <Bell className="w-4 h-4 mr-2 inline-block" />
            <span className="inline-flex items-center gap-1">Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
          </TabsTrigger>
          <TabsTrigger
            value="gamification"
            className={
              `border-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
              data-[state=active]:bg-gray-400 data-[state=active]:text-white
              data-[state=active]:border-gray-600
              bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50`
            }
          >
            <Trophy className="w-4 h-4 mr-2 inline-block" />
            <span className="inline-flex items-center gap-1">Gamification <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-3">
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600">Loading attendance data...</p>
                  </div>
                </div>
              ) : (
                <>
                  <AttendanceSearchFilters
                attendanceRecords={attendanceDataWindowed}
                setFilteredAttendance={setFilteredAttendance}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onAddAttendance={() => setIsAttendanceModalOpen(true)}
                onImport={(items) => {
                  setAttendanceData((prev: StudentAttendanceRecord[]) => {
                    const maxId = prev.reduce((m, r) => Math.max(m, typeof r.id === 'number' ? r.id : 0), 0);
                    const normalized: StudentAttendanceRecord[] = items.map((it, idx) => ({
                      ...it,
                      id: maxId + idx + 1,
                    }));
                    return [...prev, ...normalized];
                  });
                }}
                selectedIds={selectedIds}
                displayedColumns={displayedColumns}
                setDisplayedColumns={setDisplayedColumns}
                onOpenDrafts={() => draftsRef.current?.open()}
                draftCount={draftsCount}
                dateWindow={tableDateWindow}
                setDateWindow={(v: 'today'|'7d'|'15d')=> setTableDateWindow(v)}
              />
              {viewMode === "list" ? (
                <>
                  {/* Selection banner removed as requested */}
                  <AttendanceTable
                    attendanceData={filteredAttendance as any}
                    selectedIds={selectedIds}
                    onToggleSelect={(id: string, checked: boolean) => {
                      if (checked) setSelectedIds(prev => [...prev, id]);
                      else setSelectedIds(prev => prev.filter(x => x !== id));
                    }}
                    onToggleSelectAll={(checked: boolean) => {
                      if (checked) setSelectedIds(filteredAttendance.map(r => r.id.toString()));
                      else setSelectedIds([]);
                    }}
                    displayedColumns={displayedColumns}
                    onSelectRecord={(record) => { setRecordToView(record as any); setViewDialogOpen(true); }}
                    onEditRecord={(record) => openEditAttendance(record as any)}
                    onDeleteRecord={(record) => { setRecordToDelete(record as any); setDeleteDialogOpen(true); }}
                  />
                </>
              ) : (
                <AttendanceGrid
                  attendanceData={filteredAttendance}
                  onSelectRecord={(record) => { setRecordToView(record as any); setViewDialogOpen(true); }}
                  onEditRecord={(record) => openEditAttendance(record as any)}
                  onDeleteRecord={(record) => { setRecordToDelete(record as any); setDeleteDialogOpen(true); }}
                />
              )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        
        

        <TabsContent value="analytics" className="mt-3">
          <Card>
            <CardContent className="p-4">
              <AttendanceSummary attendanceData={attendanceData} loading={loading} />
              <div className="mt-4">
                <AttendanceAnalytics attendanceData={attendanceData} loading={loading} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-3">
          <Card>
            <CardContent className="p-4 pointer-events-none opacity-50 grayscale">
              <AttendanceSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamification" className="mt-3">
          <Card>
            <CardContent className="p-4 pointer-events-none opacity-50 grayscale">
              <AttendanceGamification />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* View details dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Attendance Details</DialogTitle>
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
            <div className="p-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{recordToView.studentName}</h3>
                <p className="text-sm text-gray-500">{recordToView.studentId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
              <div className="text-sm"><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDateForDisplay(recordToView.date)}</span></div>
                  <div className="text-sm"><span className="text-gray-500">Start Time:</span> <span className="font-medium">{recordToView.startTime ? formatTimeTo12Hour(recordToView.startTime) : '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-500">End Time:</span> <span className="font-medium">{recordToView.endTime ? formatTimeTo12Hour(recordToView.endTime) : '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{recordToView.status}</span></div>
                <div className="text-sm"><span className="text-gray-500">Remarks:</span> <span className="font-medium">{recordToView.notes || '-'}</span></div>
              
                </div>
                <div className="space-y-2">
                  <div className="text-sm"><span className="text-gray-500">Course Name:</span> <span className="font-medium">{recordToView.courseName || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-500">Course ID:</span> <span className="font-medium">{recordToView.courseId || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-500">Cohort:</span> <span className="font-medium">{recordToView.cohortName && recordToView.cohortId ? `${recordToView.cohortName} (${recordToView.cohortId})` : recordToView.cohortName || recordToView.cohortId || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-500">Scheduled Time:</span> <span className="font-medium">{recordToView.cohortTiming ? formatTimesInTextTo12Hour(recordToView.cohortTiming) : '-'}</span></div>
                  
                </div>
              </div>
            
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete confirmation modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Delete Attendance</DialogTitle>
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
            <p className="text-sm text-gray-600 mb-3">Are you sure you want to delete this attendance record? This will remove it and cannot be undone.</p>
            {recordToDelete && (
              <div className="text-sm bg-gray-50 border rounded p-3">
                <div><span className="text-gray-500">Student:</span> <span className="font-medium">{recordToDelete.studentName} ({recordToDelete.studentId})</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDateForDisplay(recordToDelete.date)}</span></div>
                {recordToDelete.courseName && (
                  <div><span className="text-gray-500">Course:</span> <span className="font-medium">{recordToDelete.courseName} ({recordToDelete.courseId})</span></div>
                )}
                {(recordToDelete.cohortName || recordToDelete.cohortId) && (
                  <div><span className="text-gray-500">Cohort:</span> <span className="font-medium">{recordToDelete.cohortName && recordToDelete.cohortId ? `${recordToDelete.cohortName} (${recordToDelete.cohortId})` : recordToDelete.cohortName || recordToDelete.cohortId}</span></div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setRecordToDelete(null); }}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (!recordToDelete) return;
                  
                  try {
                    const response = await fetch(`/api/dashboard/student/attendance/${recordToDelete.id}`, {
                      method: 'DELETE',
                    });

                    if (response.ok) {
                      const result = await response.json();
                      if (result.success) {
                        // Remove from local state
                        setAttendanceData(prev => prev.filter(r => r.id !== recordToDelete.id));
                        setSelectedIds(prev => prev.filter(id => id !== recordToDelete.id.toString()));
                        toast({
                          title: 'Success',
                          description: 'Attendance record deleted successfully',
                        });
                      } else {
                        throw new Error(result.error);
                      }
                    } else {
                      throw new Error('Failed to delete attendance record');
                    }
                  } catch (error: any) {
                    console.error('Error deleting attendance:', error);
                    toast({
                      title: 'Error',
                      description: error.message || 'Failed to delete attendance record',
                      variant: 'destructive'
                    });
                  }
                  
                  setRecordToDelete(null);
                  setDeleteDialogOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AttendanceManagement({ preloadedData, preloadedDataLoading }: AttendanceManagementProps) {
  return (
    
      <AttendanceManagementInner 
        preloadedData={preloadedData}
        preloadedDataLoading={preloadedDataLoading}
      />
    
  );
}

