"use client"

import { useState, useEffect } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { StatsOverview } from "@/components/dashboard/financials/StatsOverview"
import { FinancialTabs } from "@/components/dashboard/financials/FinancialTabs/FinancialTabs"
import { IncomeExpensesSection } from "@/components/dashboard/financials/IncomeExpensesSection"
import { IncomeDialog } from "@/components/dashboard/financials/IncomeDialog"
import { ExpenseDialog } from "@/components/dashboard/financials/ExpenseDialog"
import { BankAccountDialog } from "@/components/dashboard/financials/BankAccountDialog"
import { ReportsSection } from "@/components/dashboard/financials/ReportsSection"
import { ROICalculator } from "@/components/dashboard/financials/ROICalculator"
import { ForecastSection } from "@/components/dashboard/financials/ForecastSection"
import { DataProvider } from "@/contexts/dashboard/data-context"
import type { Income, Expense, IncomeFormData, ExpenseFormData } from "@/components/dashboard/financials/types"
import { useToast } from "@/hooks/dashboard/use-toast"
import { TopTabs } from "@/components/dashboard/financials/TopTabs"
import { RefreshCw } from "lucide-react"

function FinancialsPageContent() {
  const { primaryColor, secondaryColor } = useCustomColors();
  // Top-level navigation tabs: Dashboard, Income, Expense, Report, ROI, Forecast
  const [topTab, setTopTab] = useState<'dashboard' | 'income' | 'expense' | 'report' | 'roi' | 'forecast'>('dashboard')
  const [migratingIncomes, setMigratingIncomes] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [incomeFilter, setIncomeFilter] = useState("monthly")
  const [expenseFilter, setExpenseFilter] = useState("category")
  const [roiFilter, setRoiFilter] = useState("monthly")
  const [forecastPeriod, setForecastPeriod] = useState("3months")

  // Dialog state for Add Income/Expense/Bank Account
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showBankDialog, setShowBankDialog] = useState(false)

  // Selected row/card to prefill dialogs
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [incomeDialogMode, setIncomeDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [expenseDialogMode, setExpenseDialogMode] = useState<'add' | 'edit' | 'view'>('add')

  // Draft ID states for editing existing drafts
  const [incomeDraftId, setIncomeDraftId] = useState<string | null>(null)
  const [expenseDraftId, setExpenseDraftId] = useState<string | null>(null)

  // Reports timeframe state (only used by ReportsSection)
  const [reportsTimeframe, setReportsTimeframe] = useState("monthly")
  const [reportsCustomStartDate, setReportsCustomStartDate] = useState("")
  const [reportsCustomEndDate, setReportsCustomEndDate] = useState("")
  const { toast } = useToast();

  // Server-backed data with fallback defaults
  const generateId = () => Math.random().toString(36).slice(2,11);

  // Helper function for API calls with retry logic
  const apiCallWithRetry = async (url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API call attempt ${attempt + 1}:`, url);
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          return response;
        }
        
        // If it's a server error (5xx), retry. If client error (4xx), don't retry
        if (response.status >= 500 && attempt < maxRetries) {
          console.log(`Server error ${response.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      } catch (error: any) {
        lastError = error;
        
        // If it's a network error and we have retries left, try again
        if ((error.name === 'TypeError' || error.name === 'AbortError') && attempt < maxRetries) {
          console.log(`Network error, retrying in ${(attempt + 1) * 1000}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError!;
  };

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load from server on mount
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const [incRes, expRes] = await Promise.all([
          fetch('/api/dashboard/financial?collection=incomes', { credentials: 'include' }),
          fetch('/api/dashboard/financial?collection=expenses', { credentials: 'include' })
        ]);
        const incData = incRes.ok ? await incRes.json() : [];
        const expData = expRes.ok ? await expRes.json() : [];

        // Map server docs to UI shape
        const mapIncome = (d: any): Income => ({
          id: d._id || d.id,
          date: (d.date ? new Date(d.date).toISOString().slice(0,10) : ''),
          amount: Number(d.amount || 0),
          description: d.description,
          incomeCategory: d.incomeCategory,
          sourceType: d.sourceType,
          paymentMode: d.paymentMode,
          reference: d.reference,
          studentId: d.studentId,
          branch: d.branch,
          status: d.status,
          notes: d.notes,
          addToAccount: d.addToAccount,
          receivedBy: d.receivedBy,
          receivedFrom: d.receivedFrom,
          receiptNumber: d.receiptNumber,
        });
        const mapExpense = (d: any): Expense => ({
          id: d._id || d.id,
          date: (d.date ? new Date(d.date).toISOString().slice(0,10) : ''),
          amount: Number(d.amount || 0),
          description: d.description,
          expenseCategory: d.expenseCategory,
          vendorName: d.vendorName,
          vendorType: d.vendorType,
          paymentMode: d.paymentMode,
          reference: d.reference,
          branch: d.branch,
          notes: d.notes,
          addFromAccount: d.addFromAccount,
          receivedBy: d.receivedBy,
          receivedFrom: d.receivedFrom,
          receiptNumber: d.receiptNumber,
        });
        if (!cancelled && Array.isArray(incData)) setIncomes(incData.map(mapIncome));
        if (!cancelled && Array.isArray(expData)) setExpenses(expData.map(mapExpense));
      } catch {
        // Fallback to defaults already set
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // One-time migration function to sync payments to income
  const handleMigratePaymentIncomes = async () => {
    setMigratingIncomes(true);
    try {
      const res = await fetch('/api/dashboard/financial/payments/migrate-incomes', { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: 'Migration Complete',
          description: data.message,
          variant: 'default'
        });
        
        // Reload incomes to show newly created records
        const incRes = await fetch('/api/dashboard/financial?collection=incomes', { credentials: 'include' });
        if (incRes.ok) {
          const incData = await incRes.json();
          const mapIncome = (d: any): Income => ({
            id: d._id || d.id,
            date: (d.date ? new Date(d.date).toISOString().slice(0,10) : ''),
            amount: Number(d.amount || 0),
            description: d.description,
            incomeCategory: d.incomeCategory,
            sourceType: d.sourceType,
            paymentMode: d.paymentMode,
            reference: d.reference,
            studentId: d.studentId,
            branch: d.branch,
            status: d.status,
            notes: d.notes,
            addToAccount: d.addToAccount,
            receivedBy: d.receivedBy,
            receivedFrom: d.receivedFrom,
            receiptNumber: d.receiptNumber,
          });
          if (Array.isArray(incData)) setIncomes(incData.map(mapIncome));
        }
      } else {
        toast({
          title: 'Migration Failed',
          description: data.error || 'Failed to migrate payment incomes',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Migration Error',
        description: error.message || 'An error occurred during migration',
        variant: 'destructive'
      });
    } finally {
      setMigratingIncomes(false);
    }
  };

  const handleSaveIncome = async (data: IncomeFormData, mode: 'add' | 'edit') => {
    try {
      let payload = { ...data } as any;
      
      // Handle file upload if a new file is attached
      if (data.attachments && data.attachments !== 'REMOVE' && typeof data.attachments !== 'string') {
        try {
          const formData = new FormData();
          formData.append('files', data.attachments);
          formData.append('category', 'financial-documents');
          
          const uploadRes = await fetch('/api/academy-storage/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!uploadRes.ok) {
            throw new Error('File upload failed');
          }
          
          const uploadResult = await uploadRes.json();
          
          if (uploadResult.success && uploadResult.data) {
            // Store attachment metadata in payload
            payload.attachmentUrl = uploadResult.data.url;
            payload.attachmentName = uploadResult.data.originalName;
            payload.attachmentSize = uploadResult.data.size;
            payload.attachmentType = uploadResult.data.type;
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: 'File upload failed',
            description: 'Could not upload attachment. Saving income without attachment.',
            variant: 'destructive'
          });
        }
      } else if (data.attachments === 'REMOVE') {
        // Mark attachment for removal
        payload.attachmentUrl = null;
        payload.attachmentName = null;
        payload.attachmentSize = null;
        payload.attachmentType = null;
      } else if (selectedIncome?.attachmentUrl) {
        // Keep existing attachment if no changes
        payload.attachmentUrl = selectedIncome.attachmentUrl;
        payload.attachmentName = selectedIncome.attachmentName;
        payload.attachmentSize = selectedIncome.attachmentSize;
        payload.attachmentType = selectedIncome.attachmentType;
      }
      
      // Remove the File object before sending to API
      delete payload.attachments;
      
      // If we have a draftId, we're creating a new income from a draft, not editing an existing income
      const isEditingIncome = mode === 'edit' && selectedIncome && !incomeDraftId;
      const method = isEditingIncome ? 'PUT' : 'POST';
      const url = isEditingIncome ? `/api/dashboard/financial?collection=incomes&id=${selectedIncome.id}` : `/api/dashboard/financial?collection=incomes`;
      
      console.log('Saving income:', { method, url, payload, incomeDraftId });
      
      const res = await apiCallWithRetry(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });
      
      const saved = await res.json();
      console.log('Income saved successfully:', saved);
      
      const mapped: Income = {
        id: saved._id || saved.id,
        date: saved.date ? new Date(saved.date).toISOString().slice(0,10) : data.date,
        amount: Number(saved.amount ?? data.amount),
        incomeCategory: saved.incomeCategory ?? data.incomeCategory,
        sourceType: saved.sourceType ?? data.sourceType,
        paymentMode: saved.paymentMode ?? data.paymentMode,
        description: saved.description ?? data.description,
        addToAccount: saved.addToAccount ?? data.addToAccount,
        receivedBy: saved.receivedBy ?? data.receivedBy,
        receivedFrom: saved.receivedFrom ?? data.receivedFrom,
        receiptNumber: saved.receiptNumber ?? data.receiptNumber,
        attachmentUrl: saved.attachmentUrl,
        attachmentName: saved.attachmentName,
        attachmentSize: saved.attachmentSize,
        attachmentType: saved.attachmentType,
        status: saved.status ?? 'Updated',
      } as Income;
      
      setIncomes(prev => isEditingIncome
        ? prev.map(i => (i.id === selectedIncome.id ? mapped : i))
        : [mapped, ...prev]
      );
      
      // If this was created from a draft, delete the draft
      if (incomeDraftId) {
        try {
          const { IncomeDraftsAPI } = await import('@/lib/dashboard/income-drafts-api');
          await IncomeDraftsAPI.deleteDraft(incomeDraftId);
          console.log('Draft deleted after creating income:', incomeDraftId);
          
          // Trigger event to update draft counts
          const allDrafts = await IncomeDraftsAPI.getAllDrafts();
          IncomeDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'converted');
        } catch (draftError) {
          console.error('Failed to delete draft after creating income:', draftError);
          // Don't fail the whole operation if draft deletion fails
        }
      }
      
      toast({ 
        title: isEditingIncome ? 'Income updated' : 'Income added', 
        description: (mapped.incomeCategory || '') + ' ' + (isEditingIncome ? 'was updated.' : 'was added.') 
      });
    } catch (e: any) {
      console.error('Income save error:', e);
      
      // More specific error messages
      let errorMessage = 'Could not save income to server.';
      if (e.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (e.name === 'TypeError') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      toast({ 
        title: 'Save failed', 
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleSaveExpense = async (data: ExpenseFormData, mode: 'add' | 'edit') => {
    try {
      let payload = { ...data } as any;
      
      // Handle file upload if a new file is attached
      if (data.attachments && data.attachments !== 'REMOVE' && typeof data.attachments !== 'string') {
        try {
          const formData = new FormData();
          formData.append('files', data.attachments);
          formData.append('category', 'financial-documents');
          
          const uploadRes = await fetch('/api/academy-storage/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!uploadRes.ok) {
            throw new Error('File upload failed');
          }
          
          const uploadResult = await uploadRes.json();
          
          if (uploadResult.success && uploadResult.data) {
            // Store attachment metadata in payload
            payload.attachmentUrl = uploadResult.data.url;
            payload.attachmentName = uploadResult.data.originalName;
            payload.attachmentSize = uploadResult.data.size;
            payload.attachmentType = uploadResult.data.type;
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: 'File upload failed',
            description: 'Could not upload attachment. Saving expense without attachment.',
            variant: 'destructive'
          });
        }
      } else if (data.attachments === 'REMOVE') {
        // Mark attachment for removal
        payload.attachmentUrl = null;
        payload.attachmentName = null;
        payload.attachmentSize = null;
        payload.attachmentType = null;
      } else if (selectedExpense?.attachmentUrl) {
        // Keep existing attachment if no changes
        payload.attachmentUrl = selectedExpense.attachmentUrl;
        payload.attachmentName = selectedExpense.attachmentName;
        payload.attachmentSize = selectedExpense.attachmentSize;
        payload.attachmentType = selectedExpense.attachmentType;
      }
      
      // Remove the File object before sending to API
      delete payload.attachments;
      
      // If we have a draftId, we're creating a new expense from a draft, not editing an existing expense
      const isEditingExpense = mode === 'edit' && selectedExpense && !expenseDraftId;
      const method = isEditingExpense ? 'PUT' : 'POST';
      const url = isEditingExpense ? `/api/dashboard/financial?collection=expenses&id=${selectedExpense.id}` : `/api/dashboard/financial?collection=expenses`;
      
      console.log('Saving expense:', { method, url, payload, expenseDraftId });
      
      const res = await apiCallWithRetry(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });
      
      const saved = await res.json();
      console.log('Expense saved successfully:', saved);
      
      const mapped: Expense = {
        id: saved._id || saved.id,
        date: saved.date ? new Date(saved.date).toISOString().slice(0,10) : data.date,
        amount: Number(saved.amount ?? data.amount),
        expenseCategory: saved.expenseCategory ?? data.expenseCategory,
        vendorName: saved.vendorName ?? data.vendorName,
        vendorType: saved.vendorType ?? data.vendorType,
        paymentMode: saved.paymentMode ?? data.paymentMode,
        description: saved.description ?? data.description,
        addFromAccount: saved.addFromAccount ?? data.addFromAccount,
        receivedBy: saved.receivedBy ?? data.receivedBy,
        receivedFrom: saved.receivedFrom ?? data.receivedFrom,
        receiptNumber: saved.receiptNumber ?? data.receiptNumber,
        attachmentUrl: saved.attachmentUrl,
        attachmentName: saved.attachmentName,
        attachmentSize: saved.attachmentSize,
        attachmentType: saved.attachmentType,
      } as Expense;
      
      setExpenses(prev => isEditingExpense
        ? prev.map(e => (e.id === selectedExpense.id ? mapped : e))
        : [mapped, ...prev]
      );
      
      // If this was created from a draft, delete the draft
      if (expenseDraftId) {
        try {
          const { ExpenseDraftsAPI } = await import('@/lib/dashboard/expense-drafts-api');
          await ExpenseDraftsAPI.deleteDraft(expenseDraftId);
          console.log('Draft deleted after creating expense:', expenseDraftId);
          
          // Trigger event to update draft counts
          const allDrafts = await ExpenseDraftsAPI.getAllDrafts();
          ExpenseDraftsAPI.triggerDraftsUpdatedEvent(allDrafts, 'converted');
        } catch (draftError) {
          console.error('Failed to delete draft after creating expense:', draftError);
          // Don't fail the whole operation if draft deletion fails
        }
      }
      
      toast({ 
        title: isEditingExpense ? 'Expense updated' : 'Expense added', 
        description: (mapped.expenseCategory || '') + ' ' + (isEditingExpense ? 'was updated.' : 'was added.') 
      });
    } catch (e: any) {
      console.error('Expense save error:', e);
      
      // More specific error messages
      let errorMessage = 'Could not save expense to server.';
      if (e.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (e.name === 'TypeError') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      toast({ 
        title: 'Save failed', 
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="responsive-dashboard-container px-2 sm:px-3 lg:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 relative max-w-full overflow-hidden">
        <div className="w-full min-w-0">
        <div className="flex items-center mb-2 sm:mb-3 lg:mb-4 flex-wrap gap-1 sm:gap-2 lg:gap-4 relative">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight truncate" style={{ color: primaryColor }}>Financial Management</h1>
        </div>        {/* Top navigation tabs - mobile optimized */}
        <div className="w-full mt-2 sm:mt-3 lg:mt-4 overflow-hidden">
          <TopTabs value={topTab} onChange={setTopTab} />
        </div>

        {/* Page content based on selected top tab */}
        {topTab === 'dashboard' && (
          <div className="mt-2 sm:mt-3 lg:mt-4 space-y-2 sm:space-y-3 lg:space-y-4">
            {/* Stats Overview */}
            <StatsOverview />
            {/* Financial Tabs */}
            <FinancialTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              incomeFilter={incomeFilter}
              setIncomeFilter={setIncomeFilter}
              expenseFilter={expenseFilter}
              setExpenseFilter={setExpenseFilter}
              roiFilter={roiFilter}
              setRoiFilter={setRoiFilter}
              forecastPeriod={forecastPeriod}
              setForecastPeriod={setForecastPeriod}
            />
          </div>
        )}

        {topTab === 'income' && (
          <div className="mt-4 sm:mt-6 lg:mt-10">
            {/* One-time migration button - can be removed after migration */}
            {incomes.length === 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">No income records found</h3>
                  <p className="text-sm text-blue-700">If you have existing payments, click here to sync them to income records</p>
                </div>
                <button
                  onClick={handleMigratePaymentIncomes}
                  disabled={migratingIncomes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {migratingIncomes ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sync Payments
                    </>
                  )}
                </button>
              </div>
            )}
            <IncomeExpensesSection
              setShowIncomeDialog={setShowIncomeDialog}
              setShowExpenseDialog={setShowExpenseDialog}
              setShowBankDialog={setShowBankDialog}
              setSelectedIncome={setSelectedIncome}
              setSelectedExpense={setSelectedExpense}
              setIncomeDialogMode={setIncomeDialogMode}
              setExpenseDialogMode={setExpenseDialogMode}
              incomes={incomes}
              setIncomes={setIncomes}
              expenses={expenses}
              setExpenses={setExpenses}
              setIncomeDraftId={setIncomeDraftId}
              setExpenseDraftId={setExpenseDraftId}
              visibleSection="income"
            />
          </div>
        )}

        {topTab === 'expense' && (
          <div className="mt-4 sm:mt-6 lg:mt-10">
            <IncomeExpensesSection
              setShowIncomeDialog={setShowIncomeDialog}
              setShowExpenseDialog={setShowExpenseDialog}
              setShowBankDialog={setShowBankDialog}
              setSelectedIncome={setSelectedIncome}
              setSelectedExpense={setSelectedExpense}
              setIncomeDialogMode={setIncomeDialogMode}
              setExpenseDialogMode={setExpenseDialogMode}
              incomes={incomes}
              setIncomes={setIncomes}
              expenses={expenses}
              setExpenses={setExpenses}
              setIncomeDraftId={setIncomeDraftId}
              setExpenseDraftId={setExpenseDraftId}
              visibleSection="expense"
            />
          </div>
        )}

        {topTab === 'report' && (
          <div className="mt-4 sm:mt-6 lg:mt-10">
            <ReportsSection
              statsTimeframe={reportsTimeframe}
              setStatsTimeframe={setReportsTimeframe}
              customStartDate={reportsCustomStartDate}
              setCustomStartDate={setReportsCustomStartDate}
              customEndDate={reportsCustomEndDate}
              setCustomEndDate={setReportsCustomEndDate}
            />
          </div>
        )}

        {topTab === 'roi' && (
          <div className="mt-4 sm:mt-6 lg:mt-10">
            <ROICalculator />
          </div>
        )}

        {topTab === 'forecast' && (
          <div className="mt-4 sm:mt-6 lg:mt-10">
            <ForecastSection />
          </div>
        )}

        {/* Dialogs */}
        <IncomeDialog
          open={showIncomeDialog}
          onOpenChange={(open) => {
            setShowIncomeDialog(open)
            if (!open) { setSelectedIncome(null); setIncomeDialogMode('add'); setIncomeDraftId(null); }
          }}
          initialIncome={selectedIncome}
          mode={incomeDialogMode}
          onSave={handleSaveIncome}
          draftId={incomeDraftId}
          onDraftSave={(draftId) => {
            if (draftId) {
              // Draft was updated, keep the draftId for potential further edits
              setIncomeDraftId(draftId);
            } else {
              // New draft was created, clear the draftId
              setIncomeDraftId(null);
            }
          }}
        />

        <ExpenseDialog
          open={showExpenseDialog}
          onOpenChange={(open) => {
            setShowExpenseDialog(open)
            if (!open) { setSelectedExpense(null); setExpenseDialogMode('add'); setExpenseDraftId(null); }
          }}
          initialExpense={selectedExpense}
          mode={expenseDialogMode}
          onSave={handleSaveExpense}
          draftId={expenseDraftId}
          onDraftSave={(draftId) => {
            if (draftId) {
              // Draft was updated, keep the draftId for potential further edits
              setExpenseDraftId(draftId);
            } else {
              // New draft was created, clear the draftId
              setExpenseDraftId(null);
            }
          }}
        />

        <BankAccountDialog
          open={showBankDialog}
          onOpenChange={setShowBankDialog}
        />
      </div>
    </div>
  )
}

export default function FinancialsPage() {
  return (
    <DataProvider>
      <FinancialsPageContent />
    </DataProvider>
  )
}
