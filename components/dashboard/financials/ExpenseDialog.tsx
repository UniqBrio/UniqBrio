"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dashboard/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { useToast } from "@/hooks/dashboard/use-toast"
import { ExpenseFormData } from "./types"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/dashboard/ui/dropdown-menu";
import { Input } from "@/components/dashboard/ui/input";
import { ChevronDown, FileText } from "lucide-react";
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input";
import { ExpenseDraftsAPI } from "@/lib/dashboard/expense-drafts-api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip";

import type { Expense } from "./types";

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialExpense?: Expense | null
  mode?: 'add' | 'edit' | 'view'
  onSave?: (data: ExpenseFormData, mode: 'add' | 'edit') => void
  draftId?: string | null; // when editing an existing draft
  onDraftSave?: (draftId?: string) => void; // callback when draft is saved/updated
}

export function ExpenseDialog({ open, onOpenChange, initialExpense = null, mode = 'add', onSave, draftId = null, onDraftSave }: ExpenseDialogProps) {
  const { toast } = useToast();
  // Vendor Type search/add state
  const [vendorTypeSearchTerm, setVendorTypeSearchTerm] = useState("");
  const [vendorNameSearchTerm, setVendorNameSearchTerm] = useState("");
  const [expenseCategorySearchTerm, setExpenseCategorySearchTerm] = useState("");
  const [options, setOptions] = useState<{ expenseCategories: string[]; vendorNames: string[]; vendorTypes: string[]; paymentModes: string[]; accounts: string[] }>({ expenseCategories: [], vendorNames: [], vendorTypes: [], paymentModes: [], accounts: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Dropdown open states for Alt+Down keyboard handling
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [vendorNameDropdownOpen, setVendorNameDropdownOpen] = useState(false);
  const [vendorTypeDropdownOpen, setVendorTypeDropdownOpen] = useState(false);
  
  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper function to format date for display (dd-mmm-yyyy)
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString; // fallback to original if parsing fails
    }
  };
  
  const emptyExpenseForm: ExpenseFormData = {
    date: getCurrentDate(),
    amount: "",
    description: "",
    expenseCategory: "",
    vendorName: "",
    vendorType: "",
    paymentMode: "",
    addFromAccount: "",
    receivedBy: "",
    receivedFrom: "",
    receiptNumber: "",
    attachments: null
  };
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>(emptyExpenseForm)
  const isView = mode === 'view'
  const [hasJustSaved, setHasJustSaved] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  // Prevent double submission of draft
  const [savingDraft, setSavingDraft] = useState(false);
  // Track original snapshot for dirty comparison in edit mode
  const [originalExpenseSnapshot, setOriginalExpenseSnapshot] = useState<ExpenseFormData | null>(null);
  // Populate on open when initialExpense provided
  useEffect(() => {
    if (!open) return;
    // fetch dropdown options when dialog opens with session caching
    let cancelled = false;
    (async () => {
      try {
        setLoadingOptions(true);
        // Check session cache first
        const cached = sessionStorage.getItem('expense-options');
        if (cached) {
          const data = JSON.parse(cached);
          if (!cancelled) setOptions({
            expenseCategories: data.expenseCategories || [],
            vendorNames: data.vendorNames || [],
            vendorTypes: data.vendorTypes || [],
            paymentModes: data.paymentModes || [],
            accounts: data.accounts || [],
          });
          setLoadingOptions(false);
          return;
        }
        const res = await fetch('/api/dashboard/financial/financials/options');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setOptions({
              expenseCategories: data.expenseCategories || [],
              vendorNames: data.vendorNames || [],
              vendorTypes: data.vendorTypes || [],
              paymentModes: data.paymentModes || [],
              accounts: data.accounts || [],
            });
            // Cache for session
            sessionStorage.setItem('expense-options', JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error('Failed to fetch dropdown options', e);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    if (initialExpense) {
      const populated: ExpenseFormData = {
        ...emptyExpenseForm,
        date: initialExpense.date || "",
        amount: (initialExpense.amount ?? "").toString(),
        description: initialExpense.description || "",
        expenseCategory: initialExpense.expenseCategory || "",
        vendorName: initialExpense.vendorName || "",
        vendorType: initialExpense.vendorType || "",
        paymentMode: initialExpense.paymentMode || "",
        attachments: initialExpense.attachments ?? null,
        addFromAccount: initialExpense.addFromAccount || "",
        receivedBy: initialExpense.receivedBy || "",
        receivedFrom: initialExpense.receivedFrom || "",
        receiptNumber: initialExpense.receiptNumber || "",
      };
      setExpenseForm(populated);
      setOriginalExpenseSnapshot(JSON.parse(JSON.stringify({ ...populated, attachments: null })));
    } else {
      setExpenseForm(emptyExpenseForm)
      setOriginalExpenseSnapshot(JSON.parse(JSON.stringify({ ...emptyExpenseForm, attachments: null })));
    }
    setFieldErrors({})
    setExpenseFormError("")
  }, [open, initialExpense])
  const [expenseFormError, setExpenseFormError] = useState("")
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
    // Required fields & validation state (enable submit only when satisfied)
    const isRequiredFieldsFilled = (
      expenseForm.date.trim() !== '' &&
      expenseForm.amount.toString().trim() !== '' &&
      expenseForm.expenseCategory.trim() !== '' &&
      (expenseForm.paymentMode?.toLowerCase() === 'cash' || expenseForm.addFromAccount.trim() !== '')
    );
    const hasFieldErrors = Object.values(fieldErrors).some(err => !!err);

  function handleExpenseChange(field: string, value: any) {
      // Generic sanitization/validation rules per field
      let sanitized = value
      let error = ""

      // Dates: keep as-is (native date input handles format)
      if (field === "date") {
        // nothing to sanitize
      }

      // Amount: allow only positive whole numbers (no decimals)
      if (field === "amount") {
        // Remove anything except digits (no decimals allowed)
        sanitized = String(value).replace(/[^0-9]/g, "")
        
        // Validation
        if (!/^[0-9]*$/.test(sanitized)) {
          error = "Only whole numbers are allowed."
        } else if (sanitized && sanitized !== "0" && parseInt(sanitized) <= 0) {
          error = "Amount must be greater than 0."
        }
      }

      // Account IDs: digits only
      if (field === "senderAccountId" || field === "receiverAccountId") {
        sanitized = String(value).replace(/[^0-9]/g, "")
        if (!/^[0-9]*$/.test(sanitized)) error = "Only digits are allowed."
      }

      // Text fields: block control characters that are not printable and trim excessive whitespace
      const textFields = [
        'description',
        'receivedBy',
        'receivedFrom',
        'receiptNumber',
        'vendorName',
        'vendorType'
      ]

      if (textFields.includes(field)) {
        // remove non-printable characters except basic punctuation
        sanitized = String(value).replace(/[\x00-\x1F\x7F]/g, "")
        // disallow < and > to avoid accidental tag injection
        if (/[<>]/.test(sanitized)) {
          sanitized = sanitized.replace(/[<>]/g, '')
          error = "Invalid characters removed."
        }
      }

      // References/receipt: allow alphanumeric and -_/ only
      if (field === 'receiptNumber') {
        sanitized = String(value).replace(/[^a-zA-Z0-9-_\/]/g, '')
      }

      // Vendor type search term update (free text allowed but sanitized)
      if (field === 'vendorTypeSearchTerm') {
        sanitized = String(value).replace(/[\x00-\x1F\x7F<>]/g, '')
      }

      // Update field errors and form
      setFieldErrors(prev => ({ ...prev, [field]: error }))
      
      // Handle special logic for payment mode changes
      if (field === 'paymentMode') {
        setExpenseForm((prev) => ({ 
          ...prev, 
          [field]: sanitized,
          // Clear account when switching to cash, keep it when switching away from cash
          addFromAccount: sanitized?.toLowerCase() === 'cash' ? '' : prev.addFromAccount
        }));
      } else {
        setExpenseForm((prev) => ({ ...prev, [field]: sanitized }));
      }
      
    setExpenseFormError("")

      // Show immediate toast for invalid input if there's an error
      if (error) {
        toast({ title: 'Invalid input', description: error })
      }
  }

  // Memoize filtered options to prevent recalculation on every render
  const filteredExpenseCategories = useMemo(() => 
    (options.expenseCategories || [])
      .filter(cat => cat.toLowerCase().includes(expenseCategorySearchTerm.toLowerCase())),
    [options.expenseCategories, expenseCategorySearchTerm]
  );

  const filteredVendorNames = useMemo(() =>
    (options.vendorNames || [])
      .filter((vendor: string) => vendor.toLowerCase().includes(vendorNameSearchTerm.toLowerCase())),
    [options.vendorNames, vendorNameSearchTerm]
  );

  const filteredVendorTypes = useMemo(() =>
    (options.vendorTypes || [])
      .filter((type: string) => type.toLowerCase().includes(vendorTypeSearchTerm.toLowerCase())),
    [options.vendorTypes, vendorTypeSearchTerm]
  );

  // Dirty-state detection
  const isEditMode = !isView && !!initialExpense;
  
  // Check if form has any meaningful data filled
  const hasDataFilled = () => {
    const form = expenseForm;
    return (
      (form.amount && form.amount.trim() !== '') ||
      (form.description && form.description.trim() !== '') ||
      (form.expenseCategory && form.expenseCategory.trim() !== '') ||
      (form.vendorName && form.vendorName.trim() !== '') ||
      (form.vendorType && form.vendorType.trim() !== '') ||
      (form.paymentMode && form.paymentMode.trim() !== '') ||
      (form.addFromAccount && form.addFromAccount.trim() !== '') ||
      (form.receivedBy && form.receivedBy.trim() !== '') ||
      (form.receivedFrom && form.receivedFrom.trim() !== '') ||
      (form.receiptNumber && form.receiptNumber.trim() !== '') ||
      !!form.attachments
    );
  };
  
  const isDirty = isView ? false : (isEditMode ? (() => {
    if (!originalExpenseSnapshot) return false;
    const attachmentChanged = (() => {
      const origHas = !!initialExpense?.attachments;
      const currHas = !!expenseForm.attachments;
      if (origHas !== currHas) return true;
      if (!origHas && !currHas) return false;
      if (expenseForm.attachments && initialExpense?.attachments) {
        return expenseForm.attachments.name !== initialExpense.attachments.name || expenseForm.attachments.size !== initialExpense.attachments.size || expenseForm.attachments.type !== initialExpense.attachments.type;
      }
      return false;
    })();
    if (attachmentChanged) return true;
    const comparableCurrent = { ...expenseForm, attachments: null };
    return Object.keys(originalExpenseSnapshot).some(key => {
      // @ts-ignore
      return originalExpenseSnapshot[key] !== comparableCurrent[key];
    });
  })() : hasDataFilled()); // In add mode, only consider dirty if actual data is filled

  function handleExpenseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Final validation before submit
    if (!expenseForm.date || !expenseForm.amount || !expenseForm.expenseCategory || 
        (expenseForm.paymentMode?.toLowerCase() !== 'cash' && !expenseForm.addFromAccount)) {
      setExpenseFormError("Date, Amount, Category" + (expenseForm.paymentMode?.toLowerCase() !== 'cash' ? ", and From Account" : "") + " are required.")
      toast({ title: 'Validation error', description: 'Date, Amount, Category' + (expenseForm.paymentMode?.toLowerCase() !== 'cash' ? ', and From Account' : '') + ' are required.' })
      return
    }
    // Check for any field errors
    const anyErrors = Object.values(fieldErrors).some(err => err)
    if (anyErrors) {
      setExpenseFormError('Please fix the highlighted errors before submitting.')
      toast({ title: 'Validation error', description: 'Please fix invalid fields.' })
      return
    }
    onSave?.(expenseForm, initialExpense ? 'edit' : 'add')
    setHasJustSaved(true);
    onOpenChange(false)
    toast({ title: initialExpense ? "Expense Saved" : "Expense Added", description: initialExpense ? "Expense entry changes have been saved." : "Expense entry has been recorded." })
    // Reset form
    setExpenseForm(emptyExpenseForm)
  }

  // Save Draft function
  async function handleSaveDraft() {
    if (savingDraft) return; // guard against double clicks
    try {
      setSavingDraft(true);
      // Immediately close dialog to avoid double clicks
      onOpenChange(false);
      const draftName = ExpenseDraftsAPI.generateDraftName(expenseForm);
      
      if (draftId) {
        // Update existing draft
        const updatedDraft = await ExpenseDraftsAPI.updateDraft(draftId, {
          name: draftName,
          category: expenseForm.expenseCategory || 'Uncategorized',
          amount: expenseForm.amount || '0',
          data: expenseForm
        });
        toast({
          title: "?? Draft Updated",
          description: `Expense draft "${draftName}" has been updated successfully.`,
          duration: 3000,
        });
        
        // Trigger event to update draft counts
        const allDrafts = await ExpenseDraftsAPI.getAllDrafts();
        ExpenseDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'updated');
      } else {
        // Create new draft
        const newDraft = await ExpenseDraftsAPI.createDraft({
          name: draftName,
          category: expenseForm.expenseCategory || 'Uncategorized',
          amount: expenseForm.amount || '0',
          data: expenseForm
        });
        toast({
          title: "?? Draft Saved",
          description: `Expense draft "${draftName}" has been saved successfully.`,
          duration: 3000,
        });
        
        // Trigger event to update draft counts
        const allDrafts = await ExpenseDraftsAPI.getAllDrafts();
        ExpenseDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'created');
      }
      
      setHasJustSaved(true);
      onDraftSave?.(draftId || undefined);
      setExpenseForm(emptyExpenseForm);
    } catch (error) {
      console.error('Error saving expense draft:', error);
      toast({
        title: "? Save Failed",
        description: "Unable to save expense draft. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSavingDraft(false);
    }
  }

  function attemptClose() {
    if (isView) {
      onOpenChange(false);
      return;
    }
    if (isDirty && !hasJustSaved) {
      setShowUnsavedAlert(true);
      return;
    }
    setHasJustSaved(false);
    onOpenChange(false);
  }

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          attemptClose();
        } else {
          setHasJustSaved(false);
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className={isView ? 'pt-4 pr-4 pb-5 pl-5' : undefined}>
        {isView ? (
          <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#a78bfa]/60 scrollbar-track-[#f4f2ff]">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-semibold tracking-wide">Expense Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                <Detail label="Date" value={formatDateForDisplay(expenseForm.date)} />
                <Detail label="Amount" value={expenseForm.amount ? `${expenseForm.amount} INR` : '-'} />
                <Detail label="Category" value={expenseForm.expenseCategory || '-'} />
                <Detail label="Vendor Name" value={expenseForm.vendorName || '-'} />
                <Detail label="Vendor Type" value={expenseForm.vendorType || '-'} />
                <Detail label="Payment Mode" value={expenseForm.paymentMode || '-'} />
                <Detail label="Received By" value={expenseForm.receivedBy || '-'} />
                <Detail label="Received From" value={expenseForm.receivedFrom || '-'} />
                <Detail label="Receipt / Transaction No." value={expenseForm.receiptNumber || '-'} />
                <Detail label="From Account" value={expenseForm.addFromAccount || '-'} />
                <Detail label="Description" value={expenseForm.description || '-'} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#a78bfa]/60 scrollbar-track-[#f4f2ff]">
            <DialogHeader>
              <DialogTitle>
                {draftId ? 'Create Expense from Draft' : (initialExpense ? 'Edit Expense' : 'Add Expense Entry')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <style>{`
                input:focus, select:focus { cursor: pointer; }
              `}</style>
              
              {/* Original field order: Date, Amount, Category, Vendor Name, Vendor Type, Payment Mode, From Account, Description, Transaction Details, Attachment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormattedDateInput
                    id="expense-date"
                    label="Date"
                    value={expenseForm.date}
                    onChange={(date) => handleExpenseChange("date", date)}
                    required
                    error={!!fieldErrors.date}
                    className="input-bordered h-10"
                    tabIndex={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount" className="text-sm font-medium text-gray-700">Amount<span className="text-red-500">*</span></Label>
                  <input
                    id="expense-amount"
                    type="number"
                    min="0.01"
                    step="any"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    value={expenseForm.amount}
                    onChange={e => handleExpenseChange("amount", e.target.value)}
                    onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') { e.preventDefault(); } }}
                    required
                    tabIndex={2}
                    placeholder="Enter amount"
                    aria-label="Expense amount"
                    aria-required="true"
                    aria-invalid={!!fieldErrors.amount}
                    aria-describedby={fieldErrors.amount ? "amount-error" : undefined}
                  />
                  {fieldErrors.amount && <div id="amount-error" role="alert" className="text-red-600 text-xs mt-1">{fieldErrors.amount}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category" className="text-sm font-medium text-gray-700">Category<span className="text-red-500">*</span></Label>
                  <DropdownMenu open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        id="expense-category"
                        variant="outline" 
                        className="w-full h-10 text-left justify-between border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        tabIndex={3}
                        aria-label="Select expense category"
                        aria-haspopup="listbox"
                        aria-expanded={categoryDropdownOpen}
                        aria-required="true"
                        onKeyDown={(e) => {
                          if (e.altKey && e.key === 'ArrowDown') {
                            e.preventDefault();
                            setCategoryDropdownOpen(true);
                          }
                        }}
                      >
                        <span className="truncate">{expenseForm.expenseCategory || 'Select category'}</span>
                        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 text-[15px]">
                      <div className="mb-2" onClick={e => e.stopPropagation()}>
                        <Input placeholder="Search or type new category..." className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={expenseCategorySearchTerm} onChange={e => setExpenseCategorySearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto" role="listbox">
                        {filteredExpenseCategories
                          .map(cat => (
                            <DropdownMenuItem key={cat} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${expenseForm.expenseCategory === cat ? 'bg-purple-100' : ''}`} onSelect={() => { handleExpenseChange('expenseCategory', cat); setExpenseCategorySearchTerm(''); }}>
                              {cat}
                            </DropdownMenuItem>
                          ))}
                        {expenseCategorySearchTerm && !((options.expenseCategories || []).find((cat: string) => cat.toLowerCase() === expenseCategorySearchTerm.toLowerCase())) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]" onSelect={async () => { const newVal = expenseCategorySearchTerm; setExpenseCategorySearchTerm(''); handleExpenseChange('expenseCategory', newVal); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'expenseCategories', value: newVal }) }); setOptions(prev => ({ ...prev, expenseCategories: Array.from(new Set([...(prev.expenseCategories || []), newVal])) })); } catch (e) { console.error('Failed to persist new category', e); } }}>
                            Add "{expenseCategorySearchTerm}" as new category
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-vendor-name" className="text-sm font-medium text-gray-700">Vendor Name</Label>
                  <DropdownMenu open={vendorNameDropdownOpen} onOpenChange={setVendorNameDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        id="expense-vendor-name"
                        variant="outline" 
                        className="w-full h-10 text-left justify-between border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        tabIndex={4}
                        aria-label="Select vendor name"
                        aria-haspopup="listbox"
                        aria-expanded={vendorNameDropdownOpen}
                        onKeyDown={(e) => {
                          if (e.altKey && e.key === 'ArrowDown') {
                            e.preventDefault();
                            setVendorNameDropdownOpen(true);
                          }
                        }}
                      >
                        <span className="truncate">{expenseForm.vendorName || 'Select vendor'}</span>
                        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 text-[15px]">
                      <div className="mb-2" onClick={e => e.stopPropagation()}>
                        <Input placeholder="Search or type new vendor..." className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={vendorNameSearchTerm} onChange={e => setVendorNameSearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto" role="listbox">
                        {filteredVendorNames
                          .map((vendor: string) => (
                            <DropdownMenuItem key={vendor} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${expenseForm.vendorName === vendor ? 'bg-purple-100' : ''}`} onSelect={() => { handleExpenseChange('vendorName', vendor); setVendorNameSearchTerm(''); }}>
                              {vendor}
                            </DropdownMenuItem>
                          ))}
                        {vendorNameSearchTerm && !((options.vendorNames || []) as string[]).find((vendor: string) => vendor.toLowerCase() === vendorNameSearchTerm.toLowerCase()) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]" onSelect={async () => { const newVal = vendorNameSearchTerm; setVendorNameSearchTerm(''); handleExpenseChange('vendorName', newVal); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'vendorNames', value: newVal }) }); setOptions(prev => ({ ...prev, vendorNames: Array.from(new Set([...(prev.vendorNames || []), newVal])) })); } catch (e) { console.error('Failed to persist new vendor', e); } }}>
                            Add "{vendorNameSearchTerm}" as new vendor
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-vendor-type" className="text-sm font-medium text-gray-700">Vendor Type</Label>
                  <DropdownMenu open={vendorTypeDropdownOpen} onOpenChange={setVendorTypeDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        id="expense-vendor-type"
                        variant="outline" 
                        className="w-full h-10 text-left justify-between border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        tabIndex={5}
                        aria-label="Select vendor type"
                        aria-haspopup="listbox"
                        aria-expanded={vendorTypeDropdownOpen}
                        onKeyDown={(e) => {
                          if (e.altKey && e.key === 'ArrowDown') {
                            e.preventDefault();
                            setVendorTypeDropdownOpen(true);
                          }
                        }}
                      >
                        <span className="truncate">{expenseForm.vendorType || 'Select type'}</span>
                        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 text-[15px]">
                      <div className="mb-2" onClick={e => e.stopPropagation()}>
                        <Input placeholder="Search or type new type..." className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={vendorTypeSearchTerm} onChange={e => setVendorTypeSearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto" role="listbox">
                        {filteredVendorTypes
                          .map((type: string) => (
                            <DropdownMenuItem key={type} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${expenseForm.vendorType === type ? 'bg-purple-100' : ''}`} onSelect={() => { handleExpenseChange('vendorType', type); setVendorTypeSearchTerm(''); }}>
                              {type}
                            </DropdownMenuItem>
                          ))}
                        {vendorTypeSearchTerm && !((options.vendorTypes || []) as string[]).find((type: string) => type.toLowerCase() === vendorTypeSearchTerm.toLowerCase()) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-purple-600 text-[15px]" onSelect={async () => { const newVal = vendorTypeSearchTerm; setVendorTypeSearchTerm(''); handleExpenseChange('vendorType', newVal); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'vendorTypes', value: newVal }) }); setOptions(prev => ({ ...prev, vendorTypes: Array.from(new Set([...(prev.vendorTypes || []), newVal])) })); } catch (e) { console.error('Failed to persist new type', e); } }}>
                            Add "{vendorTypeSearchTerm}" as new type
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-payment-mode" className="text-sm font-medium text-gray-700">Payment Mode</Label>
                  <Select value={expenseForm.paymentMode} onValueChange={v => handleExpenseChange('paymentMode', v)}>
                    <SelectTrigger id="expense-payment-mode" className="w-full h-10 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" tabIndex={6} aria-label="Select payment mode">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {((options.paymentModes || []) as string[]).map(mode => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
              </div>
              
             
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-from-account" className="text-sm font-medium text-gray-700">From Account{expenseForm.paymentMode?.toLowerCase() !== 'cash' && <span className="text-red-500">*</span>}</Label>
                  <Select 
                    value={expenseForm.addFromAccount || ""} 
                    onValueChange={v => handleExpenseChange('addFromAccount', v)} 
                    required={expenseForm.paymentMode?.toLowerCase() !== 'cash'}
                    disabled={expenseForm.paymentMode?.toLowerCase() === 'cash'}
                  >
                    <SelectTrigger id="expense-from-account" className={`w-full h-10 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${expenseForm.paymentMode?.toLowerCase() === 'cash' ? 'opacity-50 cursor-not-allowed' : ''}`} tabIndex={7} aria-label="Select from account" aria-required={expenseForm.paymentMode?.toLowerCase() !== 'cash'}>
                      <SelectValue placeholder={expenseForm.paymentMode?.toLowerCase() === 'cash' ? 'Not applicable for cash transactions' : 'Select account'} />
                    </SelectTrigger>
                    <SelectContent>
                      {((options.accounts || []) as string[]).map(acc => (
                        <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-received-by" className="text-sm font-medium text-gray-700">Received By</Label>
                  <input 
                    id="expense-received-by"
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    value={expenseForm.receivedBy} 
                    onChange={e => handleExpenseChange('receivedBy', e.target.value)} 
                    placeholder="Enter receiver's name" 
                    tabIndex={9}
                    aria-label="Received by" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-received-from" className="text-sm font-medium text-gray-700">Received From</Label>
                  <input 
                    id="expense-received-from"
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    value={expenseForm.receivedFrom} 
                    onChange={e => handleExpenseChange('receivedFrom', e.target.value)} 
                    placeholder="Enter sender's name" 
                    tabIndex={10}
                    aria-label="Received from" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-receipt-number" className="text-sm font-medium text-gray-700">Receipt / Transaction Number</Label>
                  <input 
                    id="expense-receipt-number"
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    value={expenseForm.receiptNumber} 
                    onChange={e => handleExpenseChange('receiptNumber', e.target.value)} 
                    placeholder="Enter receipt or transaction number" 
                    tabIndex={11}
                    aria-label="Receipt or transaction number" 
                  />
                </div>
                 
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-description" className="text-sm font-medium text-gray-700">Description</Label>
                <textarea
                  id="expense-description"
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  value={expenseForm.description}
                  onChange={e => handleExpenseChange("description", e.target.value)}
                  placeholder="Enter description or notes about this expense"
                  tabIndex={8}
                  aria-label="Expense description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-attachment" className="text-sm font-medium text-gray-700">Attachment</Label>
                <input 
                  id="expense-attachment"
                  type="file" 
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:border file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer" 

                                    accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={e => { const file = e.target.files?.[0] || null; if (file) { if (file.size > 10 * 1024 * 1024) { toast({ title: 'File too large', description: 'Maximum file size is 10MB' }); return; } } handleExpenseChange('attachments', file); }} 
                  tabIndex={12}
                  aria-label="Attach file" 
                />
                <div className="text-xs text-gray-500">
                  Accepted formats: PDF, PNG, JPG, JPEG (Max 10MB)
                </div>
              </div>

              {expenseFormError && <div role="alert" className="text-red-600 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded-md">{expenseFormError}</div>}
              
              <DialogFooter className="pt-4 space-x-2">
                <TooltipProvider>
                <Button type="button" variant="outline" onClick={attemptClose} tabIndex={15}>Cancel</Button>
                {/* Show Update Draft and Add Expense buttons when editing a draft */}
                {draftId ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={!isDirty || savingDraft}
                      title={!isDirty ? 'No changes to save' : undefined}
                      className="h-10 px-4 bg-purple-600 text-white hover:bg-purple-600 hover:text-white border-0"
                      tabIndex={12}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {savingDraft ? 'Saving�' : 'Update Draft'}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={-1}>
                          <Button
                            type="submit"
                            disabled={!isRequiredFieldsFilled || hasFieldErrors || !isDirty}
                            className="h-10 px-6 bg-purple-600 text-white hover:bg-purple-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            tabIndex={13}
                          >
                            Add Expense
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {(!isRequiredFieldsFilled || hasFieldErrors) && (
                        <TooltipContent>
                          <p>Please fill all the mandatory fields</p>
                        </TooltipContent>
                      )}
                      {isDirty === false && isRequiredFieldsFilled && !hasFieldErrors && (
                        <TooltipContent>
                          <p>No changes to save</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={!isDirty || savingDraft}
                      title={!isDirty ? 'No changes to save as draft' : undefined}
                      className="h-10 px-4 bg-purple-600 text-white hover:bg-purple-600 hover:text-white border-0"
                      tabIndex={13}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {savingDraft ? 'Saving�' : 'Save Draft'}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={-1}>
                          <Button
                            type="submit"
                            disabled={!isRequiredFieldsFilled || hasFieldErrors || !isDirty}
                            className="h-10 px-6 bg-purple-600 text-white hover:bg-purple-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            tabIndex={13}
                          >
                            {initialExpense ? 'Save Changes' : 'Add Expense'}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {(!isRequiredFieldsFilled || hasFieldErrors) && (
                        <TooltipContent>
                          <p>Please fill all the mandatory fields</p>
                        </TooltipContent>
                      )}
                      {isDirty === false && isRequiredFieldsFilled && !hasFieldErrors && (
                        <TooltipContent>
                          <p>{initialExpense ? 'Please make any changes to save changes' : 'No changes to save'}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </>
                )}
                </TooltipProvider>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
    {!isView && (
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your expense form. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)}>Continue Editing</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                setShowUnsavedAlert(false);
                await handleSaveDraft();
              }}
              className="h-10 px-4 bg-purple-600 text-white border-0"
            >
              <FileText className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-600 hover:text-white"
              onClick={() => {
                setShowUnsavedAlert(false);
                setHasJustSaved(true);
                onOpenChange(false);
                if (initialExpense) {
                  if (originalExpenseSnapshot) {
                    setExpenseForm({ ...originalExpenseSnapshot, attachments: initialExpense?.attachments ?? null });
                  }
                } else {
                  setExpenseForm(emptyExpenseForm);
                }
              }}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    <style jsx>{`
      .view-mode input[disabled],
      .view-mode select[disabled],
      .view-mode button[disabled] { background-color:#f9fafb; color:#374151; opacity:1; }
      .view-mode .input[disabled] { border-color:#e5e7eb; }
    `}</style>
    </>
  );
}

// Small detail component for view mode to keep markup tidy
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] tracking-wide text-gray-500 font-semibold">{label}</div>
      <div className="text-gray-800 font-medium break-words">{value || '-'}</div>
    </div>
  );
}