"use client"

import React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/dashboard/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import type { InstructorFormData } from "@/components/dashboard/instructor/add-instructor-dialog-refactored/types"
import { Instructor as HooksInstructor } from "@/components/dashboard/instructor/instructor-profile/hooks"
import { Mail, Phone, Calendar, Briefcase, User, Layers, Hash, ListChecks } from "lucide-react"

interface InstructorDetailsDialogProps {
  instructorData: { instructor: HooksInstructor; storeForm: InstructorFormData | null } | null
  isOpen: boolean
  onClose: () => void
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A"
  const d = new Date(dateStr)
  const day = d.toLocaleString("en-GB", { day: "2-digit" })
  const mon = d.toLocaleString("en-GB", { month: "short" })
  const yr = d.getFullYear()
  return `${day}-${mon}-${yr}`
}

function safeValue(value: any, defaultValue: string = "N/A"): string {
  if (value === null || value === undefined || value === "") return defaultValue
  return String(value)
}

function normalizeContractType(raw?: string) {
  if (!raw) return "N/A"
  const v = raw.toLowerCase()
  if (v.includes("full")) return "Full-time"
  if (v.includes("part")) return "Part-time"
  if (v.includes("guest")) return "Guest Faculty"
  if (v.includes("temp")) return "Temporary"
  if (v.includes("contract")) return "Contract"
  return raw
}

export default function InstructorDetailsDialog({ 
  instructorData, 
  isOpen, 
  onClose 
}: InstructorDetailsDialogProps) {
  if (!instructorData) return null

  const { instructor, storeForm } = instructorData
  const allCohorts = (instructor.cohortNames && instructor.cohortNames.length)
    ? instructor.cohortNames
    : (instructor.cohortName ? instructor.cohortName.split(',').map(s => s.trim()).filter(Boolean) : [])

  // Build a clean, minimal name from mandatory fields (fallback to existing aggregated name)
  const firstName = safeValue(storeForm?.firstName, "")
  const middleName = safeValue(storeForm?.middleName, "")
  const lastName = safeValue(storeForm?.lastName, "")
  const composedName = [firstName, middleName, lastName].filter(Boolean).join(" ") || safeValue(instructor.name)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
        {/* Hidden dialog title for accessibility (required by Radix) */}
        <VisuallyHidden>
          <DialogTitle>Instructor Details</DialogTitle>
        </VisuallyHidden>
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#9b5cf6] to-[#DE7D14] p-8 text-white">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">{composedName}</h2>
            <div className="flex flex-wrap items-center gap-2 text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
                <User className="h-4 w-4" /> {safeValue(storeForm?.role || instructor.role)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
                <Hash className="h-4 w-4" /> ID: {safeValue(instructor.instructorId)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-white to-white/80">
          {/* Cards: glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile essentials */}
            <section className="rounded-xl border border-indigo-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 py-3 border-b text-sm font-semibold text-indigo-700/90">Profile</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-indigo-500" />
                  <div className="min-w-[120px] text-gray-500">Instructor ID</div>
                  <div className="font-medium text-gray-900">{safeValue(instructor.instructorId)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-indigo-500" />
                  <div className="min-w-[120px] text-gray-500">First Name</div>
                  <div className="font-medium text-gray-900">{safeValue(storeForm?.firstName)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-indigo-500" />
                  <div className="min-w-[120px] text-gray-500">Last Name</div>
                  <div className="font-medium text-gray-900">{safeValue(storeForm?.lastName)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  <div className="min-w-[120px] text-gray-500">Role</div>
                  <div className="font-medium text-gray-900">{safeValue(storeForm?.role || instructor.role)}</div>
                </div>
              </div>
            </section>

            {/* Assignments: Courses & Cohorts */}
            <section className="rounded-xl border border-fuchsia-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 py-3 border-b text-sm font-semibold text-fuchsia-700/90">Assignments</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-4 w-4 text-fuchsia-500" />
                  <div className="min-w-[120px] text-gray-500">Course(s)</div>
                  <div className="font-medium text-gray-900 break-words">{safeValue(instructor.courseAssigned)}</div>
                </div>
                <div className="flex items-start gap-3">
                  <ListChecks className="h-4 w-4 text-fuchsia-500" />
                  <div className="min-w-[120px] text-gray-500">Cohort(s)</div>
                  <div className="font-medium text-gray-900 flex flex-wrap gap-1">
                    {allCohorts.length === 0 ? (
                      <span>N/A</span>
                    ) : (
                      allCohorts.map((c, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs">{c}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
            {/* Contact */}
            <section className="rounded-xl border border-purple-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 py-3 border-b text-sm font-semibold text-purple-700/90">Contact</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-purple-500" />
                  <div className="min-w-[90px] text-gray-500">Email</div>
                  <div className="font-medium text-gray-900 truncate">{safeValue(storeForm?.email || instructor.email)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-purple-500" />
                  <div className="min-w-[90px] text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900">
                    {storeForm?.phoneCountryCode && storeForm?.phone ? `${storeForm.phoneCountryCode} ${storeForm.phone}` : safeValue(instructor.phone)}
                  </div>
                </div>
              </div>
            </section>

            {/* Employment */}
            <section className="rounded-xl border border-orange-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 py-3 border-b text-sm font-semibold text-orange-700/90">Employment</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <div className="min-w-[120px] text-gray-500">Joining Date</div>
                  <div className="font-medium text-gray-900">{formatDate(storeForm?.joiningDate)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-orange-500" />
                  <div className="min-w-[120px] text-gray-500">Experience</div>
                  <div className="font-medium text-gray-900">{safeValue(storeForm?.yearsOfExperience)} years</div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-orange-500" />
                  <div className="min-w-[120px] text-gray-500">Contract Type</div>
                  <div className="font-medium text-gray-900">{normalizeContractType(storeForm?.contractType)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-orange-500" />
                  <div className="min-w-[120px] text-gray-500">Job Level</div>
                  <div className="font-medium text-gray-900">{safeValue(storeForm?.jobLevel)}</div>
                </div>
              </div>
            </section>

            {/* Personal */}
            <section className="rounded-xl border border-teal-100/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 py-3 border-b text-sm font-semibold text-teal-700/90">Personal</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-teal-500" />
                  <div className="min-w-[90px] text-gray-500">Gender</div>
                  <div className="font-medium text-gray-900">
                    {storeForm?.gender === "Other" && storeForm?.genderOther ? storeForm.genderOther : safeValue(storeForm?.gender || instructor.gender)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  <div className="min-w-[90px] text-gray-500">Date of Birth</div>
                  <div className="font-medium text-gray-900">{formatDate(storeForm?.dob)}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
