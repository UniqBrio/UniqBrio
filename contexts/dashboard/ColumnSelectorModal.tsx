"use client";
import React, { useState } from "react";
import { ChevronsRight, ChevronsLeft, ArrowRight, ArrowLeft, Save, RotateCcw, X, ChevronUp, ChevronDown } from "lucide-react";
import { getTenantLocalStorage, setTenantLocalStorage } from "@/lib/tenant-storage";

export interface ColumnSelectorModalProps {
  open: boolean;
  columns: string[];
  displayedColumns: string[];
  setDisplayedColumns: (cols: string[]) => void;
  onClose: () => void;
  onSave: () => void;
  onReset: () => void;
  /** Optional flag so parent can distinguish income vs expense for persistence */
  storageKeyPrefix?: string; // e.g. "income" | "expense" (will store under <prefix>DisplayedColumns)
  /** Columns that are always displayed and cannot be removed by users */
  fixedColumns?: string[]; // e.g. ["Student ID", "Name", "Actions"]
}

export const ColumnSelectorModal: React.FC<ColumnSelectorModalProps> = ({
  open,
  columns,
  displayedColumns,
  setDisplayedColumns,
  onClose,
  onSave,
  onReset,
  storageKeyPrefix,
  fixedColumns = ["Actions"], // Default to just Actions for backward compatibility
}) => {
  // Work with a draft list that excludes all fixed columns
  const [draftDisplayed, setDraftDisplayed] = useState<string[]>(displayedColumns.filter(c => !fixedColumns.includes(c)));
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedDisplayed, setSelectedDisplayed] = useState<string[]>([]);
  const availableColumns = columns.filter(col => !fixedColumns.includes(col) && !draftDisplayed.includes(col));

  // Keyboard navigation state
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Refs
  const availableListRef = React.useRef<HTMLDivElement>(null);
  const displayedListRef = React.useRef<HTMLDivElement>(null);

  // Sync when opened / external change
  React.useEffect(() => {
    if (open) {
      setDraftDisplayed(displayedColumns.filter(c => !fixedColumns.includes(c)));
      setSelectedAvailable([]);
      setSelectedDisplayed([]);
    }
  }, [open, displayedColumns, fixedColumns]);

  // Initial focus
  React.useEffect(() => {
    if (open) {
      setFocusedList('available');
      setFocusedIndex(0);
      setTimeout(() => availableListRef.current?.focus(), 80);
    }
  }, [open]);

  // Helpers
  const selectAllAvailable = () => setSelectedAvailable(availableColumns.slice());
  const clearAvailableSelection = () => setSelectedAvailable([]);
  const selectAllDisplayed = () => setSelectedDisplayed(draftDisplayed.slice());
  const clearDisplayedSelection = () => setSelectedDisplayed([]);
  const handleAdd = () => {
    setDraftDisplayed(prev => [...prev, ...selectedAvailable]);
    setSelectedAvailable([]);
  };
  const handleRemove = () => {
    setDraftDisplayed(prev => prev.filter(col => !selectedDisplayed.includes(col) || fixedColumns.includes(col)));
    setSelectedDisplayed(prev => prev.filter(col => !fixedColumns.includes(col)));
  };
  const moveDisplayed = (dir: 'up' | 'down') => {
    const arr = [...draftDisplayed];
    if (dir === 'up') {
      for (let i = 1; i < arr.length; i++) {
        if (selectedDisplayed.includes(arr[i]) && !selectedDisplayed.includes(arr[i - 1])) {
          [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        }
      }
    } else {
      for (let i = arr.length - 2; i >= 0; i--) {
        if (selectedDisplayed.includes(arr[i]) && !selectedDisplayed.includes(arr[i + 1])) {
          [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
        }
      }
    }
    setDraftDisplayed(arr);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const currentList = focusedList === 'available' ? availableColumns : draftDisplayed;
      const currentSelected = focusedList === 'available' ? selectedAvailable : selectedDisplayed;
      const setCurrentSelected = focusedList === 'available' ? setSelectedAvailable : setSelectedDisplayed;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (e.shiftKey) {
            const nextIdx = Math.min(focusedIndex + 1, currentList.length - 1);
            setFocusedIndex(nextIdx);
            const item = currentList[nextIdx];
            if (item && !currentSelected.includes(item)) setCurrentSelected(prev => [...prev, item]);
          } else {
            setFocusedIndex(Math.min(focusedIndex + 1, currentList.length - 1));
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (e.shiftKey) {
            const prevIdx = Math.max(focusedIndex - 1, 0);
            setFocusedIndex(prevIdx);
            const item = currentList[prevIdx];
            if (item && !currentSelected.includes(item)) setCurrentSelected(prev => [...prev, item]);
          } else {
            setFocusedIndex(Math.max(focusedIndex - 1, 0));
          }
          break;
        }
        case ' ': // toggle
        case 'Enter': {
          e.preventDefault();
          if (focusedIndex < currentList.length) {
            const item = currentList[focusedIndex];
            // Don't allow toggling of fixed columns when in displayed list
            if (focusedList === 'displayed' && fixedColumns.includes(item)) {
              return;
            }
            setCurrentSelected(prev => prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]);
          }
          break;
        }
        case 'Tab': {
          // Toggle between the two lists on any Tab press while inside the modal
          e.preventDefault();
          if (focusedList === 'available') {
            setFocusedList('displayed');
            setFocusedIndex(0);
            displayedListRef.current?.focus();
          } else {
            setFocusedList('available');
            setFocusedIndex(0);
            availableListRef.current?.focus();
          }
          break;
        }
        case 'a': case 'A': {
          if (e.ctrlKey) { 
            e.preventDefault(); 
            if (focusedList === 'available') {
              selectAllAvailable();
            } else {
              // Only select non-fixed columns in displayed list
              const selectableDisplayed = draftDisplayed.filter(col => !fixedColumns.includes(col));
              setSelectedDisplayed(selectableDisplayed);
            }
          }
          break;
        }
        case 'd': case 'D': {
          if (e.ctrlKey) { e.preventDefault(); focusedList === 'available' ? clearAvailableSelection() : clearDisplayedSelection(); }
          break;
        }
        case 'ArrowRight': {
          // Add selected available columns with plain Right Arrow
          if (focusedList === 'available' && selectedAvailable.length) { e.preventDefault(); handleAdd(); }
          break;
        }
        case 'ArrowLeft': {
          // Remove selected displayed columns with plain Left Arrow
          if (focusedList === 'displayed' && selectedDisplayed.length) { e.preventDefault(); handleRemove(); }
          break;
        }
        case 'PageUp': {
          if (e.ctrlKey && focusedList === 'displayed' && selectedDisplayed.length) { e.preventDefault(); moveDisplayed('up'); }
          break;
        }
        case 'PageDown': {
          if (e.ctrlKey && focusedList === 'displayed' && selectedDisplayed.length) { e.preventDefault(); moveDisplayed('down'); }
          break;
        }
        case 's': case 'S': {
          if (e.ctrlKey) {
            e.preventDefault();
            // Migrate any legacy "Batch" to "Cohort" and remove duplicates before saving
            const migrated = draftDisplayed.map(col => col === 'Batch' ? 'Cohort' : col);
            const deduplicated = Array.from(new Set(migrated));
            // Separate fixed columns into start and end
            const startFixed = fixedColumns.filter(col => col !== 'Actions');
            const endFixed = fixedColumns.includes('Actions') ? ['Actions'] : [];
            // Combine: start fixed + user selected + end fixed
            const combined = [...startFixed, ...deduplicated, ...endFixed];
            const uniqueFinal = Array.from(new Set(combined));
            setDisplayedColumns(uniqueFinal);
            const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
            if (key) localStorage.setItem(key, JSON.stringify(uniqueFinal));
            onSave();
          }
          break;
        }
        case 'r': case 'R': {
          if (e.ctrlKey) { e.preventDefault(); setDraftDisplayed(columns.filter(c => !fixedColumns.includes(c))); setSelectedAvailable([]); setSelectedDisplayed([]); onReset(); }
          break;
        }
        case 'Home': { e.preventDefault(); setFocusedIndex(0); break; }
        case 'End': { e.preventDefault(); setFocusedIndex(currentList.length - 1); break; }
        case 'Escape': { e.preventDefault(); onClose(); break; }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    }, [open, focusedList, focusedIndex, availableColumns, draftDisplayed, selectedAvailable, selectedDisplayed, storageKeyPrefix, columns, onClose, onReset, onSave, setDisplayedColumns, fixedColumns]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 sm:p-8 w-full sm:min-w-[500px] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
        <div className="font-bold text-lg mb-4">Select Columns to Display</div>
        
        <div className="text-sm text-gray-600 dark:text-white mb-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-950 border rounded text-gray-700 dark:text-white">Shift+↑↓</kbd> Multi-select</div>
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-950 border rounded text-gray-700 dark:text-white">Tab</kbd> Switch list</div>
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-950 border rounded text-gray-700 dark:text-white">Ctrl+A</kbd> Select all</div>
            <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-950 border rounded text-gray-700 dark:text-white">Ctrl+D</kbd> Deselect all</div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Available */}
          <div className="flex-1 min-h-0">
            <div className="font-semibold mb-2">Available Columns</div>
            <div
              ref={availableListRef}
              className={`w-full h-40 md:max-h-[56vh] border rounded p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500 ${focusedList === 'available' ? 'border-purple-300 ring-1 ring-purple-200' : ''}`}
              style={{ scrollbarWidth: 'thin' }}
              role="listbox"
              tabIndex={focusedList === 'available' ? 0 : -1}
              aria-label="Available columns"
              onFocus={() => setFocusedList('available')}
            >
              {availableColumns.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'available' && focusedIndex === idx ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => { setFocusedList('available'); setFocusedIndex(idx); availableListRef.current?.focus(); }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAvailable.includes(col)}
                    onChange={() => setSelectedAvailable(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                  />
                  <span>{col}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Move buttons */}
          <div className="flex md:flex-col flex-row justify-center gap-2">
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedAvailable.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'}`}
              onClick={handleAdd}
              disabled={!selectedAvailable.length}
              title="Add Selected (→)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${availableColumns.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'}`}
              onClick={() => { setDraftDisplayed(prev => [...prev, ...availableColumns]); setSelectedAvailable([]); }}
              disabled={!availableColumns.length}
              title="Add All"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedDisplayed.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'}`}
              onClick={handleRemove}
              disabled={!selectedDisplayed.length}
              title="Remove Selected (←)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${draftDisplayed.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'}`}
              onClick={() => { setDraftDisplayed([]); setSelectedDisplayed([]); }}
              disabled={!draftDisplayed.length}
              title="Remove All"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          </div>
          {/* Displayed */}
          <div className="flex-1 min-h-0">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Displayed Columns</div>
              <div className="flex gap-1">
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50'}`}
                  onClick={() => moveDisplayed('up')}
                  disabled={!selectedDisplayed.length}
                  title="Move Up (Ctrl+PgUp)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50'}`}
                  onClick={() => moveDisplayed('down')}
                  disabled={!selectedDisplayed.length}
                  title="Move Down (Ctrl+PgDn)"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              ref={displayedListRef}
              className={`w-full h-40 md:max-h-[56vh] border rounded p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500 ${focusedList === 'displayed' ? 'border-purple-300 ring-1 ring-purple-200' : ''}`}
              style={{ scrollbarWidth: 'thin' }}
              role="listbox"
              tabIndex={focusedList === 'displayed' ? 0 : -1}
              aria-label="Displayed columns"
              onFocus={() => setFocusedList('displayed')}
            >
              {/* Show start fixed columns (Student ID, Student Name, etc.) */}
              {fixedColumns.filter(col => col !== 'Actions' && col !== 'Invoice' && col !== 'Send Reminder').map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 py-1 rounded px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-1"
                  title="This column is required and cannot be removed"
                >
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="opacity-50"
                  />
                  <span className="text-gray-600 dark:text-white font-medium">{col}*</span>
                </label>
              ))}
              
              {/* Show user-selectable displayed columns */}
              {draftDisplayed.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'displayed' && focusedIndex === idx ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => { setFocusedList('displayed'); setFocusedIndex(idx); displayedListRef.current?.focus(); }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDisplayed.includes(col)}
                    onChange={() => setSelectedDisplayed(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                  />
                  <span>{col}</span>
                </label>
              ))}
              
              {/* Show action-related fixed columns (Invoice, Send Reminder) before Actions */}
              {fixedColumns.filter(col => col === 'Invoice' || col === 'Send Reminder').map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 py-1 rounded px-2 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 mb-1"
                  title="This column is required and cannot be removed"
                >
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="opacity-50"
                  />
                  <span className="text-purple-700 dark:text-purple-300 font-medium">{col}*</span>
                </label>
              ))}
              
              {/* Show Actions fixed column at the end */}
              {fixedColumns.filter(col => col === 'Actions').map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 py-1 rounded px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-1"
                  title="This column is required and cannot be removed"
                >
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="opacity-50"
                  />
                  <span className="text-gray-600 dark:text-white font-medium">{col}*</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 mt-6 flex-shrink-0">
          <button
            className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center gap-2 text-sm sm:text-base"
            onClick={() => {
              // Migrate any legacy "Batch" to "Cohort" and remove duplicates before saving
              const migrated = draftDisplayed.map(col => col === 'Batch' ? 'Cohort' : col);
              const deduplicated = Array.from(new Set(migrated));
              // Separate fixed columns: start fixed, middle action-related fixed, and Actions
              const startFixed = fixedColumns.filter(col => col !== 'Actions' && col !== 'Invoice' && col !== 'Send Reminder');
              const actionFixed = fixedColumns.filter(col => col === 'Invoice' || col === 'Send Reminder');
              const endFixed = fixedColumns.includes('Actions') ? ['Actions'] : [];
              // Combine: start fixed + user selected + action fixed + Actions
              const combined = [...startFixed, ...deduplicated, ...actionFixed, ...endFixed];
              const uniqueFinal = Array.from(new Set(combined));
              setDisplayedColumns(uniqueFinal);
              const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
              if (key) {
                setTenantLocalStorage(key, JSON.stringify(uniqueFinal)).catch(console.error);
              }
              onSave();
            }}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            onClick={() => {
              setDraftDisplayed(columns.filter(c => !fixedColumns.includes(c)));
              setSelectedAvailable([]);
              setSelectedDisplayed([]);
              onReset();
            }}
            title="Reset (Ctrl+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={onClose}
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelectorModal;
