"use client"
import React, { useEffect, useMemo, useState } from "react"
import { isPossiblePhoneNumber } from "libphonenumber-js"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/dashboard/ui/select"
import { Button } from "@/components/dashboard/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover" // retained for date pickers
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput, CommandSeparator } from "@/components/dashboard/ui/command"
import { Calendar as CalendarIcon, Check, ChevronDown, Star } from "lucide-react"
import { useCountryCodes } from "@/hooks/dashboard/staff/use-country-codes"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { CountryStateDropdown } from "@/components/dashboard/ui/staff/country-state-dropdown"
import { formatDateToDisplay } from "./date-utils"
import type { BasicInfoFieldErrors, InstructorFormData } from "./types"
import { useNonInstructors } from "@/hooks/dashboard/staff/use-non-instructors"
import { useCustomContractTypes } from "@/hooks/dashboard/staff/use-custom-contract-types"
import { useCustomJobLevels } from "@/hooks/dashboard/staff/use-custom-job-levels"
import { useCustomRoles } from "@/hooks/dashboard/staff/use-custom-roles"
import { cn } from "@/lib/dashboard/staff/utils"
import { apiGet } from "@/lib/dashboard/staff/api"
import { validateEmail } from "./validators"

interface BasicInfoTabProps {
  form: InstructorFormData
  setForm: React.Dispatch<React.SetStateAction<InstructorFormData>>
  currentId?: string
  fieldErrors: BasicInfoFieldErrors
  setFieldErrors: React.Dispatch<React.SetStateAction<BasicInfoFieldErrors>>
  setFormError: React.Dispatch<React.SetStateAction<string>>
  genericErrorMessage: string
  dobFutureMessage: string
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ form, setForm, currentId, fieldErrors, setFieldErrors, setFormError, genericErrorMessage, dobFutureMessage }) => {
  const { instructors } = useNonInstructors()
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes()
  const { getAllContractTypes, addCustomContractType, loading } = useCustomContractTypes()
  const { getAllJobLevels, addCustomJobLevel, loading: jobLevelLoading } = useCustomJobLevels()
  const { getAllRoles, getRolesByCategory, addCustomRole, loading: roleLoading } = useCustomRoles()
  const [contractTypeOpen, setContractTypeOpen] = React.useState(false)
  const [contractTypeSearch, setContractTypeSearch] = React.useState("")
  const [jobLevelOpen, setJobLevelOpen] = React.useState(false)
  const [jobLevelSearch, setJobLevelSearch] = React.useState("")
  const [roleOpen, setRoleOpen] = React.useState(false)
  const [roleSearch, setRoleSearch] = React.useState("")
  // Helper: allow only letters and spaces
  const lettersOnly = (s: string) => s.replace(/[^A-Za-z ]/g, "")
  const [showCustomContractType, setShowCustomContractType] = React.useState(false)
  const [showCustomJobLevel, setShowCustomJobLevel] = React.useState(false)
  // Focus state for custom date display over native input
  const [joiningDateFocused, setJoiningDateFocused] = React.useState(false)
  const [dobFocused, setDobFocused] = React.useState(false)
  // Local 'today' in YYYY-MM-DD for date input constraints
  const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const todayISO = toYMD(new Date())

  const updateFieldError = (field: keyof BasicInfoFieldErrors, message?: string, formMessage?: string) => {
    setFieldErrors(prev => {
      const next = { ...prev }
      const previousMessage = next[field]
      if (message) {
        next[field] = message
      } else {
        delete next[field]
      }

      setFormError((current) => {
        if (message) {
          if (formMessage) return formMessage
          return message === dobFutureMessage ? dobFutureMessage : genericErrorMessage
        }
        if (Object.keys(next).length === 0) {
          return ""
        }
        if (current === previousMessage) {
          const priority = Object.values(next).find(msg => msg === dobFutureMessage)
          return priority || genericErrorMessage
        }
        return current
      })

      return next
    })
  }


  // Compute the next ID (mirrors NI store logic by scanning existing NON INS ids)
  const nextId = useMemo(() => {
    const small: number[] = []
    const all: number[] = []
    let observedWidth = 4
    for (const s of instructors) {
      const m = /NON\s?INS(\d+)/i.exec(s.id)
      if (!m) continue
      const num = parseInt(m[1], 10)
      if (Number.isNaN(num)) continue
      all.push(num)
      if (num <= 999) small.push(num)
      if (m[1].length > observedWidth) observedWidth = m[1].length
    }
    const base = (small.length ? Math.max(...small) : (all.length ? Math.max(...all) : 0))
    const width = Math.max(4, observedWidth)
    const next = base + 1
    return `NON INS${String(next).padStart(width, '0')}`
  }, [instructors])

  // Start with locally computed next ID, then prefer backend suggestion if it is higher
  const [displayId, setDisplayId] = useState<string>(currentId || nextId)

  useEffect(() => {
    // Keep local as baseline if editing existing
    if (currentId) { setDisplayId(currentId); return }
    setDisplayId(nextId)
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiGet<{ ok: boolean; nextExternalId?: string }>("/api/dashboard/staff/non-instructor/non-instructors/last-id")
        if (!cancelled && res?.ok && res.nextExternalId) {
          const pickHigher = (a: string, b: string) => {
            const ma = /NON\s?INS(\d+)/i.exec(a); const mb = /NON\s?INS(\d+)/i.exec(b)
            const na = ma ? parseInt(ma[1], 10) : 0; const nb = mb ? parseInt(mb[1], 10) : 0
            return nb > na ? b : a
          }
          setDisplayId(prev => pickHigher(prev || "", res.nextExternalId!))
        }
      } catch { /* ignore and keep local */ }
    })()
    return () => { cancelled = true }
  }, [currentId, nextId])

  // Name validation helpers: allow only letters and spaces
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, label: string) => {
    const k = e.key
    const isControl =
      e.ctrlKey || e.metaKey || e.altKey ||
      ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(k)
    if (isControl) return
    if (k.length === 1 && !/[A-Za-z ]/.test(k)) {
      e.preventDefault()
    }
  }

  const sanitizeName = (value: string, label: string) => {
    return value.replace(/[^A-Za-z ]/g, "")
  }

  // Email validation state
  const runEmailValidation = (value: string) => {
    const res = validateEmail(value)
    if (res.ok) {
      updateFieldError("email")
      return true
    } else {
      updateFieldError("email", res.reason, res.reason)
      return false
    }
  }

  // Phone validation (length & structure via libphonenumber-js metadata)
  const validatePhone = (raw: string, countryIso?: string, dial?: string) => {
    const digits = raw.replace(/[^0-9]/g, "")
    if (!digits) { updateFieldError("phone", "Phone is required."); return false }
    let iso = countryIso
    if (!iso && dial && countryCodes?.length) {
      const match = countryCodes.find((c: any) => c.dial === dial)
      iso = match?.code
    }
    if (!iso) { updateFieldError("phone"); return true }
    const possible = isPossiblePhoneNumber(digits, iso as any)
    if (possible) updateFieldError("phone")
    else updateFieldError("phone", `Invalid phone number length for ${iso}`)
    return possible
  }

  const validatePostalInline = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      updateFieldError("pincode", "Postal/Zip/Pin Code is required.")
      return false
    }
    if (trimmed.length < 3) {
      updateFieldError("pincode", "Postal/Zip/Pin Code must be at least 3 characters.")
      return false
    }
    if (trimmed.length > 10) {
      updateFieldError("pincode", "Postal/Zip/Pin Code cannot exceed 10 characters.")
      return false
    }
    if (!/^[A-Za-z0-9\s-]+$/.test(trimmed)) {
      updateFieldError("pincode", "Postal/Zip/Pin Code can only contain letters, numbers, spaces, and hyphens.")
      return false
    }
    updateFieldError("pincode")
    return true
  }

  useEffect(() => {
    if (fieldErrors.pincode) {
      validatePostalInline(form.pincode || '')
    }
  }, [form.pincode])


  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Non-Instructor ID</Label>
          <div className="border-2 border-purple-400 dark:border-purple-600 rounded-lg px-3 py-2 text-foreground bg-background dark:bg-gray-800 select-text cursor-default" title={currentId ? "Existing ID (unchanged)" : "Auto-generated on save"}>{displayId}</div>
        </div>

        {/* Name fields */}
        <div>
          <Label>First Name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="Michael "
            value={form.firstName}
            onKeyDown={(e) => handleNameKeyDown(e, "First Name")}
            onChange={(e) => setForm(f => ({ ...f, firstName: sanitizeName(e.target.value, "First Name") }))}
            inputMode="text"
            autoComplete="given-name"
            className={cn(fieldErrors.firstName ? "border-red-500 focus:ring-red-400" : "")}
            onBlur={() => {
              if (!form.firstName.trim()) updateFieldError("firstName", "First name is required.")
              else updateFieldError("firstName")
            }}
          />
          {fieldErrors.firstName && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
          )}
        </div>
        <div>
          <Label>Middle Name</Label>
          <Input
            placeholder="James"
            value={form.middleName}
            onKeyDown={(e) => handleNameKeyDown(e, "Middle Name")}
            onChange={(e) => setForm(f => ({ ...f, middleName: sanitizeName(e.target.value, "Middle Name") }))}
            inputMode="text"
            autoComplete="additional-name"
          />
        </div>
        <div>
          <Label>Last Name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="Jordan"
            value={form.lastName}
            onKeyDown={(e) => handleNameKeyDown(e, "Last Name")}
            onChange={(e) => setForm(f => ({ ...f, lastName: sanitizeName(e.target.value, "Last Name") }))}
            inputMode="text"
            autoComplete="family-name"
            className={cn(fieldErrors.lastName ? "border-red-500 focus:ring-red-400" : "")}
            onBlur={() => {
              if (!form.lastName.trim()) updateFieldError("lastName", "Last name is required.")
              else updateFieldError("lastName")
            }}
          />
          {fieldErrors.lastName && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
          )}
        </div>
        
        {/* Date of Birth */}
        <div>
          <Label>Date of Birth <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              type="date"
              max={todayISO}
              value={form.dob || ''}
              onChange={(e) => {
                const v = e.target.value
                if (!v) {
                  setForm(f => ({ ...f, dob: '' }))
                  updateFieldError("dob", "Date of birth is required.")
                  return
                }
                if (v > todayISO) {
                  updateFieldError("dob", dobFutureMessage, dobFutureMessage)
                  return
                }
                setForm(f => ({ ...f, dob: v }))
                updateFieldError("dob")
              }}
              onFocus={() => setDobFocused(true)}
              onBlur={(e) => {
                setDobFocused(false)
                const v = e.target.value
                if (!v) {
                  updateFieldError("dob", "Date of birth is required.")
                } else if (v > todayISO) {
                  updateFieldError("dob", dobFutureMessage, dobFutureMessage)
                } else {
                  updateFieldError("dob")
                }
              }}
              required
              className={cn(
                "px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent",
                dobFocused ? '' : 'text-transparent',
                fieldErrors.dob ? "border-red-500 focus:ring-red-400" : ""
              )}
            />
            {!dobFocused && (
              <div className={`absolute inset-0 flex items-center px-3 text-sm pointer-events-none ${form.dob ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white'} z-0`}>
                {form.dob ? formatDateToDisplay(form.dob) : 'dd-mmm-yy'}
              </div>
            )}
          </div>
          {fieldErrors.dob && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <Label>Gender <span className="text-red-500">*</span></Label>
          <Select value={form.gender} onValueChange={v => {
            setForm(f => ({ ...f, gender: v, genderOther: "" }))
            updateFieldError("gender")
          }}>
            <SelectTrigger className={cn(fieldErrors.gender ? "border-red-500 focus:ring-red-400" : "")}><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.gender && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p>
          )}
        </div>

        {/* Marital Status */}
        <div>
          <Label>Marital Status</Label>
          <Select value={form.maritalStatus} onValueChange={v => setForm(f => ({ ...f, maritalStatus: v }))}>
            <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email */}
        <div>
          <Label>Email <span className="text-red-500">*</span></Label>
          <Input
            placeholder="emily.carter@artsacademy.com"
            type="email"
            value={form.email}
            aria-invalid={!!fieldErrors.email}
            aria-describedby="email-help email-error"
            onChange={e => {
              const v = e.target.value.trim()
              setForm(f => ({ ...f, email: v }))
              if (!v) {
                updateFieldError("email", "Email is required.", "Email is required.")
                return
              }
              runEmailValidation(v)
            }}
            onBlur={e => {
              const v = e.target.value.trim()
              if (v) {
                runEmailValidation(v)
              } else {
                updateFieldError("email", "Email is required.", "Email is required.")
              }
            }}
            onKeyDown={e => {
              // Prevent certain characters that would make email invalid
              if (e.key === ' ' || (e.key === '-' && e.currentTarget.value.endsWith('-'))) {
                e.preventDefault()
              }
            }}
            className={cn(
              fieldErrors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300",
              "transition-colors duration-200"
            )}
          />
          <p className="mt-1 text-[11px] text-gray-500">Must be a valid email address (e.g., user@domain.com)</p>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-[12px] text-red-600 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        {/* Country (swapped with Phone) */}
        <div>
          <CountryStateDropdown
            country={form.country}
            state={form.state}
            onCountryChange={(value) => {
              const match = countryCodes?.find((c: any) => c.code === value)
              setForm(f => ({ 
                ...f, 
                country: value, 
                state: "",
                // Auto-set phone country code to selected country's dial code (if available)
                phoneCountryCode: match?.dial ?? f.phoneCountryCode,
              }));
              validatePhone(form.phone, value, match?.dial ?? form.phoneCountryCode)
            }}
            onStateChange={(value) => {
              setForm(f => ({ ...f, state: value }));
            }}
            mode="country"
          />
        </div>

        {/* Country / State and Address */}
        <div className="col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {/* Phone (swapped into country position) */}
            <div>
              <Label>Phone <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <CountryCodeSelector
                  value={form.phoneCountryCode}
                  onValueChange={(dial) => {
                    setForm(f => {
                      const list = (countryCodes || []).filter((c: any) => c.dial === dial)
                      const keep = list.find((m: any) => m.code === f.country)
                      const nextCountry = keep ? f.country : (list[0]?.code || f.country)
                      return {
                        ...f,
                        phoneCountryCode: dial,
                        country: nextCountry,
                        state: keep ? f.state : "",
                      }
                    })
                    validatePhone(form.phone, form.country, dial)
                  }}
                  countryCodes={countryCodes}
                />
                <Input
                  className={cn("flex-1", fieldErrors.phone ? "border-red-500 focus:ring-red-400" : "")}
                  type="tel"
                  inputMode="tel"
                  placeholder="555 987 6543"
                  value={form.phone}
                  onKeyDown={(e) => {
                    const k = e.key
                    const isControl =
                      e.ctrlKey || e.metaKey || e.altKey ||
                      ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(k)
                    if (isControl) return
                    // Only allow digits and space
                    if (k.length === 1 && !/[0-9 ]/.test(k)) {
                      e.preventDefault()
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData?.getData("text") ?? ""
                    const cleaned = text.replace(/[^0-9 ]/g, "")
                    if (cleaned !== text) {
                      e.preventDefault()
                      if (cleaned.length > 0) {
                        setForm(f => ({ ...f, phone: cleaned }))
                        validatePhone(cleaned, form.country, form.phoneCountryCode)
                      }
                    }
                  }}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9 ]/g,'')
                    setForm(f => ({ ...f, phone: val }))
                    validatePhone(val, form.country, form.phoneCountryCode)
                  }}
                  onBlur={(e) => {
                    validatePhone(e.target.value, form.country, form.phoneCountryCode)
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-white"></p>
              {fieldErrors.phone && (
                <p className="mt-1 text-[12px] text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
            {/* State remains on the right */}
            <CountryStateDropdown
              country={form.country}
              state={form.state}
              onCountryChange={(value) => {
                setForm(f => ({ ...f, country: value, state: "" }));
              }}
              onStateChange={(value) => {
                setForm(f => ({ ...f, state: value }));
              }}
              mode="state"
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label>Postal/Zip/Pin Code <span className="text-red-500">*</span></Label>
              <Input
                value={form.pincode}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^A-Za-z0-9\s-]/g, "");
                  const normalized = sanitized.replace(/\s+/g, ' ');
                  const valueToStore = normalized.startsWith(' ') ? normalized.trimStart() : normalized;
                  setForm(f => ({ ...f, pincode: valueToStore }));
                  if (fieldErrors.pincode) validatePostalInline(valueToStore);
                }}
                onBlur={(e) => validatePostalInline(e.target.value)}
                placeholder="e.g. 560001"
                className={cn(fieldErrors.pincode ? "border-red-500 focus-visible:ring-red-500" : "")}
                maxLength={10}
              />
              {fieldErrors.pincode && (
                <p className="mt-1 text-[12px] text-red-600">{fieldErrors.pincode}</p>
              )}
            </div>
          </div>
          <Label>Address</Label>
          <Textarea placeholder="456 Creative Avenue, Art City, AC 67890" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>

        {/* Contract Type and Job Level */}
        <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="contractType">Contract Type <span className="text-red-500">*</span></Label>
            <Popover 
              open={contractTypeOpen} 
              onOpenChange={(open) => {
                setContractTypeOpen(open)
                if (!open) setContractTypeSearch("")
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contractTypeOpen}
                  className={cn("w-full justify-between", fieldErrors.contractType ? "border-red-500 focus-visible:ring-red-500" : "")}
                >
                  {form.contractType 
                    ? getAllContractTypes().find(type => type.value === form.contractType)?.label 
                    : "Select contract type"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or add contract types..." 
                    value={contractTypeSearch}
                    onValueChange={(v) => setContractTypeSearch(lettersOnly(v))}
                    className="h-9"
                  />
                  <CommandList 
                    className="max-h-[200px] overflow-y-auto scroll-smooth"
                    style={{ 
                      scrollBehavior: 'smooth',
                      overflowY: 'auto'
                    }}
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {loading ? (
                      <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading contract types...</div>
                    ) : (
                      <>
                        <CommandEmpty>No contract type found.</CommandEmpty>
                        {(() => {
                          const query = contractTypeSearch.trim()
                          const isLetters = /^[A-Za-z ]+$/.test(query)
                          const exists = getAllContractTypes().some(t => t.label.toLowerCase() === query.toLowerCase())
                          if (!query || !isLetters || exists) return null
                          return (
                            <CommandItem
                              onSelect={async () => {
                                const created = await addCustomContractType(query)
                                if (created) {
                                  setForm(f => ({ ...f, contractType: created, contractTypeOther: '' }))
                                  setShowCustomContractType(false)
                                  setContractTypeOpen(false)
                                  setContractTypeSearch("")
                                  updateFieldError("contractType")
                                }
                              }}
                              className="text-blue-600 font-medium"
                            >
                              <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                              Add "{query}" as new contract type
                            </CommandItem>
                          )
                        })()}
                        
                        <CommandGroup>
                          {getAllContractTypes()
                            .filter(type => 
                              type.label.toLowerCase().includes(contractTypeSearch.toLowerCase())
                            )
                            .map(type => (
                        <CommandItem
                          key={type.value}
                          value={type.value}
                          className="flex items-center justify-between"
                          onSelect={() => {
                            setForm(f => ({ 
                              ...f, 
                              contractType: type.value,
                              contractTypeOther: ''
                            }))
                            setShowCustomContractType(false)
                            setContractTypeOpen(false)
                            updateFieldError("contractType")
                          }}
                        >
                          <div className="flex items-center">
                            <Check 
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.contractType === type.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {type.label}
                          </div>
                          {null}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {null}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {fieldErrors.contractType && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.contractType}</p>
            )}
            {showCustomContractType && null}
          </div>
          <div className="flex-1">
            <Label htmlFor="jobLevel">Job Level <span className="text-red-500">*</span></Label>
            <Popover open={jobLevelOpen} onOpenChange={(open) => {
              setJobLevelOpen(open)
              if (!open) {
                setJobLevelSearch("")
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between", fieldErrors.jobLevel ? "border-red-500 focus-visible:ring-red-500" : "")}
                >
                  {form.jobLevel ? getAllJobLevels().find(level => level.value === form.jobLevel)?.label || form.jobLevel : "Select job level"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or add job levels..." 
                    value={jobLevelSearch}
                    onValueChange={(v) => setJobLevelSearch(lettersOnly(v))}
                    onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                      const query = jobLevelSearch.trim()
                      const exists = getAllJobLevels().some(l => l.label.toLowerCase() === query.toLowerCase())
                      const isLetters = /^[A-Za-z ]+$/.test(query)
                      if (e.key === 'Enter' && query && isLetters && !exists) {
                        const ok = await addCustomJobLevel(query)
                        if (ok) {
                          setForm(f => ({ ...f, jobLevel: query, jobLevelOther: '' }))
                          setShowCustomJobLevel(false)
                          setJobLevelOpen(false)
                          setJobLevelSearch("")
                          updateFieldError("jobLevel")
                        }
                      }
                    }}
                    className="h-9"
                  />
                  <CommandList 
                    className="max-h-[200px] overflow-y-auto scroll-smooth"
                    style={{ 
                      scrollBehavior: 'smooth',
                      overflowY: 'auto'
                    }}
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {jobLevelLoading ? (
                      <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading job levels...</div>
                    ) : (
                      <>
                        <CommandEmpty>No job level found.</CommandEmpty>
                        {(() => {
                          const query = jobLevelSearch.trim()
                          const isLetters = /^[A-Za-z ]+$/.test(query)
                          const exists = getAllJobLevels().some(l => l.label.toLowerCase() === query.toLowerCase())
                          if (!query || !isLetters || exists) return null
                          return (
                            <CommandItem
                              onSelect={async () => {
                                const ok = await addCustomJobLevel(query)
                                if (ok) {
                                  setForm(f => ({ ...f, jobLevel: query, jobLevelOther: '' }))
                                  setShowCustomJobLevel(false)
                                  setJobLevelOpen(false)
                                  setJobLevelSearch("")
                                }
                              }}
                              className="text-blue-600 font-medium"
                            >
                              <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                              Add "{query}" as new job level
                            </CommandItem>
                          )
                        })()}
                        
                        <CommandGroup>
                          {getAllJobLevels()
                            .filter(level => 
                              level.label.toLowerCase().includes(jobLevelSearch.toLowerCase())
                            )
                            .map(level => (
                            <CommandItem
                              key={level.value}
                              value={level.value}
                              className="flex items-center justify-between"
                                onSelect={() => {
                                  setForm(f => ({ 
                                    ...f, 
                                    jobLevel: level.value,
                                    jobLevelOther: ''
                                  }))
                                  setShowCustomJobLevel(false)
                                  setJobLevelOpen(false)
                                  updateFieldError("jobLevel")
                                }}
                            >
                              <div className="flex items-center">
                                <Check 
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.jobLevel === level.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {level.label}
                              </div>
                              {null}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {null}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {fieldErrors.jobLevel && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.jobLevel}</p>
            )}
            {showCustomJobLevel && null}
          </div>
        </div>

        {/* Role */}
        <div>
          <Label>Role <span className="text-red-500">*</span></Label>
            <Popover open={roleOpen} onOpenChange={(open) => {
            setRoleOpen(open)
            if (!open) {
              setRoleSearch("")
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn("w-full justify-between", fieldErrors.role ? "border-red-500 focus-visible:ring-red-500" : "")}
              >
                {form.role ? getAllRoles().find(role => role.value === form.role)?.label || form.role : "Select instructor role"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search or add roles..." 
                  value={roleSearch}
                  onValueChange={(v) => setRoleSearch(lettersOnly(v))}
                  onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                    const query = roleSearch.trim()
                    const exists = getAllRoles().some(r => r.label.toLowerCase() === query.toLowerCase())
                    const isLetters = /^[A-Za-z ]+$/.test(query)
                    if (e.key === 'Enter' && query && isLetters && !exists) {
                      const ok = await addCustomRole(query)
                      if (ok) {
                        setForm(f => ({ ...f, role: query, roleOther: '' }))
                        setRoleOpen(false)
                        setRoleSearch("")
                      }
                    }
                  }}
                  className="h-9"
                />
                <CommandList 
                  className="max-h-[300px] overflow-y-auto scroll-smooth"
                  style={{ 
                    scrollBehavior: 'smooth',
                    overflowY: 'auto'
                  }}
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {roleLoading ? (
                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading roles...</div>
                  ) : (
                    <>
                      <CommandEmpty>No role found.</CommandEmpty>
                      {(() => {
                        const query = roleSearch.trim()
                        const isLetters = /^[A-Za-z ]+$/.test(query)
                        const exists = getAllRoles().some(r => r.label.toLowerCase() === query.toLowerCase())
                        if (!query || !isLetters || exists) return null
                        return (
                          <CommandItem
                            onSelect={async () => {
                              const ok = await addCustomRole(query)
                              if (ok) {
                                setForm(f => ({ ...f, role: query, roleOther: '' }))
                                setRoleOpen(false)
                                setRoleSearch("")
                                updateFieldError("role")
                              }
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                            Add "{query}" as new role
                          </CommandItem>
                        )
                      })()}
                      
                      {Object.entries(getRolesByCategory()).map(([category, roles]) => {
                        const filteredRoles = roles.filter(role => 
                          role.label.toLowerCase().includes(roleSearch.toLowerCase())
                        );
                        
                        if (filteredRoles.length === 0) return null;
                        
                        return (
                          <CommandGroup key={category}>
                            <div className="px-2 py-1 text-xs text-gray-500 dark:text-white font-semibold select-none pointer-events-none">
                              {category}
                            </div>
                            {filteredRoles.map(role => (
                              <CommandItem
                                key={role.value}
                                value={role.value}
                                className="flex items-center justify-between"
                                onSelect={() => {
                                  setForm(f => ({ 
                                    ...f, 
                                    role: role.value,
                                    roleOther: role.value === 'custom' ? f.roleOther : ''
                                  }))
                                  setRoleOpen(false)
                                  updateFieldError("role")
                                }}
                              >
                                <div className="flex items-center">
                                  <Check 
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.role === role.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {role.label}
                                </div>
                                {null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      })}
                      {null}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {fieldErrors.role && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>
          )}
          {false && form.role === 'custom'}
        </div>

        {/* Years of Experience */}
        <div>
          <Label>Years of Experience <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            placeholder="0"
            value={form.yearsOfExperience}
            inputMode="numeric"
            pattern="[0-9]*"
            className={cn(fieldErrors.yearsOfExperience ? "border-red-500 focus:ring-red-400" : "")}
            onKeyDown={(e) => {
              const k = e.key
              const isControl =
                e.ctrlKey || e.metaKey || e.altKey ||
                ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(k)
              if (isControl) return
              if (k.length === 1 && !/[0-9]/.test(k)) {
                e.preventDefault()
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData?.getData("text") ?? ""
              const digits = text.replace(/\D/g, "")
              if (digits !== text) {
                e.preventDefault()
                if (digits.length > 0) {
                  setForm(f => ({ ...f, yearsOfExperience: digits }))
                }
              }
            }}
            onChange={(e) => {
              const value = e.target.value
              if (value === '' || /^\d+$/.test(value)) {
                setForm(f => ({ ...f, yearsOfExperience: value }))
                if (value === '') {
                  updateFieldError("yearsOfExperience", "Years of experience is required.")
                } else {
                  updateFieldError("yearsOfExperience")
                }
              }
            }}
            onBlur={() => {
              const currentValue = parseInt(form.yearsOfExperience) || 0
              setForm(f => ({ ...f, yearsOfExperience: String(Math.max(0, currentValue)) }))
              if (form.yearsOfExperience.trim() === '') {
                updateFieldError("yearsOfExperience", "Years of experience is required.")
              } else {
                updateFieldError("yearsOfExperience")
              }
            }}
            min="0"
          />
          {fieldErrors.yearsOfExperience && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.yearsOfExperience}</p>
          )}
        </div>

        {/* Joining Date (moved to end of form) */}
        <div>
          <Label>Joining Date <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              type="date"
              value={form.joiningDate || ''}
              onChange={(e) => {
                const value = e.target.value
                setForm(f => ({ ...f, joiningDate: value }))
                if (!value) {
                  updateFieldError("joiningDate", "Joining date is required.")
                } else {
                  updateFieldError("joiningDate")
                }
              }}
              onFocus={() => setJoiningDateFocused(true)}
              onBlur={() => {
                setJoiningDateFocused(false)
                if (!form.joiningDate.trim()) {
                  updateFieldError("joiningDate", "Joining date is required.")
                } else {
                  updateFieldError("joiningDate")
                }
              }}
              required
              className={cn(
                "px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent",
                joiningDateFocused ? '' : 'text-transparent',
                fieldErrors.joiningDate ? "border-red-500 focus:ring-red-400" : ""
              )}
            />
            {!joiningDateFocused && (
              <div className={`absolute inset-0 flex items-center px-3 text-sm pointer-events-none ${form.joiningDate ? 'text-gray-900' : 'text-gray-500 dark:text-white'}`}>
                {form.joiningDate ? formatDateToDisplay(form.joiningDate) : 'dd-mmm-yy'}
              </div>
            )}
          </div>
          {fieldErrors.joiningDate && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.joiningDate}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Country code selector component with integrated search
const CountryCodeSelector: React.FC<{ 
  value: string | undefined; 
  onValueChange: (value: string) => void; 
  countryCodes: any[] 
}> = ({ value, onValueChange, countryCodes }) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const filteredCountries = React.useMemo(() => {
    // Group by dial code to avoid duplicate value collisions (+1 appears for US & CA, etc.)
    const grouped = new Map<string, { dial: string; codes: string[]; names: string[] }>()
    for (const c of countryCodes) {
      const existing = grouped.get(c.dial)
      if (existing) {
        existing.codes.push(c.code)
        existing.names.push(c.name)
      } else {
        grouped.set(c.dial, { dial: c.dial, codes: [c.code], names: [c.name] })
      }
    }
    let arr = Array.from(grouped.values()).map(g => ({
      dial: g.dial,
      label: g.names.join(', '),
      codes: g.codes,
    }))
    arr.sort((a,b) => a.label.localeCompare(b.label))
    
    if (!searchQuery.trim()) return arr
    const f = searchQuery.trim().toLowerCase()
    
    // Prioritize country name matches over code matches
    const nameMatches = arr.filter(c => c.label.toLowerCase().includes(f))
    const codeMatches = arr.filter(c => 
      !c.label.toLowerCase().includes(f) && 
      (c.dial.includes(f) || c.codes.some(code => code.toLowerCase().includes(f)))
    )
    
    return [...nameMatches, ...codeMatches]
  }, [countryCodes, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[10.5rem] justify-between font-normal px-3"
        >
          <div className="text-sm font-medium tracking-wide">
            {(() => {
              if (!value) return 'Code'
              // Derive ISO code(s) for the selected dialing code; e.g. +91 -> IN, +1 -> US/CA
              const codes = countryCodes
                ?.filter((c: any) => c.dial === value)
                .map((c: any) => c.code)
                .sort()
              const abbr = codes && codes.length ? ` ${codes.join('/')}` : ''
              return `${value}${abbr}`
            })()}
          </div>
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by country name (e.g. India, USA)..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList 
            className="max-h-60 overflow-y-auto scroll-smooth"
            onWheel={(e) => {
              e.stopPropagation()
              const target = e.currentTarget
              target.scrollTop += e.deltaY
            }}
          >
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <div 
                className="space-y-0"
                onWheel={(e) => {
                  e.stopPropagation()
                  const target = e.currentTarget.parentElement?.parentElement
                  if (target) {
                    target.scrollTop += e.deltaY
                  }
                }}
              >
                {filteredCountries.map(item => (
                  <CommandItem
                    key={item.dial}
                    value={`${item.label} ${item.dial}`}
                    keywords={[item.label, item.dial, ...item.codes]}
                    onSelect={() => {
                      onValueChange(item.dial)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === item.dial ? "opacity-100" : "opacity-0")} />
                    <span className="w-16 text-left">{item.dial}</span>
                    <span className="flex-1 truncate text-left text-gray-700 dark:text-white">{item.label}</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 dark:text-white border border-gray-200">
                      {item.codes.join('/')}
                    </span>
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default BasicInfoTab
