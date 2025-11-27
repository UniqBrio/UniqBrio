"use client"

import React, { useEffect, useState, useRef, lazy, Suspense } from "react"
import { ProfileData } from "./types"
import PerformanceCard from "./PerformanceCard"
import type { EditFormData } from "./comprehensive-edit-modal"

// Lazy load heavy components
const ComprehensiveEditModal = lazy(() => import("./comprehensive-edit-modal"))
import SearchAndFilterBar from "./SearchAndFilterBar"
import InstructorListView from "./InstructorListView"
import DeleteConfirmationDialog from "./DeleteConfirmationDialog"
import InstructorDetailsDialog from "./InstructorDetailsDialog"
import InstructorListSkeleton from "./InstructorListSkeleton"
import { useInstructorFiltering, useInstructorActions, Instructor } from "./hooks"
import { useNonInstructors } from "@/hooks/dashboard/staff/use-non-instructors"
import type { Instructor as StoreInstructor } from "@/types/dashboard/staff/instructor"
import "./SearchAndFilters.css"
import AddInstructorDialog from "@/components/dashboard/non-instructor/add-instructor-dialog-refactored/AddInstructorDialogWrapper"
import type { InstructorFormData } from "@/components/dashboard/instructor/add-instructor-dialog-refactored/types"
import { useToast } from "@/hooks/dashboard/use-toast"

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const day = d.toLocaleString("en-GB", { day: "2-digit" })
  const mon = d.toLocaleString("en-GB", { month: "short" })
  const yr = d.getFullYear()
  return `${day}-${mon}-${yr}`
}

export default function InstructorProfile({
  onOpenDrafts,
  draftsCount,
  onOpenAddDialog,
}: {
  onOpenDrafts?: () => void;
  draftsCount?: number;
  onOpenAddDialog?: () => void;
} = {}) {
  const { toast } = useToast()
  // Seed data (optional fields omitted; subcomponents handle them as optional)
  const initialProfile: ProfileData = {
  instructorId: "NON INS0001",
    name: "Ms. Emily Carter",
    gender: "Female",
    role: "Senior Arts & Sports Instructor",
    email: "emily.carter@artsacademy.com",
    phone: "+1 (555) 987-6543",
    address: "456 Creative Avenue, Art City, AC 67890",
    joinDate: "2018-03-10",
    yearsOfExperience: 10,
    specializations: ["Watercolor", "Dribbling"],
    awards: ["Best Arts Coach 2022", "Top Performer 2023"],
    careerGoals: "Lead interdisciplinary programs combining arts and sports; mentor new instructors.",
    certifications: ["Master of Fine Arts", "Certified Sports Coach", "Art Therapy Certification"],
    paymentInfo: { classCount: 18, frequency: "Monthly", hourlyRate: 55 },
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      branches: ["Art Campus", "Sports Complex"],
      upcomingClasses: [
        { title: "Watercolor Basics", date: "2025-09-15", time: "10:00", location: "Art Campus" },
        { title: "Basketball Drills", date: "2025-09-16", time: "15:30", location: "Sports Complex" },
      ],
      timeOffRequests: [
        { startDate: "2025-10-01", endDate: "2025-10-05", reason: "Conference", status: "Approved" },
      ],
      substituteHistory: [
        { date: "2025-08-12", className: "Advanced Sculpture", substituteName: "Mr. Lee" },
      ],
      overtimeTracking: [
        { date: "2025-08-20", hours: 2, note: "Exhibition prep" },
      ],
    },
    shifts: { primary: "Afternoon (13:00 - 17:00)", secondary: "Evening (17:00 - 20:00)" },
    employmentHistory: [
      {
        position: "Arts Instructor",
        institution: "Creative Minds Academy",
        duration: "2015 - 2018",
        responsibilities: "Teaching painting and sculpture, organizing art exhibitions",
        startDate: "2015-01-01",
        endDate: "2018-02-28",
      },
      {
        position: "Sports Coach",
        institution: "Active Youth Sports Center",
        duration: "2012 - 2015",
        responsibilities: "Coaching basketball and football, leading sports workshops",
        startDate: "2012-03-01",
        endDate: "2015-01-01",
      },
    ],
  }

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [courses, setCourses] = useState<Array<{ name: string; instructor?: string }>>([])
  const [cohorts, setCohorts] = useState<Array<{ name?: string; instructor?: string }>>([])

  // Sync with shared instructors store so new additions appear here
  const { instructors: storeInstructors, deleteInstructor: deleteFromStore, getFormById, updateInstructor, loading: instructorsLoading } = useNonInstructors()

  // Fetch courses data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/dashboard/staff/instructor/courses', {
          credentials: 'include'
        })
        if (response.ok) {
          const coursesData = await response.json()
          setCourses(coursesData)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      }
    }
    
    fetchCourses()
  }, [])

  // Fetch cohorts data
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const response = await fetch('/api/dashboard/staff/instructor/cohorts', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setCohorts(data)
        }
      } catch (error) {
        console.error('Failed to fetch cohorts:', error)
      }
    }
    fetchCohorts()
  }, [])

  useEffect(() => {
    const mapped: Instructor[] = storeInstructors.map((s: StoreInstructor) => {
      // Find ALL matching courses by instructor name
      const matchingCourses = courses.filter(course => 
        course.instructor && course.instructor.toLowerCase() === s.name.toLowerCase()
      )

      // Find ALL matching cohorts by instructor name
      const matchingCohorts = cohorts.filter(cohort => 
        cohort.instructor && cohort.instructor.toLowerCase() === s.name.toLowerCase()
      )

      // Deduplicate course names (case-insensitive, trimmed)
      const uniqueCourseNames = Array.from(
        new Map(
          matchingCourses
            .map(c => (c.name || '').trim())
            .filter(Boolean)
            .map(n => [n.toLowerCase(), n] as const)
        ).values()
      )

      // Join multiple courses with commas
      const courseNames = uniqueCourseNames.join(', ')

      // Deduplicate cohort names
      const uniqueCohortNames = Array.from(
        new Map(
          matchingCohorts
            .map(c => (c.name || '').trim())
            .filter(Boolean)
            .map(n => [n.toLowerCase(), n] as const)
        ).values()
      )
      const cohortNames = uniqueCohortNames.join(', ')

      return {
        instructorId: s.id,
        name: s.name,
        role: s.role,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        yearsOfExperience: s.experience,
        // Pass through newly persisted fields so edit forms can use them
        contractType: (s as any).contractType,
        jobLevel: (s as any).jobLevel,
        // Dates for export/display
        dateOfBirth: (s as any).dateOfBirth,
        joiningDate: (s as any).joiningDate,
        courseAssigned: courseNames || undefined,
        cohortName: cohortNames || undefined,
        cohortNames: uniqueCohortNames,
      }
    })
    setInstructors(mapped)
  }, [storeInstructors, courses, cohorts])

  // Note: Removed cross-collection sync listener to prevent instructor data bleeding into non-instructor view.

  const [profileData, setProfileData] = useState<ProfileData>(initialProfile)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  // Track selected rows for export in list view
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draftProfile, setDraftProfile] = useState<ProfileData>(initialProfile)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTab, setEditTab] = useState("basic")
  const [showProfessionalModal, setShowProfessionalModal] = useState(false)
  const [showEmploymentModal, setShowEmploymentModal] = useState(false)
  const [employmentDraft, setEmploymentDraft] = useState(initialProfile.employmentHistory)
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg?height=96&width=96")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New: Edit via shared AddInstructorDialog in edit mode (prefill from store form)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editInstructorId, setEditInstructorId] = useState<string | null>(null)
  const [editDraftData, setEditDraftData] = useState<InstructorFormData | null>(null)

  // Details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedInstructorDetails, setSelectedInstructorDetails] = useState<{ instructor: Instructor; storeForm: InstructorFormData | null } | null>(null)

  // Handle details view click
  const handleViewDetails = (instructor: Instructor) => {
    // Try to get fuller data from store
    const storeInstructor = storeInstructors.find(s => s.id === instructor.instructorId)
    const storeForm = storeInstructor ? getFormById(instructor.instructorId) : null
    
    // Pass the form data as well for comprehensive details
    setSelectedInstructorDetails({ instructor, storeForm: storeForm || null })
    setDetailsDialogOpen(true)
  }

  // Local backfill: map a normalized instructor (store type) to an edit form
  const backfillFormFromInstructor = (inst: StoreInstructor): InstructorFormData => {
    const [firstName = "", ...rest] = (inst.name || "").split(" ")
    const lastName = rest.pop() || ""
    const middleName = rest.join(" ")
    return {
      avatar: "",
      firstName,
      middleName,
      lastName,
      role: inst.role || "",
      roleOther: "",
      email: inst.email || "",
      phone: inst.phone || "",
      maritalStatus: "",
      bloodGroup: "",
      dob: inst.dateOfBirth || "",
      temporaryPassword: "",
      permissionsLevel: "",
      joiningDate: inst.joiningDate || "",
      contractType: (inst as any).contractType || "",
      contractTypeOther: "",
      jobLevel: (inst as any).jobLevel || "",
      jobLevelOther: "",
      gender: (inst.gender as any) || "",
      genderOther: "",
      address: "",
      country: (inst as any).country || "",
      state: (inst as any).state || "",
      yearsOfExperience: String(inst.experience ?? 0),
      paymentInfo: {
        classCount: "",
        frequency: "",
        hourlyRate: "",
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        ifsc: "",
        branchAddress: "",
        paymentType: "",
        rate: "",
        overtimeRate: "",
        deductions: "",
        taxId: "",
        paymentMethod: "",
        payrollEmail: "",
        payrollPhone: "",
        idProof: null,
        rateType: "hourly",
      },
      upcomingClasses: [{ title: "", date: "", time: "", location: "" }],
      branches: [""],
      shifts: { primary: [{ start: "", end: "" }], secondary: [{ start: "", end: "" }] },
      employmentHistory: [{ position: "", institution: "", startDate: "", endDate: "", responsibilities: "" }],
    }
  }



  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedFilters, setSelectedFilters] = useState({
    role: [] as string[],
    gender: [] as string[],
    experience: [0, 50] as [number, number],
    courseAssigned: [] as string[],
  })

  // Use custom hooks
  const filteredInstructors = useInstructorFiltering({
    instructors,
    searchTerm,
    selectedFilters,
    sortBy,
    sortOrder,
  })

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    instructorToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleExport,
    handleImport,
  } = useInstructorActions({ instructors, setInstructors })

  // Extended form state for comprehensive editing
  const [editForm, setEditForm] = useState<EditFormData>({
    // Basic Info
    avatar: "",
    firstName: "",
    middleName: "",
    lastName: "",
    role: "",
    roleOther: "",
    email: "",
    // Split phone into dialing code + local number (backward compatible)
    phoneCountryCode: "",
    phone: "",
    maritalStatus: "",
    bloodGroup: "",
    dob: "",
    // Employment Tab Fields
    temporaryPassword: "",
    permissionsLevel: "",
    joiningDate: "",
    contractType: "",
    contractTypeOther: "",
  jobLevel: "",
  jobLevelOther: "",
    gender: "",
    genderOther: "",
    address: "",
    country: "",
    state: "",
    // Branch Assignment
    branch: "",
    department: "",
    reportingManager: "",
    yearsOfExperience: "",
    certifications: [""],
    specializations: [""],
    awards: [""],
    careerGoals: "",
    paymentInfo: {
      classCount: "",
      frequency: "",
      hourlyRate: "",
      // Bank Details
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      ifsc: "",
      branchAddress: "",
      // Payment Structure
      paymentType: "",
      rate: "",
      overtimeRate: "",
      deductions: "",
      // Tax & Compliance
      taxId: "",
      // Other Payment Preference
      paymentMethod: "",
      // Payroll Contact
      payrollEmail: "",
      payrollPhone: "",
      // Supporting Documents
      idProof: null,
      // Added for UI
      rateType: "hourly",
      // UPI / Online Payments
      upiProvider: "",
      upiId: "",
    },
    // Availability
    upcomingClasses: [{ title: "", date: "", time: "", location: "" }],
    branches: [""],
    shifts: {
      primary: [{ start: "", end: "" }],
      secondary: [{ start: "", end: "" }],
    },
    // Employment
    employmentHistory: [{ position: "", institution: "", startDate: "", endDate: "", responsibilities: "" }],
  })

  // Add original form state to track the initial values
  const [originalEditForm, setOriginalEditForm] = useState<EditFormData>(editForm)

  // Edit handlers
  function handleEditAll() {
    // Populate editForm with current profile data
    const nameParts = profileData.name?.split(' ') || ['', '', '']
    // Extract dialing code from combined phone if present
    let phoneCountryCode = ""
    let localPhone = profileData.phone || ""
    if (localPhone) {
      const match = localPhone.match(/^(\+\d{1,4})\s*(.*)$/)
      if (match) {
        phoneCountryCode = match[1]
        localPhone = match[2]
      }
    }
    const formData = {
      avatar: avatarUrl,
      firstName: nameParts[1] || '',
      middleName: nameParts.length > 3 ? nameParts[2] : '',
      lastName: nameParts[nameParts.length - 1] || '',
      role: profileData.role || '',
      roleOther: '',
      email: profileData.email || '',
      phoneCountryCode,
      phone: localPhone,
      nationality: '',
      maritalStatus: '',
      bloodGroup: '',
      dob: '',
      temporaryPassword: '',
      permissionsLevel: '',
      joiningDate: profileData.joinDate || '',
  contractType: (storeInstructors.find(s => s.id === profileData.instructorId) as any)?.contractType || '',
  contractTypeOther: '',
  jobLevel: (storeInstructors.find(s => s.id === profileData.instructorId) as any)?.jobLevel || '',
  jobLevelOther: '',
      gender: profileData.gender || '',
      genderOther: '',
      address: profileData.address || '',
      country: '',
      state: '',
      branch: '',
      department: '',
      reportingManager: '',
      yearsOfExperience: profileData.yearsOfExperience?.toString() || '',
      certifications: profileData.certifications || [''],
      specializations: profileData.specializations || [''],
      awards: profileData.awards || [''],
      careerGoals: profileData.careerGoals || '',
      paymentInfo: {
        classCount: profileData.paymentInfo?.classCount?.toString() || '',
        frequency: profileData.paymentInfo?.frequency || '',
        hourlyRate: profileData.paymentInfo?.hourlyRate?.toString() || '',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        branchAddress: '',
        paymentType: '',
        rate: '',
        overtimeRate: '',
        deductions: '',
        taxId: '',
        paymentMethod: '',
        payrollEmail: '',
        payrollPhone: '',
        idProof: null,
        rateType: 'hourly',
        upiProvider: profileData.paymentInfo?.upiProvider || '',
        upiId: profileData.paymentInfo?.upiId || '',
      },
      upcomingClasses: profileData.availability?.upcomingClasses || [{ title: '', date: '', time: '', location: '' }],
      branches: profileData.availability?.branches || [''],
      shifts: {
        primary: [{ start: '', end: '' }],
        secondary: [{ start: '', end: '' }],
      },
      employmentHistory: profileData.employmentHistory?.map(emp => ({
        position: emp.position || '',
        institution: emp.institution || '',
        startDate: emp.startDate || '',
        endDate: emp.endDate || '',
        responsibilities: emp.responsibilities || '',
      })) || [{ position: '', institution: '', startDate: '', endDate: '', responsibilities: '' }],
    }
    setEditForm(formData)
    setOriginalEditForm(formData) // Set original form to current form data
    setDraftProfile(profileData)
    setEditTab("basic")
    setEditModalOpen(true)
  }

  // Handler for table Edit click � open standard Add dialog in edit mode with prefilled data
  function handleEditClick(row: Instructor) {
    const id = row.instructorId
    setEditInstructorId(id)
    // Try to fetch the original form captured at add time
    const formFromStore = getFormById(id)
    if (formFromStore) {
      setEditDraftData(formFromStore)
    } else {
      // Fallback: map current normalized instructor to a form
      const backing = storeInstructors.find((s) => s.id === id)
      if (backing) setEditDraftData(backfillFormFromInstructor(backing))
      else {
        // Last resort from row data
        const minimal: StoreInstructor = {
          id,
          name: row.name,
          role: row.role,
          gender: (row.gender as any) || 'Other',
          experience: row.yearsOfExperience || 0,
        }
        setEditDraftData(backfillFormFromInstructor(minimal))
      }
    }
    setEditDialogOpen(true)
  }

  function handleEditProfessional() {
    setDraftProfile(profileData)
    setEditTab("professional")
    setEditModalOpen(true)
  }

  function handleEditAvailability() {
    setDraftProfile(profileData)
    setEditTab("availability")
    setEditModalOpen(true)
  }

  function handleEditEmployment() {
    setDraftProfile(profileData)
    setEditTab("employment")
    setEditModalOpen(true)
  }

  function handleSave() {
    // Convert editForm back to ProfileData format
    const combinedPhone = editForm.phoneCountryCode ? `${editForm.phoneCountryCode} ${editForm.phone}`.trim() : editForm.phone
    const updatedProfile: ProfileData = {
      ...profileData,
      name: `${editForm.firstName} ${editForm.middleName} ${editForm.lastName}`.replace(/\s+/g, ' ').trim(),
      role: editForm.role,
      email: editForm.email,
      phone: combinedPhone,
      gender: editForm.gender,
      address: editForm.address,
      joinDate: editForm.joiningDate,
      yearsOfExperience: parseInt(editForm.yearsOfExperience) || 0,
      certifications: editForm.certifications.filter(cert => cert.trim() !== ''),
      specializations: editForm.specializations.filter(spec => spec.trim() !== ''),
      awards: editForm.awards.filter(award => award.trim() !== ''),
      careerGoals: editForm.careerGoals,
      paymentInfo: {
        classCount: parseInt(editForm.paymentInfo.classCount) || 0,
        frequency: editForm.paymentInfo.frequency,
        hourlyRate: parseInt(editForm.paymentInfo.hourlyRate) || 0,
      },
      availability: {
        ...profileData.availability,
        branches: editForm.branches.filter(branch => branch.trim() !== ''),
      },
      employmentHistory: editForm.employmentHistory
        .filter(emp => emp.position.trim() !== '' || emp.institution.trim() !== '')
        .map(emp => ({
          ...emp,
          duration: `${emp.startDate} - ${emp.endDate}` // Add the missing duration field
        })),
    }
    setProfileData(updatedProfile)
    setEditModalOpen(false)
    // Persist to backend using the shared store updater so fields like UPI are saved server-side as well
    Promise.resolve(updateInstructor(profileData.instructorId, editForm as any)).then(() => {
      toast({ title: "Instructor updated", description: `Changes saved for ${updatedProfile.name}` })
    }).catch((e) => {
      console.error('Failed to persist instructor update from comprehensive modal', e)
      toast({ title: "Save failed", description: e?.message || 'Unable to save changes to server.', variant: 'destructive' })
    })
  }

  function handleCancelEdit() {
    setEditModalOpen(false)
    setDraftProfile(profileData)
  }




  return (
    <div className="space-y-6">
      {/* Profile Table/List View with Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-6 pb-3">
          <h2 className="text-xl font-semibold text-[#5E35B1]">List of Non-Instructors</h2>
        </div>

        {/* Search and Filter Bar */}
        <SearchAndFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          instructors={instructors}
          filteredInstructors={filteredInstructors}
          onExport={() => handleExport(filteredInstructors, selectedIds)}
          onImport={handleImport}
          selectedCount={selectedIds.length}
          onOpenDrafts={onOpenDrafts}
          draftsCount={draftsCount}
          onOpenAddDialog={onOpenAddDialog}
        />

        {/* Instructor List View */}
        {instructorsLoading ? (
          <InstructorListSkeleton viewMode={viewMode} count={6} />
        ) : (
          <InstructorListView
            viewMode={viewMode}
            instructors={filteredInstructors}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onViewDetails={handleViewDetails}
            selectedIds={selectedIds}
            onToggleOne={(id, checked) =>
              setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
            }
            onToggleAll={(ids, checked) => {
              setSelectedIds(prev => {
                const idSet = new Set(prev)
                if (checked) {
                  ids.forEach(id => idSet.add(id))
                } else {
                  ids.forEach(id => idSet.delete(id))
                }
                return Array.from(idSet)
              })
            }}
          />
        )}
      </div>

      {/* Performance Card always visible */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">Performance</h2>
        <PerformanceCard isEditing={false} onPrimaryAction={() => {}} />
      </div>

      {/* Comprehensive Edit Modal */}
      {editModalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <ComprehensiveEditModal
            isOpen={editModalOpen}
            onClose={handleCancelEdit}
            profileData={profileData}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={handleSave}
            activeTab={editTab}
            setActiveTab={setEditTab}
            originalForm={originalEditForm}
          />
        </Suspense>
      )}

      {/* Standardized Edit Dialog reusing Add flow */}
      <AddInstructorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        draftData={editDraftData || undefined}
        mode="edit"
  title="Edit Non-Instructor"
        saveLabel="Save Changes"
        currentId={editInstructorId || undefined}
        onSave={(form) => {
          if (!editInstructorId) return
          Promise.resolve(updateInstructor(editInstructorId, form)).then(updated => {
            toast({ title: "Instructor updated", description: `Changes saved for ${updated.name}` })
          })
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        instructor={instructorToDelete}
        onConfirm={() => {
          const id = instructorToDelete?.instructorId
          // Update local table UI
          handleDeleteConfirm()
          // Persist delete to shared store so it survives refresh
          if (id) {
            Promise.resolve(deleteFromStore(id)).then(() => {
              toast({ title: "Instructor deleted", description: `Instructor ${id} was deleted.` })
            }).catch((e) => {
              toast({ title: "Deletion failed", description: e?.message || 'Unable to delete instructor.', variant: 'destructive' })
            })
          }
        }}
        onCancel={handleDeleteCancel}
      />

      {/* Instructor Details Dialog */}
      <InstructorDetailsDialog
        instructorData={selectedInstructorDetails}
        isOpen={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          setSelectedInstructorDetails(null)
        }}
      />

    </div>
  )
}
