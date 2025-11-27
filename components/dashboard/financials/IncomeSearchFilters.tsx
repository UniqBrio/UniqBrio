"use client"

import React, { useState, useRef, useMemo, type CSSProperties } from "react";
import { useCustomColors } from '@/lib/use-custom-colors';
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Upload, Download, Check, X, Plus, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/dashboard/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import type { Income } from "./types";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { MonthYearFilter } from "./MonthYearFilter";
import { useToast } from "@/hooks/dashboard/use-toast";
import { Progress } from "@/components/dashboard/ui/progress";
import type { Dispatch, SetStateAction } from "react";
import { useCurrency } from "@/contexts/currency-context";
interface IncomeSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  onAddIncome?: () => void;
  incomes?: Income[];
  setFilteredIncomes?: Dispatch<SetStateAction<Income[]>>;
  viewMode: "grid" | "list";
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  onImport?: (items: Income[]) => void;
  selectedIds?: string[];
  disabled?: boolean;
  setShowIncomeDraftsDialog?: (show: boolean) => void;
  draftsCount?: number;
}

type CSSPropertiesWithVars = CSSProperties & Record<string, string>;

// Options are now loaded from the backend options endpoint

export default function IncomeSearchFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onAddIncome,
  incomes = [],
  setFilteredIncomes,
  viewMode, // Use viewMode from props
  setViewMode, // Use setViewMode from props
  onImport,
  selectedIds = [],
  disabled = false,
  setShowIncomeDraftsDialog,
  draftsCount = 0,
}: IncomeSearchFiltersProps) {
  const { primaryColor } = useCustomColors();
  const { currency } = useCurrency();
  
  // Month/Year filter state - default to current month/year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // getMonth() returns 0-11
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Filter state
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [options, setOptions] = useState<{ incomeCategories: string[]; incomeSources: string[]; paymentModes: string[] }>({ incomeCategories: [], incomeSources: [], paymentModes: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [pendingFilters, setPendingFilters] = useState({
    category: [] as string[],
    source: [] as string[],
    paymentMode: [] as string[],
    amountRange: [0, 1000000] as [number, number],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    category: [] as string[],
    source: [] as string[],
    paymentMode: [] as string[],
    amountRange: [0, 1000000] as [number, number],
  });
  const firstCheckboxRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Load filter options from backend once with session caching
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingOptions(true);
        // Check session cache first
        const cached = sessionStorage.getItem('income-filter-options');
        if (cached) {
          const data = JSON.parse(cached);
          if (!cancelled) {
            setOptions({
              incomeCategories: data.incomeCategories || [],
              incomeSources: data.incomeSources || [],
              paymentModes: data.paymentModes || [],
            });
          }
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
            });
            // Cache for session
            sessionStorage.setItem('income-filter-options', JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error('Failed to load income filter options', e);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Import progress state
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({
    processed: 0,
    total: 0,
    inserted: 0,
    duplicates: 0,
    invalid: 0,
    errors: 0
  });

  // Explicit toggle handler to satisfy requirement:
  // If popup closed -> open, if open -> close
  const toggleFilterDropdown = React.useCallback(() => {
    setFilterDropdownOpen(prev => !prev);
  }, []);

  // Filtering logic
  const filtered = useMemo(() => {
    let data = incomes;
    
    // Month/Year filter - filter by selected month and year
    data = data.filter(i => {
      if (!i.date) return false;
      const itemDate = new Date(i.date);
      const itemMonth = itemDate.getMonth() + 1; // getMonth() returns 0-11
      const itemYear = itemDate.getFullYear();
      return itemMonth === selectedMonth && itemYear === selectedYear;
    });
    
    // Search
    if (searchTerm) {
      data = data.filter(i =>
        i.incomeCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (i.sourceType?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (i.receivedFrom?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }
    // Category filter
    if (selectedFilters.category.length) {
      data = data.filter(i => selectedFilters.category.includes(i.incomeCategory));
    }
    // Source filter
    if (selectedFilters.source.length) {
      data = data.filter(i => selectedFilters.source.includes(i.sourceType || ""));
    }
    // Payment Mode filter
    if (selectedFilters.paymentMode.length) {
      data = data.filter(i => selectedFilters.paymentMode.includes(i.paymentMode || ""));
    }
    // Amount range
    data = data.filter(i => i.amount >= selectedFilters.amountRange[0] && i.amount <= selectedFilters.amountRange[1]);
    // Sort
    data = [...data].sort((a, b) => {
      let vA: any = a[sortBy as keyof Income];
      let vB: any = b[sortBy as keyof Income];
      if (typeof vA === "string") vA = vA.toLowerCase();
      if (typeof vB === "string") vB = vB.toLowerCase();
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [incomes, selectedMonth, selectedYear, searchTerm, selectedFilters, sortBy, sortOrder]);

  // Update filtered incomes in parent when filtered changes
  React.useEffect(() => {
    if (setFilteredIncomes) {
      setFilteredIncomes(filtered);
    }
  }, [filtered, setFilteredIncomes]);

  // ---------- Import / Export helpers ----------
  function toCSV(rows: Income[]) {
    const headers = [
      'date','amount','incomeCategory','sourceType','paymentMode','addToAccount','receivedBy','receivedFrom','receiptNumber','description'
    ];
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push(headers.map(h => esc((r as any)[h])).join(','));
    });
    return lines.join('\n');
  }
  function download(filename: string, content: string, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function handleExportAll() {
    const csv = toCSV(incomes);
    download(`incomes-all-${new Date().toISOString().slice(0,10)}.csv`, csv);
  }
  function handleExportSelected() {
    if (!selectedIds?.length) {
      handleExportAll();
      return;
    }
    const byId = new Map(incomes.map(i => [i.id, i] as const));
    const rows = selectedIds.map(id => byId.get(id)).filter(Boolean) as Income[];
    const csv = toCSV(rows);
    download(`incomes-selected-${new Date().toISOString().slice(0,10)}.csv`, csv);
  }
  function parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const split = (line: string) => {
      const out: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i=0;i<line.length;i++) {
        const ch = line[i];
        if (inQ) {
          if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
          else if (ch === '"') inQ = false;
          else cur += ch;
        } else {
          if (ch === ',') { out.push(cur); cur = ''; }
          else if (ch === '"') inQ = true;
          else cur += ch;
        }
      }
      out.push(cur);
      return out;
    };
    const headers = split(lines[0]).map(h => h.trim());
    return lines.slice(1).map(l => {
      const cols = split(l);
      const o: any = {};
      headers.forEach((h, idx) => { o[h] = cols[idx]; });
      return o;
    });
  }
  function normalizeIncome(o: any): Income {
    return {
      date: String(o.date || o.Date || ''),
      amount: Number(o.amount ?? o.Amount ?? 0) || 0,
      incomeCategory: String(o.incomeCategory || o.Category || ''),
      sourceType: o.sourceType ?? o.Source ?? '',
      paymentMode: o.paymentMode ?? o['Payment Mode'] ?? '',
      addToAccount: String(o.addToAccount || o['To Account'] || ''),
      receivedBy: o.receivedBy ?? '',
      receivedFrom: o.receivedFrom ?? '',
      receiptNumber: o.receiptNumber ?? '',
      description: o.description ?? '',
      attachments: null,
      reference: o.reference ?? '',
      studentId: o.studentId ?? '',
      branch: o.branch ?? '',
      status: o.status ?? '',
      notes: o.notes ?? ''
    } as Income;
  }
  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result || '');
        let rows: any[] = [];
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const json = JSON.parse(text); rows = Array.isArray(json) ? json : [json];
        } else { rows = parseCSV(text); }
        const normalized = rows.map(normalizeIncome);
        const valid = normalized.filter(i => i.date && i.incomeCategory && i.addToAccount);
        if (!valid.length) {
          toast({ title: 'Import finished', description: 'No valid rows found in file', variant: 'destructive' });
          return;
        }
        const CHUNK = 200; // tune as needed
        setImporting(true);
        setImportStats({ processed: 0, total: valid.length, inserted: 0, duplicates: 0, invalid: 0, errors: 0 });
        let allInserted: any[] = [];
        let rowStatuses: any[] = [];
        for (let i=0;i<valid.length;i+=CHUNK) {
          const chunk = valid.slice(i, i+CHUNK);
          try {
            const res = await fetch('/api/dashboard/financial/financials/bulk', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collection: 'incomes', items: chunk })
            });
            if (res.ok) {
              const json = await res.json();
              allInserted = allInserted.concat(json.successItems || []);
              rowStatuses = rowStatuses.concat(json.rowStatus || []);
              // Update stats incrementally
              const inserted = json.rowStatus?.filter((r: any) => r.status === 'inserted').length || 0;
              const duplicates = json.rowStatus?.filter((r: any) => r.status === 'duplicate').length || 0;
              const invalid = json.rowStatus?.filter((r: any) => r.status === 'invalid').length || 0;
              const errors = json.rowStatus?.filter((r: any) => r.status === 'error').length || 0;
              setImportStats(prev => ({
                ...prev,
                processed: Math.min(i + chunk.length, valid.length),
                inserted: prev.inserted + inserted,
                duplicates: prev.duplicates + duplicates,
                invalid: prev.invalid + invalid,
                errors: prev.errors + errors
              }));
            } else {
              console.warn('Chunk import failed status', res.status);
              setImportStats(prev => ({ ...prev, processed: Math.min(i + chunk.length, valid.length), errors: prev.errors + chunk.length }));
            }
          } catch (chunkErr) {
            console.warn('Chunk error', chunkErr);
            setImportStats(prev => ({ ...prev, processed: Math.min(i + chunk.length, valid.length), errors: prev.errors + chunk.length }));
          }
        }
        // Only use server confirmed inserted rows. If none inserted, show message and stop.
        if (!allInserted.length) {
          const summaryCounts = {
            duplicates: rowStatuses.filter((r: any) => r.status === 'duplicate').length,
            invalid: rowStatuses.filter((r: any) => r.status === 'invalid').length,
            errors: rowStatuses.filter((r: any) => r.status === 'error').length,
          };
          toast({
            title: 'No new incomes inserted',
            description: `${summaryCounts.duplicates} duplicates, ${summaryCounts.invalid} invalid, ${summaryCounts.errors} errors`,
            variant: 'destructive'
          });
        } else {
          onImport?.(allInserted as any);
          const inserted = rowStatuses.filter((r: any) => r.status === 'inserted').length;
          const duplicates = rowStatuses.filter((r: any) => r.status === 'duplicate').length;
          const invalid = rowStatuses.filter((r: any) => r.status === 'invalid').length;
          const errors = rowStatuses.filter((r: any) => r.status === 'error').length;
          console.info('Income import summary', { total: valid.length, inserted });
          toast({
            title: 'Income import complete',
            description: `${inserted} inserted, ${duplicates} duplicates, ${invalid} invalid, ${errors} errors`,
          });
        }
      } catch (err) {
        console.error(err);
        alert('Failed to import file. Ensure it is valid CSV or JSON.');
        toast({ title: 'Import failed', description: 'Could not parse or import file', variant: 'destructive' });
      } finally { e.target.value = ''; }
      setImporting(false);
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
        <Input
          placeholder="Search income sources..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {/* Month/Year Filter */}
        <MonthYearFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          label="Period"
          className="flex-shrink-0"
        />
        
        {/* View toggle */}
        <div className="flex rounded-md overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={()=>setViewMode('list')} 
            style={{ backgroundColor: viewMode==='list' ? primaryColor : '', color: viewMode==='list' ? 'white' : '' }}
            className={`rounded-l-md rounded-r-none border-0 h-9 px-3 ${viewMode==='list' ? '' : 'bg-gray-50'}`} 
            title="List View" 
            disabled={disabled}
          >
            <div className="flex flex-col gap-0.5 w-4 h-4"><div className="bg-current h-0.5 rounded-sm"></div><div className="bg-current h-0.5 rounded-sm"></div><div className="bg-current h-0.5 rounded-sm"></div></div>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={()=>setViewMode('grid')} 
            style={{ backgroundColor: viewMode==='grid' ? primaryColor : '', color: viewMode==='grid' ? 'white' : '' }}
            className={`rounded-r-md rounded-l-none border-0 h-9 px-3 ${viewMode==='grid' ? '' : 'bg-gray-50'}`} 
            title="Grid View" 
            disabled={disabled}
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div></div>
          </Button>
        </div>
        {/* Filter Button and Panel */}
        <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex items-center gap-1 relative group"
              aria-label="Filter options"
              title="Filter"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); toggleFilterDropdown(); }}
            >
              <span
                className="relative inline-flex text-[color:var(--filter-color)] transition-colors duration-200 group-hover:text-white"
                style={{ "--filter-color": primaryColor } as React.CSSProperties}
              >
                <Filter className="h-3.5 w-3.5" />
                {filterAction === "applied" && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                      <Check className="w-2 h-2 text-white" />
                    </span>
                  </span>
                )}
                {filterAction === "cleared" && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500">
                      <X className="w-2 h-2 text-white" />
                    </span>
                  </span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[280px] p-0 filter-panel"
            onCloseAutoFocus={e => e.preventDefault()}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
            onOpenAutoFocus={e => { e.preventDefault(); firstCheckboxRef.current?.focus(); }}
          >
            <div className="max-h-96 overflow-y-auto p-4 relative">
              <MultiSelectDropdown
                label="Filter by Category"
                options={options.incomeCategories}
                selected={pendingFilters.category}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, category: next }))}
                placeholder="All Categories"
              />
              <MultiSelectDropdown
                label="Filter by Source"
                options={options.incomeSources}
                selected={pendingFilters.source}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, source: next }))}
                placeholder="All Sources"
              />
              <MultiSelectDropdown
                label="Filter by Payment Mode"
                options={options.paymentModes}
                selected={pendingFilters.paymentMode}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, paymentMode: next }))}
                placeholder="All Modes"
              />
            <div className="mb-2 font-semibold text-sm">Amount Range ({currency || 'Amount'})</div>
            <div className="flex flex-wrap gap-2 mb-3">
              <input
                type="number"
                min="0"
                className="w-20 px-2 py-1 text-xs border rounded"
                placeholder="Min"
                value={pendingFilters.amountRange[0]}
                onChange={e => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setPendingFilters(prev => ({
                    ...prev,
                    amountRange: [value, prev.amountRange[1]],
                  }));
                }}
                onKeyDown={e => {
                  if (e.key === '-' || e.key === '+' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
              />
              <span className="text-xs self-center">to</span>
              <input
                type="number"
                min="0"
                className="w-20 px-2 py-1 text-xs border rounded"
                placeholder="Max"
                value={pendingFilters.amountRange[1]}
                onChange={e => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setPendingFilters(prev => ({
                    ...prev,
                    amountRange: [prev.amountRange[0], value],
                  }));
                }}
                onKeyDown={e => {
                  if (e.key === '-' || e.key === '+' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div className="flex justify-between gap-2 mt-4">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                tabIndex={0}
                role="button"
                aria-label="Apply selected filters"
                onClick={() => {
                  setSelectedFilters({ ...pendingFilters });
                  setFilterDropdownOpen(false);
                  setFilterAction("applied");
                }}
              >
                Apply Filters
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                tabIndex={0}
                role="button"
                aria-label="Clear all filters"
                onClick={() => {
                  setPendingFilters({ ...pendingFilters, category: [], source: [], paymentMode: [] });
                  setSelectedFilters({ ...selectedFilters, category: [], source: [], paymentMode: [] });
                  setFilterDropdownOpen(false);
                  setFilterAction("cleared");
                }}
              >
                Clear All
              </Button>
            </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* Sort Field Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              title="Sort"
              size="sm"
              className="h-9 flex items-center gap-1 border text-[color:var(--sort-icon-color)] hover:bg-[color:var(--sort-hover-bg)] hover:text-white"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: `${primaryColor}15`,
                '--sort-icon-color': primaryColor,
                '--sort-hover-bg': primaryColor,
              } as CSSPropertiesWithVars}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {(() => {
                // Mirror expense sort label mapping so the active sort field name shows in the button
                const label = [
                  { value: "incomeCategory", label: "Category" },
                  { value: "date", label: "Date" },
                  { value: "amount", label: "Amount" },
                  { value: "sourceType", label: "Source" },
                  { value: "paymentMode", label: "Payment Mode" },
                ].find(o => o.value === sortBy)?.label;
                return label ? <span className="ml-1 text-xs">{label}</span> : null;
              })()}
              {sortOrder === "asc" ? (
                <ArrowUp className="ml-2 h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="ml-2 h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "incomeCategory", label: "Category" },
              { value: "date", label: "Date" },
              { value: "amount", label: "Amount" },
              { value: "sourceType", label: "Source" },
              { value: "paymentMode", label: "Payment Mode" },
            ].map(option => (
              <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortOrder("asc")}>
              <span>Ascending</span>
              {sortOrder === "asc" && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("desc")}>
              <span>Descending</span>
              {sortOrder === "desc" && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Import/Export */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportFileChange}
        />
        <Button variant="outline" size="sm" title="Upload File" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          <Upload className="mr-2 h-4 w-4" /> {importing ? 'Importing...' : 'Import'}
        </Button>
        {/* Single Export button: exports selected; falls back to all */}
        <Button
          variant="outline"
          size="sm"
          title={selectedIds.length ? `Export selected (${selectedIds.length})` : "Export"}
          onClick={handleExportSelected}
        >
          <Download className="mr-2 h-4 w-4" /> {selectedIds.length ? `Export (${selectedIds.length})` : 'Export'}
        </Button>

        {/* Drafts button - positioned after export, before add button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIncomeDraftsDialog?.(true)}
          style={{ backgroundColor: draftsCount >= 1 ? primaryColor : '', color: draftsCount >= 1 ? 'white' : '' }}
          className={`h-9 px-3 flex items-center gap-2 ${
            draftsCount >= 1 
              ? "" 
              : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          }`}
          onMouseEnter={(e) => { if (draftsCount >= 1) e.currentTarget.style.backgroundColor = primaryColor; }}
          onMouseLeave={(e) => { if (draftsCount >= 1) e.currentTarget.style.backgroundColor = primaryColor; }}
          title="Income Drafts"
        >
          <FileText className="h-4 w-4" />
          Drafts ({draftsCount})
        </Button>
        <Button 
          size="sm" 
          title="Add Income" 
          onClick={onAddIncome} 
          style={{ backgroundColor: primaryColor, color: 'white' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
        > 
          <Plus className="h-4 w-4 mr-2" /> Add Income 
        </Button>

        </div>
      {importing && (
        <div className="w-full flex items-center gap-4 mt-2">
          <div className="flex-1 max-w-xs">
            <Progress value={importStats.total ? (importStats.processed / importStats.total) * 100 : 0} />
          </div>
          <div className="text-xs text-muted-foreground">
            {importStats.processed}/{importStats.total} rows
          </div>
        </div>
      )}
    </div>
  );
}
