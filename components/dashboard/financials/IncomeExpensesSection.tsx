"use client"

import React, { useState } from "react";
import { format as formatDate } from "date-fns";
import { useCustomColors } from '@/lib/use-custom-colors';
import { useCurrency } from "@/contexts/currency-context";
// 3x3 grid icon
function GridIcon({ className = "w-6 h-6", fill = "#7C3AED" }: { className?: string, fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="10" y="3" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="17" y="3" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="3" y="10" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="17" y="10" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="3" y="17" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="10" y="17" width="5" height="5" rx="1.5" fill={fill} />
      <rect x="17" y="17" width="5" height="5" rx="1.5" fill={fill} />
    </svg>
  );
}
import ColumnSelectorModal from "./ColumnSelectorModal";
import { useToast } from "@/hooks/dashboard/use-toast";
// Confirmation dialog component
function ConfirmDeleteDialog({ open, title, description, onCancel, onConfirm }: { open: boolean, title: string, description: string, onCancel: () => void, onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl p-8 min-w-[340px] max-w-[90vw]">
        <div className="font-bold text-lg mb-2">{title}</div>
        <div className="text-gray-700 dark:text-white mb-6">{description}</div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 dark:text-white hover:bg-gray-100" onClick={onCancel}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
import { Pencil, Trash2, Eye, FileText } from "lucide-react";
import type { Income, Expense, IncomeFormData, ExpenseFormData } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/ui/card"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import IncomeSearchFilters from "./IncomeSearchFilters"
import ExpenseSearchFilters from "./ExpenseSearchFilters"
import { IncomeDraftsDialog } from "./IncomeDraftsDialog"
import { ExpenseDraftsDialog } from "./ExpenseDraftsDialog"

interface IncomeExpensesSectionProps {
  setShowIncomeDialog: (show: boolean) => void
  setShowExpenseDialog: (show: boolean) => void
  setShowBankDialog: (show: boolean) => void
  setSelectedIncome?: (income: Income | null) => void
  setSelectedExpense?: (expense: Expense | null) => void
  setIncomeDialogMode?: (mode: 'add' | 'edit' | 'view') => void
  setExpenseDialogMode?: (mode: 'add' | 'edit' | 'view') => void
  incomes: Income[]
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>
  expenses: Expense[]
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  // Draft-related props
  setIncomeDraftId?: (draftId: string | null) => void
  setExpenseDraftId?: (draftId: string | null) => void
  // Controls which section to render on the page (both by default)
  visibleSection?: 'both' | 'income' | 'expense'
}

export function IncomeExpensesSection({
  setShowIncomeDialog,
  setShowExpenseDialog,
  setShowBankDialog,
  setSelectedIncome,
  setSelectedExpense,
  setIncomeDialogMode,
  setExpenseDialogMode,
  incomes,
  setIncomes,
  expenses,
  setExpenses,
  setIncomeDraftId,
  setExpenseDraftId,
  visibleSection = 'both'
}: IncomeExpensesSectionProps) {

  // Custom colors and currency context
  const { primaryColor, secondaryColor } = useCustomColors();
  const { currency } = useCurrency();

  // Toast
  const { toast } = useToast();

  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'income' | 'expense' | null,
    item: Income | Expense | null
  }>({ type: null, item: null });

  // State for draft dialogs
  const [showIncomeDraftsDialog, setShowIncomeDraftsDialog] = useState(false);
  const [showExpenseDraftsDialog, setShowExpenseDraftsDialog] = useState(false);

  // State for draft counts
  const [incomeDraftsCount, setIncomeDraftsCount] = useState(0);
  const [expenseDraftsCount, setExpenseDraftsCount] = useState(0);

  // Enhanced setter functions that immediately update counts when dialogs open
  const handleShowIncomeDraftsDialog = React.useCallback(async (show: boolean) => {
    setShowIncomeDraftsDialog(show);
    if (show) {
      // Immediately fetch and update count when dialog opens
      try {
        const response = await fetch('/api/dashboard/financial/incomedrafts');
        if (response.ok) {
          const drafts = await response.json();
          setIncomeDraftsCount(drafts.length);
        }
      } catch (error) {
        console.error('Failed to fetch income drafts count:', error);
      }
    }
  }, []);

  const handleShowExpenseDraftsDialog = React.useCallback(async (show: boolean) => {
    setShowExpenseDraftsDialog(show);
    if (show) {
      // Immediately fetch and update count when dialog opens
      try {
        const response = await fetch('/api/dashboard/financial/expensedrafts');
        if (response.ok) {
          const drafts = await response.json();
          setExpenseDraftsCount(drafts.length);
        }
      } catch (error) {
        console.error('Failed to fetch expense drafts count:', error);
      }
    }
  }, []);

  // Helper function to check if income is from payment transactions
  const isFromPaymentTransaction = (income: Income) => {
    return income.incomeCategory === 'Course Fees' && 
           income.sourceType === 'Students' && 
           (!income.receiptNumber || income.receiptNumber.trim() === '');
  };

  // Handlers for edit, delete, and view
  const handleEditIncome = (income: Income) => {
    // Don't allow editing incomes from payment transactions
    if (isFromPaymentTransaction(income)) {
      toast({
        title: 'Cannot Edit',
        description: 'This income was automatically created from a payment transaction and cannot be edited.',
        variant: 'destructive'
      });
      return;
    }
    // open dialog with prefilled values
    setSelectedIncome?.(income);
    setIncomeDialogMode?.('edit');
    setShowIncomeDialog(true);
  };
  const handleDeleteIncome = (income: Income) => {
    // Don't allow deleting incomes from payment transactions
    if (isFromPaymentTransaction(income)) {
      toast({
        title: 'Cannot Delete',
        description: 'This income was automatically created from a payment transaction and cannot be deleted.',
        variant: 'destructive'
      });
      return;
    }
    setDeleteDialog({ type: 'income', item: income });
  };
  const handleViewIncome = (income: Income) => {
    setSelectedIncome?.(income);
    setIncomeDialogMode?.('view');
    setShowIncomeDialog(true);
  };
  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense?.(expense);
    setExpenseDialogMode?.('edit');
    setShowExpenseDialog(true);
  };
  const handleDeleteExpense = (expense: Expense) => {
    setDeleteDialog({ type: 'expense', item: expense });
  };
  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense?.(expense);
    setExpenseDialogMode?.('view');
    setShowExpenseDialog(true);
  };

  // Draft handlers
  const handleEditIncomeDraft = (draftData: IncomeFormData, draftId: string) => {
    // Convert draft data back to Income format for the dialog
    const incomeFromDraft: Income = {
      id: draftId,
      date: draftData.date,
      amount: parseFloat(draftData.amount) || 0,
      description: draftData.description,
      incomeCategory: draftData.incomeCategory,
      sourceType: draftData.sourceType,
      paymentMode: draftData.paymentMode,
      addToAccount: draftData.addToAccount,
      receivedBy: draftData.receivedBy,
      receivedFrom: draftData.receivedFrom,
      receiptNumber: draftData.receiptNumber,
      attachments: draftData.attachments
    };
    
    setSelectedIncome?.(incomeFromDraft);
    setIncomeDraftId?.(draftId);
    setIncomeDialogMode?.('add'); // Changed from 'edit' to 'add' - we're creating new income from draft
    setShowIncomeDialog(true);
  };

  const handleEditExpenseDraft = (draftData: ExpenseFormData, draftId: string) => {
    // Convert draft data back to Expense format for the dialog
    const expenseFromDraft: Expense = {
      id: draftId,
      date: draftData.date,
      amount: parseFloat(draftData.amount) || 0,
      description: draftData.description,
      expenseCategory: draftData.expenseCategory,
      vendorName: draftData.vendorName,
      vendorType: draftData.vendorType,
      paymentMode: draftData.paymentMode,
      addFromAccount: draftData.addFromAccount,
      receivedBy: draftData.receivedBy,
      receivedFrom: draftData.receivedFrom,
      receiptNumber: draftData.receiptNumber,
      attachments: draftData.attachments
    };
    
    setSelectedExpense?.(expenseFromDraft);
    setExpenseDraftId?.(draftId);
    setExpenseDialogMode?.('add'); // Changed from 'edit' to 'add' - we're creating new expense from draft
    setShowExpenseDialog(true);
  };

  // Confirm delete logic
  const handleConfirmDelete = async () => {
    if (!deleteDialog.type || !deleteDialog.item) return;

    try {
      const collection = deleteDialog.type === 'income' ? 'incomes' : 'expenses';
      // @ts-ignore id exists on our data
      const id = deleteDialog.item._id || deleteDialog.item.id;
      if (id) {
        await fetch(`/api/dashboard/financial?collection=${collection}&id=${id}`, { method: 'DELETE' });
      }

      if (deleteDialog.type === 'income') {
        setIncomes(prev => prev.filter(i => (i as any)._id !== id && (i as any).id !== id));
        setFilteredIncomes(prev => prev.filter(i => (i as any)._id !== id && (i as any).id !== id));
        toast({
          title: 'Income Deleted',
          description: `"${(deleteDialog.item as Income).incomeCategory}" has been deleted successfully.`,
        });
      } else if (deleteDialog.type === 'expense') {
        setExpenses(prev => prev.filter(e => (e as any)._id !== id && (e as any).id !== id));
        setFilteredExpenses(prev => prev.filter(e => (e as any)._id !== id && (e as any).id !== id));
        toast({
          title: 'Expense Deleted',
          description: `"${(deleteDialog.item as Expense).expenseCategory}" has been deleted successfully.`,
        });
      }
    } catch (e) {
      toast({ title: 'Delete failed', description: 'Could not delete item from server.' });
    }

    setDeleteDialog({ type: null, item: null });
  };

  // Filtered data - initialized with all data, then managed by filter components
  const [filteredIncomes, setFilteredIncomes] = useState(incomes);
  const [filteredExpenses, setFilteredExpenses] = useState(expenses);

  // Column selection state (Income)
  const incomeColumns = ["Date", "Amount", "Category", "Source", "Payment Mode", "To Account", "Received By", "Received From", "Receipt Number", "Description", "Actions"];
  const [incomeDisplayedColumns, setIncomeDisplayedColumns] = useState<string[]>(["Date", "Amount", "Category", "Source", "Payment Mode", "Actions"]);
  const [showIncomeColumnSelector, setShowIncomeColumnSelector] = useState(false);

  // Column selection state (Expense)
  const expenseColumns = [
    "Date",
    "Amount",
    "Category",
    "Vendor Name",
    "Vendor Type",
    "Payment Mode",
    "From Account",
    "Received By",
    "Received From",
    "Receipt Number",
    "Description",
    "Actions",
  ];
  const [expenseDisplayedColumns, setExpenseDisplayedColumns] = useState<string[]>([
    "Date",
    "Amount",
    "Category",
    "Vendor Name",
    "Payment Mode",
    "Actions",
  ]);
  const [showExpenseColumnSelector, setShowExpenseColumnSelector] = useState(false);

  // View mode state
  const [incomeViewMode, setIncomeViewMode] = useState<"grid" | "list">("list");
  const [expenseViewMode, setExpenseViewMode] = useState<"grid" | "list">("list");
  // Multi-select state (Income)
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<string[]>([]);
  // Multi-select state (Expenses)
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Search/sort state
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeSortBy, setIncomeSortBy] = useState("date");
  const [incomeSortOrder, setIncomeSortOrder] = useState<"asc" | "desc">("asc");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseSortBy, setExpenseSortBy] = useState("date");
  const [expenseSortOrder, setExpenseSortOrder] = useState<"asc" | "desc">("asc");

  // Load draft counts on component mount
  React.useEffect(() => {
    const loadDraftCounts = async () => {
      try {
        // Load income drafts count
        const incomeRes = await fetch('/api/dashboard/financial/incomedrafts');
        if (incomeRes.ok) {
          const incomeData = await incomeRes.json();
          setIncomeDraftsCount(incomeData.length);
        }

        // Load expense drafts count
        const expenseRes = await fetch('/api/dashboard/financial/expensedrafts');
        if (expenseRes.ok) {
          const expenseData = await expenseRes.json();
          setExpenseDraftsCount(expenseData.length);
        }
      } catch (error) {
        console.error('Failed to load draft counts:', error);
      }
    };

    loadDraftCounts();
  }, []);

  // Listen for draft changes to update counts
  React.useEffect(() => {
    const handleIncomeDraftChange = (event: CustomEvent) => {
      // Update count immediately from the event data
      const { drafts } = event.detail;
      setIncomeDraftsCount(drafts.length);
    };

    const handleExpenseDraftChange = (event: CustomEvent) => {
      // Update count immediately from the event data
      const { drafts } = event.detail;
      setExpenseDraftsCount(drafts.length);
    };

    // Listen for custom events from draft dialogs
    window.addEventListener('income-drafts-updated', handleIncomeDraftChange as EventListener);
    window.addEventListener('expense-drafts-updated', handleExpenseDraftChange as EventListener);

    return () => {
      window.removeEventListener('income-drafts-updated', handleIncomeDraftChange as EventListener);
      window.removeEventListener('expense-drafts-updated', handleExpenseDraftChange as EventListener);
    };
  }, []);

  // Close column selector modals if user switches to grid view (feature disabled there)
  React.useEffect(() => {
    if (incomeViewMode !== 'list' && showIncomeColumnSelector) setShowIncomeColumnSelector(false);
  }, [incomeViewMode, showIncomeColumnSelector]);
  React.useEffect(() => {
    if (expenseViewMode !== 'list' && showExpenseColumnSelector) setShowExpenseColumnSelector(false);
  }, [expenseViewMode, showExpenseColumnSelector]);

  // Hydrate persisted column selections (ensure 'Actions' always present once)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawIncome = localStorage.getItem('incomeDisplayedColumns');
      if (rawIncome) {
        const arr = JSON.parse(rawIncome);
        if (Array.isArray(arr)) {
          const sanitized = arr.filter((c: string) => incomeColumns.includes(c));
          if (!sanitized.includes('Actions') && incomeColumns.includes('Actions')) sanitized.push('Actions');
          setIncomeDisplayedColumns(sanitized);
        }
      }
    } catch {}
    try {
      const rawExpense = localStorage.getItem('expenseDisplayedColumns');
      if (rawExpense) {
        const arr = JSON.parse(rawExpense);
        if (Array.isArray(arr)) {
          const sanitized = arr.filter((c: string) => expenseColumns.includes(c));
          if (!sanitized.includes('Actions') && expenseColumns.includes('Actions')) sanitized.push('Actions');
          setExpenseDisplayedColumns(sanitized);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ConfirmDeleteDialog
        open={!!deleteDialog.type}
  title={deleteDialog.type === 'income' ? 'Delete Income' : deleteDialog.type === 'expense' ? 'Delete Expense' : ''}
  description={deleteDialog.item ? `Are you sure you want to delete this ${deleteDialog.type}? This action cannot be undone.\n"${deleteDialog.type === 'income' ? (deleteDialog.item as Income).incomeCategory : deleteDialog.type === 'expense' ? (deleteDialog.item as Expense).expenseCategory : ''}"` : ''}
        onCancel={() => setDeleteDialog({ type: null, item: null })}
        onConfirm={handleConfirmDelete}
      />
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-10">
      {/* Income Section */}
      {visibleSection !== 'expense' && (
      <div className="bg-white shadow-md border-2 border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Income</h2>
        <IncomeSearchFilters
          searchTerm={incomeSearch}
          setSearchTerm={setIncomeSearch}
          sortBy={incomeSortBy}
          setSortBy={setIncomeSortBy}
          sortOrder={incomeSortOrder}
          setSortOrder={setIncomeSortOrder}
          onAddIncome={() => { setSelectedIncome?.(null); setIncomeDialogMode?.('add'); setShowIncomeDialog(true); }}
          incomes={incomes}
          setFilteredIncomes={setFilteredIncomes}
          viewMode={incomeViewMode}
          setViewMode={setIncomeViewMode}
          onImport={(items) => {
            const mapped = items.map((d: any) => ({
              id: d._id || d.id,
              date: d.date ? new Date(d.date).toISOString().slice(0,10) : '',
              amount: Number(d.amount || 0),
              incomeCategory: d.incomeCategory,
              sourceType: d.sourceType,
              paymentMode: d.paymentMode,
              description: d.description,
              addToAccount: d.addToAccount,
              receivedBy: d.receivedBy,
              receivedFrom: d.receivedFrom,
              receiptNumber: d.receiptNumber,
              status: d.status || 'Imported'
            } as Income));
            setIncomes(prev => [...mapped, ...prev]);
            setFilteredIncomes(prev => [...mapped, ...prev]);
            toast({ title: 'Import complete', description: `${mapped.length} incomes inserted.` });
          }}
          selectedIds={selectedIncomeIds}
          setShowIncomeDraftsDialog={handleShowIncomeDraftsDialog}
          draftsCount={incomeDraftsCount}
        />
        
        {/* Count bar for both views + column selector button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="w-full rounded-xl px-6 py-3 flex items-center text-base font-medium" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor, backgroundImage: `linear-gradient(90deg, ${primaryColor}20 80%, #fff 100%)` }}>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full inline-block mr-2" style={{ backgroundColor: primaryColor }}></span>
              <span className="font-bold">{filteredIncomes.length}</span>
              <span className="font-normal">{filteredIncomes.length === 1 ? 'income found' : 'incomes found'}</span>
            </span>
          </div>
          {incomeViewMode === 'list' && (
            <button
              className="ml-4 w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm hover:shadow transition-colors"
              style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
              onClick={() => setShowIncomeColumnSelector(true)}
              title="Displayed Columns"
              aria-label="Edit displayed income columns"
            >
              <GridIcon className="w-6 h-6" fill={primaryColor} />
            </button>
          )}
        </div>
        {incomeViewMode === 'list' && (
          <ColumnSelectorModal
            open={showIncomeColumnSelector}
            columns={incomeColumns}
            displayedColumns={incomeDisplayedColumns}
            setDisplayedColumns={setIncomeDisplayedColumns}
            onClose={() => setShowIncomeColumnSelector(false)}
            onSave={() => setShowIncomeColumnSelector(false)}
            onReset={() => setIncomeDisplayedColumns(incomeColumns)}
            storageKeyPrefix="income"
          />
        )}
        {incomeViewMode === "list" ? (
          <div className="overflow-x-auto pb-4">
            <div style={{ minWidth: 900 }}>
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#a78bfa]/60 scrollbar-track-[#f4f2ff]">
                <table className="min-w-full text-[15px] bg-white border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20 bg-[#f8f8fc]">
                    <tr className="bg-[#f8f8fc] text-gray-700 dark:text-white">
                      {/* Selection column header for Income */}
                      <th className="sticky top-0 z-20 px-4 py-3 text-left font-semibold w-10 bg-[#f8f8fc]">
                        {(() => {
                          const visibleIds = filteredIncomes.map(i => i.id);
                          const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIncomeIds.includes(id));
                          return (
                            <input
                              type="checkbox"
                              aria-label="Select all visible incomes"
                              checked={allSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                const next = e.target.checked
                                  ? Array.from(new Set([...selectedIncomeIds, ...visibleIds]))
                                  : selectedIncomeIds.filter(id => !visibleIds.includes(id));
                                setSelectedIncomeIds(next);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          );
                        })()}
                      </th>
                      {incomeDisplayedColumns.map(col => (
                        <th
                          key={col}
                          className={(col === "Actions"
                            ? "sticky top-0 z-20 px-6 py-3 text-center font-semibold "
                            : "sticky top-0 z-20 px-6 py-3 text-left font-semibold ") + "bg-[#f8f8fc]"}
                        >
                          {col === "Actions" ? '' : col === "Amount" ? `Amount (${currency})` : col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomes.length === 0 ? (
                      <tr>
                        <td colSpan={incomeDisplayedColumns.length + 1} className="text-center text-gray-500 dark:text-white py-8">No incomes found.</td>
                      </tr>
                    ) : (
                      filteredIncomes.map((income) => (
                        <tr key={income.id} className="border-b border-gray-200 dark:border-gray-700 group cursor-pointer transition-colors" style={{ ':hover': { backgroundColor: `${primaryColor}10` } }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''} onClick={() => handleViewIncome(income)}>
                          {/* Selection checkbox cell */}
                          <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Select income ${income.incomeCategory}`}
                              checked={selectedIncomeIds.includes(income.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedIncomeIds(prev => checked ? [...prev, income.id] : prev.filter(id => id !== income.id));
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          {incomeDisplayedColumns.map(col => {
                            switch (col) {
                              case "Date":
                                return <td key="date" className="px-6 py-3 text-black">{formatDate(new Date(income.date), 'dd-MMM-yyyy')}</td>;
                              case "Amount":
                                return <td key="amount" className="px-6 py-3 text-black">{income.amount.toLocaleString()}</td>;
                              case "Category":
                                return <td key="category" className="px-6 py-3">
                                  <span className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                    {income.incomeCategory}
                                  </span>
                                </td>;
                              case "Source":
                                return <td key="source" className="px-6 py-3 text-black">{income.sourceType || '-'}</td>;
                              case "Payment Mode":
                                return <td key="paymentMode" className="px-6 py-3">
                                  <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">
                                    {income.paymentMode || '-'}
                                  </span>
                                </td>;
                              case "To Account":
                                return <td key="toAccount" className="px-6 py-3 text-black">{income.addToAccount}</td>;
                              case "Received By":
                                return <td key="receivedBy" className="px-6 py-3 text-black">{income.receivedBy || '-'}</td>;
                              case "Received From":
                                return <td key="receivedFrom" className="px-6 py-3 text-black">{income.receivedFrom || '-'}</td>;
                              case "Receipt Number":
                                return <td key="receiptNumber" className="px-6 py-3 text-black">{income.receiptNumber || '-'}</td>;
                              case "Description":
                                return <td key="description" className="px-6 py-3 text-black">{income.description || '-'}</td>;
                              case "Actions":
                                return <td key="actions" className="px-6 py-3 text-center align-middle">
                                  <div className="flex justify-center items-center gap-2 h-full min-h-[40px]">
                                    <button
                                      className={`p-1 rounded-full focus:outline-none ${
                                        isFromPaymentTransaction(income)
                                          ? 'text-gray-300 dark:text-white cursor-not-allowed'
                                          : 'text-gray-500 dark:text-white hover:text-blue-600'
                                      }`}
                                      title={isFromPaymentTransaction(income) ? 'Cannot edit payment-generated income' : 'Edit'}
                                      onClick={e => { e.stopPropagation(); handleEditIncome(income); }}
                                      disabled={isFromPaymentTransaction(income)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      className={`p-2 rounded ${
                                        isFromPaymentTransaction(income)
                                          ? 'text-gray-300 dark:text-white cursor-not-allowed'
                                          : 'text-red-500 hover:text-red-700'
                                      }`}
                                      onClick={e => { e.stopPropagation(); handleDeleteIncome(income); }}
                                      title={isFromPaymentTransaction(income) ? 'Cannot delete payment-generated income' : 'Delete'}
                                      disabled={isFromPaymentTransaction(income)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>;
                              default:
                                return null;
                            }
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 w-max">
              {/* Count bar for grid view is above, shared with list view */}
              {filteredIncomes.map((income) => (
                <Card key={income.id} className="hover:shadow-lg transition-shadow cursor-pointer group relative border-2 border-orange-400 hover:border-orange-500 bg-white rounded-xl p-0 w-80 flex-shrink-0" onClick={() => handleViewIncome(income)}>
                  <CardContent className="p-5 pb-2 relative">
                    {/* Edit button top right */}
                    <button
                      className={`absolute top-1 right-1 p-1 rounded-full focus:outline-none z-10 opacity-80 group-hover:opacity-100 ${
                        isFromPaymentTransaction(income)
                          ? 'text-gray-300 dark:text-white cursor-not-allowed'
                          : 'text-gray-500 dark:text-white hover:text-orange-500'
                      }`}
                      title={isFromPaymentTransaction(income) ? 'Cannot edit payment-generated income' : 'Edit'}
                      onClick={e => { e.stopPropagation(); handleEditIncome(income); }}
                      disabled={isFromPaymentTransaction(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight line-clamp-2">{income.incomeCategory}</h3>
                        <p className="text-sm text-gray-500 dark:text-white">{formatDate(new Date(income.date), 'dd-MMM-yyyy')}</p>
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2 items-center">
                      <Badge className="bg-blue-100 text-blue-700">{income.paymentMode || 'N/A'}</Badge>
                      {income.sourceType && <Badge className="bg-purple-100 text-purple-700">{income.sourceType}</Badge>}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-white mb-1">{income.description || 'No description'}</p>
                    <div className="text-xs text-gray-500 dark:text-white mb-2">
                      <p>To: {income.addToAccount}</p>
                      {income.receivedFrom && <p>From: {income.receivedFrom}</p>}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xl font-bold text-purple-700">{income.amount.toLocaleString()} <span className="text-sm font-semibold text-purple-600">{currency}</span></span>
                    </div>
                  </CardContent>
                  {/* Delete icon bottom right */}
                  <button
                    className={`absolute -bottom-0 right-0 focus:outline-none z-10 p-1 opacity-80 group-hover:opacity-100 ${
                      isFromPaymentTransaction(income)
                        ? 'text-gray-300 dark:text-white cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    title={isFromPaymentTransaction(income) ? 'Cannot delete payment-generated income' : 'Delete'}
                    onClick={e => { e.stopPropagation(); handleDeleteIncome(income); }}
                    disabled={isFromPaymentTransaction(income)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Expenses Section */}
      {visibleSection !== 'income' && (
      <div className="bg-white shadow-md border-2 border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Expenses</h2>
        <ExpenseSearchFilters
          searchTerm={expenseSearch}
          setSearchTerm={setExpenseSearch}
          sortBy={expenseSortBy}
          setSortBy={setExpenseSortBy}
          sortOrder={expenseSortOrder}
          setSortOrder={setExpenseSortOrder}
          onAddExpense={() => { setSelectedExpense?.(null); setExpenseDialogMode?.('add'); setShowExpenseDialog(true); }}
          expenses={expenses}
          setFilteredExpenses={setFilteredExpenses}
          viewMode={expenseViewMode}
          setViewMode={setExpenseViewMode}
          onImport={(items) => {
            const mapped = items.map((d: any) => ({
              id: d._id || d.id,
              date: d.date ? new Date(d.date).toISOString().slice(0,10) : '',
              amount: Number(d.amount || 0),
              expenseCategory: d.expenseCategory,
              vendorName: d.vendorName,
              vendorType: d.vendorType,
              paymentMode: d.paymentMode,
              description: d.description,
              addFromAccount: d.addFromAccount,
              receivedBy: d.receivedBy,
              receivedFrom: d.receivedFrom,
              receiptNumber: d.receiptNumber,
            } as Expense));
            setExpenses(prev => [...mapped, ...prev]);
            setFilteredExpenses(prev => [...mapped, ...prev]);
            toast({ title: 'Import complete', description: `${mapped.length} expenses inserted.` });
          }}
          selectedIds={selectedExpenseIds}
          setShowExpenseDraftsDialog={handleShowExpenseDraftsDialog}
          draftsCount={expenseDraftsCount}
        />
        
        {/* Count bar for both views + column selector button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="w-full rounded-xl px-6 py-3 flex items-center text-base font-medium" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor, backgroundImage: `linear-gradient(90deg, ${primaryColor}20 80%, #fff 100%)` }}>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full inline-block mr-2" style={{ backgroundColor: primaryColor }}></span>
              <span className="font-bold">{filteredExpenses.length}</span>
              <span className="font-normal">{filteredExpenses.length === 1 ? 'expense found' : 'expenses found'}</span>
            </span>
          </div>
          {expenseViewMode === 'list' && (
            <button
              className="ml-4 w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm hover:shadow transition-colors"
              style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
              onClick={() => setShowExpenseColumnSelector(true)}
              title="Displayed Columns"
              aria-label="Edit displayed expense columns"
            >
              <GridIcon className="w-6 h-6" fill={primaryColor} />
            </button>
          )}
        </div>
        {expenseViewMode === 'list' && (
          <ColumnSelectorModal
            open={showExpenseColumnSelector}
            columns={expenseColumns}
            displayedColumns={expenseDisplayedColumns}
            setDisplayedColumns={setExpenseDisplayedColumns}
            onClose={() => setShowExpenseColumnSelector(false)}
            onSave={() => setShowExpenseColumnSelector(false)}
            onReset={() => setExpenseDisplayedColumns(expenseColumns)}
            storageKeyPrefix="expense"
          />
        )}
        {expenseViewMode === "list" ? (
          <div className="overflow-x-auto pb-4">
            <div style={{ minWidth: 900 }}>
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#a78bfa]/60 scrollbar-track-[#f4f2ff]">
                <table className="min-w-full text-[15px] bg-white border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20 bg-[#f8f8fc]">
                    <tr className="bg-[#f8f8fc] text-gray-700 dark:text-white">
                      {/* Selection column header */}
                      <th className="sticky top-0 z-20 px-4 py-3 text-left font-semibold w-10 bg-[#f8f8fc]">
                        {(() => {
                          const visibleIds = filteredExpenses.map(e => e.id);
                          const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedExpenseIds.includes(id));
                          return (
                            <input
                              type="checkbox"
                              aria-label="Select all visible expenses"
                              checked={allSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                const next = e.target.checked
                                  ? Array.from(new Set([...selectedExpenseIds, ...visibleIds]))
                                  : selectedExpenseIds.filter(id => !visibleIds.includes(id));
                                setSelectedExpenseIds(next);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          );
                        })()}
                      </th>
                      {expenseDisplayedColumns.map(col => (
                        <th
                          key={col}
                          className={(col === "Actions"
                            ? "sticky top-0 z-20 px-6 py-3 text-center font-semibold "
                            : "sticky top-0 z-20 px-6 py-3 text-left font-semibold ") + "bg-[#f8f8fc]"}
                        >
                          {col === "Actions" ? '' : col === "Amount" ? `Amount (${currency})` : col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={expenseDisplayedColumns.length + 1} className="text-center text-gray-500 dark:text-white py-8">No expenses found.</td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-gray-200 dark:border-gray-700 group cursor-pointer transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''} onClick={() => handleViewExpense(expense)}>
                          {/* Selection checkbox cell */}
                          <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Select expense ${expense.expenseCategory}`}
                              checked={selectedExpenseIds.includes(expense.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedExpenseIds(prev => checked ? [...prev, expense.id] : prev.filter(id => id !== expense.id));
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          {expenseDisplayedColumns.map(col => {
                            switch (col) {
                              case "Date":
                                return <td key="date" className="px-6 py-3 text-black">{formatDate(new Date(expense.date), 'dd-MMM-yyyy')}</td>;
                              case "Amount":
                                return <td key="amount" className="px-6 py-3 text-black">{expense.amount.toLocaleString()}</td>;
                              case "Category":
                                return <td key="category" className="px-6 py-3">
                                  <span className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                    {expense.expenseCategory}
                                  </span>
                                </td>;
                              case "Vendor Name":
                                return <td key="vendorName" className="px-6 py-3 text-gray-700 dark:text-white">{expense.vendorName || '-'}</td>;
                              case "Vendor Type":
                                return <td key="vendorType" className="px-6 py-3">
                                  <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">
                                    {expense.vendorType || '-'}
                                  </span>
                                </td>;
                              case "Payment Mode":
                                return <td key="paymentMode" className="px-6 py-3">
                                  <span className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                                    {expense.paymentMode || '-'}
                                  </span>
                                </td>;
                              case "From Account":
                                return <td key="fromAccount" className="px-6 py-3 text-gray-700 dark:text-white">{expense.addFromAccount}</td>;
                              case "Received By":
                                return <td key="receivedBy" className="px-6 py-3 text-gray-700 dark:text-white">{expense.receivedBy || '-'}</td>;
                              case "Received From":
                                return <td key="receivedFrom" className="px-6 py-3 text-gray-700 dark:text-white">{expense.receivedFrom || '-'}</td>;
                              case "Receipt Number":
                                return <td key="receiptNumber" className="px-6 py-3 text-gray-700 dark:text-white">{expense.receiptNumber || '-'}</td>;
                              case "Description":
                                return <td key="desc" className="px-6 py-3 text-gray-600 dark:text-white">{expense.description || '-'}</td>;
                              case "Actions":
                                return <td key="actions" className="px-6 py-3 text-center align-middle">
                                  <div className="flex justify-center items-center gap-2 h-full min-h-[40px]">
                                    <button
                                      className="text-gray-500 dark:text-white hover:text-blue-600 p-1 rounded-full focus:outline-none"
                                      title="Edit"
                                      onClick={e => { e.stopPropagation(); handleEditExpense(expense); }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      className="p-2 rounded text-red-500 hover:text-red-700"
                                      onClick={e => { e.stopPropagation(); handleDeleteExpense(expense); }}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>;
                              default:
                                return null;
                            }
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 w-max">
              {/* Count bar for grid view is above, shared with list view */}
              {filteredIncomes.map((income) => (
                <Card key={income.id} className="hover:shadow-lg transition-shadow cursor-pointer group relative border-2 border-orange-400 hover:border-orange-500 bg-white rounded-xl p-0 w-80 flex-shrink-0" onClick={() => handleViewIncome(income)}>
                  <CardContent className="p-5 pb-2 relative">
                    {/* Edit button top right */}
                    <button
                      className={`absolute top-1 right-1 p-1 rounded-full focus:outline-none z-10 opacity-80 group-hover:opacity-100 ${
                        isFromPaymentTransaction(income)
                          ? 'text-gray-300 dark:text-white cursor-not-allowed'
                          : 'text-gray-500 dark:text-white hover:text-orange-500'
                      }`}
                      title={isFromPaymentTransaction(income) ? 'Cannot edit payment-generated income' : 'Edit'}
                      onClick={e => { e.stopPropagation(); handleEditIncome(income); }}
                      disabled={isFromPaymentTransaction(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight line-clamp-2">{income.incomeCategory}</h3>
                        <p className="text-sm text-gray-500 dark:text-white">{formatDate(new Date(income.date), 'dd-MMM-yyyy')}</p>
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2 items-center">
                      <Badge className="bg-blue-100 text-blue-700">{income.paymentMode || 'N/A'}</Badge>
                      {income.sourceType && <Badge className="bg-purple-100 text-purple-700">{income.sourceType}</Badge>}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-white mb-1">{income.description || 'No description'}</p>
                    <div className="text-xs text-gray-500 dark:text-white mb-2">
                      <p>To: {income.addToAccount}</p>
                      {income.receivedFrom && <p>From: {income.receivedFrom}</p>}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xl font-bold text-purple-700">{income.amount.toLocaleString()} <span className="text-sm font-semibold text-purple-600">{currency}</span></span>
                    </div>
                  </CardContent>
                  {/* Delete icon bottom right */}
                  <button
                    className={`absolute -bottom-0 right-0 focus:outline-none z-10 p-1 opacity-80 group-hover:opacity-100 ${
                      isFromPaymentTransaction(income)
                        ? 'text-gray-300 dark:text-white cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    title={isFromPaymentTransaction(income) ? 'Cannot delete payment-generated income' : 'Delete'}
                    onClick={e => { e.stopPropagation(); handleDeleteIncome(income); }}
                    disabled={isFromPaymentTransaction(income)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
    
    {/* Draft Dialogs */}
    <IncomeDraftsDialog
      open={showIncomeDraftsDialog}
      onOpenChange={handleShowIncomeDraftsDialog}
      onEditDraft={handleEditIncomeDraft}
    />
    
    <ExpenseDraftsDialog
      open={showExpenseDraftsDialog}
      onOpenChange={handleShowExpenseDraftsDialog}
      onEditDraft={handleEditExpenseDraft}
    />
    </>
  );
}