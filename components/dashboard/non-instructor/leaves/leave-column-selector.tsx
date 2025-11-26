"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import GridIcon from "@/components/dashboard/icons/grid-icon"
import { Save, RotateCcw, X, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"

export type LeaveColId =
  | "registeredDate"
  | "instructorId"
  | "instructor"
  | "jobLevel"
  | "contractType"
  | "leaveType"
  | "startDate"
  | "endDate"
  | "status"
  | "days"
  | "balance"
  | "edit"
  | "delete"

export const LEAVE_TABLE_COLUMNS: { id: LeaveColId; label: string }[] = [
  { id: "instructorId", label: "Non-Instructor ID" },
  { id: "instructor", label: "Non-Instructor Name" },
  { id: "jobLevel", label: "Job Level" },
  { id: "contractType", label: "Contract Type" },
  { id: "leaveType", label: "Leave Type" },
  { id: "startDate", label: "Start Date" },
  { id: "endDate", label: "End Date" },
  { id: "registeredDate", label: "Approved Date" },
  { id: "status", label: "Status" },
  { id: "days", label: "No. of days" },
  { id: "balance", label: "Assigned leaves" },
  { id: "edit", label: "" },
  { id: "delete", label: "" },
]

// Columns that must always be displayed and cannot be toggled/removed
// Instructor ID and Instructor Name are also mandatory and cannot be removed/reordered
const NON_EDITABLE_COLS: LeaveColId[] = ["instructorId", "instructor", "edit", "delete"]

type Props = {
  value: LeaveColId[]
  onChange: (cols: LeaveColId[]) => void
  storageKey?: string
  className?: string
  buttonTitle?: string
}

export default function LeaveColumnSelector({ value, onChange, storageKey = "leaveDisplayedColumns", className, buttonTitle = "Select displayed columns" }: Props) {
  const [open, setOpen] = useState(false)
  const { primaryColor } = useCustomColors()
  // Ensure mandatory (non-editable) columns are always present in draft
  const [draft, setDraft] = useState<LeaveColId[]>(() => {
    const base = [...value]
    NON_EDITABLE_COLS.forEach(c => { if (!base.includes(c)) base.push(c) })
    return base
  })
  const [selectedAvailable, setSelectedAvailable] = useState<LeaveColId[]>([])
  const [selectedDisplayed, setSelectedDisplayed] = useState<LeaveColId[]>([])

  // Keyboard navigation state
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available')
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  // Refs
  const availableListRef = useRef<HTMLDivElement>(null)
  const displayedListRef = useRef<HTMLDivElement>(null)

  const available = useMemo(
    () => LEAVE_TABLE_COLUMNS.map(c => c.id).filter(id => !draft.includes(id) && !NON_EDITABLE_COLS.includes(id)) as LeaveColId[],
    [draft]
  )

  // Keep user's chosen order; only validate and de-duplicate
  const sanitizeOrder = (cols: LeaveColId[]): LeaveColId[] => {
    const seen = new Set<LeaveColId>()
    const valid = cols.filter(
      (c): c is LeaveColId => LEAVE_TABLE_COLUMNS.some(x => x.id === c) && (seen.has(c) ? false : (seen.add(c), true))
    )
    // Ensure mandatory columns remain present; if missing, insert at their default relative positions
    NON_EDITABLE_COLS.forEach(c => {
      if (!valid.includes(c)) {
        const defIdx = LEAVE_TABLE_COLUMNS.findIndex(x => x.id === c)
        let insertAt = valid.length
        for (let i = 0; i < valid.length; i++) {
          const curIdx = LEAVE_TABLE_COLUMNS.findIndex(x => x.id === valid[i])
          if (curIdx > defIdx) { insertAt = i; break }
        }
        valid.splice(insertAt, 0, c)
      }
    })
    return valid
  }

  // Helper functions for keyboard shortcuts
  const selectAllAvailable = () => setSelectedAvailable(available.slice())
  const clearAvailableSelection = () => setSelectedAvailable([])
  const selectAllDisplayed = () => setSelectedDisplayed(draft.filter(c => !NON_EDITABLE_COLS.includes(c)))
  const clearDisplayedSelection = () => setSelectedDisplayed([])

  const handleAdd = () => {
    const next = sanitizeOrder([...draft, ...selectedAvailable.filter(c => !draft.includes(c))])
    setDraft(next)
    setSelectedAvailable([])
    window.dispatchEvent(new CustomEvent('leave-displayed-columns-changed', { detail: next }))
  }

  const handleRemove = () => {
    const next = sanitizeOrder(draft.filter(c => !selectedDisplayed.includes(c)))
    setDraft(next)
    setSelectedDisplayed([])
    window.dispatchEvent(new CustomEvent('leave-displayed-columns-changed', { detail: next }))
  }

  const moveDisplayed = (direction: 'up' | 'down') => {
    // Work only on editable columns (excluding mandatory ones)
    const editableDraft = draft.filter(c => !NON_EDITABLE_COLS.includes(c))
    const editableSelected = selectedDisplayed.filter(c => !NON_EDITABLE_COLS.includes(c))

    if (editableSelected.length === 0) return

    // Reorder within the editable subset
    let newOrder = [...editableDraft]
    if (direction === 'up') {
      for (let i = 1; i < newOrder.length; i++) {
        if (editableSelected.includes(newOrder[i]) && !editableSelected.includes(newOrder[i - 1])) {
          ;[newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]]
        }
      }
    } else {
      for (let i = newOrder.length - 2; i >= 0; i--) {
        if (editableSelected.includes(newOrder[i]) && !editableSelected.includes(newOrder[i + 1])) {
          ;[newOrder[i + 1], newOrder[i]] = [newOrder[i], newOrder[i + 1]]
        }
      }
    }

    // Merge back into full list keeping mandatory columns fixed in their current positions
    const newDraft = draft.map(c => (NON_EDITABLE_COLS.includes(c) ? c : newOrder.shift()!))
    setDraft(newDraft)
  }

  const save = () => {
    const ordered = sanitizeOrder(draft)
    onChange(ordered)
    try { localStorage.setItem(storageKey, JSON.stringify(ordered)) } catch {}
    setOpen(false)
  }

  const reset = () => {
    const allColumns = LEAVE_TABLE_COLUMNS.map(c => c.id as LeaveColId)
    setDraft(allColumns)
    setSelectedAvailable([])
    setSelectedDisplayed([])
  }

  // Sync when opened
  useEffect(() => {
    if (open) {
      const cleaned = (value as LeaveColId[]).filter(v => v !== ("subInstructor" as any))
      setDraft(sanitizeOrder([...cleaned, ...NON_EDITABLE_COLS.filter(c => !cleaned.includes(c))]))
      setSelectedAvailable([])
      setSelectedDisplayed([])
      setFocusedList('available')
      setFocusedIndex(0)
      setTimeout(() => availableListRef.current?.focus(), 80)
    }
  }, [open, value])

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return
    
    const handler = (e: KeyboardEvent) => {
      const currentList = focusedList === 'available' ? available : draft.filter(c => !NON_EDITABLE_COLS.includes(c))
      const currentSelected = focusedList === 'available' ? selectedAvailable : selectedDisplayed
      const setCurrentSelected = focusedList === 'available' ? setSelectedAvailable : setSelectedDisplayed

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          if (e.shiftKey) {
            const nextIdx = Math.min(focusedIndex + 1, currentList.length - 1)
            setFocusedIndex(nextIdx)
            const item = currentList[nextIdx]
            if (item && !currentSelected.includes(item)) setCurrentSelected(prev => [...prev, item])
          } else {
            setFocusedIndex(Math.min(focusedIndex + 1, currentList.length - 1))
          }
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          if (e.shiftKey) {
            const prevIdx = Math.max(focusedIndex - 1, 0)
            setFocusedIndex(prevIdx)
            const item = currentList[prevIdx]
            if (item && !currentSelected.includes(item)) setCurrentSelected(prev => [...prev, item])
          } else {
            setFocusedIndex(Math.max(focusedIndex - 1, 0))
          }
          break
        }
        case ' ':
        case 'Enter': {
          e.preventDefault()
          if (focusedIndex < currentList.length) {
            const item = currentList[focusedIndex]
            setCurrentSelected(prev => prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item])
          }
          break
        }
        case 'Tab': {
          e.preventDefault()
          if (focusedList === 'available') {
            setFocusedList('displayed')
            setFocusedIndex(0)
            displayedListRef.current?.focus()
          } else {
            setFocusedList('available')
            setFocusedIndex(0)
            availableListRef.current?.focus()
          }
          break
        }
        case 'a':
        case 'A': {
          if (e.ctrlKey) {
            e.preventDefault()
            focusedList === 'available' ? selectAllAvailable() : selectAllDisplayed()
          }
          break
        }
        case 'd':
        case 'D': {
          if (e.ctrlKey) {
            e.preventDefault()
            focusedList === 'available' ? clearAvailableSelection() : clearDisplayedSelection()
          }
          break
        }
        case 'ArrowRight': {
          if (focusedList === 'available' && selectedAvailable.length) {
            e.preventDefault()
            handleAdd()
          }
          break
        }
        case 'ArrowLeft': {
          if (focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            handleRemove()
          }
          break
        }
        case 'PageUp': {
          if (e.ctrlKey && focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            moveDisplayed('up')
          }
          break
        }
        case 'PageDown': {
          if (e.ctrlKey && focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            moveDisplayed('down')
          }
          break
        }
        case 's':
        case 'S': {
          if (e.ctrlKey) {
            e.preventDefault()
            save()
          }
          break
        }
        case 'r':
        case 'R': {
          if (e.ctrlKey) {
            e.preventDefault()
            reset()
          }
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedIndex(currentList.length - 1)
          break
        }
        case 'Escape': {
          e.preventDefault()
          setOpen(false)
          break
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, focusedList, focusedIndex, available, draft, selectedAvailable, selectedDisplayed, storageKey])

  return (
    <>
      <button
        type="button"
        className={`inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors ${className || ""}`}
        title={buttonTitle}
        onClick={() => {
          const cleaned = (value as LeaveColId[]).filter(v => v !== ("subInstructor" as any))
          setDraft(sanitizeOrder([...cleaned, ...NON_EDITABLE_COLS.filter(c => !cleaned.includes(c))]));
          setSelectedAvailable([]); setSelectedDisplayed([]); setOpen(true)
        }}
        aria-label={buttonTitle}
      >
        <GridIcon className="w-9 h-7" color={primaryColor} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl p-8 min-w-[700px] max-w-[95vw]">
            <div className="font-bold text-lg mb-4 text-black">Select Displayed Columns
              <div className="text-sm text-gray-600 dark:text-white mb-3 p-3 bg-gray-50 rounded-lg border">
                <div className="text-xs font-semibold mb-2 text-gray-800 dark:text-white">Keyboard Shortcuts:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Shift+??</kbd> Multi-select</div>
                  <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Tab</kbd> Switch list</div>
                  <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+A</kbd> Select all</div>
                  <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+D</kbd> Deselect all</div>
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="font-semibold mb-2 text-black">Available Columns</div>
                <div
                  ref={availableListRef}
                  className={`w-full h-40 border rounded p-2 overflow-y-auto`}
                  style={focusedList === 'available' ? { borderColor: primaryColor } : undefined}
                  role="listbox"
                  tabIndex={focusedList === 'available' ? 0 : -1}
                  aria-label="Available columns"
                  onFocus={() => setFocusedList('available')}
                >
                  {available.map((col, idx) => (
                    <label
                      key={col}
                      className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'available' && focusedIndex === idx ? '' : 'hover:bg-gray-50'}`}
                      style={focusedList === 'available' && focusedIndex === idx ? { backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}4D` } : undefined}
                      onClick={() => { setFocusedList('available'); setFocusedIndex(idx); availableListRef.current?.focus(); }}
                    >
                      <input
                        type="checkbox"
                        style={{ accentColor: primaryColor }}
                        checked={selectedAvailable.includes(col)}
                        onChange={() => setSelectedAvailable(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                      />
                      <span>{LEAVE_TABLE_COLUMNS.find(c => c.id === col)?.label ?? col}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <button
                  className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedAvailable.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
                  style={selectedAvailable.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
                  onClick={handleAdd}
                  disabled={selectedAvailable.length === 0}
                  title="Add Selected (?)"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${available.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
                  style={available.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
                  onClick={() => { 
                    const next = sanitizeOrder([...draft, ...available.filter(c => !draft.includes(c))]);
                    setDraft(next);
                    setSelectedAvailable([]);
                    window.dispatchEvent(new CustomEvent('leave-displayed-columns-changed', { detail: next }));
                  }}
                  disabled={available.length === 0}
                  title="Add All"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
                <button
                  className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
                  style={selectedDisplayed.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
                  onClick={handleRemove}
                  disabled={selectedDisplayed.length === 0}
                  title="Remove Selected (?)"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${draft.filter(c => !NON_EDITABLE_COLS.includes(c)).length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
                  style={draft.filter(c => !NON_EDITABLE_COLS.includes(c)).length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
                  onClick={() => { 
                    const next = sanitizeOrder([...NON_EDITABLE_COLS]);
                    setDraft(next);
                    setSelectedDisplayed([]);
                    window.dispatchEvent(new CustomEvent('leave-displayed-columns-changed', { detail: next }));
                  }}
                  disabled={draft.filter(c => !NON_EDITABLE_COLS.includes(c)).length === 0}
                  title="Remove All"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-black">Displayed Columns</div>
                  <div className="flex gap-1">
                    <button
                      className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
                      style={selectedDisplayed.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
                      onClick={() => moveDisplayed('up')}
                      disabled={selectedDisplayed.length === 0}
                      title="Move Up (Ctrl+PgUp)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : ''}`}
                      style={selectedDisplayed.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
                      onClick={() => moveDisplayed('down')}
                      disabled={selectedDisplayed.length === 0}
                      title="Move Down (Ctrl+PgDn)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  ref={displayedListRef}
                  className={`w-full h-40 border rounded p-2 overflow-y-auto`}
                  style={focusedList === 'displayed' ? { borderColor: primaryColor } : undefined}
                  role="listbox"
                  tabIndex={focusedList === 'displayed' ? 0 : -1}
                  aria-label="Displayed columns"
                  onFocus={() => setFocusedList('displayed')}
                >
                  {draft.map((col, idx) => {
                    const mandatory = NON_EDITABLE_COLS.includes(col)
                    const editableIdx = draft.filter(c => !NON_EDITABLE_COLS.includes(c)).indexOf(col)
                    const isFocused = focusedList === 'displayed' && focusedIndex === editableIdx && !mandatory
                    return (
                      <label 
                        key={col} 
                        className={`flex items-center gap-2 py-1 rounded px-2 ${
                          mandatory 
                            ? 'cursor-not-allowed' 
                            : isFocused 
                            ? 'bg-purple-100 border border-purple-300 cursor-pointer' 
                            : 'cursor-pointer hover:bg-gray-50'
                        }`}
                        style={(!mandatory && isFocused) ? { backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}4D` } : undefined}
                        onClick={() => {
                          if (!mandatory) {
                            setFocusedList('displayed');
                            setFocusedIndex(editableIdx);
                            displayedListRef.current?.focus();
                          }
                        }}
                      >                        
                        {col !== "edit" && col !== "delete" && (
                          mandatory ? (
                            <input
                              type="checkbox"
                              className="accent-blue-600"
                              checked={false}
                              disabled
                              tabIndex={-1}
                              aria-disabled={true}
                              title={'This column is mandatory'}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              className="accent-blue-600"
                              checked={selectedDisplayed.includes(col)}
                              onChange={() => setSelectedDisplayed(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                              style={{ accentColor: primaryColor }}
                              title={undefined}
                            />
                          )
                        )}
                        <span>
                          {LEAVE_TABLE_COLUMNS.find(c => c.id === col)?.label ?? col}
                          {mandatory && col !== "edit" && col !== "delete" && ' *'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center gap-2"
                onClick={save}
                title="Save (Ctrl+S)"
                aria-label="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                className="px-4 py-2 rounded text-white font-semibold flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
                onClick={reset}
                title="Reset (Ctrl+R)"
                aria-label="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 flex items-center gap-2"
                onClick={() => setOpen(false)}
                title="Close (Escape)"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
