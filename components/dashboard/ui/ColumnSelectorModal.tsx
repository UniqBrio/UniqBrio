"use client";
import React, { useState } from "react";
import { ChevronsRight, ChevronsLeft, ArrowRight, ArrowLeft, Save, RotateCcw, X, ChevronUp, ChevronDown } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";
import { setTenantLocalStorage } from "@/lib/tenant-storage";

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
  /** Function to convert column IDs to display labels */
  getColumnLabel?: (columnId: string) => string;
  /** Optional flag to control whether to add an Actions column automatically */
  includeActionsColumn?: boolean;
  /** Array of column IDs that must always be displayed and cannot be removed */
  requiredColumns?: string[];
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
  getColumnLabel,
  includeActionsColumn = true,
  requiredColumns = [],
}) => {
  const { primaryColor } = useCustomColors()
  // Always-on column (not user removable)
  const ACTIONS_COL = "Actions";
  // Work with a draft list that excludes the always-on column if it appears in the incoming prop
  const [draftDisplayed, setDraftDisplayed] = useState<string[]>(displayedColumns.filter(c => c !== ACTIONS_COL));
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedDisplayed, setSelectedDisplayed] = useState<string[]>([]);
  const availableColumns = columns.filter(col => col !== ACTIONS_COL && !draftDisplayed.includes(col) && !requiredColumns.includes(col));

  // Keyboard navigation state
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Refs
  const availableListRef = React.useRef<HTMLDivElement>(null);
  const displayedListRef = React.useRef<HTMLDivElement>(null);

  // Sync when opened / external change
  React.useEffect(() => {
    if (open) {
      setDraftDisplayed(displayedColumns.filter(c => c !== ACTIONS_COL));
      setSelectedAvailable([]);
      setSelectedDisplayed([]);
    }
  }, [open, displayedColumns]);

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
  const selectAllDisplayed = () => setSelectedDisplayed(draftDisplayed.filter(col => !requiredColumns.includes(col)));
  const clearDisplayedSelection = () => setSelectedDisplayed([]);
  const handleAdd = () => {
    setDraftDisplayed(prev => [...prev, ...selectedAvailable]);
    setSelectedAvailable([]);
  };
  const handleRemove = () => {
    // Filter out required columns from removal
    const columnsToRemove = selectedDisplayed.filter(col => !requiredColumns.includes(col));
    setDraftDisplayed(prev => prev.filter(col => !columnsToRemove.includes(col)));
    setSelectedDisplayed([]);
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
          if (e.ctrlKey) { e.preventDefault(); focusedList === 'available' ? selectAllAvailable() : selectAllDisplayed(); }
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
            const finalDisplayed = includeActionsColumn ? [...draftDisplayed, ACTIONS_COL] : draftDisplayed;
            setDisplayedColumns(finalDisplayed);
            const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
            if (key) {
              setTenantLocalStorage(key, JSON.stringify(finalDisplayed)).catch(console.error);
            }
            onSave();
          }
          break;
        }
        case 'r': case 'R': {
          if (e.ctrlKey) { e.preventDefault(); setDraftDisplayed(columns.filter(c => c !== ACTIONS_COL)); setSelectedAvailable([]); setSelectedDisplayed([]); onReset(); }
          break;
        }
        case 'Home': { e.preventDefault(); setFocusedIndex(0); break; }
        case 'End': { e.preventDefault(); setFocusedIndex(currentList.length - 1); break; }
        case 'Escape': { e.preventDefault(); onClose(); break; }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, focusedList, focusedIndex, availableColumns, draftDisplayed, selectedAvailable, selectedDisplayed, storageKeyPrefix, columns, onClose, onReset, onSave, setDisplayedColumns]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-background dark:bg-gray-900 rounded-lg shadow-xl p-8 min-w-[500px] max-w-[95vw] relative z-[10000]">
        <div className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Select Columns to Display
          <div className="text-sm text-gray-600 dark:text-white mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-white">Shift+↑↓</kbd> Multi-select</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-white">Tab</kbd> Switch list</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+A</kbd> Select all</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+D</kbd> Deselect all</div>
              
            </div>
          </div>
        </div>
        <div className="flex gap-8">
          {/* Available */}
          <div className="flex-1">
            <div className="font-semibold mb-2 text-gray-800 dark:text-white">Available Columns</div>
            <div
              ref={availableListRef}
              className={`w-full h-40 border rounded p-2 overflow-y-auto bg-white dark:bg-gray-800/50 ${focusedList === 'available' ? 'ring-1' : 'border-gray-300 dark:border-gray-700'}`}
              style={focusedList === 'available' ? { borderColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties : {}}
              role="listbox"
              tabIndex={focusedList === 'available' ? 0 : -1}
              aria-label="Available columns"
              onFocus={() => setFocusedList('available')}
            >
              {availableColumns.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 text-gray-800 dark:text-white ${focusedList === 'available' && focusedIndex === idx ? 'border' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  style={focusedList === 'available' && focusedIndex === idx ? { backgroundColor: `${primaryColor}15`, borderColor: primaryColor } : {}}
                  onClick={() => { setFocusedList('available'); setFocusedIndex(idx); availableListRef.current?.focus(); }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAvailable.includes(col)}
                    onChange={() => setSelectedAvailable(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                    className="form-checkbox h-4 w-4 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    style={{ accentColor: primaryColor }}
                  />
                  <span>{getColumnLabel ? getColumnLabel(col) : col}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Move buttons */}
          <div className="flex flex-col justify-center gap-2">
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedAvailable.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'text-white'}`}
              style={selectedAvailable.length > 0 ? { backgroundColor: `${primaryColor}30`, color: primaryColor } : {}}
              onMouseEnter={(e) => selectedAvailable.length > 0 && (e.currentTarget.style.backgroundColor = `${primaryColor}50`)}
              onMouseLeave={(e) => selectedAvailable.length > 0 && (e.currentTarget.style.backgroundColor = `${primaryColor}30`)}
              onClick={handleAdd}
              disabled={!selectedAvailable.length}
              title="Add Selected (→)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${availableColumns.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'text-white'}`}
              style={availableColumns.length > 0 ? { backgroundColor: `${primaryColor}30`, color: primaryColor } : {}}
              onMouseEnter={(e) => availableColumns.length > 0 && (e.currentTarget.style.backgroundColor = `${primaryColor}50`)}
              onMouseLeave={(e) => availableColumns.length > 0 && (e.currentTarget.style.backgroundColor = `${primaryColor}30`)}
              onClick={() => { setDraftDisplayed(prev => [...prev, ...availableColumns]); setSelectedAvailable([]); }}
              disabled={!availableColumns.length}
              title="Add All"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedDisplayed.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'text-white'}`}
              style={selectedDisplayed.length > 0 ? { backgroundColor: `${primaryColor}30`, color: primaryColor } : {}}
              onMouseEnter={(e) => selectedDisplayed.length > 0 && (e.currentTarget.style.backgroundColor = `${primaryColor}50`)}
              onMouseLeave={(e) => selectedDisplayed.length > 0 && (e.currentTarget.style.backgroundColor = `${primaryColor}30`)}
              onClick={handleRemove}
              disabled={!selectedDisplayed.length}
              title="Remove Selected (←)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${draftDisplayed.length === 0 || draftDisplayed.length === requiredColumns.length ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'text-white'}`}
              style={draftDisplayed.length > 0 && draftDisplayed.length !== requiredColumns.length ? { backgroundColor: `${primaryColor}30`, color: primaryColor } : {}}
              onMouseEnter={(e) => (draftDisplayed.length > 0 && draftDisplayed.length !== requiredColumns.length) && (e.currentTarget.style.backgroundColor = `${primaryColor}50`)}
              onMouseLeave={(e) => (draftDisplayed.length > 0 && draftDisplayed.length !== requiredColumns.length) && (e.currentTarget.style.backgroundColor = `${primaryColor}30`)}
              onClick={() => { setDraftDisplayed(requiredColumns); setSelectedDisplayed([]); }}
              disabled={draftDisplayed.length === 0 || draftDisplayed.length === requiredColumns.length}
              title="Remove All"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          </div>
          {/* Displayed */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-gray-800 dark:text-white">Displayed Columns</div>
              <div className="flex gap-1">
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'}`}
                  onClick={() => moveDisplayed('up')}
                  disabled={!selectedDisplayed.length}
                  title="Move Up (Ctrl+PgUp)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'}`}
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
              className={`w-full h-40 border rounded p-2 overflow-y-auto bg-white dark:bg-gray-800/50 ${focusedList === 'displayed' ? 'ring-1' : 'border-gray-300 dark:border-gray-700'}`}
              style={focusedList === 'displayed' ? { borderColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties : {}}
              role="listbox"
              tabIndex={focusedList === 'displayed' ? 0 : -1}
              aria-label="Displayed columns"
              onFocus={() => setFocusedList('displayed')}
            >
              {draftDisplayed.map((col, idx) => {
                const isRequired = requiredColumns.includes(col);
                return (
                  <label
                    key={col}
                    className={`flex items-center gap-2 py-1 rounded px-2 text-gray-800 dark:text-white ${
                      isRequired 
                        ? 'bg-gray-200 dark:bg-gray-700/50 cursor-not-allowed opacity-70' 
                        : `cursor-pointer ${focusedList === 'displayed' && focusedIndex === idx ? 'border' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
                    }`}
                    style={!isRequired && focusedList === 'displayed' && focusedIndex === idx ? { backgroundColor: `${primaryColor}15`, borderColor: primaryColor } : {}}
                    onClick={() => { 
                      if (!isRequired) {
                        setFocusedList('displayed'); 
                        setFocusedIndex(idx); 
                        displayedListRef.current?.focus(); 
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDisplayed.includes(col)}
                      onChange={() => {
                        if (!isRequired) {
                          setSelectedDisplayed(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col]);
                        }
                      }}
                      disabled={isRequired}
                      className="form-checkbox h-4 w-4 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                      style={!isRequired ? { accentColor: primaryColor } : {}}
                    />
                    <span className={isRequired ? 'font-medium' : ''}>{getColumnLabel ? getColumnLabel(col) : col}</span>
                    {isRequired && <span className="ml-auto text-xs text-gray-500 dark:text-white italic">(Required)</span>}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded text-white font-semibold flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            onClick={() => {
              const finalDisplayed = includeActionsColumn ? [...draftDisplayed, ACTIONS_COL] : draftDisplayed;
              setDisplayedColumns(finalDisplayed);
              const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
              if (key) {
                setTenantLocalStorage(key, JSON.stringify(finalDisplayed)).catch(console.error);
              }
              onSave();
            }}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={() => {
              setDraftDisplayed(columns.filter(c => c !== ACTIONS_COL));
              setSelectedAvailable([]);
              setSelectedDisplayed([]);
              onReset();
            }}
            title="Reset (Ctrl+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
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