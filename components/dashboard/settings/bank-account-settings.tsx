"use client"

import React, { useState, useEffect } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/dashboard/ui/dialog"
import { Landmark, Plus, Pencil, Trash2, Building2, CreditCard, Loader2, Search, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/ui/alert"

interface BankAccount {
  _id?: string
  id?: string
  holderName: string
  accountNumber: string
  accountType: string
  bankName: string
  ifsc: string
  branch: string
  micr?: string
  isPrimary?: boolean
}

interface BankFormData {
  holderName: string
  accountNumber: string
  accountType: string
  bankName: string
  ifsc: string
  branch: string
  micr: string
}

const initialFormData: BankFormData = {
  holderName: "",
  accountNumber: "",
  accountType: "",
  bankName: "",
  ifsc: "",
  branch: "",
  micr: ""
}

export function BankAccountSettings() {
  const { primaryColor } = useCustomColors()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [bankForm, setBankForm] = useState<BankFormData>(initialFormData)
  const [originalFormData, setOriginalFormData] = useState<BankFormData>(initialFormData)
  const [isFormModified, setIsFormModified] = useState(false)
  const [bankFormError, setBankFormError] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; description?: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const isFormValid = bankForm.holderName && bankForm.accountNumber && bankForm.accountType && bankForm.bankName && bankForm.ifsc && bankForm.branch

  // Track form modifications
  useEffect(() => {
    if (editingAccount) {
      // Check if any field has changed from original
      const hasChanged = 
        bankForm.holderName !== originalFormData.holderName ||
        bankForm.accountNumber !== originalFormData.accountNumber ||
        bankForm.accountType !== originalFormData.accountType ||
        bankForm.bankName !== originalFormData.bankName ||
        bankForm.ifsc !== originalFormData.ifsc ||
        bankForm.branch !== originalFormData.branch ||
        bankForm.micr !== originalFormData.micr
      setIsFormModified(hasChanged)
    } else {
      // In add mode, form is always considered modified if fields are filled
      setIsFormModified(true)
    }
  }, [bankForm, originalFormData, editingAccount])

  // Fetch bank accounts from the database on component mount
  useEffect(() => {
    fetchBankAccounts()
  }, [])

  async function fetchBankAccounts() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dashboard/financial?collection=bankaccounts', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Map _id to id for consistency
        const accounts = data.map((acc: any) => ({
          ...acc,
          id: acc._id || acc.id
        }))
        setBankAccounts(accounts)
      } else {
        console.error('Failed to fetch bank accounts:', response.statusText)
        toast({ 
          title: "Error", 
          description: "Failed to load bank accounts. Please try again.", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
      toast({ 
        title: "Error", 
        description: "Failed to load bank accounts. Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleBankChange(field: string, value: string) {
    setBankForm((prev) => ({ ...prev, [field]: value }))
    setBankFormError("")
  }

  function hasUnsavedChanges(): boolean {
    // Check if any field has been filled or modified
    if (!editingAccount) {
      // In add mode, check if any field has data
      return !!(bankForm.holderName || bankForm.accountNumber || bankForm.accountType || 
               bankForm.bankName || bankForm.ifsc || bankForm.branch || bankForm.micr)
    } else {
      // In edit mode, check if form is modified
      return isFormModified
    }
  }

  function handleDialogClose(open: boolean) {
    if (!open && hasUnsavedChanges()) {
      // Prevent closing and show confirmation dialog
      setUnsavedChangesDialogOpen(true)
    } else {
      setDialogOpen(open)
    }
  }

  function discardChanges() {
    setUnsavedChangesDialogOpen(false)
    setDialogOpen(false)
    setBankForm(initialFormData)
    setOriginalFormData(initialFormData)
    setIsFormModified(false)
    setBankFormError("")
  }

  function openAddDialog() {
    setEditingAccount(null)
    setBankForm(initialFormData)
    setOriginalFormData(initialFormData)
    setIsFormModified(false)
    setBankFormError("")
    setDialogOpen(true)
  }

  function openViewDialog(account: BankAccount) {
    setViewingAccount(account)
    setViewDialogOpen(true)
  }

  function openEditDialog(account: BankAccount) {
    setEditingAccount(account)
    const formData = {
      holderName: account.holderName,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      bankName: account.bankName,
      ifsc: account.ifsc,
      branch: account.branch,
      micr: account.micr || ""
    }
    setBankForm(formData)
    setOriginalFormData(formData)
    setIsFormModified(false)
    setBankFormError("")
    setDialogOpen(true)
  }

  async function handleBankSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bankForm.holderName || !bankForm.accountNumber || !bankForm.accountType || !bankForm.bankName || !bankForm.ifsc || !bankForm.branch) {
      setBankFormError("All fields except MICR Code are required.")
      return
    }

    setIsSaving(true)
    try {
      if (editingAccount) {
        // Update existing account
        const accountId = editingAccount._id || editingAccount.id
        const response = await fetch(`/api/dashboard/financial?collection=bankaccounts&id=${accountId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holderName: bankForm.holderName,
            accountNumber: bankForm.accountNumber,
            accountType: bankForm.accountType,
            bankName: bankForm.bankName,
            ifsc: bankForm.ifsc,
            branch: bankForm.branch,
            micr: bankForm.micr || undefined,
            isPrimary: editingAccount.isPrimary
          })
        })

        if (response.ok) {
          const updatedAccount = await response.json()
          setBankAccounts(prev => prev.map(acc => 
            (acc._id || acc.id) === accountId 
              ? { ...updatedAccount, id: updatedAccount._id || updatedAccount.id }
              : acc
          ))
          toast({ title: "Bank Account Updated", description: "Bank account details have been updated successfully." })
          // Clear options cache so financials page picks up updated account
          sessionStorage.removeItem('income-options')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update bank account')
        }
      } else {
        // Add new account
        const response = await fetch('/api/dashboard/financial?collection=bankaccounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holderName: bankForm.holderName,
            accountNumber: bankForm.accountNumber,
            accountType: bankForm.accountType,
            bankName: bankForm.bankName,
            ifsc: bankForm.ifsc,
            branch: bankForm.branch,
            micr: bankForm.micr || undefined,
            isPrimary: bankAccounts.length === 0 // First account is primary
          })
        })

        if (response.ok) {
          const newAccount = await response.json()
          setBankAccounts(prev => [...prev, { ...newAccount, id: newAccount._id }])
          toast({ title: "Bank Account Added", description: "Bank account details have been saved successfully." })
          // Clear options cache so financials page picks up new account
          sessionStorage.removeItem('income-options')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add bank account')
        }
      }

      setDialogOpen(false)
      setBankForm(initialFormData)
      setEditingAccount(null)
    } catch (error: any) {
      console.error('Error saving bank account:', error)
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save bank account. Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleDeleteClick(accountId: string) {
    setAccountToDelete(accountId)
    setDeleteConfirmOpen(true)
  }

  async function confirmDelete() {
    if (accountToDelete) {
      try {
        const response = await fetch(`/api/dashboard/financial?collection=bankaccounts&id=${accountToDelete}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (response.ok) {
          setBankAccounts(prev => prev.filter(acc => (acc._id || acc.id) !== accountToDelete))
          toast({ title: "Bank Account Removed", description: "Bank account has been removed successfully." })
          // Clear options cache so financials page reflects the change
          sessionStorage.removeItem('income-options')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete bank account')
        }
      } catch (error: any) {
        console.error('Error deleting bank account:', error)
        toast({ 
          title: "Error", 
          description: error.message || "Failed to delete bank account. Please try again.", 
          variant: "destructive" 
        })
      }
    }
    setDeleteConfirmOpen(false)
    setAccountToDelete(null)
  }

  async function setAsPrimary(accountId: string) {
    try {
      // Update all accounts - set the selected one as primary, others as non-primary
      const updatePromises = bankAccounts.map(async (acc) => {
        const id = acc._id || acc.id
        const isPrimary = id === accountId
        
        await fetch(`/api/dashboard/financial?collection=bankaccounts&id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...acc,
            isPrimary
          })
        })
        
        return { ...acc, isPrimary }
      })

      const updatedAccounts = await Promise.all(updatePromises)
      setBankAccounts(updatedAccounts)
      toast({ title: "Primary Account Updated", description: "Primary bank account has been updated." })
    } catch (error: any) {
      console.error('Error setting primary account:', error)
      toast({ 
        title: "Error", 
        description: "Failed to update primary account. Please try again.", 
        variant: "destructive" 
      })
    }
  }

  function maskAccountNumber(accountNumber: string) {
    if (accountNumber.length <= 4) return accountNumber
    return "XXXX" + accountNumber.slice(-4)
  }

  // Filter bank accounts based on search query
  const filteredBankAccounts = bankAccounts.filter((account) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      account.bankName.toLowerCase().includes(query) ||
      account.holderName.toLowerCase().includes(query) ||
      account.accountNumber.includes(query) ||
      account.ifsc.toLowerCase().includes(query) ||
      account.branch.toLowerCase().includes(query) ||
      account.accountType.toLowerCase().includes(query)
    )
  })

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" style={{ color: primaryColor }} />
                  Bank Accounts
                </CardTitle>
                <CardDescription>
                  Manage your bank accounts for receiving payments and payouts
                </CardDescription>
              </div>
              <Button
                onClick={openAddDialog}
                className="gap-2"
                title="Add Bank Account"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                <Plus className="h-4 w-4" />
                Add Bank Account
              </Button>
            </div>
            {bankAccounts.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by bank name, holder, account number, IFSC, branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div 
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Bank Accounts Added
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                Add your bank account details to receive payments and manage payouts securely.
              </p>
              <Button
                onClick={openAddDialog}
                variant="outline"
                className="gap-2"
                title="Add Your First Bank Account"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Plus className="h-4 w-4" />
                Add Your First Bank Account
              </Button>
            </div>
          ) : filteredBankAccounts.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div 
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Search className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Results Found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                No bank accounts match your search criteria. Try a different search term.
              </p>
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {[...filteredBankAccounts]
                .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                .map((account) => (
                <div
                  key={account._id || account.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => openViewDialog(account)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div 
                      className="rounded-full p-2.5"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {account.bankName}
                        </h4>
                        {account.isPrimary && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-600 text-white"
                          >
                            Primary
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {account.accountType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {account.holderName}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>A/C: {maskAccountNumber(account.accountNumber)}</span>
                        <span>IFSC: {account.ifsc}</span>
                        <span>Branch: {account.branch}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                    {!account.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsPrimary(account._id || account.id || '')}
                        className="text-xs"
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(account)}
                      className="h-8 w-8"
                      title="Edit Account"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Account"
                      onClick={() => handleDeleteClick(account._id || account.id || '')}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Bank Account Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => {
          if (hasUnsavedChanges()) {
            e.preventDefault()
            setUnsavedChangesDialogOpen(true)
          }
        }}>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="holderName">
                  Account Holder Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="holderName"
                  type="text"
                  placeholder="Enter account holder name"
                  value={bankForm.holderName}
                  onChange={e => {
                    const value = e.target.value
                    // Only allow letters, spaces, hyphens, apostrophes, and dots
                    const sanitizedValue = value
                      .replace(/[^a-zA-Z\s\-'.]/g, '')
                      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
                      .replace(/[\-']{2,}/g, (match) => match[0]) // Prevent consecutive special chars
                    if (value !== sanitizedValue) {
                      toast({
                        title: "Invalid Characters",
                        description: "Account holder name can only contain letters, spaces, and valid punctuation (-, ', .)",
                        variant: "destructive",
                      })
                    }
                    handleBankChange("holderName", sanitizedValue)
                  }}
                  onBlur={(e) => {
                    // Trim leading/trailing spaces and special characters on blur
                    const trimmed = e.target.value.trim().replace(/^[\-'.]+|[\-'.]+$/g, '')
                    if (trimmed !== e.target.value) {
                      handleBankChange("holderName", trimmed)
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  Account Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter account number"
                  value={bankForm.accountNumber}
                  onChange={e => {
                    const value = e.target.value
                    const sanitizedValue = value.replace(/[^0-9]/g, "")
                    if (value !== sanitizedValue) {
                      toast({
                        title: "Invalid Characters",
                        description: "Account number can only contain digits (0-9)",
                        variant: "destructive",
                      })
                    }
                    handleBankChange("accountNumber", sanitizedValue)
                  }}
                  required
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">
                  Account Type<span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={bankForm.accountType} 
                  onValueChange={v => handleBankChange("accountType", v)}
                >
                  <SelectTrigger id="accountType">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="NRE">NRE</SelectItem>
                    <SelectItem value="NRO">NRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">
                  Bank Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankName"
                  type="text"
                  placeholder="Enter bank name"
                  value={bankForm.bankName}
                  onChange={e => {
                    const value = e.target.value
                    // Allow letters, spaces, ampersand, hyphens, apostrophes, and dots (e.g., HSBC Bank, State Bank of India)
                    const sanitizedValue = value
                      .replace(/[^a-zA-Z\s&\-'.]/g, '')
                      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
                      .replace(/[&\-']{2,}/g, (match) => match[0]) // Prevent consecutive special chars
                    if (value !== sanitizedValue) {
                      toast({
                        title: "Invalid Characters",
                        description: "Bank name can only contain letters, spaces, and valid punctuation (&, -, ', .)",
                        variant: "destructive",
                      })
                    }
                    handleBankChange("bankName", sanitizedValue)
                  }}
                  onBlur={(e) => {
                    // Trim leading/trailing spaces and special characters on blur
                    const trimmed = e.target.value.trim().replace(/^[&\-'.]+|[&\-'.]+$/g, '')
                    if (trimmed !== e.target.value) {
                      handleBankChange("bankName", trimmed)
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">
                  IFSC Code<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ifsc"
                  type="text"
                  placeholder="e.g., SBIN0001234"
                  className="uppercase"
                  value={bankForm.ifsc}
                  onChange={e => {
                    const value = e.target.value.toUpperCase()
                    // Only allow alphanumeric characters for IFSC
                    const sanitizedValue = value.replace(/[^A-Z0-9]/g, '')
                    if (value !== sanitizedValue) {
                      toast({
                        title: "Invalid Characters",
                        description: "IFSC code can only contain letters and numbers",
                        variant: "destructive",
                      })
                    }
                    handleBankChange("ifsc", sanitizedValue)
                  }}
                  onBlur={(e) => {
                    const value = e.target.value
                    // Validate IFSC format: 4 letters, then 0, then 6 alphanumeric
                    if (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
                      toast({
                        title: "Invalid IFSC Code",
                        description: "IFSC must be 11 characters: 4 letters, followed by 0, then 6 alphanumeric (e.g., SBIN0001234)",
                        variant: "destructive",
                      })
                    }
                  }}
                  required
                  maxLength={11}
                  pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                  title="Enter valid IFSC code (e.g., SBIN0001234)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">
                  Branch Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="branch"
                  type="text"
                  placeholder="Enter branch name"
                  value={bankForm.branch}
                  onChange={e => {
                    const value = e.target.value
                    // Allow letters, spaces, hyphens, apostrophes, and dots (e.g., Main Branch, St. Mary's Road)
                    const sanitizedValue = value
                      .replace(/[^a-zA-Z\s\-'.]/g, '')
                      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
                      .replace(/[\-']{2,}/g, (match) => match[0]) // Prevent consecutive special chars
                    if (value !== sanitizedValue) {
                      toast({
                        title: "Invalid Characters",
                        description: "Branch name can only contain letters, spaces, and valid punctuation (-, ', .)",
                        variant: "destructive",
                      })
                    }
                    handleBankChange("branch", sanitizedValue)
                  }}
                  onBlur={(e) => {
                    // Trim leading/trailing spaces and special characters on blur
                    const trimmed = e.target.value.trim().replace(/^[\-'.]+|[\-'.]+$/g, '')
                    if (trimmed !== e.target.value) {
                      handleBankChange("branch", trimmed)
                    }
                  }}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="micr">MICR Code</Label>
                <Input
                  id="micr"
                  type="text"
                  placeholder="Enter MICR code (9 digits)"
                  value={bankForm.micr}
                  onChange={e => {
                    const value = e.target.value
                    const sanitizedValue = value.replace(/[^0-9]/g, "")
                    if (value !== sanitizedValue) {
                      toast({
                        title: "Invalid Characters",
                        description: "MICR code can only contain digits (0-9)",
                        variant: "destructive",
                      })
                    }
                    handleBankChange("micr", sanitizedValue)
                  }}
                  onBlur={(e) => {
                    const value = e.target.value
                    if (value && value.length !== 9) {
                      toast({
                        title: "Invalid MICR Code",
                        description: "MICR code must be exactly 9 digits",
                        variant: "destructive",
                      })
                    }
                  }}
                  maxLength={9}
                />
              </div>
            </div>
            {bankFormError && (
              <div className="text-red-600 text-sm">{bankFormError}</div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSaving}
                onClick={() => {
                  if (hasUnsavedChanges()) {
                    setUnsavedChangesDialogOpen(true)
                  } else {
                    setDialogOpen(false)
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isFormValid || isSaving || (!!editingAccount && !isFormModified)}
                style={{ backgroundColor: isFormValid && !isSaving && (editingAccount ? isFormModified : true) ? primaryColor : undefined }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingAccount ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingAccount ? "Update Account" : "Add Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Bank Account Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
              Bank Account Details
            </DialogTitle>
          </DialogHeader>
          {viewingAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Account Holder Name</Label>
                  <p className="font-medium">{viewingAccount.holderName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Account Number</Label>
                  <p className="font-medium font-mono">{viewingAccount.accountNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Account Type</Label>
                  <p className="font-medium">{viewingAccount.accountType}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Bank Name</Label>
                  <p className="font-medium">{viewingAccount.bankName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">IFSC Code</Label>
                  <p className="font-medium font-mono">{viewingAccount.ifsc}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Branch Name</Label>
                  <p className="font-medium">{viewingAccount.branch}</p>
                </div>
                {viewingAccount.micr && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-500 dark:text-gray-400 text-xs">MICR Code</Label>
                    <p className="font-medium font-mono">{viewingAccount.micr}</p>
                  </div>
                )}
                {viewingAccount.isPrimary && (
                  <div className="md:col-span-2">
                    <span 
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium bg-purple-600 text-white"
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Primary Account
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={unsavedChangesDialogOpen} onOpenChange={setUnsavedChangesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You have unsaved changes. Do you want to save them before closing?
          </p>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button 
              type="button" 
              variant="outline"
              onClick={discardChanges}
            >
              Discard Changes
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setUnsavedChangesDialogOpen(false)}
            >
              Continue Editing
            </Button>
            <Button 
              type="button"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setUnsavedChangesDialogOpen(false)
                // Trigger form submit programmatically
                const form = document.querySelector('form') as HTMLFormElement
                if (form) {
                  form.requestSubmit()
                }
              }}
              disabled={!isFormValid}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Bank Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to remove this bank account? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDelete}
            >
              Remove Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
