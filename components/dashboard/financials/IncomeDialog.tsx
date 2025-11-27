"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useCustomColors } from '@/lib/use-custom-colors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dashboard/ui/dialog"
import { useCurrency } from "@/contexts/currency-context"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as AlertFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDescription } from "@/components/dashboard/ui/alert-dialog" // alias footer/description to avoid name clash
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { useToast } from "@/hooks/dashboard/use-toast"
import { IncomeFormData } from "./types"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/dashboard/ui/dropdown-menu";
import { Input } from "@/components/dashboard/ui/input";
import { ChevronDown, FileText } from "lucide-react";
import { FormattedDateInput } from "@/components/dashboard/ui/formatted-date-input";
import { IncomeDraftsAPI } from "@/lib/dashboard/income-drafts-api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip";

import type { Income } from "./types";

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIncome?: Income | null; // when provided, pre-fill the form for view/edit
  mode?: 'add' | 'edit' | 'view';
  onSave?: (data: IncomeFormData, mode: 'add' | 'edit') => void; // callback to propagate saved data
  draftId?: string | null; // when editing an existing draft
  onDraftSave?: (draftId?: string) => void; // callback when draft is saved/updated
}

export function IncomeDialog({ open, onOpenChange, initialIncome = null, mode = 'add', onSave, draftId = null, onDraftSave }: IncomeDialogProps) {
  const { primaryColor } = useCustomColors();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [incomeFormError, setIncomeFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  // Track if a successful save occurred (bypass unsaved guard)
  const [hasJustSaved, setHasJustSaved] = useState(false);
  // Prevent double submission of draft
  const [savingDraft, setSavingDraft] = useState(false);
  // Unsaved changes confirmation dialog visibility
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [sourceSearchTerm, setSourceSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [options, setOptions] = useState<{ incomeCategories: string[]; incomeSources: string[]; paymentModes: string[]; accounts: string[]; }>({ incomeCategories: [], incomeSources: [], paymentModes: [], accounts: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Dropdown open states for Alt+Down keyboard handling
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  
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
  
  const emptyIncomeForm: IncomeFormData = {
    date: getCurrentDate(),
    amount: "",
    description: "",
    incomeCategory: "",
    sourceType: "",
    paymentMode: "",
    addToAccount: "",
    receivedBy: "",
    receivedFrom: "",
    receiptNumber: "",
    attachments: null
  };
  const [incomeForm, setIncomeForm] = useState<IncomeFormData>(emptyIncomeForm);
  const isView = mode === 'view';
  // Track original snapshot for dirty-state detection in edit mode
  const [originalIncomeSnapshot, setOriginalIncomeSnapshot] = useState<IncomeFormData | null>(null);
  // Form validity (enable submit only when required fields present and no errors)
  const isRequiredFieldsFilled = (
    incomeForm.date.trim() !== '' &&
    incomeForm.amount.toString().trim() !== '' &&
    incomeForm.incomeCategory.trim() !== '' &&
    (incomeForm.paymentMode?.toLowerCase() === 'cash' || incomeForm.addToAccount.trim() !== '')
  );
  const hasFieldErrors = Object.values(fieldErrors).some(err => !!err);

  // Populate form when dialog opens with initialIncome, or reset when adding new
  useEffect(() => {
    if (!open) return;
    // Load dropdown options from backend when dialog opens with session caching
    let cancelled = false;
    (async () => {
      try {
        setLoadingOptions(true);
        // Check session cache first
        const cached = sessionStorage.getItem('income-options');
        if (cached) {
          const data = JSON.parse(cached);
          if (!cancelled) setOptions({
            incomeCategories: data.incomeCategories || [],
            incomeSources: data.incomeSources || [],
            paymentModes: data.paymentModes || [],
            accounts: data.accounts || [],
          });
          setLoadingOptions(false);
          return;
        }
        const res = await fetch('/api/dashboard/financial/financials/options', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setOptions({
              incomeCategories: data.incomeCategories || [],
              incomeSources: data.incomeSources || [],
              paymentModes: data.paymentModes || [],
              accounts: data.accounts || [],
            });
            // Cache for session
            sessionStorage.setItem('income-options', JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error('Failed to fetch dropdown options', e);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    if (initialIncome) {
      const populated: IncomeFormData = {
        ...emptyIncomeForm,
        date: initialIncome.date || "",
        amount: (initialIncome.amount ?? "").toString(),
        description: initialIncome.description || "",
        incomeCategory: initialIncome.incomeCategory || "",
        sourceType: initialIncome.sourceType || "",
        paymentMode: initialIncome.paymentMode || "",
        addToAccount: initialIncome.addToAccount || "",
        receivedBy: initialIncome.receivedBy || "",
        receivedFrom: initialIncome.receivedFrom || "",
        receiptNumber: initialIncome.receiptNumber || "",
        attachments: initialIncome.attachments ?? null,
      };
      setIncomeForm(populated);
      // store snapshot for dirty comparison (exclude attachments object reference issues)
      setOriginalIncomeSnapshot(JSON.parse(JSON.stringify({ ...populated, attachments: null })));
    } else {
      setIncomeForm(emptyIncomeForm);
      setOriginalIncomeSnapshot(JSON.parse(JSON.stringify({ ...emptyIncomeForm, attachments: null })));
    }
    // reset validation
    setFieldErrors({});
    setIncomeFormError("");
    return () => { cancelled = true; };
  }, [open, initialIncome]);

  function handleIncomeChange(field: string, value: any) {
    // Generic sanitization/validation rules per field
    let sanitized = value;
    let error = "";

    if (field === "amount") {
      // Remove anything except digits (no decimals allowed)
      sanitized = String(value).replace(/[^0-9]/g, "");
      
      // Validation
      if (!/^[0-9]*$/.test(sanitized)) {
        error = "Only whole numbers are allowed.";
      } else if (sanitized && sanitized !== "0" && parseInt(sanitized) <= 0) {
        error = "Amount must be greater than 0.";
      }
    } else {
      sanitized = value;
    }

    // Update field errors and form
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    
    // Handle special logic for payment mode changes
    if (field === 'paymentMode') {
      setIncomeForm((prev) => ({ 
        ...prev, 
        [field]: sanitized,
        // Clear account when switching to cash, keep it when switching away from cash
        addToAccount: sanitized?.toLowerCase() === 'cash' ? '' : prev.addToAccount
      }));
    } else {
      setIncomeForm((prev) => ({ ...prev, [field]: sanitized }));
    }
    
    setIncomeFormError("");

    // Show immediate toast for invalid input if there's an error
    if (error) {
      toast({ title: 'Invalid input', description: error });
    }
  }

  // Memoize filtered options to prevent recalculation on every render
  const filteredIncomeCategories = useMemo(() => 
    (options.incomeCategories || [])
      .filter(cat => cat.toLowerCase().includes(categorySearchTerm.toLowerCase())),
    [options.incomeCategories, categorySearchTerm]
  );

  const filteredIncomeSources = useMemo(() =>
    (options.incomeSources || [])
      .filter((source: string) => source.toLowerCase().includes(sourceSearchTerm.toLowerCase())),
    [options.incomeSources, sourceSearchTerm]
  );

  // Determine if form is dirty relative to original snapshot when in edit mode
  const isEditMode = !isView && !!initialIncome;
  
  // Check if form has any meaningful data filled
  const hasDataFilled = () => {
    const form = incomeForm;
    return (
      (form.amount && form.amount.trim() !== '') ||
      (form.description && form.description.trim() !== '') ||
      (form.incomeCategory && form.incomeCategory.trim() !== '') ||
      (form.sourceType && form.sourceType.trim() !== '') ||
      (form.paymentMode && form.paymentMode.trim() !== '') ||
      (form.addToAccount && form.addToAccount.trim() !== '') ||
      (form.receivedBy && form.receivedBy.trim() !== '') ||
      (form.receivedFrom && form.receivedFrom.trim() !== '') ||
      (form.receiptNumber && form.receiptNumber.trim() !== '') ||
      !!form.attachments
    );
  };
  
  // isDirty only relevant for edit/add modes; never trigger in view mode
  const isDirty = isView ? false : (isEditMode ? (() => {
    if (!originalIncomeSnapshot) return false;
    const attachmentChanged = (() => {
      const origHas = !!initialIncome?.attachments;
      const currHas = !!incomeForm.attachments;
      if (origHas !== currHas) return true;
      if (!origHas && !currHas) return false;
      if (incomeForm.attachments && initialIncome?.attachments) {
        return incomeForm.attachments.name !== initialIncome.attachments.name || incomeForm.attachments.size !== initialIncome.attachments.size || incomeForm.attachments.type !== initialIncome.attachments.type;
      }
      return false;
    })();
    if (attachmentChanged) return true;
    const comparableCurrent = { ...incomeForm, attachments: null };
    return Object.keys(originalIncomeSnapshot).some(key => {
      // @ts-ignore
      return originalIncomeSnapshot[key] !== comparableCurrent[key];
    });
  })() : hasDataFilled()); // In add mode, only consider dirty if actual data is filled

  function handleIncomeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!incomeForm.date || !incomeForm.amount || !incomeForm.incomeCategory || 
        (incomeForm.paymentMode?.toLowerCase() !== 'cash' && !incomeForm.addToAccount)) {
      setIncomeFormError("Date, Amount, Category" + (incomeForm.paymentMode?.toLowerCase() !== 'cash' ? ", and To Account" : "") + " are required.");
      return;
    }
    // Emit to parent BEFORE closing/resetting (so it can reference initialIncome for replace logic)
    onSave?.(incomeForm, initialIncome ? 'edit' : 'add');
    setHasJustSaved(true);
    onOpenChange(false);
    toast({ title: initialIncome ? "Income Saved" : "Income Added", description: initialIncome ? "Income entry changes have been saved." : "Income entry has been recorded." });
    setIncomeForm(emptyIncomeForm);
  }

  // Save Draft function
  async function handleSaveDraft() {
    if (savingDraft) return; // guard against double clicks
    try {
      setSavingDraft(true);
      // Immediately close dialog to avoid double clicks
      onOpenChange(false);
      const draftName = IncomeDraftsAPI.generateDraftName(incomeForm);
      
      if (draftId) {
        // Update existing draft
        const updatedDraft = await IncomeDraftsAPI.updateDraft(draftId, {
          name: draftName,
          category: incomeForm.incomeCategory || 'Uncategorized',
          amount: incomeForm.amount || '0',
          data: incomeForm
        });
        toast({
          title: "?? Draft Updated",
          description: `Income draft "${draftName}" has been updated successfully.`,
          duration: 3000,
        });
        
        // Trigger event to update draft counts
        const allDrafts = await IncomeDraftsAPI.getAllDrafts();
        IncomeDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'updated');
      } else {
        // Create new draft
        const newDraft = await IncomeDraftsAPI.createDraft({
          name: draftName,
          category: incomeForm.incomeCategory || 'Uncategorized',
          amount: incomeForm.amount || '0',
          data: incomeForm
        });
        toast({
          title: "?? Draft Saved",
          description: `Income draft "${draftName}" has been saved successfully.`,
          duration: 3000,
        });
        
        // Trigger event to update draft counts
        const allDrafts = await IncomeDraftsAPI.getAllDrafts();
        IncomeDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'created');
      }
      
      setHasJustSaved(true);
      onDraftSave?.(draftId || undefined);
      setIncomeForm(emptyIncomeForm);
    } catch (error) {
      console.error('Error saving income draft:', error);
      toast({
        title: "? Save Failed",
        description: "Unable to save income draft. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
    finally {
      setSavingDraft(false);
    }
  }

  // Attempt to close the dialog (user clicked cancel / backdrop / esc)
  function attemptClose() {
    if (isView) { // direct close in view mode (no prompts)
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
          // intercept close attempt
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
              <DialogTitle className="text-lg font-semibold tracking-wide">Income Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                <Detail label="Date" value={formatDateForDisplay(incomeForm.date)} />
                <Detail label="Amount" value={incomeForm.amount ? `${currency} ${incomeForm.amount}` : '-'} />
                <Detail label="Category" value={incomeForm.incomeCategory || '-'} />
                <Detail label="Source" value={incomeForm.sourceType || '-'} />
                <Detail label="Income Mode" value={incomeForm.paymentMode || '-'} />
                <Detail label="Received By" value={incomeForm.receivedBy || '-'} />
                <Detail label="Received From" value={incomeForm.receivedFrom || '-'} />
                <Detail label="Receipt / Transaction No." value={incomeForm.receiptNumber || '-'} />
                <Detail label="To Account" value={incomeForm.addToAccount || '-'} />
                <Detail label="Attachment" value={(initialIncome?.attachments || incomeForm.attachments) ? 'Attached' : '�'} />
              </div>
              {incomeForm.description && (
                <div className="text-sm">
                  <div className="text-[11px] tracking-wide text-gray-500 dark:text-white font-semibold mb-1">Description</div>
                  <div className="rounded-md border dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 leading-relaxed text-foreground whitespace-pre-wrap">
                    {incomeForm.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#a78bfa]/60 scrollbar-track-[#f4f2ff]">
            <DialogHeader>
              <DialogTitle>
                {draftId ? 'Create Income from Draft' : (initialIncome ? 'Edit Income' : 'Add Income Entry')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <style>{`input:focus, select:focus { cursor: pointer; }`}</style>
              
              {/* Original field order: Date, Amount, Category, Source, Payment Mode, To Account, Description, Transaction Details, Attachment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormattedDateInput
                    id="income-date"
                    label="Date"
                    value={incomeForm.date}
                    onChange={(date) => handleIncomeChange('date', date)}
                    required
                    error={!!fieldErrors.date}
                    className="input-bordered h-10"
                    tabIndex={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Amount<span className="text-red-500">*</span></Label>
                  <input 
                    type="number" 
                    min="0.01" 
                    step="any" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50" 
                    style={{ '--focus-ring-color': primaryColor } as any}
                    onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                    value={incomeForm.amount} 
                    onChange={e => handleIncomeChange('amount', e.target.value)} 
                    onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') { e.preventDefault(); } }} 
                    required 
                    tabIndex={2} 
                    placeholder="Enter amount"
                  />
                  {fieldErrors.amount && <div className="text-red-600 text-xs mt-1">{fieldErrors.amount}</div>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Category<span className="text-red-500">*</span></Label>
                  <DropdownMenu open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full h-10 text-left justify-between border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent" 
                        tabIndex={3}
                        onKeyDown={(e) => {
                          if (e.altKey && e.key === 'ArrowDown') {
                            e.preventDefault();
                            setCategoryDropdownOpen(true);
                          }
                        }}
                      >
                        <span className="truncate">{incomeForm.incomeCategory || 'Select category'}</span>
                        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 text-[15px]">
                      <div className="mb-2" onClick={e => e.stopPropagation()}>
                        <Input placeholder="Search or type new category..." className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 custom-focus-ring" value={categorySearchTerm} onChange={e => setCategorySearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {(options.incomeCategories || [])
                          .filter(cat => cat.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                          .map(cat => (
                            <DropdownMenuItem key={cat} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${incomeForm.incomeCategory === cat ? 'bg-purple-100' : ''}`} onSelect={() => { handleIncomeChange('incomeCategory', cat); setCategorySearchTerm(''); }}>
                              {cat}
                            </DropdownMenuItem>
                          ))}
                        {categorySearchTerm && !((options.incomeCategories || []).find((cat: string) => cat.toLowerCase() === categorySearchTerm.toLowerCase())) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 add-new-item text-[15px]" onSelect={async () => { const newVal = categorySearchTerm; handleIncomeChange('incomeCategory', newVal); setCategorySearchTerm(''); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'incomeCategories', value: newVal }) }); setOptions(prev => ({ ...prev, incomeCategories: Array.from(new Set([...(prev.incomeCategories || []), newVal])) })); } catch (e) { console.error('Failed to persist new category', e); } }}>
                            Add "{categorySearchTerm}" as new category
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Source</Label>
                  <DropdownMenu open={sourceDropdownOpen} onOpenChange={setSourceDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full h-10 text-left justify-between border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent" 
                        tabIndex={4}
                        onKeyDown={(e) => {
                          if (e.altKey && e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSourceDropdownOpen(true);
                          }
                        }}
                      >
                        <span className="truncate">{incomeForm.sourceType || 'Select source'}</span>
                        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 text-[15px]">
                      <div className="mb-2" onClick={e => e.stopPropagation()}>
                        <Input placeholder="Search or type new source..." className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 custom-focus-ring" value={sourceSearchTerm} onChange={e => setSourceSearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {(options.incomeSources || [])
                          .filter((source: string) => source.toLowerCase().includes(sourceSearchTerm.toLowerCase()))
                          .map((source: string) => (
                            <DropdownMenuItem key={source} className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-[15px] ${incomeForm.sourceType === source ? 'bg-purple-100' : ''}`} onSelect={() => { handleIncomeChange('sourceType', source); setSourceSearchTerm(''); }}>
                              {source}
                            </DropdownMenuItem>
                          ))}
                        {sourceSearchTerm && !((options.incomeSources || []) as string[]).find((source: string) => source.toLowerCase() === sourceSearchTerm.toLowerCase()) && (
                          <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-100 add-new-item text-[15px]" onSelect={async () => { const newVal = sourceSearchTerm; handleIncomeChange('sourceType', newVal); setSourceSearchTerm(''); try { await fetch('/api/dashboard/financial/financials/options/add', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'incomeSources', value: newVal }) }); setOptions(prev => ({ ...prev, incomeSources: Array.from(new Set([...(prev.incomeSources || []), newVal])) })); } catch (e) { console.error('Failed to persist new source', e); } }}>
                            Add "{sourceSearchTerm}" as new source
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Payment Mode</Label>
                  <Select value={incomeForm.paymentMode} onValueChange={v => handleIncomeChange('paymentMode', v)}>
                    <SelectTrigger className="w-full h-10 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent" tabIndex={5}>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {((options.paymentModes || []) as string[]).map(mode => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">To Account{incomeForm.paymentMode?.toLowerCase() !== 'cash' && <span className="text-red-500">*</span>}</Label>
                  <Select 
                    value={incomeForm.addToAccount || ""} 
                    onValueChange={v => handleIncomeChange('addToAccount', v)} 
                    required={incomeForm.paymentMode?.toLowerCase() !== 'cash'}
                    disabled={incomeForm.paymentMode?.toLowerCase() === 'cash'}
                  >
                    <SelectTrigger className={`w-full h-10 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent ${incomeForm.paymentMode?.toLowerCase() === 'cash' ? 'opacity-50 cursor-not-allowed' : ''}`} tabIndex={6}>
                      <SelectValue placeholder={incomeForm.paymentMode?.toLowerCase() === 'cash' ? 'Not applicable for cash transactions' : 'Select account'} />
                    </SelectTrigger>
                    <SelectContent>
                      {((options.accounts || []) as string[]).map(acc => (
                        <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Received By</Label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent" 
                    value={incomeForm.receivedBy} 
                    onChange={e => handleIncomeChange('receivedBy', e.target.value)} 
                    placeholder="Enter receiver's name" 
                    tabIndex={8} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Received From</Label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent" 
                    value={incomeForm.receivedFrom} 
                    onChange={e => handleIncomeChange('receivedFrom', e.target.value)} 
                    placeholder="Enter sender's name" 
                    tabIndex={9} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white">Receipt / Transaction Number</Label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent" 
                    value={incomeForm.receiptNumber} 
                    onChange={e => handleIncomeChange('receiptNumber', e.target.value)} 
                    placeholder="Enter receipt or transaction number" 
                    tabIndex={10} 
                  />
                </div>
                
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-white">Description</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y" 
                  value={incomeForm.description} 
                  onChange={e => handleIncomeChange('description', e.target.value)} 
                  placeholder="Enter description or notes about this income"
                  tabIndex={7} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-white">Attachment</Label>
                <input 
                  type="file" 
                                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-sm text-foreground file:border file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 custom-focus-ring focus:border-transparent cursor-pointer" 
 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={e => { const file = e.target.files?.[0] || null; if (file) { if (file.size > 10 * 1024 * 1024) { toast({ title: 'File too large', description: 'Maximum file size is 10MB' }); return; } } handleIncomeChange('attachments', file); }} 
                  tabIndex={11} 
                />
                <div className="text-xs text-gray-500 dark:text-white">
                  Accepted formats: PDF, PNG, JPG, JPEG (Max 10MB)
                </div>
              </div>
              
              {incomeFormError && <div className="text-red-600 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded-md">{incomeFormError}</div>}
              
              <DialogFooter className="mt-6 pt-4 border-t">
                <TooltipProvider>
                {/* Show Update Draft and Add Income buttons when editing a draft */}
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
                      {savingDraft ? 'Saving�' : 'Update Draft'}
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
                            Add Income
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={-1}>
                          <Button 
                            type="submit" 
                            disabled={!isRequiredFieldsFilled || hasFieldErrors || !isDirty} 
                            style={{ backgroundColor: primaryColor, color: 'white' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)} onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = primaryColor)} className="h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            tabIndex={12}
                          >
                            {initialIncome ? 'Save Changes' : 'Add Income'}
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
                          <p>{initialIncome ? 'Please make any changes to save changes' : 'No changes to save'}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
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
                      {savingDraft ? 'Saving�' : 'Save Draft'}
                    </Button>
                  </>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={attemptClose} 
                  className="h-10 px-6 border-gray-300"
                  tabIndex={14}
                >
                  Cancel
                </Button>
                </TooltipProvider>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
    {/* Unsaved changes dialog only for non-view modes */}
    {!isView && (
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDescription>
              You have unsaved changes in your income form. What would you like to do?
            </AlertDescription>
          </AlertDialogHeader>
          <AlertFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)}>Continue Editing</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                setShowUnsavedAlert(false);
                await handleSaveDraft();
              }}
              style={{ backgroundColor: primaryColor, color: 'white' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor} className="h-10 px-4 border-0"
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
                if (initialIncome) {
                  if (originalIncomeSnapshot) {
                    setIncomeForm({ ...originalIncomeSnapshot, attachments: initialIncome?.attachments ?? null });
                  }
                } else {
                  setIncomeForm(emptyIncomeForm);
                }
              }}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertFooter>
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
  )
}

// Small detail component for view mode (mirrors ExpenseDialog styling, natural casing)
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] tracking-wide text-gray-500 dark:text-white font-semibold">{label}</div>
      <div className="text-gray-800 dark:text-white font-medium break-words">{value || '-'}</div>
    </div>
  );
}

