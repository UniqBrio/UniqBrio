import { useCallback, useEffect, useMemo, useState } from "react"
import type { Instructor } from "@/types/dashboard/staff/instructor"
import type { InstructorFormData } from "@/components/dashboard/instructor/add-instructor-dialog-refactored/types"
import { apiPut, apiDelete, apiGet } from "@/lib/dashboard/staff/api"

export interface StoredNonInstructor {
  id: string
  instructor: Instructor
  form: InstructorFormData
}

let __pendingCreateId: string | null = null

const computeNextExternalId = (existing: StoredNonInstructor[]): string => {
  const all: number[] = []
  let observedWidth = 4
  for (const it of existing) {
    const m = /NON\s?INS(\d+)/i.exec(it.id)
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
  return `NON INS${String(next).padStart(width, '0')}`
}

export const mapFormToNonInstructor = (form: InstructorFormData, id?: string): Instructor => {
  const name = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ") || "Unnamed"
  const yearsOfExperience = parseInt(form.yearsOfExperience || "0", 10) || 0
  // If user selects "Other" in the Add Non-Instructor dialog, store as lowercase "other" and ignore any auxiliary field
  const selectedGender = (form.gender as any) || "Other"
  const gender = selectedGender === "Other" ? ("other" as any) : (selectedGender as any)
  const fullPhone = form.phoneCountryCode ? `${form.phoneCountryCode} ${form.phone}`.trim() : form.phone
  return {
    id: id || "",
    name,
    role: form.role || "Non-Instructor",
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

// Helper: merge server doc paymentInfo (including UPI fields) into a form
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

export const useNonInstructors = () => {
  const [items, setItems] = useState<StoredNonInstructor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Ensure unique items by id (last write wins)
  const dedupe = (arr: StoredNonInstructor[]): StoredNonInstructor[] => {
    const byId = new Map<string, StoredNonInstructor>()
    for (const it of arr) {
      if (!it?.id) continue
      byId.set(it.id, it)
    }
    return Array.from(byId.values())
  }

  // Broadcast helper to allow same-tab listeners specific to non-instructors
  const broadcast = (nextItems: StoredNonInstructor[]) => {
    try {
      if (typeof window !== 'undefined') {
        const clean = dedupe(nextItems)
        ;(window as any).__nonInstructorsSnapshot = clean
        const payload = { items: clean }
        window.dispatchEvent(new CustomEvent('non-instructors-sync', { detail: payload }))
      }
    } catch {}
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      setError(null)
      try {
        const response: { ok: boolean; data: any[] } = await apiGet<{ ok: boolean; data: any[] }>("/api/dashboard/staff/non-instructor/non-instructors")
        if (cancelled) return
        const serverItems = response.data || []
        const visible = serverItems.filter(doc => (doc.status ?? 'Active') !== 'Inactive' && doc.deleted_data !== false)
  const mapped: StoredNonInstructor[] = visible.map(doc => {
          const nameParts = [doc.firstName, doc.middleName, doc.lastName].filter(Boolean)
          const name = nameParts.join(" ") || doc.externalId || doc._id || "Unnamed"
          const inst: Instructor = {
            id: doc.externalId || doc._id,
            name,
            role: doc.role || "Non-Instructor",
            gender: (doc.gender as any) || "Other",
            experience: parseInt(doc.yearsOfExperience || "0", 10) || 0,
            email: doc.email,
            phone: doc.phone,
            department: doc.department,
            joiningDate: doc.joiningDate,
            contractType: doc.contractType,
            jobLevel: doc.jobLevel,
            dateOfBirth: doc.dob,
            country: doc.country,
            state: doc.state,
            status: (doc.status as any) || "Active",
          }
          const baseForm: InstructorFormData = {
            avatar: "",
            firstName: doc.firstName || "",
            middleName: doc.middleName || "",
            lastName: doc.lastName || "",
            role: inst.role,
            roleOther: "",
            email: inst.email || "",
            phone: doc.phoneLocal || inst.phone || "",
            phoneCountryCode: doc.phoneCountryCode || "",
            maritalStatus: "",
            dob: inst.dateOfBirth || "",
            joiningDate: inst.joiningDate || "",
            contractType: inst.contractType || "",
            contractTypeOther: "",
            jobLevel: inst.jobLevel || "",
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
              upiProvider: "",
              upiId: "",
            },
          }
          const form = applyServerPaymentInfoToForm(baseForm, doc)
          return { id: inst.id, instructor: inst, form }
        })
  const clean = dedupe(mapped)
  setItems(clean)
  broadcast(clean)
      } catch (e: any) {
        setError(e.message || 'Failed to load non-instructors')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    // Listen for cross-instance updates so list/table reflects additions immediately
    try {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent<{ items: StoredNonInstructor[] }>).detail
        if (!detail?.items) return
        // Do not broadcast here to avoid event loops
        setItems(dedupe(detail.items))
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('non-instructors-sync', handler as EventListener)
        // If another instance already loaded data, adopt it immediately
        const snapshot = (window as any).__nonInstructorsSnapshot as StoredNonInstructor[] | undefined
        if (Array.isArray(snapshot) && snapshot.length) {
          setItems(dedupe(snapshot))
          setLoading(false)
        }
        return () => {
          window.removeEventListener('non-instructors-sync', handler as EventListener)
        }
      }
    } catch {}
    return () => { cancelled = true }
  }, [])

  const instructors = useMemo(() => items.map(it => it.instructor), [items])

  const addInstructor = useCallback(async (form: InstructorFormData) => {
    // Compute next NON INS id using backend when available
    let id = computeNextExternalId(items)
    try {
      const res = await apiGet<{ ok: boolean; lastNumber: number; width: number; nextExternalId: string }>("/api/dashboard/staff/non-instructor/non-instructors/last-id")
      if (res?.ok && res.nextExternalId) {
        const localMatch = /NON\s?INS(\d+)/i.exec(id)
        const serverMatch = /NON\s?INS(\d+)/i.exec(res.nextExternalId)
        const localNum = localMatch ? parseInt(localMatch[1], 10) : 0
        const serverNum = serverMatch ? parseInt(serverMatch[1], 10) : 0
        if (serverNum > localNum) id = res.nextExternalId
      }
    } catch {}
    __pendingCreateId = id

    const optimistic = mapFormToNonInstructor(form, id)
  setItems(prev => { const next = dedupe([...prev, { id, instructor: optimistic, form }]); broadcast(next); return next })

    try {
      const composedPhone = form.phoneCountryCode ? `${form.phoneCountryCode} ${form.phone}`.trim() : form.phone
      const serverDoc: any = await apiPut(`/api/dashboard/staff/non-instructor/non-instructors/by-external/${encodeURIComponent(id)}`, { externalId: id, ...form, phone: composedPhone, phoneCountryCode: form.phoneCountryCode, phoneLocal: form.phone })
      const authoritativeId = serverDoc.externalId || id
      const nameParts = [serverDoc.firstName, serverDoc.middleName, serverDoc.lastName].filter(Boolean)
      const name = nameParts.join(" ") || authoritativeId
      const canonical: Instructor = {
        id: authoritativeId,
        name,
        role: serverDoc.role || "Non-Instructor",
        gender: (serverDoc.gender as any) || "Other",
        experience: parseInt(serverDoc.yearsOfExperience || "0", 10) || 0,
        email: serverDoc.email,
        phone: serverDoc.phone,
        department: serverDoc.department,
        joiningDate: serverDoc.joiningDate,
        contractType: serverDoc.contractType,
        jobLevel: serverDoc.jobLevel,
        dateOfBirth: serverDoc.dob,
        country: serverDoc.country,
        state: serverDoc.state,
        status: (serverDoc.status as any) || "Active",
      }
  setItems(prev => { const next = dedupe(prev.map(it => it.id === id ? { ...it, id: authoritativeId, instructor: canonical } : it)); broadcast(next); return next })
      return canonical
    } catch (e) {
      return optimistic
    } finally {
      if (__pendingCreateId === id) __pendingCreateId = null
    }
  }, [items])

  const updateInstructor = useCallback(async (id: string, form: InstructorFormData) => {
    const normalized = mapFormToNonInstructor(form, id)
  setItems(prev => { const next = dedupe(prev.map(it => it.id === id ? { ...it, instructor: normalized, form } : it)); broadcast(next); return next })
    try {
      const composedPhone = form.phoneCountryCode ? `${form.phoneCountryCode} ${form.phone}`.trim() : form.phone
      const serverDoc: any = await apiPut(`/api/dashboard/staff/non-instructor/non-instructors/by-external/${encodeURIComponent(id)}`, { externalId: id, ...form, phone: composedPhone, phoneCountryCode: form.phoneCountryCode, phoneLocal: form.phone })
      const authoritativeId = serverDoc.externalId || id
      const nameParts = [serverDoc.firstName, serverDoc.middleName, serverDoc.lastName].filter(Boolean)
      const name = nameParts.join(" ") || authoritativeId
      const canonical: Instructor = {
        id: authoritativeId,
        name,
        role: serverDoc.role || "Non-Instructor",
        gender: (serverDoc.gender as any) || "Other",
        experience: parseInt(serverDoc.yearsOfExperience || "0", 10) || 0,
        email: serverDoc.email,
        phone: serverDoc.phone,
        department: serverDoc.department,
        joiningDate: serverDoc.joiningDate,
        contractType: serverDoc.contractType,
        jobLevel: serverDoc.jobLevel,
        dateOfBirth: serverDoc.dob,
        country: serverDoc.country,
        state: serverDoc.state,
        status: (serverDoc.status as any) || "Active",
      }
  setItems(prev => { const next = dedupe(prev.map(it => it.id === id ? { ...it, instructor: canonical } : it)); broadcast(next); return next })
      return canonical
    } catch (e) {
      return normalized
    }
  }, [])

  const deleteInstructor = useCallback(async (id: string) => {
  setItems(prev => { const next = dedupe(prev.filter(it => it.id !== id)); broadcast(next); return next })
    try {
      await apiDelete(`/api/dashboard/staff/non-instructor/non-instructors/by-external/${encodeURIComponent(id)}`)
    } catch (e: any) {
      try { await apiDelete(`/api/dashboard/staff/non-instructor/non-instructors/${encodeURIComponent(id)}`) } catch {}
    }
  }, [])

  const getFormById = useCallback((id: string): InstructorFormData | undefined => {
    return items.find(it => it.id === id)?.form
  }, [items])

  return { instructors, addInstructor, updateInstructor, deleteInstructor, getFormById, loading, error, reload: async () => {
    try {
      setLoading(true)
      const response: { ok: boolean; data: any[] } = await apiGet<{ ok: boolean; data: any[] }>("/api/dashboard/staff/non-instructor/non-instructors")
      const serverItems = response.data || []
      const visible = serverItems.filter((doc: any) => (doc.status ?? 'Active') !== 'Inactive' && doc.deleted_data !== false)
      const mapped: StoredNonInstructor[] = visible.map((doc: any) => {
        const nameParts = [doc.firstName, doc.middleName, doc.lastName].filter(Boolean)
        const name = nameParts.join(" ") || doc.externalId || doc._id || "Unnamed"
        const inst: Instructor = {
          id: doc.externalId || doc._id,
          name,
          role: doc.role || "Non-Instructor",
          gender: (doc.gender as any) || "Other",
          experience: parseInt(doc.yearsOfExperience || "0", 10) || 0,
          email: doc.email,
          phone: doc.phone,
          department: doc.department,
          joiningDate: doc.joiningDate,
          contractType: doc.contractType,
          jobLevel: doc.jobLevel,
          dateOfBirth: doc.dob,
          country: doc.country,
          state: doc.state,
          status: (doc.status as any) || "Active",
        }
        const baseForm: InstructorFormData = {
          avatar: "",
          firstName: doc.firstName || "",
          middleName: doc.middleName || "",
          lastName: doc.lastName || "",
          role: inst.role,
          roleOther: "",
          email: inst.email || "",
          phone: doc.phoneLocal || inst.phone || "",
          phoneCountryCode: doc.phoneCountryCode || "",
          maritalStatus: "",
          dob: inst.dateOfBirth || "",
          joiningDate: inst.joiningDate || "",
          contractType: inst.contractType || "",
          contractTypeOther: "",
          jobLevel: inst.jobLevel || "",
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
            upiProvider: "",
            upiId: "",
          },
        }
        const form = applyServerPaymentInfoToForm(baseForm, doc)
        return { id: inst.id, instructor: inst, form }
      })
  const clean = dedupe(mapped)
  setItems(clean)
  broadcast(clean)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Reload failed')
    } finally { setLoading(false) }
  } }
}
