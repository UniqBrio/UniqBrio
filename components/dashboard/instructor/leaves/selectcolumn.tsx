"use client";
import React, { useState } from "react";
import { ChevronsRight, ChevronsLeft, ArrowRight, ArrowLeft, Save, RotateCcw, X, ChevronUp, ChevronDown } from "lucide-react";

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
  // Work with a draft list from the incoming prop
  const [draftDisplayed, setDraftDisplayed] = useState<string[]>(displayedColumns);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedDisplayed, setSelectedDisplayed] = useState<string[]>([]);
  const availableColumns = columns.filter(col => !draftDisplayed.includes(col));

  // Keyboard navigation state
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Refs
  const availableListRef = React.useRef<HTMLDivElement>(null);
  const displayedListRef = React.useRef<HTMLDivElement>(null);

  // Sync when opened / external change
  React.useEffect(() => {
    if (open) {
      setDraftDisplayed(displayedColumns);
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
    setDraftDisplayed(prev => prev.filter(col => !selectedDisplayed.includes(col)));
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
            const finalDisplayed = [...draftDisplayed];
            setDisplayedColumns(finalDisplayed);
            const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
            if (key) localStorage.setItem(key, JSON.stringify(finalDisplayed));
            onSave();
          }
          break;
        }
        case 'r': case 'R': {
          if (e.ctrlKey) { e.preventDefault(); setDraftDisplayed(columns); setSelectedAvailable([]); setSelectedDisplayed([]); onReset(); }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl p-8 min-w-[500px] max-w-[95vw]">
        <div className="font-bold text-lg mb-4 text-black">Select Columns to Display
          <div className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="text-xs font-semibold mb-2 text-gray-800">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Shift+??</kbd> Multi-select</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Tab</kbd> Switch list</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Ctrl+A</kbd> Select all</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Ctrl+D</kbd> Deselect all</div>
            </div>
          </div>
        </div>
        <div className="flex gap-8">
          {/* Available */}
          <div className="flex-1">
            <div className="font-semibold mb-2 text-black">Available Columns</div>
            <div
              ref={availableListRef}
              className={`w-full h-40 border rounded p-2 overflow-y-auto ${focusedList === 'available' ? 'border-purple-300 ring-1 ring-purple-200' : ''}`}
              role="listbox"
              tabIndex={focusedList === 'available' ? 0 : -1}
              aria-label="Available columns"
              onFocus={() => setFocusedList('available')}
            >
              {availableColumns.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'available' && focusedIndex === idx ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'}`}
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
          <div className="flex flex-col justify-center gap-2">
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedAvailable.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={handleAdd}
              disabled={!selectedAvailable.length}
              title="Add Selected (?)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${availableColumns.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={() => { setDraftDisplayed(prev => [...prev, ...availableColumns]); setSelectedAvailable([]); }}
              disabled={!availableColumns.length}
              title="Add All"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={handleRemove}
              disabled={!selectedDisplayed.length}
              title="Remove Selected (?)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${draftDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={() => { setDraftDisplayed([]); setSelectedDisplayed([]); }}
              disabled={!draftDisplayed.length}
              title="Remove All"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          </div>
          {/* Displayed */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-black">Displayed Columns</div>
              <div className="flex gap-1">
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => moveDisplayed('up')}
                  disabled={!selectedDisplayed.length}
                  title="Move Up (Ctrl+PgUp)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
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
              className={`w-full h-40 border rounded p-2 overflow-y-auto ${focusedList === 'displayed' ? 'border-purple-300 ring-1 ring-purple-200' : ''}`}
              role="listbox"
              tabIndex={focusedList === 'displayed' ? 0 : -1}
              aria-label="Displayed columns"
              onFocus={() => setFocusedList('displayed')}
            >
              {draftDisplayed.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'displayed' && focusedIndex === idx ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'}`}
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
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center gap-2"
            onClick={() => {
              const finalDisplayed = [...draftDisplayed];
              setDisplayedColumns(finalDisplayed);
              const key = storageKeyPrefix ? `${storageKeyPrefix}DisplayedColumns` : undefined;
              if (key) localStorage.setItem(key, JSON.stringify(finalDisplayed));
              onSave();
            }}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              setDraftDisplayed(columns);
              setSelectedAvailable([]);
              setSelectedDisplayed([]);
              onReset();
            }}
            title="Reset (Ctrl+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 flex items-center gap-2"
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
