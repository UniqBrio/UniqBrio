"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useCustomColors } from '@/lib/use-custom-colors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dashboard/ui/dialog"
import { useCurrency } from "@/contexts/currency-context"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/dashboard/ui/alert-dialog"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { useToast } from "@/hooks/dashboard/use-toast"
import { ExpenseFormData } from "./types"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/dashboard/ui/dropdown-menu";
import { Input } from "@/components/dashboard/ui/input";
import { ChevronDown, FileText, Download, X } from "lucide-react";
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input";
import { ExpenseDraftsAPI } from "@/lib/dashboard/expense-drafts-api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip";
import { FINANCIAL_FORM_MESSAGES, getRequiredFieldsMessage } from "./financial-form-messages";

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
  const { primaryColor } = useCustomColors();
  const { toast } = useToast();
  const { currency } = useCurrency();
  // Vendor Type search/add state
  const [vendorTypeSearchTerm, setVendorTypeSearchTerm] = useState("");
  const [vendorNameSearchTerm, setVendorNameSearchTerm] = useState("");
  const [expenseCategorySearchTerm, setExpenseCategorySearchTerm] = useState("");
  const [options, setOptions] = useState<{ expenseCategories: string[]; vendorNames: string[]; vendorTypes: string[]; paymentModes: string[]; accounts: string[]; primaryAccount: string }>({ expenseCategories: [], vendorNames: [], vendorTypes: [], paymentModes: [], accounts: [], primaryAccount: "" });
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Dropdown open states for Alt+Down keyboard handling
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [vendorNameDropdownOpen, setVendorNameDropdownOpen] = useState(false);
  const [vendorTypeDropdownOpen, setVendorTypeDropdownOpen] = useState(false);
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
        let data: any = null;
        
        // Check session cache first
        const cached = sessionStorage.getItem('expense-options');
        if (cached) {
          data = JSON.parse(cached);
          if (!cancelled) setOptions({
            expenseCategories: data.expenseCategories || [],
            vendorNames: data.vendorNames || [],
            vendorTypes: data.vendorTypes || [],
            paymentModes: data.paymentModes || [],
            accounts: data.accounts || [],
            primaryAccount: data.primaryAccount || "",
          });
        } else {
          const res = await fetch('/api/dashboard/financial/financials/options', { credentials: 'include' });
          if (res.ok) {
            data = await res.json();
            if (!cancelled) {
              setOptions({
                expenseCategories: data.expenseCategories || [],
                vendorNames: data.vendorNames || [],
                vendorTypes: data.vendorTypes || [],
                paymentModes: data.paymentModes || [],
                accounts: data.accounts || [],
                primaryAccount: data.primaryAccount || "",
              });
              // Cache for session
              sessionStorage.setItem('expense-options', JSON.stringify(data));
            }
          }
        }
        
        // Set primary account as default for new entries (not editing existing)
        if (!cancelled && data?.primaryAccount && !initialExpense) {
          setExpenseForm(prev => ({
            ...prev,
            addFromAccount: prev.addFromAccount || data.primaryAccount
          }));
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

      // Amount: allow positive numbers with up to 2 decimal places
      if (field === "amount") {
        // Remove anything except digits and decimal point
        sanitized = String(value).replace(/[^0-9.]/g, "");
        // Ensure only one decimal point
        const parts = sanitized.split('.');
        if (parts.length > 2) {
          sanitized = parts[0] + '.' + parts.slice(1).join('');
        }
        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
          sanitized = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        // Validation: /^\\d+(\\.\\d{1,2})?$/
        if (sanitized && !/^\d+(\.\d{1,2})?$/.test(sanitized)) {
          error = "Amount must be a valid number with up to 2 decimal places.";
        } else if (sanitized && parseFloat(sanitized) <= 0) {
          error = "Amount must be greater than 0.";
        }
      } else if (field === "expenseCategory") {
        // Allow letters, numbers, spaces, hyphens, apostrophes, ampersands
        sanitized = String(value).replace(/[^a-zA-Z0-9\s\-'&]/g, "");
        if (sanitized && !/^[a-zA-Z0-9\s\-'&]+$/.test(sanitized)) {
          error = "Category can only contain letters, numbers, spaces, hyphens, apostrophes, and ampersands.";
        }
      } else if (field === "vendorName") {
        // Allow letters, numbers, spaces, hyphens, apostrophes, dots, commas
        sanitized = String(value).replace(/[^a-zA-Z0-9\s\-'.,]/g, "");
        if (sanitized && !/^[a-zA-Z0-9\s\-'.,]+$/.test(sanitized)) {
          error = "Vendor name can only contain letters, numbers, spaces, hyphens, apostrophes, dots, and commas.";
        }
      } else if (field === "vendorType") {
        // Allow letters, numbers, spaces, hyphens, apostrophes
        sanitized = String(value).replace(/[^a-zA-Z0-9\s\-']/g, "");
        if (sanitized && !/^[a-zA-Z0-9\s\-']+$/.test(sanitized)) {
          error = "Vendor type can only contain letters, numbers, spaces, hyphens, and apostrophes.";
        }
      } else if (field === "receivedBy" || field === "receivedFrom") {
        // Allow only letters and spaces
        sanitized = String(value).replace(/[^a-zA-Z\s]/g, "");
        if (sanitized && !/^[a-zA-Z\s]+$/.test(sanitized)) {
          error = "Name can only contain letters and spaces.";
        }
      } else if (field === "receiptNumber") {
        // Allow alphanumeric, hyphens, slashes, underscores
        sanitized = String(value).replace(/[^a-zA-Z0-9\-/_]/g, "");
        if (sanitized && !/^[a-zA-Z0-9\-/_]+$/.test(sanitized)) {
          error = "Receipt number can only contain letters, numbers, hyphens, slashes, and underscores.";
        }
      } else if (field === "description") {
        // Allow letters, numbers, spaces, and common punctuation
        if (value && !/^[a-zA-Z0-9\s.,!?;:()\-_'"\n\r&@#%/\\[\]{}+=*]+$/.test(value)) {
          error = "Description contains invalid characters.";
          sanitized = String(value).replace(/[^a-zA-Z0-9\s.,!?;:()\-_'"\n\r&@#%/\\[\]{}+=*]/g, "");
        }
      } else {
        sanitized = value;
      }

      // Update field errors and form
      setFieldErrors(prev => {
        const next = { ...prev };
        if (error) {
          next[field] = error;
        } else {
          delete next[field];
        }
        return next;
      })
      
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
      if (expenseForm.attachments && initialExpense?.attachments && 
          typeof expenseForm.attachments !== 'string' && typeof initialExpense.attachments !== 'string') {
        return expenseForm.attachments.name !== initialExpense.attachments.name || 
               expenseForm.attachments.size !== initialExpense.attachments.size || 
               expenseForm.attachments.type !== initialExpense.attachments.type;
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
    setExpenseFormError("")
    const requiresAccount = expenseForm.paymentMode?.toLowerCase() !== 'cash'
    let missingRequired = false

    const updatedErrors: { [key: string]: string } = { ...fieldErrors }
    const ensureMissing = (fieldKey: keyof ExpenseFormData, missing: boolean, message: string) => {
      if (missing) {
        missingRequired = true
        if (!updatedErrors[fieldKey]) {
          updatedErrors[fieldKey] = message
        }
      } else if (updatedErrors[fieldKey] === message) {
        delete updatedErrors[fieldKey]
      }
    }

    ensureMissing('date', !expenseForm.date?.trim(), 'Date is required.')
    ensureMissing('amount', !expenseForm.amount?.toString().trim(), 'Amount is required.')
    ensureMissing('expenseCategory', !expenseForm.expenseCategory?.trim(), 'Category is required.')
    ensureMissing('addFromAccount', requiresAccount && !expenseForm.addFromAccount?.trim(), 'From Account is required for non-cash payments.')

    setFieldErrors(updatedErrors)

    if (missingRequired) {
      setExpenseFormError(getRequiredFieldsMessage(requiresAccount))
      return
    }

    if (Object.values(updatedErrors).some(Boolean)) {
      setExpenseFormError(FINANCIAL_FORM_MESSAGES.genericError)
      return
    }

    onSave?.(expenseForm, initialExpense ? 'edit' : 'add')
    setHasJustSaved(true);
    onOpenChange(false)
    toast({ title: initialExpense ? "Expense Saved" : "Expense Added", description: initialExpense ? "Expense entry changes have been saved." : "Expense entry has been recorded." })
    setFieldErrors({})
    setExpenseFormError("")
    setExpenseForm(emptyExpenseForm)
  }

  // Save Draft function
  async function handleSaveDraft() {
    if (savingDraft) return false; // guard against double clicks
    setExpenseFormError("")
    try {
      setSavingDraft(true);
      const draftName = ExpenseDraftsAPI.generateDraftName(expenseForm);

      if (draftId) {
        await ExpenseDraftsAPI.updateDraft(draftId, {
          name: draftName,
          category: expenseForm.expenseCategory || 'Uncategorized',
          amount: expenseForm.amount || '0',
          data: expenseForm,
        });
        toast({
          title: "✅ Draft Updated",
          description: `Expense draft "${draftName}" has been updated successfully.`,
          duration: 3000,
        });

        const allDrafts = await ExpenseDraftsAPI.getAllDrafts();
        ExpenseDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'updated');
      } else {
        await ExpenseDraftsAPI.createDraft({
          name: draftName,
          category: expenseForm.expenseCategory || 'Uncategorized',
          amount: expenseForm.amount || '0',
          data: expenseForm,
        });
        toast({
          title: "✅ Draft Saved",
          description: `Expense draft "${draftName}" has been saved successfully.`,
          duration: 3000,
        });

        const allDrafts = await ExpenseDraftsAPI.getAllDrafts();
        ExpenseDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'created');
      }

      setHasJustSaved(true);
      onDraftSave?.(draftId || undefined);
      setFieldErrors({})
      setExpenseForm(emptyExpenseForm);
      onOpenChange(false);
      return true;
    } catch (error) {
      console.error('Error saving expense draft:', error);
      setExpenseFormError(FINANCIAL_FORM_MESSAGES.draftSaveFailed)
      return false;
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
                <Detail label="Amount" value={expenseForm.amount ? `${currency} ${expenseForm.amount}` : '-'} />
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
                  <Label htmlFor="expense-amount" className="text-sm font-medium text-gray-700 dark:text-white">Amount<span className="text-red-500">*</span></Label>
                  <input
                    id="expense-amount"
                    type="number"
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
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
                  <Label htmlFor="expense-category" className="text-sm font-medium text-gray-700 dark:text-white">Category<span className="text-red-500">*</span></Label>
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
                        <Input 
                          placeholder="Search or type new category..." 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                          value={expenseCategorySearchTerm} 
                          onChange={e => {
                            const sanitized = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
                            setExpenseCategorySearchTerm(sanitized);
                          }} 
                          onKeyDown={e => e.stopPropagation()} 
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto" role="listbox">
                        {filteredExpenseCategories
                          .map(cat => (
                            <DropdownMenuItem key={cat} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${expenseForm.expenseCategory === cat ? 'bg-purple-100' : ''}`} onSelect={() => { handleExpenseChange('expenseCategory', cat); setExpenseCategorySearchTerm(''); }}>
                              {cat}
                            </DropdownMenuItem>
                          ))}
                        {expenseCategorySearchTerm && !((options.expenseCategories || []).find((cat: string) => cat.toLowerCase() === expenseCategorySearchTerm.toLowerCase())) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px]" onSelect={async () => { const newVal = expenseCategorySearchTerm; setExpenseCategorySearchTerm(''); handleExpenseChange('expenseCategory', newVal); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'expenseCategories', value: newVal }) }); setOptions(prev => ({ ...prev, expenseCategories: Array.from(new Set([...(prev.expenseCategories || []), newVal])) })); } catch (e) { console.error('Failed to persist new category', e); } }}>
                            Add "{expenseCategorySearchTerm}" as new category
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-vendor-name" className="text-sm font-medium text-gray-700 dark:text-white">Vendor Name</Label>
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
                        <Input 
                          placeholder="Search or type new vendor..." 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                          value={vendorNameSearchTerm} 
                          onChange={e => {
                            const sanitized = e.target.value.replace(/[^a-zA-Z\s\-'.]/g, '');
                            setVendorNameSearchTerm(sanitized);
                          }} 
                          onKeyDown={e => e.stopPropagation()} 
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto" role="listbox">
                        {filteredVendorNames
                          .map((vendor: string) => (
                            <DropdownMenuItem key={vendor} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${expenseForm.vendorName === vendor ? 'bg-purple-100' : ''}`} onSelect={() => { handleExpenseChange('vendorName', vendor); setVendorNameSearchTerm(''); }}>
                              {vendor}
                            </DropdownMenuItem>
                          ))}
                        {vendorNameSearchTerm && !((options.vendorNames || []) as string[]).find((vendor: string) => vendor.toLowerCase() === vendorNameSearchTerm.toLowerCase()) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px]" onSelect={async () => { const newVal = vendorNameSearchTerm; setVendorNameSearchTerm(''); handleExpenseChange('vendorName', newVal); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'vendorNames', value: newVal }) }); setOptions(prev => ({ ...prev, vendorNames: Array.from(new Set([...(prev.vendorNames || []), newVal])) })); } catch (e) { console.error('Failed to persist new vendor', e); } }}>
                            Add "{vendorNameSearchTerm}" as new vendor
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-vendor-type" className="text-sm font-medium text-gray-700 dark:text-white">Vendor Type</Label>
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
                        <Input 
                          placeholder="Search or type new type..." 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                          value={vendorTypeSearchTerm} 
                          onChange={e => {
                            const sanitized = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
                            setVendorTypeSearchTerm(sanitized);
                          }} 
                          onKeyDown={e => e.stopPropagation()} 
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto" role="listbox">
                        {filteredVendorTypes
                          .map((type: string) => (
                            <DropdownMenuItem key={type} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${expenseForm.vendorType === type ? 'bg-purple-100' : ''}`} onSelect={() => { handleExpenseChange('vendorType', type); setVendorTypeSearchTerm(''); }}>
                              {type}
                            </DropdownMenuItem>
                          ))}
                        {vendorTypeSearchTerm && !((options.vendorTypes || []) as string[]).find((type: string) => type.toLowerCase() === vendorTypeSearchTerm.toLowerCase()) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px]" onSelect={async () => { const newVal = vendorTypeSearchTerm; setVendorTypeSearchTerm(''); handleExpenseChange('vendorType', newVal); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'vendorTypes', value: newVal }) }); setOptions(prev => ({ ...prev, vendorTypes: Array.from(new Set([...(prev.vendorTypes || []), newVal])) })); } catch (e) { console.error('Failed to persist new type', e); } }}>
                            Add "{vendorTypeSearchTerm}" as new type
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-payment-mode" className="text-sm font-medium text-gray-700 dark:text-white">Payment Mode</Label>
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
                  <Label htmlFor="expense-from-account" className="text-sm font-medium text-gray-700 dark:text-white">From Account{expenseForm.paymentMode?.toLowerCase() !== 'cash' && <span className="text-red-500">*</span>}</Label>
                  <Select 
                    value={expenseForm.addFromAccount || ""} 
                    onValueChange={v => handleExpenseChange('addFromAccount', v)} 
                    required={expenseForm.paymentMode?.toLowerCase() !== 'cash'}
                    disabled={expenseForm.paymentMode?.toLowerCase() === 'cash' || (options.accounts?.length === 0 && expenseForm.paymentMode?.toLowerCase() !== 'cash')}
                  >
                    <SelectTrigger id="expense-from-account" className={`w-full h-10 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${expenseForm.paymentMode?.toLowerCase() === 'cash' ? 'opacity-50 cursor-not-allowed' : ''}`} tabIndex={7} aria-label="Select from account" aria-required={expenseForm.paymentMode?.toLowerCase() !== 'cash'}>
                      <SelectValue placeholder={expenseForm.paymentMode?.toLowerCase() === 'cash' ? 'Not applicable for cash transactions' : (options.accounts?.length === 0 ? 'No bank accounts - Add one in Bank Accounts tab' : 'Select account')} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.accounts?.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          No bank accounts available. Please add a bank account first.
                        </div>
                      ) : (
                        ((options.accounts || []) as string[]).map(acc => (
                          <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {options.accounts?.length === 0 && expenseForm.paymentMode?.toLowerCase() !== 'cash' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Please add a bank account in the "Bank Accounts" tab before creating non-cash expenses.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-received-by" className="text-sm font-medium text-gray-700 dark:text-white">Received By</Label>
                  <input 
                    id="expense-received-by"
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    value={expenseForm.receivedBy} 
                    onChange={e => handleExpenseChange('receivedBy', e.target.value)} 
                    placeholder="Enter receiver's name" 
                    tabIndex={9}
                    aria-label="Received by" 
                  />
                  {fieldErrors.receivedBy && <p className="text-red-500 text-xs mt-1">{fieldErrors.receivedBy}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-received-from" className="text-sm font-medium text-gray-700 dark:text-white">Received From</Label>
                  <input 
                    id="expense-received-from"
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    value={expenseForm.receivedFrom} 
                    onChange={e => handleExpenseChange('receivedFrom', e.target.value)} 
                    placeholder="Enter sender's name" 
                    tabIndex={10}
                    aria-label="Received from" 
                  />
                  {fieldErrors.receivedFrom && <p className="text-red-500 text-xs mt-1">{fieldErrors.receivedFrom}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-receipt-number" className="text-sm font-medium text-gray-700 dark:text-white">Receipt / Transaction Number</Label>
                  <input 
                    id="expense-receipt-number"
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    value={expenseForm.receiptNumber} 
                    onChange={e => handleExpenseChange('receiptNumber', e.target.value)} 
                    placeholder="Enter receipt or transaction number" 
                    tabIndex={11}
                    aria-label="Receipt or transaction number" 
                  />
                  {fieldErrors.receiptNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.receiptNumber}</p>}
                </div>
                 
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-description" className="text-sm font-medium text-gray-700 dark:text-white">Description</Label>
                <textarea
                  id="expense-description"
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  value={expenseForm.description}
                  onChange={e => handleExpenseChange("description", e.target.value)}
                  placeholder="Enter description or notes about this expense"
                  tabIndex={8}
                  aria-label="Expense description"
                />
                {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-attachment" className="text-sm font-medium text-gray-700 dark:text-white">Attachment</Label>
                
                {/* Show existing attachment if present */}
                {initialExpense?.attachmentUrl && !expenseForm.attachments && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                    <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {initialExpense.attachmentName || 'Attachment'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {initialExpense.attachmentSize ? `${(initialExpense.attachmentSize / 1024).toFixed(2)} KB` : ''}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(initialExpense.attachmentUrl, '_blank')}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!isView && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Mark for removal by setting a flag
                          handleExpenseChange('attachments', 'REMOVE');
                        }}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Show new file selected */}
                {expenseForm.attachments && expenseForm.attachments !== 'REMOVE' && typeof expenseForm.attachments !== 'string' && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                        {expenseForm.attachments.name}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {(expenseForm.attachments.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    {!isView && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExpenseChange('attachments', null)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                
                {/* File input (hidden when viewing or when attachment exists) */}
                {!isView && (!initialExpense?.attachmentUrl || expenseForm.attachments === 'REMOVE') && !expenseForm.attachments && (
                  <input 
                    id="expense-attachment"
                    type="file" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground file:border file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer" 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    onChange={e => { const file = e.target.files?.[0] || null; if (file) { if (file.size > 10 * 1024 * 1024) { toast({ title: 'File too large', description: 'Maximum file size is 10MB' }); return; } } handleExpenseChange('attachments', file); }} 
                    tabIndex={12}
                    aria-label="Attach file"
                    disabled={uploadingFile}
                  />
                )}
                
                {uploadingFile && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {!uploadingFile && (
                  <div className="text-xs text-gray-500 dark:text-white">
                    Accepted formats: PDF, PNG, JPG, JPEG (Max 10MB)
                  </div>
                )}
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
                      style={{ backgroundColor: primaryColor, color: 'white' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor} className="h-10 px-4 border-0"
                      tabIndex={12}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {savingDraft ? 'Saving...' : 'Update Draft'}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={-1}>
                          <Button
                            type="submit"
                            disabled={!isRequiredFieldsFilled || hasFieldErrors || !isDirty}
                            style={{ backgroundColor: primaryColor, color: 'white' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)} onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)} className="h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      style={{ backgroundColor: primaryColor, color: 'white' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor} className="h-10 px-4 border-0"
                      tabIndex={13}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {savingDraft ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={-1}>
                          <Button
                            type="submit"
                            disabled={!isRequiredFieldsFilled || hasFieldErrors || !isDirty}
                            style={{ backgroundColor: primaryColor, color: 'white' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)} onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)} className="h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={savingDraft}
              style={{ backgroundColor: primaryColor, color: 'white' }} className="h-10 px-4 border-0"
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
      <div className="text-[11px] tracking-wide text-gray-500 dark:text-white font-semibold">{label}</div>
      <div className="text-gray-800 dark:text-white font-medium break-words">{value || '-'}</div>
    </div>
  );
}
