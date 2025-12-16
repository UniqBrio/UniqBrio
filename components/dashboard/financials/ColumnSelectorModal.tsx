"use client";
import React, { useState } from "react";
import { ChevronsRight, ChevronsLeft, ArrowRight, ArrowLeft, Save, RotateCcw, X, ChevronUp, ChevronDown } from "lucide-react";
import { useCustomColors } from '@/lib/use-custom-colors'

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
}) => {
  const { primaryColor } = useCustomColors()
  // Always-on columns (not user removable)
  const ACTIONS_COL = "Actions";
  const LOCKED_COLUMNS = ["Date", "Amount"];
  // Work with a draft list that excludes the always-on columns if they appear in the incoming prop
  const [draftDisplayed, setDraftDisplayed] = useState<string[]>(
    displayedColumns.filter(c => c !== ACTIONS_COL && !LOCKED_COLUMNS.includes(c))
  );
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedDisplayed, setSelectedDisplayed] = useState<string[]>([]);
  const availableColumns = columns.filter(col => 
    col !== ACTIONS_COL && 
    !LOCKED_COLUMNS.includes(col) && 
    !draftDisplayed.includes(col)
  );

  // Keyboard navigation state
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Refs
  const availableListRef = React.useRef<HTMLDivElement>(null);
  const displayedListRef = React.useRef<HTMLDivElement>(null);

  // Sync when opened / external change
  React.useEffect(() => {
    if (open) {
      setDraftDisplayed(displayedColumns.filter(c => c !== ACTIONS_COL && !LOCKED_COLUMNS.includes(c)));
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
  const selectAllDisplayed = () => setSelectedDisplayed(draftDisplayed.slice());
  const clearDisplayedSelection = () => setSelectedDisplayed([]);
  const handleAdd = () => {
    setDraftDisplayed(prev => [...prev, ...selectedAvailable]);
    setSelectedAvailable([]);
  };
  const handleRemove = () => {
    setDraftDisplayed(prev => prev.filter(col => !selectedDisplayed.includes(col) || LOCKED_COLUMNS.includes(col)));
    setSelectedDisplayed(prev => prev.filter(col => !LOCKED_COLUMNS.includes(col)));
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
            // Don't allow toggling of locked columns when in displayed list
            if (focusedList === 'displayed' && LOCKED_COLUMNS.includes(item)) {
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
              // Only select non-locked columns in displayed list
              const selectableDisplayed = draftDisplayed.filter(col => !LOCKED_COLUMNS.includes(col));
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
            const finalDisplayed = [...LOCKED_COLUMNS, ...draftDisplayed, ACTIONS_COL];
            setDisplayedColumns(finalDisplayed);
            const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
            if (key) localStorage.setItem(key, JSON.stringify(finalDisplayed));
            onSave();
          }
          break;
        }
        case 'r': case 'R': {
          if (e.ctrlKey) { e.preventDefault(); setDraftDisplayed(columns.filter(c => c !== ACTIONS_COL && !LOCKED_COLUMNS.includes(c))); setSelectedAvailable([]); setSelectedDisplayed([]); onReset(); }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-3 sm:p-6 lg:p-8 w-full max-w-[95vw] sm:min-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="font-bold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">Select Columns to Display
          <div className="text-xs sm:text-sm text-gray-600 dark:text-white mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] sm:text-xs">
              <div className="truncate"><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white text-[10px] sm:text-xs">Shift+↑↓</kbd> <span className="hidden sm:inline">Multi-select</span><span className="sm:hidden">Multi</span></div>
              <div className="truncate"><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white text-[10px] sm:text-xs">Tab</kbd> <span className="hidden sm:inline">Switch list</span><span className="sm:hidden">Switch</span></div>
              <div className="truncate"><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white text-[10px] sm:text-xs">Ctrl+A</kbd> <span className="hidden sm:inline">Select all</span><span className="sm:hidden">All</span></div>
              <div className="truncate"><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white text-[10px] sm:text-xs">Ctrl+D</kbd> <span className="hidden sm:inline">Deselect all</span><span className="sm:hidden">Clear</span></div>
              
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 lg:gap-8">
          {/* Available */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-2 text-xs sm:text-sm">Available Columns</div>
            <div
              ref={availableListRef}
              className={`w-full h-32 sm:h-40 border rounded p-2 overflow-y-auto ${focusedList === 'available' ? 'ring-1' : ''}`}
              role="listbox"
              tabIndex={focusedList === 'available' ? 0 : -1}
              aria-label="Available columns"
              onFocus={() => setFocusedList('available')}
              style={focusedList === 'available' ? ({ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor} inset` }) : undefined}
            >
              {availableColumns.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'available' && focusedIndex === idx ? 'border' : 'hover:bg-gray-50'}`}
                  onClick={() => { setFocusedList('available'); setFocusedIndex(idx); availableListRef.current?.focus(); }}
                  style={focusedList === 'available' && focusedIndex === idx ? ({ backgroundColor: `${primaryColor}15`, borderColor: primaryColor }) : undefined}
                >
                  <input
                    type="checkbox"
                    checked={selectedAvailable.includes(col)}
                    onChange={() => setSelectedAvailable(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                    className="flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm truncate">{col}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Move buttons */}
          <div className="flex sm:flex-col justify-center gap-2 order-3 sm:order-2">
            <button
              className={`px-2 sm:px-3 py-1 rounded flex items-center justify-center transition-colors flex-1 sm:flex-none ${selectedAvailable.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
              onClick={handleAdd}
              disabled={!selectedAvailable.length}
              title="Add Selected (→)"
              style={!selectedAvailable.length ? undefined : ({ backgroundColor: `${primaryColor}15`, color: primaryColor })}
              onMouseEnter={(e) => { if (selectedAvailable.length) e.currentTarget.style.backgroundColor = `${primaryColor}20` }}
              onMouseLeave={(e) => { if (selectedAvailable.length) e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className={`px-2 sm:px-3 py-1 rounded flex items-center justify-center transition-colors flex-1 sm:flex-none ${availableColumns.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
              onClick={() => { setDraftDisplayed(prev => [...prev, ...availableColumns]); setSelectedAvailable([]); }}
              disabled={!availableColumns.length}
              title="Add All"
              style={!availableColumns.length ? undefined : ({ backgroundColor: `${primaryColor}15`, color: primaryColor })}
              onMouseEnter={(e) => { if (availableColumns.length) e.currentTarget.style.backgroundColor = `${primaryColor}20` }}
              onMouseLeave={(e) => { if (availableColumns.length) e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            >
              <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className={`px-2 sm:px-3 py-1 rounded flex items-center justify-center transition-colors flex-1 sm:flex-none ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
              onClick={handleRemove}
              disabled={!selectedDisplayed.length}
              title="Remove Selected (←)"
              style={!selectedDisplayed.length ? undefined : ({ backgroundColor: `${primaryColor}15`, color: primaryColor })}
              onMouseEnter={(e) => { if (selectedDisplayed.length) e.currentTarget.style.backgroundColor = `${primaryColor}20` }}
              onMouseLeave={(e) => { if (selectedDisplayed.length) e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className={`px-2 sm:px-3 py-1 rounded flex items-center justify-center transition-colors flex-1 sm:flex-none ${draftDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
              onClick={() => { setDraftDisplayed([]); setSelectedDisplayed([]); }}
              disabled={!draftDisplayed.length}
              title="Remove All (except required)"
              style={!draftDisplayed.length ? undefined : ({ backgroundColor: `${primaryColor}15`, color: primaryColor })}
              onMouseEnter={(e) => { if (draftDisplayed.length) e.currentTarget.style.backgroundColor = `${primaryColor}20` }}
              onMouseLeave={(e) => { if (draftDisplayed.length) e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            >
              <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          {/* Displayed */}
          <div className="flex-1 min-w-0 order-2 sm:order-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-xs sm:text-sm">Displayed Columns</div>
              <div className="flex gap-1">
                <button
                  className={`text-xs px-1.5 sm:px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => moveDisplayed('up')}
                  disabled={!selectedDisplayed.length}
                  title="Move Up (Ctrl+PgUp)"
                >
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  className={`text-xs px-1.5 sm:px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => moveDisplayed('down')}
                  disabled={!selectedDisplayed.length}
                  title="Move Down (Ctrl+PgDn)"
                >
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
            <div
              ref={displayedListRef}
              className={`w-full h-32 sm:h-40 border rounded p-2 overflow-y-auto ${focusedList === 'displayed' ? 'ring-1' : ''}`}
              role="listbox"
              tabIndex={focusedList === 'displayed' ? 0 : -1}
              aria-label="Displayed columns"
              onFocus={() => setFocusedList('displayed')}
              style={focusedList === 'displayed' ? ({ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor} inset` }) : undefined}
            >
              {/* Show locked columns first */}
              {LOCKED_COLUMNS.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 py-1 rounded px-2 bg-gray-50 border border-gray-200 mb-1"
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
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'displayed' && focusedIndex === idx ? 'border' : 'hover:bg-gray-50'}`}
                  onClick={() => { setFocusedList('displayed'); setFocusedIndex(idx); displayedListRef.current?.focus(); }}
                  style={focusedList === 'displayed' && focusedIndex === idx ? ({ backgroundColor: `${primaryColor}15`, borderColor: primaryColor }) : undefined}
                >
                  <input
                    type="checkbox"
                    checked={selectedDisplayed.includes(col)}
                    onChange={() => setSelectedDisplayed(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                  />
                  <span>{col}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 mt-4 sm:mt-6">
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded text-white font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            onClick={() => {
              const finalDisplayed = [...LOCKED_COLUMNS, ...draftDisplayed, ACTIONS_COL];
              setDisplayedColumns(finalDisplayed);
              const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
              if (key) localStorage.setItem(key, JSON.stringify(finalDisplayed));
              onSave();
            }}
            title="Save (Ctrl+S)"
          >
            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            onClick={() => {
              setDraftDisplayed(columns.filter(c => c !== ACTIONS_COL && !LOCKED_COLUMNS.includes(c)));
              setSelectedAvailable([]);
              setSelectedDisplayed([]);
              onReset();
            }}
            title="Reset (Ctrl+R)"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            onClick={onClose}
            title="Close (Escape)"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelectorModal;
