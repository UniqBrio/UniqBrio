"use client";

import { Calendar as CalendarIcon, Check, ChevronDown, Star } from "lucide-react";
import { Input } from "@/components/dashboard/ui/input";
import { Label } from "@/components/dashboard/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/dashboard/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/dashboard/ui/command";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { Button } from "@/components/dashboard/ui/button";
import { CountryStateDropdown } from "@/components/dashboard/ui/staff/country-state-dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { ProfileData } from "../types";
import { EditFormData } from "./types";
import { formatDateToDisplay } from "./date-utils";
import { useCustomContractTypes } from "@/hooks/dashboard/staff/use-custom-contract-types";
import { useCustomJobLevels } from "@/hooks/dashboard/staff/use-custom-job-levels";
import { useCustomRoles } from "@/hooks/dashboard/staff/use-custom-roles";
import { useCountryCodes } from "@/hooks/dashboard/staff/use-country-codes";
import { cn } from "@/lib/dashboard/staff/utils";
import React from "react";
import { useToast } from "@/hooks/dashboard/use-toast";
import { validateEmail } from "../../add-instructor-dialog-refactored/validators";

export function BasicTab({ profileData, editForm, setEditForm }: { profileData: ProfileData; editForm: EditFormData; setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>; }) {
  const { toast } = useToast()
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
  const [showCustomContractType, setShowCustomContractType] = React.useState(false)
  const [showCustomJobLevel, setShowCustomJobLevel] = React.useState(false)
  // Focus state for custom date display over native input
  const [joiningDateFocused, setJoiningDateFocused] = React.useState(false)
  const [dobFocused, setDobFocused] = React.useState(false)
  const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const todayISO = toYMD(new Date())

  // Delete handlers removed per requirements (no delete for custom values)

  // Name validation helpers: allow only letters and spaces
  const [lastInvalidToastAt, setLastInvalidToastAt] = React.useState(0)
  const triggerInvalidNameToast = (label: string) => {
    const now = Date.now()
    if (now - lastInvalidToastAt < 1200) return // throttle
    setLastInvalidToastAt(now)
    toast({
      variant: "destructive",
      title: `Invalid ${label}`,
      description: `${label} can only contain letters and spaces. Numbers and special characters are not allowed.`,
    })
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, label: string) => {
    const k = e.key
    const isControl =
      e.ctrlKey || e.metaKey || e.altKey ||
      ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(k)
    if (isControl) return
    if (k.length === 1 && !/[A-Za-z ]/.test(k)) {
      e.preventDefault()
      triggerInvalidNameToast(label)
    }
  }

  const sanitizeName = (value: string, label: string) => {
    const sanitized = value.replace(/[^A-Za-z ]/g, "")
    if (sanitized !== value) triggerInvalidNameToast(label)
    return sanitized
  }

  // Delete handlers removed per requirements (no delete for custom values)

  // Email validation state
  const [emailError, setEmailError] = React.useState<string | null>(null)
  const runEmailValidation = (value: string) => {
    const res = validateEmail(value)
    if (res.ok) { setEmailError(null); return true }
    setEmailError(res.reason); return false
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Instructor ID</Label>
          <div className="border-2 border-purple-400 rounded-lg px-3 py-2 text-gray-500 bg-white select-text cursor-default">
            {profileData.instructorId}
          </div>
        </div>

        {/* Name fields */}
        <div>
          <Label>First Name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="Michael"
            value={editForm.firstName}
            onKeyDown={(e) => handleNameKeyDown(e, "First Name")}
            onChange={(e) => setEditForm(f => ({ ...f, firstName: sanitizeName(e.target.value, "First Name") }))}
            inputMode="text"
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label>Middle Name</Label>
          <Input
            placeholder="James"
            value={editForm.middleName}
            onKeyDown={(e) => handleNameKeyDown(e, "Middle Name")}
            onChange={(e) => setEditForm(f => ({ ...f, middleName: sanitizeName(e.target.value, "Middle Name") }))}
            inputMode="text"
            autoComplete="additional-name"
          />
        </div>
        <div>
          <Label>Last Name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="Jordan"
            value={editForm.lastName}
            onKeyDown={(e) => handleNameKeyDown(e, "Last Name")}
            onChange={(e) => setEditForm(f => ({ ...f, lastName: sanitizeName(e.target.value, "Last Name") }))}
            inputMode="text"
            autoComplete="family-name"
          />
        </div>
        
        {/* Date of Birth */}
        <div>
          <Label>Date of Birth <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              type="date"
              max={todayISO}
              value={editForm.dob || ''}
              onChange={(e) => {
                const v = e.target.value
                if (v && v > todayISO) {
                  toast({ variant: 'destructive', title: 'Invalid date of birth', description: 'Date of birth cannot be in the future.' })
                  return
                }
                setEditForm(f => ({ ...f, dob: v }))
              }}
              onFocus={() => setDobFocused(true)}
              onBlur={(e) => {
                setDobFocused(false)
                const v = e.target.value
                if (v && v > todayISO) {
                  toast({ variant: 'destructive', title: 'Invalid date of birth', description: 'Please select a date on or before today.' })
                }
              }}
              required
              className={`px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent ${
                !editForm.dob ? 'border-red-300 bg-red-50' : ''
              } ${dobFocused ? '' : 'text-transparent'}`}
            />
            {!dobFocused && (
              <div className={`absolute inset-0 flex items-center px-3 text-sm pointer-events-none ${editForm.dob ? 'text-gray-900' : 'text-gray-500'} z-0`}>
                {editForm.dob ? formatDateToDisplay(editForm.dob) : 'dd-mmm-yy'}
              </div>
            )}
          </div>
        </div>

        {/* Gender */}
        <div>
          <Label>Gender <span className="text-red-500">*</span></Label>
          <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {editForm.gender === "Other" && (
            <Input className="mt-2" placeholder="Please specify" value={editForm.genderOther} onChange={e => setEditForm(f => ({ ...f, genderOther: e.target.value }))} />
          )}
        </div>

        {/* Marital Status */}
        <div>
          <Label>Marital Status</Label>
          <Select value={editForm.maritalStatus} onValueChange={v => setEditForm(f => ({ ...f, maritalStatus: v }))}>
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
            value={editForm.email}
            aria-invalid={!!emailError}
            aria-describedby="edit-email-help edit-email-error"
            onChange={e => {
              const v = e.target.value
              setEditForm(f => ({ ...f, email: v }))
              if (v) runEmailValidation(v); else setEmailError("Email is required.")
            }}
            onBlur={e => runEmailValidation(e.target.value)}
            className={cn(emailError ? "border-red-500 focus:ring-red-400" : "")}
          />
          <p id="edit-email-help" className="mt-1 text-[11px] text-gray-500">This will be used for account login and notifications.</p>
          {emailError && <p id="edit-email-error" className="mt-1 text-[12px] text-red-600">{emailError}</p>}
        </div>

        {/* Phone */}
        <div>
          <Label>Phone <span className="text-red-500">*</span></Label>
          <div className="flex gap-2">
            <CountryCodeSelector
              value={editForm.phoneCountryCode}
              onValueChange={(dial) => setEditForm(f => ({ ...f, phoneCountryCode: dial }))}
              countryCodes={countryCodes}
            />
            <Input
              className="flex-1"
              placeholder="Local number"
              value={editForm.phone}
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9\s-]/g,'') }))}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Stored as combined international format.</p>
        </div>

        {/* Country / State and Address */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <CountryStateDropdown
              country={editForm.country}
              state={editForm.state}
              onCountryChange={(value) => {
                setEditForm(f => ({ ...f, country: value, state: "" }));
              }}
              onStateChange={(value) => {
                setEditForm(f => ({ ...f, state: value }));
              }}
            />
          </div>
          <Label>Address</Label>
          <Textarea placeholder="456 Creative Avenue, Art City, AC 67890" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
        </div>

        {/* Contract Type and Job Level */}
        <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="contractType">Contract Type <span className="text-red-500">*</span></Label>
            <Popover 
              open={contractTypeOpen} 
              onOpenChange={(open) => {
                setContractTypeOpen(open)
                if (!open) setContractTypeSearch("") // Clear search when closing
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contractTypeOpen}
                  className="w-full justify-between"
                >
                  {editForm.contractType 
                    ? getAllContractTypes().find(type => type.value === editForm.contractType)?.label 
                    : "Select contract type"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search contract types..." 
                    value={contractTypeSearch}
                    onValueChange={setContractTypeSearch}
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
                      <div className="px-2 py-1 text-sm text-gray-500">Loading contract types...</div>
                    ) : (
                      <>
                        <CommandEmpty>No contract type found.</CommandEmpty>
                        
                        {/* Add Custom Contract Type Button - Moved to Top */}
                        <div className="border-b">
                          <CommandItem
                            onSelect={() => {
                              setShowCustomContractType(true)
                              setEditForm(f => ({ 
                                ...f, 
                                contractTypeOther: ''
                              }))
                              setContractTypeOpen(false)
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <div className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">
                                +
                              </div>
                              Add Custom Contract Type
                            </div>
                          </CommandItem>
                        </div>
                        
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
                                setEditForm(f => ({ 
                                  ...f, 
                                  contractType: type.value,
                                  contractTypeOther: ''
                                }))
                                setShowCustomContractType(false)
                                setContractTypeOpen(false)
                              }}
                            >
                              <div className="flex items-center">
                                <Check 
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editForm.contractType === type.value ? "opacity-100" : "opacity-0"
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
            {showCustomContractType && (
              <div className="mt-2">
                <Input
                  placeholder="Enter custom contract type"
                  value={editForm.contractTypeOther}
                  onChange={e => setEditForm(f => ({ ...f, contractTypeOther: e.target.value }))}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        const customValue = await addCustomContractType(value)
                        if (customValue) {
                          setEditForm(f => ({ ...f, contractType: customValue, contractTypeOther: '' }))
                          setShowCustomContractType(false)
                        }
                      }
                    }
                  }}
                  onBlur={async (e) => {
                    const value = e.target.value.trim()
                    if (value) {
                      const customValue = await addCustomContractType(value)
                      if (customValue) {
                        setEditForm(f => ({ ...f, contractType: customValue, contractTypeOther: '' }))
                        setShowCustomContractType(false)
                      }
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or click outside to save this custom contract type
                </p>
              </div>
            )}
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
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {editForm.jobLevel ? getAllJobLevels().find(level => level.value === editForm.jobLevel)?.label || editForm.jobLevel : "Select job level"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search job levels..." 
                    value={jobLevelSearch}
                    onValueChange={setJobLevelSearch}
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
                      <div className="px-2 py-1 text-sm text-gray-500">Loading job levels...</div>
                    ) : (
                      <>
                        <CommandEmpty>No job level found.</CommandEmpty>
                        
                        {/* Add Custom Job Level Button - Moved to Top */}
                        <div className="border-b">
                          <CommandItem
                            onSelect={() => {
                              setShowCustomJobLevel(true)
                              setEditForm(f => ({ 
                                ...f, 
                                jobLevelOther: ''
                              }))
                              setJobLevelOpen(false)
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <div className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">
                                +
                              </div>
                              Add Custom Job Level
                            </div>
                          </CommandItem>
                        </div>
                        
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
                                setEditForm(f => ({ 
                                  ...f, 
                                  jobLevel: level.value,
                                  jobLevelOther: ''
                                }))
                                setShowCustomJobLevel(false)
                                setJobLevelOpen(false)
                              }}
                            >
                              <div className="flex items-center">
                                <Check 
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editForm.jobLevel === level.value ? "opacity-100" : "opacity-0"
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
            {showCustomJobLevel && (
              <div className="mt-2">
                <Input
                  placeholder="Enter custom job level"
                  value={editForm.jobLevelOther}
                  onChange={e => setEditForm(f => ({ ...f, jobLevelOther: e.target.value }))}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && editForm.jobLevelOther.trim()) {
                      const success = await addCustomJobLevel(editForm.jobLevelOther.trim())
                      if (success) {
                        setEditForm(f => ({ 
                          ...f, 
                          jobLevel: editForm.jobLevelOther.trim(),
                          jobLevelOther: ''
                        }))
                        setShowCustomJobLevel(false)
                      } else {
                        alert('Job level already exists or invalid input.')
                      }
                    }
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Press Enter or click outside to save this custom job level
                </p>
              </div>
            )}
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
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {editForm.role ? getAllRoles().find(role => role.value === editForm.role)?.label || editForm.role : "Select instructor role"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search roles..." 
                  value={roleSearch}
                  onValueChange={setRoleSearch}
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
                    <div className="px-2 py-1 text-sm text-gray-500">Loading roles...</div>
                  ) : (
                    <>
                      <CommandEmpty>No role found.</CommandEmpty>
                      
                      {/* Add Custom Role Button - Moved to Top */}
                      <div className="border-b">
                        <CommandItem
                          onSelect={() => {
                            setEditForm(f => ({ 
                              ...f, 
                              role: 'custom',
                              roleOther: ''
                            }))
                            setRoleOpen(false)
                          }}
                          className="text-blue-600 font-medium"
                        >
                          <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">
                              +
                            </div>
                            Add Custom Role
                          </div>
                        </CommandItem>
                      </div>
                      
                      {Object.entries(getRolesByCategory()).map(([category, roles]) => {
                        const filteredRoles = roles.filter(role => 
                          role.label.toLowerCase().includes(roleSearch.toLowerCase())
                        );
                        
                        if (filteredRoles.length === 0) return null;
                        
                        return (
                          <CommandGroup key={category}>
                            <div className="px-2 py-1 text-xs text-gray-500 font-semibold select-none pointer-events-none">
                              {category}
                            </div>
                            {filteredRoles.map(role => (
                              <CommandItem
                                key={role.value}
                                value={role.value}
                                className="flex items-center justify-between"
                                onSelect={() => {
                                  setEditForm(f => ({ 
                                    ...f, 
                                    role: role.value,
                                    roleOther: role.value === 'custom' ? f.roleOther : ''
                                  }))
                                  setRoleOpen(false)
                                }}
                              >
                                <div className="flex items-center">
                                  <Check 
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editForm.role === role.value ? "opacity-100" : "opacity-0"
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
          {editForm.role === 'custom' && (
            <div className="mt-2">
              <Input
                placeholder="Enter custom role"
                value={editForm.roleOther}
                onChange={e => setEditForm(f => ({ ...f, roleOther: e.target.value }))}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && editForm.roleOther.trim()) {
                    const success = await addCustomRole(editForm.roleOther.trim())
                    if (success) {
                      setEditForm(f => ({ 
                        ...f, 
                        role: editForm.roleOther.trim(),
                        roleOther: ''
                      }))
                    } else {
                      alert('Role already exists or invalid input.')
                    }
                  }
                }}
              />
              <p className="text-sm text-gray-500 mt-1">
                Press Enter or click outside to save this custom role
              </p>
            </div>
          )}
        </div>

        {/* Years of Experience */}
        <div>
          <Label>Years of Experience <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            placeholder="0"
            value={editForm.yearsOfExperience}
            inputMode="numeric"
            pattern="[0-9]*"
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
                  setEditForm(f => ({ ...f, yearsOfExperience: digits }))
                }
              }
            }}
            onChange={(e) => {
              const value = e.target.value
              if (value === '' || /^\d+$/.test(value)) {
                setEditForm(f => ({ ...f, yearsOfExperience: value }))
              }
            }}
            onBlur={() => {
              const currentValue = parseInt(editForm.yearsOfExperience) || 0
              setEditForm(f => ({ ...f, yearsOfExperience: String(Math.max(0, currentValue)) }))
            }}
            min="0"
          />
        </div>

        {/* Joining Date (moved to end) */}
        <div>
          <Label>Joining Date <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              type="date"
              value={editForm.joiningDate || ''}
              onChange={(e) => setEditForm(f => ({ ...f, joiningDate: e.target.value }))}
              onFocus={() => setJoiningDateFocused(true)}
              onBlur={() => setJoiningDateFocused(false)}
              required
              className={`px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent ${joiningDateFocused ? '' : 'text-transparent'}`}
            />
            {!joiningDateFocused && (
              <div className={`absolute inset-0 flex items-center px-3 text-sm pointer-events-none ${editForm.joiningDate ? 'text-gray-900' : 'text-gray-500'}`}>
                {editForm.joiningDate ? formatDateToDisplay(editForm.joiningDate) : 'dd-mmm-yy'}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
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
          className="w-28 justify-between font-normal"
        >
          <div className="text-sm font-medium tracking-wide">
            {(() => {
              if (!value) return 'Code'
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
                    <span className="flex-1 truncate text-left text-gray-700">{item.label}</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
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
