import { useCallback, useEffect, useMemo, useState } from "react"
import type { Instructor } from "@/types/dashboard/staff/instructor"
import type { InstructorFormData } from "@/components/dashboard/instructor/add-instructor-dialog-refactored/types"
import { apiPut, apiDelete, apiGet } from "@/lib/dashboard/staff/api"

export interface StoredInstructor {
  id: string
  instructor: Instructor
  form: InstructorFormData
}

// Module-level pending creation guard to ensure only one insert per computed id
let __pendingCreateId: string | null = null

// Compute next sequential ID based on existing items: INSTR + zero-padded number
const computeNextInstructorId = (existing: StoredInstructor[]): string => {
  const all: number[] = []
  let observedWidth = 4
  for (const it of existing) {
    const m = /INSTR(\d+)/i.exec(it.id)
    if (!m) continue
    const num = parseInt(m[1], 10)
    if (!Number.isNaN(num)) {
      all.push(num)
      if (m[1].length > observedWidth) observedWidth = m[1].length
    }
  }
  const base = all.length ? Math.max(...all) : 0
  const width = Math.max(4, observedWidth)
  const next = base + 1
  return `INSTR${String(next).padStart(width, '0')}`
}

// Best-effort: map form to Instructor (table-visible fields + some extras)
export const mapFormToInstructor = (form: InstructorFormData, id?: string): Instructor => {
  const name = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ") || "Unnamed"
  const yearsOfExperience = parseInt(form.yearsOfExperience || "0", 10) || 0
  // Normalize: when user selects "Other" in Add Instructor dialog, persist as lowercase "other" and ignore auxiliary field
  const selectedGender = (form.gender as any) || "Other"
  const gender = selectedGender === "Other" ? ("other" as any) : (selectedGender as any)

  const fullPhone = form.phoneCountryCode ? `${form.phoneCountryCode} ${form.phone}`.trim() : form.phone
  return {
    id: id || "",
    name,
    role: form.role || "Instructor",
    gender: (gender as any),
    experience: yearsOfExperience,
    email: form.email || undefined,
    phone: fullPhone || undefined,
    // @ts-ignore
    phoneCountryCode: form.phoneCountryCode || undefined,
    // @ts-ignore
    phoneLocal: form.phone || undefined,
    joiningDate: form.joiningDate || undefined,
    contractType: form.contractType || undefined,
    jobLevel: form.jobLevel || undefined,
    dateOfBirth: form.dob || undefined,
    country: form.country || undefined,
    state: form.state || undefined,
    status: "Active",
  }
}

// Fallback: map Instructor to a minimal form
export const mapInstructorToForm = (inst: Instructor): InstructorFormData => {
  const [firstName = "", ...rest] = inst.name?.split(" ") || []
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
    phone: (() => {
      if ((inst as any).phoneLocal) return (inst as any).phoneLocal as string
      if (!inst.phone) return ""
      const m = /^(\+\d{1,4})\s*(.*)$/.exec(inst.phone)
      if (m) return m[2]
      return inst.phone
    })(),
    phoneCountryCode: (() => {
      if ((inst as any).phoneCountryCode) return (inst as any).phoneCountryCode as string
      return (/(^\+\d{1,4})/.exec(inst.phone || '')?.[1]) || ''
    })(),
    maritalStatus: (inst as any).maritalStatus || "",
    bloodGroup: (inst as any).bloodGroup || "",
    dob: inst.dateOfBirth || "",
    temporaryPassword: "",
    permissionsLevel: (inst as any).permissionsLevel || "",
    joiningDate: inst.joiningDate || "",
    contractType: inst.contractType || "",
    contractTypeOther: "",
    jobLevel: inst.jobLevel || "",
    jobLevelOther: "",
    gender: (inst.gender as any) || "",
    genderOther: "",
    address: (inst as any).address || "",
    pincode: (inst as any).pincode || "",
    country: (inst as any).country || "IN",
    state: (inst as any).state || "",
    branch: (inst as any).branch || "",
    department: (inst as any).department || "",
    reportingManager: (inst as any).reportingManager || "",
    yearsOfExperience: String(inst.experience ?? 0),
    certifications: (inst as any).certifications || [""],
    specializations: (inst as any).specializations || [""],
    awards: (inst as any).awards || [""],
    careerGoals: (inst as any).careerGoals || "",
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
      upiProvider: "",
      upiId: "",
    },
    upcomingClasses: (inst as any).upcomingClasses || [{ title: "", date: "", time: "", location: "" }],
    branches: (inst as any).branches || [""],
    shifts: (inst as any).shifts || { primary: [{ start: "", end: "" }], secondary: [{ start: "", end: "" }] },
    employmentHistory: (inst as any).employmentHistory || [{ position: "", institution: "", startDate: "", endDate: "", responsibilities: "" }],
  }
}

// Helper: merge server doc paymentInfo (including UPI fields) into a form built from Instructor
const applyServerPaymentInfoToForm = (form: InstructorFormData, doc: any): InstructorFormData => {
  const pi = doc?.paymentInfo || {}
  if (!pi || typeof pi !== 'object') return form
  return {
    ...form,
    paymentInfo: {
      ...form.paymentInfo,
      classCount: (pi.classCount ?? form.paymentInfo.classCount) || "",
      frequency: (pi.frequency ?? form.paymentInfo.frequency) || "",
      hourlyRate: (pi.hourlyRate ?? form.paymentInfo.hourlyRate) || "",
      bankName: (pi.bankName ?? form.paymentInfo.bankName) || "",
      accountHolder: (pi.accountHolder ?? form.paymentInfo.accountHolder) || "",
      accountNumber: (pi.accountNumber ?? form.paymentInfo.accountNumber) || "",
      ifsc: (pi.ifsc ?? form.paymentInfo.ifsc) || "",
      branchAddress: (pi.branchAddress ?? form.paymentInfo.branchAddress) || "",
      paymentType: (pi.paymentType ?? form.paymentInfo.paymentType) || "",
      rate: (pi.rate ?? form.paymentInfo.rate) || "",
      overtimeRate: (pi.overtimeRate ?? form.paymentInfo.overtimeRate) || "",
      deductions: (pi.deductions ?? form.paymentInfo.deductions) || "",
      taxId: (pi.taxId ?? form.paymentInfo.taxId) || "",
      paymentMethod: (pi.paymentMethod ?? form.paymentInfo.paymentMethod) || "",
      payrollEmail: (pi.payrollEmail ?? form.paymentInfo.payrollEmail) || "",
      payrollPhone: (pi.payrollPhone ?? form.paymentInfo.payrollPhone) || "",
      rateType: (pi.rateType ?? form.paymentInfo.rateType) || form.paymentInfo.rateType,
      upiProvider: (pi.upiProvider ?? form.paymentInfo.upiProvider) || "",
      upiId: (pi.upiId ?? form.paymentInfo.upiId) || "",
      idProof: form.paymentInfo.idProof,
    },
  }
}

// In-memory same-tab snapshot + event bus
const loadFromMemory = (): StoredInstructor[] => {
  try {
    if (typeof window !== 'undefined') {
      const snap = (window as any).__instructorsSnapshot as StoredInstructor[] | undefined
      if (snap && Array.isArray(snap)) return snap
    }
  } catch {}
  return []
}
const saveToMemory = (items: StoredInstructor[]) => {
  try {
    if (typeof window !== 'undefined') {
      ;(window as any).__instructorsSnapshot = items
      const payload = { items }
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('instructors-sync', { detail: payload })) } catch {}
      }, 0)
    }
  } catch {}
}

export const purgeInstructorCache = () => {
  try { if (typeof window !== 'undefined') (window as any).__instructorsSnapshot = [] } catch {}
}

export const useInstructors = () => {
  const [items, setItems] = useState<StoredInstructor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Shared refs to avoid duplicate adds
  const addingRef = (typeof window !== 'undefined' ? (window as any).__instructorsAddingRef : undefined) || { current: false }
  const lastCreatedRef = (typeof window !== 'undefined' ? (window as any).__instructorsLastCreatedRef : undefined) || { current: null as Instructor | null }
  const lastAddKeyRef = (typeof window !== 'undefined' ? (window as any).__instructorsLastAddKeyRef : undefined) || { current: '' as string }
  const lastAddAtRef = (typeof window !== 'undefined' ? (window as any).__instructorsLastAddAtRef : undefined) || { current: 0 as number }
  if (typeof window !== 'undefined') {
    ;(window as any).__instructorsAddingRef = addingRef
    ;(window as any).__instructorsLastCreatedRef = lastCreatedRef
    ;(window as any).__instructorsLastAddKeyRef = lastAddKeyRef
    ;(window as any).__instructorsLastAddAtRef = lastAddAtRef
  }

  const hashForm = (form: InstructorFormData) => {
    try { return JSON.stringify(form) } catch { return String(Math.random()) }
  }

  // Initial load
  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      setError(null)
      // Seed from memory snapshot for instant UI (same tab only)
      const cached = loadFromMemory()
      if (!cancelled && cached.length > 0) setItems(cached)
      try {
        const response: { ok: boolean; data: any[] } = await apiGet<{ ok: boolean; data: any[] }>("/api/dashboard/staff/instructor/instructors")
        if (cancelled) return
  const serverItems = response.data || []
  // Filter out soft-deleted: status === 'Inactive' (and legacy deleted_data === false)
  const visible = serverItems.filter(doc => (doc.status ?? 'Active') !== 'Inactive' && doc.deleted_data !== false)
        const mapped: StoredInstructor[] = visible.map(doc => {
          const nameParts = [doc.firstName, doc.middleName, doc.lastName].filter(Boolean)
          const name = nameParts.join(" ") || doc.externalId || doc._id || "Unnamed"
          const inst: Instructor = {
            id: doc.externalId || doc._id,
            name,
            role: doc.role || "Instructor",
            gender: (doc.gender as any) || "Other",
            experience: parseInt(doc.yearsOfExperience || "0", 10) || 0,
            email: doc.email,
            phone: doc.phone,
            joiningDate: doc.joiningDate,
            contractType: doc.contractType,
            jobLevel: doc.jobLevel,
            courseAssigned: (doc as any).courseAssigned,
            cohortName: (doc as any).cohortName,
            courseIds: (doc as any).courseIds,
            cohortIds: (doc as any).cohortIds,
            // Backfill persisted personal/location fields so form can prefill
            dateOfBirth: doc.dob,
            country: doc.country,
            state: doc.state,
            status: (doc.status as any) || "Active",
          }
          // Build form directly from server document to preserve all fields
          const form: InstructorFormData = {
            avatar: doc.avatar || "",
            firstName: doc.firstName || "",
            middleName: doc.middleName || "",
            lastName: doc.lastName || "",
            role: doc.role || "",
            roleOther: doc.roleOther || "",
            email: doc.email || "",
            phone: doc.phoneLocal || doc.phone || "",
            phoneCountryCode: doc.phoneCountryCode || "+91",
            maritalStatus: doc.maritalStatus || "",
            bloodGroup: doc.bloodGroup || "",
            dob: doc.dob || "",
            temporaryPassword: "",
            permissionsLevel: doc.permissionsLevel || "",
            joiningDate: doc.joiningDate || "",
            contractType: doc.contractType || "",
            contractTypeOther: doc.contractTypeOther || "",
            jobLevel: doc.jobLevel || "",
            jobLevelOther: doc.jobLevelOther || "",
            gender: doc.gender || "",
            genderOther: doc.genderOther || "",
            address: doc.address || "",
            pincode: doc.pincode || "",
            country: doc.country || "IN",
            state: doc.state || "",
            branch: doc.branch || "",
            department: doc.department || "",
            reportingManager: doc.reportingManager || "",
            yearsOfExperience: String(doc.yearsOfExperience ?? 0),
            certifications: doc.certifications || [""],
            specializations: doc.specializations || [""],
            awards: doc.awards || [""],
            careerGoals: doc.careerGoals || "",
            paymentInfo: {
              classCount: doc.paymentInfo?.classCount || "",
              frequency: doc.paymentInfo?.frequency || "",
              hourlyRate: doc.paymentInfo?.hourlyRate || "",
              bankName: doc.paymentInfo?.bankName || "",
              accountHolder: doc.paymentInfo?.accountHolder || "",
              accountNumber: doc.paymentInfo?.accountNumber || "",
              ifsc: doc.paymentInfo?.ifsc || "",
              branchAddress: doc.paymentInfo?.branchAddress || "",
              paymentType: doc.paymentInfo?.paymentType || "",
              rate: doc.paymentInfo?.rate || "",
              overtimeRate: doc.paymentInfo?.overtimeRate || "",
              deductions: doc.paymentInfo?.deductions || "",
              taxId: doc.paymentInfo?.taxId || "",
              paymentMethod: doc.paymentInfo?.paymentMethod || "",
              payrollEmail: doc.paymentInfo?.payrollEmail || "",
              payrollPhone: doc.paymentInfo?.payrollPhone || "",
              idProof: null,
              rateType: doc.paymentInfo?.rateType || "hourly",
              upiProvider: doc.paymentInfo?.upiProvider || "",
              upiId: doc.paymentInfo?.upiId || "",
            },
            upcomingClasses: doc.upcomingClasses || [{ title: "", date: "", time: "", location: "" }],
            branches: doc.branches || [""],
            shifts: doc.shifts || { primary: [{ start: "", end: "" }], secondary: [{ start: "", end: "" }] },
            employmentHistory: doc.employmentHistory || [{ position: "", institution: "", startDate: "", endDate: "", responsibilities: "" }],
          }
          return { id: inst.id, instructor: inst, form }
        })
        // Merge memory optimistic entries not in server yet
        const serverIds = new Set(mapped.map(m => m.id))
        const unsynced = cached.filter(c => !serverIds.has(c.id))
        const merged = [...mapped, ...unsynced]
        setItems(merged)
        saveToMemory(merged)
      } catch (e: any) {
        if (!cancelled) {
          console.error('Failed to fetch instructors from server', e)
          setError(e.message || 'Failed to load instructors')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Listen for same-tab sync events
  useEffect(() => {
    const handleSync = (e: Event) => {
      try {
        const detail = (e as CustomEvent<{ items: StoredInstructor[] }>).detail
        if (!detail?.items) return
        const incoming = detail.items
        setItems(prev => {
          const byId = new Map<string, StoredInstructor>()
          for (const it of prev) byId.set(it.id, it)
          for (const it of incoming) byId.set(it.id, it)
          return Array.from(byId.values())
        })
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('instructors-sync', handleSync as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('instructors-sync', handleSync as EventListener)
      }
    }
  }, [])

  const instructors = useMemo(() => items.map(it => it.instructor), [items])

  const addInstructor = useCallback(async (form: InstructorFormData) => {
    // Prevent accidental rapid double submit within 1s for identical payload
    try {
      const key = JSON.stringify(form)
      const now = Date.now()
      if (lastAddKeyRef.current === key && now - lastAddAtRef.current < 1000) {
        return lastCreatedRef.current || mapFormToInstructor(form, computeNextInstructorId(items))
      }
      lastAddKeyRef.current = key
      lastAddAtRef.current = now
    } catch {}

    if (addingRef.current) {
      return lastCreatedRef.current || mapFormToInstructor(form, computeNextInstructorId(items))
    }
    addingRef.current = true

    // Compute id preferring backend last-id, then fallback to memory + current list
    const mergedForId: StoredInstructor[] = (() => {
      const snap = loadFromMemory()
      if (!snap.length) return items as StoredInstructor[]
      if (!items.length) return snap
      const byId = new Map<string, StoredInstructor>()
      for (const it of snap) byId.set(it.id, it)
      for (const it of items as StoredInstructor[]) byId.set(it.id, it)
      return Array.from(byId.values())
    })()
    let id = computeNextInstructorId(mergedForId)
    try {
      const res = await apiGet<{ ok: boolean; lastNumber: number; width: number; nextExternalId: string }>("/api/dashboard/staff/instructor/instructors/last-id")
      if (res?.ok && res.nextExternalId) {
        // If backend next is ahead of our computed one, prefer backend
        const localMatch = /INSTR(\d+)/i.exec(id)
        const serverMatch = /INSTR(\d+)/i.exec(res.nextExternalId)
        const localNum = localMatch ? parseInt(localMatch[1], 10) : 0
        const serverNum = serverMatch ? parseInt(serverMatch[1], 10) : 0
        if (serverNum > localNum) {
          id = res.nextExternalId
        }
      }
    } catch {
      // Ignore and use local computation when backend not reachable
    }
    __pendingCreateId = id

    // Optimistic insert
    const optimistic = mapFormToInstructor(form, id)
    lastCreatedRef.current = optimistic
    setItems(prev => {
      const next = [...prev, { id, instructor: optimistic, form }]
      saveToMemory(next)
      return next
    })

    // Release lock later to avoid re-entry
    setTimeout(() => {
      if (__pendingCreateId === id) __pendingCreateId = null
      addingRef.current = false
    }, 1000)

    // Persist to server and reconcile
    try {
      const composedPhone = form.phoneCountryCode ? `${form.phoneCountryCode} ${form.phone}`.trim() : form.phone
      const serverDoc: any = await apiPut(`/api/dashboard/staff/instructor/instructors/by-external/${encodeURIComponent(id)}`, { externalId: id, ...form, phone: composedPhone, phoneCountryCode: form.phoneCountryCode, phoneLocal: form.phone })
      const authoritativeId = serverDoc.externalId || id
      const nameParts = [serverDoc.firstName, serverDoc.middleName, serverDoc.lastName].filter(Boolean)
      const name = nameParts.join(" ") || authoritativeId
      const canonical: Instructor = {
        id: authoritativeId,
        name,
        role: serverDoc.role || "Instructor",
        gender: (serverDoc.gender as any) || "Other",
        experience: parseInt(serverDoc.yearsOfExperience || "0", 10) || 0,
        email: serverDoc.email,
        phone: serverDoc.phone,
        department: serverDoc.department,
        joiningDate: serverDoc.joiningDate,
        contractType: serverDoc.contractType,
        jobLevel: serverDoc.jobLevel,
        courseAssigned: (serverDoc as any).courseAssigned,
        cohortName: (serverDoc as any).cohortName,
        courseIds: (serverDoc as any).courseIds,
        cohortIds: (serverDoc as any).cohortIds,
        dateOfBirth: serverDoc.dob,
        country: serverDoc.country,
        state: serverDoc.state,
        status: (serverDoc.status as any) || "Active",
      }
      setItems(prev => {
        const next = prev.map(it => it.id === id ? { ...it, id: authoritativeId, instructor: canonical } : it)
        saveToMemory(next)
        return next
      })
      lastCreatedRef.current = canonical
      return canonical
    } catch (e) {
      console.error('Instructor create failed to persist to server', e)
      return optimistic
    }
  }, [items])

  const addManyFromInstructors = useCallback((list: Instructor[]) => {
    setItems(prev => {
      const prevById = new Map(prev.map(it => [it.id, it]))
      for (const inst of list) {
        const form = mapInstructorToForm(inst)
        prevById.set(inst.id, { id: inst.id, instructor: inst, form })
      }
      const next = Array.from(prevById.values())
      saveToMemory(next)
      return next
    })
  }, [])

  const updateInstructor = useCallback(async (id: string, form: InstructorFormData) => {
    const normalized = mapFormToInstructor(form, id)
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, instructor: normalized, form } : it)
      saveToMemory(next)
      return next
    })
    try {
      const composedPhone = form.phoneCountryCode ? `${form.phoneCountryCode} ${form.phone}`.trim() : form.phone
      const serverDoc: any = await apiPut(`/api/dashboard/staff/instructor/instructors/by-external/${encodeURIComponent(id)}`, { externalId: id, ...form, phone: composedPhone, phoneCountryCode: form.phoneCountryCode, phoneLocal: form.phone })
      const authoritativeId = serverDoc.externalId || id
      const nameParts = [serverDoc.firstName, serverDoc.middleName, serverDoc.lastName].filter(Boolean)
      const name = nameParts.join(" ") || authoritativeId
      const canonical: Instructor = {
        id: authoritativeId,
        name,
        role: serverDoc.role || "Instructor",
        gender: (serverDoc.gender as any) || "Other",
        experience: parseInt(serverDoc.yearsOfExperience || "0", 10) || 0,
        email: serverDoc.email,
        phone: serverDoc.phone,
        department: serverDoc.department,
        joiningDate: serverDoc.joiningDate,
        contractType: serverDoc.contractType,
        jobLevel: serverDoc.jobLevel,
        courseAssigned: (serverDoc as any).courseAssigned,
        cohortName: (serverDoc as any).cohortName,
        courseIds: (serverDoc as any).courseIds,
        cohortIds: (serverDoc as any).cohortIds,
        dateOfBirth: serverDoc.dob,
        country: serverDoc.country,
        state: serverDoc.state,
        status: (serverDoc.status as any) || "Active",
      }
      setItems(prev => {
        const next = prev.map(it => it.id === id ? { ...it, instructor: canonical } : it)
        saveToMemory(next)
        return next
      })
      return canonical
    } catch (e) {
      console.error('Failed to persist instructor update', e)
      return normalized
    }
  }, [])

  const deleteInstructor = useCallback(async (id: string) => {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id)
      saveToMemory(next)
      return next
    })
    try {
      await apiDelete(`/api/dashboard/staff/instructor/instructors/by-external/${encodeURIComponent(id)}`)
    } catch (e: any) {
      // Fallback: some legacy docs may not have externalId set; delete by _id instead
      try {
        await apiDelete(`/api/dashboard/staff/instructor/instructors/${encodeURIComponent(id)}`)
      } catch (e2) {
        console.error('Failed to delete instructor on server', e, e2)
      }
    }
  }, [])

  const getFormById = useCallback((id: string): InstructorFormData | undefined => {
    return items.find(it => it.id === id)?.form
  }, [items])

  return {
    instructors,
    addInstructor,
    updateInstructor,
    deleteInstructor,
    getFormById,
    addManyFromInstructors,
    loading,
    error,
    reload: async () => {
      try {
        setLoading(true)
        const response: { ok: boolean; data: any[] } = await apiGet<{ ok: boolean; data: any[] }>("/api/dashboard/staff/instructor/instructors")
  const serverItems = response.data || []
  const visible = serverItems.filter(doc => (doc.status ?? 'Active') !== 'Inactive' && doc.deleted_data !== false)
        const mapped: StoredInstructor[] = visible.map(doc => {
          const nameParts = [doc.firstName, doc.middleName, doc.lastName].filter(Boolean)
          const name = nameParts.join(" ") || doc.externalId || doc._id || "Unnamed"
          const inst: Instructor = {
            id: doc.externalId || doc._id,
            name,
            role: doc.role || "Instructor",
            gender: (doc.gender as any) || "Other",
            experience: parseInt(doc.yearsOfExperience || "0", 10) || 0,
            email: doc.email,
            phone: doc.phone,
            department: doc.department,
            joiningDate: doc.joiningDate,
            contractType: doc.contractType,
            jobLevel: doc.jobLevel,
            courseAssigned: (doc as any).courseAssigned,
            cohortName: (doc as any).cohortName,
            courseIds: (doc as any).courseIds,
            cohortIds: (doc as any).cohortIds,
            dateOfBirth: doc.dob,
            country: doc.country,
            state: doc.state,
            status: (doc.status as any) || "Active",
          }
          const baseForm = mapInstructorToForm(inst)
          const form = applyServerPaymentInfoToForm(baseForm, doc)
          return { id: inst.id, instructor: inst, form }
        })
        setItems(mapped)
        saveToMemory(mapped)
        setError(null)
      } catch (e: any) {
        console.error('Reload failed', e)
        setError(e.message || 'Reload failed')
      } finally {
        setLoading(false)
      }
    }
  }
}
