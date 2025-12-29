"use client"
import React from "react"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/dashboard/ui/select"
import { Button } from "@/components/dashboard/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/dashboard/ui/command"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/dashboard/staff/utils"
import { useCustomUpiProviders } from "@/hooks/dashboard/staff/use-custom-upi-providers"
// Removed Payment Structure UI note no longer accurate; adding Select for UPI provider
import type { InstructorFormData } from "./types"

interface PaymentTabProps {
  form: InstructorFormData
  setForm: React.Dispatch<React.SetStateAction<InstructorFormData>>
}

const PaymentTab: React.FC<PaymentTabProps> = ({ form, setForm }) => {
  const { getAllProviders, addCustomProvider, loading, refresh } = useCustomUpiProviders()
  const [providerOpen, setProviderOpen] = React.useState(false)
  const [providerSearch, setProviderSearch] = React.useState("")
  const [ifscError, setIfscError] = React.useState<string | null>(null)
  const [bankNameError, setBankNameError] = React.useState<string | null>(null)
  const [accountHolderError, setAccountHolderError] = React.useState<string | null>(null)
  const [accountNumberError, setAccountNumberError] = React.useState<string | null>(null)
  const [branchAddressError, setBranchAddressError] = React.useState<string | null>(null)
  const [upiIdError, setUpiIdError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (providerOpen) {
      try { refresh() } catch {}
    }
  }, [providerOpen, refresh])

  // Validate name fields to accept only letters and spaces
  const validateNameField = (value: string, fieldName: string, setError: (error: string | null) => void) => {
    if (!value || !value.trim()) {
      setError(null)
      return true
    }
    
    if (!/^[A-Za-z ]+$/.test(value)) {
      setError(`${fieldName} can only contain letters and spaces`)
      return false
    }
    
    setError(null)
    return true
  }

  // Validate account number: 9-18 digits
  const validateAccountNumber = (value: string) => {
    if (!value || !value.trim()) {
      setAccountNumberError(null)
      return true
    }
    
    const digits = value.replace(/\D/g, '')
    
    if (digits.length < 9) {
      setAccountNumberError("Account number must be at least 9 digits")
      return false
    }
    
    if (digits.length > 18) {
      setAccountNumberError("Account number cannot exceed 18 digits")
      return false
    }
    
    setAccountNumberError(null)
    return true
  }

  // Validate branch address: minimum 5 characters
  const validateBranchAddress = (value: string) => {
    if (!value || !value.trim()) {
      setBranchAddressError(null)
      return true
    }
    
    if (value.trim().length < 5) {
      setBranchAddressError("Branch address must be at least 5 characters")
      return false
    }
    
    setBranchAddressError(null)
    return true
  }

  // Validate UPI ID format: username@provider
  const validateUpiId = (value: string) => {
    if (!value || !value.trim()) {
      setUpiIdError(null)
      return true
    }
    
    const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/
    
    if (!value.includes('@')) {
      setUpiIdError("UPI ID must contain @ symbol (e.g., name@bank)")
      return false
    }
    
    if (!upiRegex.test(value)) {
      setUpiIdError("Invalid UPI ID format. Use: username@provider")
      return false
    }
    
    const [username, provider] = value.split('@')
    
    if (username.length < 3) {
      setUpiIdError("Username before @ must be at least 3 characters")
      return false
    }
    
    if (provider.length < 2) {
      setUpiIdError("Provider after @ must be at least 2 characters")
      return false
    }
    
    setUpiIdError(null)
    return true
  }

  // IFSC validation: 11 characters, first 4 letters, 5th is 0, last 6 alphanumeric
  const validateIfsc = (value: string) => {
    if (!value || !value.trim()) {
      setIfscError(null)
      return true
    }
    
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    const trimmed = value.trim().toUpperCase()
    
    if (trimmed.length !== 11) {
      setIfscError("IFSC code must be exactly 11 characters")
      return false
    }
    
    if (!ifscRegex.test(trimmed)) {
      if (!/^[A-Z]{4}/.test(trimmed)) {
        setIfscError("First 4 characters must be letters (bank code)")
      } else if (trimmed[4] !== '0') {
        setIfscError("5th character must be 0")
      } else if (!/^[A-Z0-9]{6}$/.test(trimmed.slice(5))) {
        setIfscError("Last 6 characters must be letters or numbers (branch code)")
      } else {
        setIfscError("Invalid IFSC code format")
      }
      return false
    }
    
    setIfscError(null)
    return true
  }

  return (
    <div>
      <div className="border rounded-lg p-4 mb-4 space-y-6">
        {/* 1. Bank Details */}
        <div>
          <h3 className="font-semibold text-base mb-2 text-purple-700">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IFSC first */}
            <div>
              <Label>IFSC/SWIFT/BIC Code</Label>
              <Input
                placeholder="e.g. SBIN0001234"
                value={form.paymentInfo.ifsc || ''}
                maxLength={11}
                onChange={e => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, ifsc: value } }))
                  if (value) validateIfsc(value)
                  else setIfscError(null)
                }}
                onBlur={e => {
                  const value = e.target.value
                  if (value) validateIfsc(value)
                }}
                className={cn(ifscError ? "border-red-500 focus:ring-red-400" : "")}
              />
              {ifscError && (
                <p className="mt-1 text-[12px] text-red-600">{ifscError}</p>
              )}
              <p className="mt-1 text-[10px] text-gray-500">11 characters: 4 letters + 0 + 6 alphanumeric</p>
            </div>
            {/* Bank name next */}
            <div>
              <Label>Bank Name</Label>
              <Input
                placeholder="Enter bank name"
                value={form.paymentInfo.bankName || ''}
                onKeyDown={(e) => {
                  const k = e.key
                  const isControl =
                    e.ctrlKey || e.metaKey || e.altKey ||
                    ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(k)
                  if (isControl) return
                  if (k.length === 1 && !/[A-Za-z ]/.test(k)) {
                    e.preventDefault()
                    setBankNameError("Bank name can only contain letters and spaces")
                  }
                }}
                onChange={e => {
                  const sanitized = e.target.value.replace(/[^A-Za-z ]/g, "")
                  setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, bankName: sanitized } }))
                  if (sanitized !== e.target.value) {
                    setBankNameError("Bank name can only contain letters and spaces")
                  } else {
                    setBankNameError(null)
                  }
                }}
                onBlur={(e) => validateNameField(e.target.value, "Bank name", setBankNameError)}
                className={cn(bankNameError ? "border-red-500 focus:ring-red-400" : "")}
              />
              {bankNameError && (
                <p className="mt-1 text-[12px] text-red-600">{bankNameError}</p>
              )}
            </div>
            {/* Account holder name */}
            <div>
              <Label>Account Holder Name</Label>
              <Input
                placeholder="Enter account holder name"
                value={form.paymentInfo.accountHolder || ''}
                onKeyDown={(e) => {
                  const k = e.key
                  const isControl =
                    e.ctrlKey || e.metaKey || e.altKey ||
                    ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(k)
                  if (isControl) return
                  if (k.length === 1 && !/[A-Za-z ]/.test(k)) {
                    e.preventDefault()
                    setAccountHolderError("Account holder name can only contain letters and spaces")
                  }
                }}
                onChange={e => {
                  const sanitized = e.target.value.replace(/[^A-Za-z ]/g, "")
                  setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, accountHolder: sanitized } }))
                  if (sanitized !== e.target.value) {
                    setAccountHolderError("Account holder name can only contain letters and spaces")
                  } else {
                    setAccountHolderError(null)
                  }
                }}
                onBlur={(e) => validateNameField(e.target.value, "Account holder name", setAccountHolderError)}
                className={cn(accountHolderError ? "border-red-500 focus:ring-red-400" : "")}
              />
              {accountHolderError && (
                <p className="mt-1 text-[12px] text-red-600">{accountHolderError}</p>
              )}
            </div>
            {/* Account number - digits only */}
            <div>
              <Label>Account Number</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="Enter account number"
                value={form.paymentInfo.accountNumber || ''}
                maxLength={18}
                onKeyDown={(e) => {
                  const allowed = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"]
                  if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return
                  if (/^[0-9]$/.test(e.key)) return
                  e.preventDefault()
                }}
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, accountNumber: digitsOnly } }))
                  if (digitsOnly) validateAccountNumber(digitsOnly)
                  else setAccountNumberError(null)
                }}
                onBlur={e => {
                  const value = e.target.value
                  if (value) validateAccountNumber(value)
                }}
                className={cn(accountNumberError ? "border-red-500 focus:ring-red-400" : "")}
              />
              {accountNumberError && (
                <p className="mt-1 text-[12px] text-red-600">{accountNumberError}</p>
              )}
              <p className="mt-1 text-[10px] text-gray-500">9-18 digits</p>
            </div>
            <div className="md:col-span-2">
              <Label>Branch Name & Address</Label>
              <Input
                placeholder="Enter branch name and address"
                value={form.paymentInfo.branchAddress || ''}
                onChange={e => {
                  setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, branchAddress: e.target.value } }))
                  if (e.target.value) validateBranchAddress(e.target.value)
                  else setBranchAddressError(null)
                }}
                onBlur={e => {
                  const value = e.target.value
                  if (value) validateBranchAddress(value)
                }}
                className={cn(branchAddressError ? "border-red-500 focus:ring-red-400" : "")}
              />
              {branchAddressError && (
                <p className="mt-1 text-[12px] text-red-600">{branchAddressError}</p>
              )}
            </div>
          </div>

        </div>

        {/* 2. Online Payment (UPI) */}
        <div>
          <h3 className="font-semibold text-base mb-2 text-purple-700">Online Payment (UPI)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Provider</Label>
              <Popover open={providerOpen} onOpenChange={(open) => {
                setProviderOpen(open)
                if (!open) setProviderSearch("")
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {form.paymentInfo.upiProvider ? form.paymentInfo.upiProvider : "Select provider"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or add providers..."
                      value={providerSearch}
                      onValueChange={(value) => {
                        // Only allow letters, spaces, and basic punctuation (no numbers)
                        const filtered = value.replace(/[0-9]/g, '')
                        setProviderSearch(filtered)
                      }}
                      onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                        const query = providerSearch.trim()
                        const exists = getAllProviders().some(p => p.label.toLowerCase() === query.toLowerCase())
                        const hasNumbers = /\d/.test(query)
                        const isLettersAndSpacesOnly = /^[A-Za-z ]+$/.test(query)
                        if (e.key === 'Enter' && query && !exists && isLettersAndSpacesOnly && !hasNumbers) {
                          const ok = await addCustomProvider(query)
                          if (ok) {
                            setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: query } }))
                            setProviderOpen(false)
                            setProviderSearch("")
                          }
                        }
                      }}
                      className="h-9"
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                      {loading ? (
                        <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading providers...</div>
                      ) : (
                        <>
                          <CommandEmpty>No provider found.</CommandEmpty>
                          {(() => {
                            const query = providerSearch.trim()
                            const exists = getAllProviders().some(p => p.label.toLowerCase() === query.toLowerCase())
                            const isLettersAndSpacesOnly = /^[A-Za-z ]+$/.test(query)
                            if (!query || exists || !isLettersAndSpacesOnly) return null
                            return (
                              <CommandItem
                                onSelect={async () => {
                                  const ok = await addCustomProvider(query)
                                  if (ok) {
                                    setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: query } }))
                                    setProviderOpen(false)
                                    setProviderSearch("")
                                  }
                                }}
                                className="text-blue-600 font-medium"
                              >
                                <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                                Add "{query}" as new provider
                              </CommandItem>
                            )
                          })()}

                          <CommandGroup>
                            {getAllProviders()
                              .filter(p => p.label.toLowerCase().includes(providerSearch.toLowerCase()))
                              .map(p => (
                                <CommandItem
                                  key={p.value}
                                  value={p.value}
                                  className="flex items-center justify-between"
                                  onSelect={() => {
                                    setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: p.label } }))
                                    setProviderOpen(false)
                                  }}
                                >
                                  <div className="flex items-center">
                                    <Check className={cn("mr-2 h-4 w-4", form.paymentInfo.upiProvider === p.label ? "opacity-100" : "opacity-0")} />
                                    {p.label}
                                  </div>
                                  {null}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>UPI ID</Label>
              <Input
                placeholder="yourname@bank or 9876543210@upi"
                value={form.paymentInfo.upiId || ''}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/\s/g, '')
                  setForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiId: value } }))
                  if (value) validateUpiId(value)
                  else setUpiIdError(null)
                }}
                onBlur={(e) => {
                  const value = e.target.value
                  if (value) validateUpiId(value)
                }}
                className={cn(upiIdError ? "border-red-500 focus:ring-red-400" : "")}
              />
              {upiIdError && (
                <p className="mt-1 text-[12px] text-red-600">{upiIdError}</p>
              )}
              <p className="mt-1 text-[10px] text-gray-500">Format: username@provider</p>
            </div>
          </div>
        </div>

        {/* Payment Structure removed as per request */}

      </div>
    </div>
  )
}

export default PaymentTab
