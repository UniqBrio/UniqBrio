"use client"

import React, { useMemo, useRef, useState } from "react"
import { AddAttendanceDialog, InstructorAttendanceRecord } from "./add-attendance-dialog"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { AttendanceTable } from "./attendance-table"
import { AttendanceSummary } from "./attendance-summary"
import { AttendanceAnalytics } from "./attendance-analytics"
import { AttendanceFilters } from "./attendance-filters"
import AttendanceSearchFilters from "./attendance-search-filters"
import { AttendanceGrid } from "./attendance-grid"
import AttendanceDrafts, { AttendanceDraftsHandle } from "./attendance-drafts"
// Chart feature removed per request


import { AttendanceSettings } from "./attendance-settings"
import { AttendanceGamification } from "./attendance-gamification"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import Image from "next/image"
import { Badge } from "@/components/dashboard/ui/badge"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { LayoutDashboard,Download, Upload, Settings, Plus, X, BarChart3, Camera, Table2, Calendar, Trophy, Bell, FileText, RefreshCcw, Pencil, Trash2, Hash, Clock, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/dashboard/use-toast"
import { useCustomColors } from "@/lib/use-custom-colors"
 


function AttendanceManagementInner() {
  const { toast } = useToast();
  const { primaryColor, secondaryColor } = useCustomColors();
  const [activeTab, setActiveTab] = useState("analytics");
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<InstructorAttendanceRecord> | null>(null);

  // Move attendance data and filter state here
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState<InstructorAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New search filter states
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [displayedColumns, setDisplayedColumns] = useState<string[]>([]);
  const draftsRef = React.useRef<AttendanceDraftsHandle | null>(null);
  const [draftsCount, setDraftsCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<InstructorAttendanceRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<InstructorAttendanceRecord | null>(null);

  // Fetch attendance data on component mount
  React.useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Listen for event to reopen drafts dialog after converting from a draft
  React.useEffect(() => {
    const onOpenDrafts = () => {
      try {
        // Switch to table tab for context and open drafts modal
        setActiveTab('table');
        draftsRef.current?.open();
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('instructor-attendance-drafts:open', onOpenDrafts);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('instructor-attendance-drafts:open', onOpenDrafts);
      }
    };
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/staff/instructor/attendance', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Map MongoDB _id to id for frontend compatibility
          const mappedData = result.data.map((record: any) => ({
            ...record,
            id: record._id
          }));
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

  // Safely parse a response as JSON if possible; otherwise return text
  const safeParseResponse = async (response: Response): Promise<{ json: any | null; text: string | null }> => {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        return { json, text: null };
      }
      const text = await response.text();
      return { json: null, text };
    } catch {
      return { json: null, text: null };
    }
  };

  const handleSaveAttendance = async (recordData: Partial<InstructorAttendanceRecord>) => {
    // Track whether to auto-reopen drafts after save (when converting from a draft)
    let reopenAfterClose = false;
    try {
      if (editingRecordId != null) {
        // Update existing record
        const response = await fetch(`/api/dashboard/staff/instructor/attendance/${editingRecordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Update local state
            setAttendanceData((prev: InstructorAttendanceRecord[]) => {
              return prev.map(r => {
                if (String(r.id) !== String(editingRecordId)) return r;
                return {
                  ...result.data,
                  id: result.data._id
                };
              });
            });
            toast({
              title: 'Success',
              description: 'Attendance record updated successfully',
            });
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('Failed to update attendance record');
        }
      } else {
        // Create new record
        const response = await fetch('/api/dashboard/staff/instructor/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(recordData),
        });

        if (response.ok) {
          const { json: result } = await safeParseResponse(response);
          if (result.success) {
            // Add to local state
            const newRecord = {
              ...result.data,
              id: result.data._id
            };
            setAttendanceData(prev => [newRecord, ...prev]);
            toast({
              title: 'Success',
              description: 'Attendance record created successfully',
            });
            // If this attendance came from a draft, delete that draft now
            if (editingDraftId != null) {
              try {
                await draftsRef.current?.deleteDraft(editingDraftId as any);
                // After deletion, if more drafts remain, mark to reopen drafts dialog
                try { reopenAfterClose = (draftsRef.current?.getCount?.() || 0) > 0 } catch { reopenAfterClose = false }
              } catch {}
              setEditingDraftId(null);
              setEditingDraft(null);
            }
          } else {
            throw new Error(result.error);
          }
        } else {
          const { json, text } = await safeParseResponse(response);
          // Handle specific error cases with better messaging
          if (response.status === 409) {
            throw new Error(`Attendance record already exists for this instructor on ${recordData.date}. Please edit the existing record or choose a different date.`);
          }
          const message = (json && (json.error || json.message))
            || (text && text.slice(0, 200))
            || 'Failed to create attendance record';
          throw new Error(message);
        }
      }
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance record',
        variant: 'destructive'
      });
    }
    setEditingRecordId(null);
    // If there are still drafts left, reopen the drafts dialog automatically
    try { if (reopenAfterClose && typeof window !== 'undefined') window.dispatchEvent(new Event('instructor-attendance-drafts:open')); } catch {}
  };

  const openEditAttendance = (record: InstructorAttendanceRecord) => {
    setIsAttendanceModalOpen(true);
    setEditingRecordId(record.id);
  };

  const handleSaveDraft = async (recordData: Partial<InstructorAttendanceRecord>) => {
    try {
      if (editingDraftId != null) {
        // Update existing draft
        const response = await fetch(`/api/dashboard/staff/instructor/attendance-drafts/${editingDraftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
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
        const response = await fetch('/api/dashboard/staff/instructor/attendance-drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
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

  

  return (
    <div className="space-y-3">
      <div className="w-full">
        <div className="flex items-center mb-1 flex-wrap gap-2 relative min-h-[48px]">
    <h1 className="text-3xl md:text-3xl font-bold" style={{ color: primaryColor }}>Instructor Attendance Management </h1>
        </div>
  <p className="text-lg mb-0 text-gray-700 dark:text-white">
    Track, manage, and analyze attendance for all instructors across cohorts</p>
        </div>
        
      

      {/* Add Attendance Dialog Component */}
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
        editingRecord={editingRecordId != null ? attendanceData.find(r => String(r.id) === String(editingRecordId)) : null}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 w-full gap-2 bg-transparent h-auto p-0">
          <TabsTrigger
            value="analytics"
            className="hexagon-tab border border-[#DE7D14] text-[#DE7D14] bg-transparent transition-all duration-150 font-semibold px-4 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] focus:outline-none"
          >
            <LayoutDashboard className="w-4 h-4 mr-2 inline-block" />
            Analytics
          </TabsTrigger>
          
          <TabsTrigger
            value="table"
            className="hexagon-tab border border-[#DE7D14] text-[#DE7D14] bg-transparent transition-all duration-150 font-semibold px-4 py-2 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#DE7D14] data-[state=active]:to-[#8B5CF6] data-[state=active]:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-[#DE7D14] hover:to-[#8B5CF6] focus:outline-none"
          >
            <Table2 className="w-4 h-4 mr-2 inline-block" />
            Attendance Table
          </TabsTrigger>
          
          
          <TabsTrigger
            value="gamification"
            className={
              `border-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
              data-[state=active]:bg-gray-400 data-[state=active]:text-white
              data-[state=active]:border-gray-600
              bg-white text-gray-700 dark:text-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:text-purple-700`
            }
          >
            <Trophy className="w-4 h-4 mr-2 inline-block" />
            <span className="inline-flex items-center gap-1">Gamification <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className={
              `border-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
              data-[state=active]:bg-gray-400 data-[state=active]:text-white
              data-[state=active]:border-gray-600
              bg-white text-gray-700 dark:text-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:text-purple-700`
            }
          >
            <Bell className="w-4 h-4 mr-2 inline-block" />
            <span className="inline-flex items-center gap-1">Notifications <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-3">
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span>Loading attendance data...</span>
                  </div>
                </div>
              ) : (
                <>
                  <AttendanceSearchFilters
                attendanceRecords={attendanceData}
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
                  setAttendanceData((prev: InstructorAttendanceRecord[]) => {
                    const maxId = prev.reduce((m, r) => Math.max(m, r.id), 0);
                    const normalized: InstructorAttendanceRecord[] = items.map((it, idx) => ({
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
              />
              {viewMode === "list" ? (
                <>
                  {selectedIds.length > 0 && (
                    <div
                      className="flex items-center gap-3 px-4 py-2 text-sm"
                      style={{
                        background: `color-mix(in oklab, ${primaryColor} 10%, white)`,
                        borderBottom: `1px solid ${primaryColor}33`,
                      }}
                    >
                      <span className="font-medium" style={{ color: primaryColor }}>{selectedIds.length} selected</span>
                      {/* Bulk status actions removed per requirements */}
                      <button
                        className="ml-auto px-2 py-1 rounded bg-white border text-gray-600 dark:text-white hover:bg-gray-50"
                        onClick={() => setSelectedIds([])}
                      >Clear Selection</button>
                    </div>
                  )}
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
              {(() => {
                // Use the same source as the table: if filtered list exists, base analytics on it
                const analyticsSource = (filteredAttendance && filteredAttendance.length > 0) ? filteredAttendance : attendanceData;
                return (
                  <>
                    <AttendanceSummary attendanceData={analyticsSource as any} />
                    <AttendanceAnalytics attendanceData={analyticsSource as any} />
                  </>
                )
              })()}
              {/* Added a real 7-day present count chart above */}
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

        <TabsContent value="settings" className="mt-3">
          <Card>
            <CardContent className="p-4 pointer-events-none opacity-50 grayscale">
              <AttendanceSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* View details dialog - redesigned to match Leave Management UI */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
          <VisuallyHidden>
            <DialogTitle>Attendance Details</DialogTitle>
          </VisuallyHidden>

          {recordToView && (
            <>
              {/* Gradient header for consistency */}
              <div
                className="relative overflow-hidden rounded-t-2xl p-8 text-white"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} 45%, ${secondaryColor} 100%)`,
                }}
              >
                <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-3">
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">{recordToView.instructorName}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-white/90">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
                      <Hash className="h-4 w-4" /> ID: {recordToView.instructorId}
                    </span>
                    {recordToView.status && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
                        <CheckCircle2 className="h-4 w-4" /> {recordToView.status.charAt(0).toUpperCase() + recordToView.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content cards */}
              <div className="p-6 md:p-8 bg-gradient-to-b from-white to-white/80">
                {/* Helper row for aligned items */}
                {(() => {
                  const DetailRow = ({ icon: Icon, iconClass, label, value }: { icon: React.ComponentType<{ className?: string }>; iconClass: string; label: string; value: React.ReactNode }) => (
                    <div className="grid grid-cols-[20px_160px_1fr] items-start gap-3 py-2 leading-6">
                      <Icon className={`h-4 w-4 ${iconClass}`} />
                      <div className="text-gray-500 dark:text-white">{label}</div>
                      <div className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap break-words">{value}</div>
                    </div>
                  )

                  const formatDisplayDate = (s?: string) => {
                    if (!s) return "?"
                    try {
                      const d = new Date(s)
                      if (isNaN(d.getTime())) return s
                      return d
                        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        .replace(/ /g, "-")
                    } catch {
                      return s || "?"
                    }
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Attendance details */}
                      <section className="rounded-xl bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow" style={{ border: `1px solid ${primaryColor}22` }}>
                        <div className="px-5 py-3 border-b text-sm font-semibold" style={{ color: primaryColor, borderColor: `${primaryColor}1f` }}>Attendance</div>
                        <div className="px-5 pb-5 pt-2 text-[15px]">
                          <DetailRow icon={Calendar} iconClass="" label="Date" value={formatDisplayDate(recordToView.date)} />
                          <DetailRow icon={Clock} iconClass="" label="Start Time" value={recordToView.startTime || "?"} />
                          <DetailRow icon={Clock} iconClass="" label="End Time" value={recordToView.endTime || "?"} />
                          <DetailRow
                            icon={CheckCircle2}
                            iconClass=""
                            label="Status"
                            value={(() => {
                              const v = (recordToView.status || '').toString().toLowerCase()
                              const label = v === 'planned' ? 'Planned leave' : v === 'absent' ? 'Unplanned Leave' : (v ? v.charAt(0).toUpperCase() + v.slice(1) : '?')
                              const cls = v === 'present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : v === 'planned' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                              return <Badge variant="secondary" className={cls}>{label}</Badge>
                            })()}
                          />
                          <DetailRow icon={FileText} iconClass="" label="Remarks" value={recordToView.notes || "-"} />
                        </div>
                      </section>

                      {/* Empty spacer card to balance grid or for future extensions */}
                      <section className="rounded-xl bg-white/70 backdrop-blur-md shadow-sm min-h-[120px] hidden lg:block" style={{ border: `1px solid ${primaryColor}12` }} />
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete confirmation modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Attendance</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <p className="text-sm text-gray-600 dark:text-white mb-3">Are you sure you want to delete this attendance record? This action can't be undone.</p>
            {recordToDelete && (
              <div className="text-sm bg-gray-50 border rounded p-3">
                <div><span className="text-gray-500 dark:text-white">Instructor:</span> <span className="font-medium">{recordToDelete.instructorName} ({recordToDelete.instructorId})</span></div>
                <div><span className="text-gray-500 dark:text-white">Date:</span> <span className="font-medium">{new Date(recordToDelete.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</span></div>
                {/* Removed Course and Cohort details from delete confirmation */}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setRecordToDelete(null); }}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (!recordToDelete) return;
                  
                  try {
                    const response = await fetch(`/api/dashboard/staff/instructor/attendance/${recordToDelete.id}`, {
                      method: 'DELETE',
                      credentials: 'include'
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

export function AttendanceManagement() {
  return (
    
      <AttendanceManagementInner />
    
  );
}

