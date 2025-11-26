"use client"

import React, { useState, useEffect, useRef } from "react"
import { ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, Save, RotateCcw, X, ChevronUp, ChevronDown } from "lucide-react"
import { SALES_TABLE_COLUMNS, type SalesColumnId } from "./sales-columns"
import { useCustomColors } from "@/lib/use-custom-colors"

export interface ColumnSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storageKey: string
}

const MANDATORY_COLUMNS: readonly SalesColumnId[] = ['invoiceNumber', 'customerName'] as const

export const ColumnSelectorModal: React.FC<ColumnSelectorModalProps> = ({
  open,
  onOpenChange,
  storageKey,
}) => {
  const { primaryColor } = useCustomColors()
  const allowedColumns = SALES_TABLE_COLUMNS.map(c => c.id) as readonly SalesColumnId[]
  
  const anchorMandatory = (arr: SalesColumnId[]) => {
    const rest = arr.filter(c => !MANDATORY_COLUMNS.includes(c))
    return [...MANDATORY_COLUMNS, ...rest]
  }

  const [displayedColumns, setDisplayedColumns] = useState<SalesColumnId[]>(() => {
    if (typeof window === "undefined") return anchorMandatory([...allowedColumns])
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return anchorMandatory([...allowedColumns])
      const parsed = JSON.parse(raw) as string[]
      const ids = parsed.filter((id): id is SalesColumnId =>
        SALES_TABLE_COLUMNS.some((c) => c.id === id)
      )
      if (ids.length) {
        const missing = MANDATORY_COLUMNS.filter(m => !ids.includes(m))
        if (missing.length) {
          return anchorMandatory(ids as SalesColumnId[])
        }
        return anchorMandatory(ids as SalesColumnId[])
      }
      return anchorMandatory([...allowedColumns])
    } catch {
      return anchorMandatory([...allowedColumns])
    }
  })

  const [draftDisplayed, setDraftDisplayed] = useState<SalesColumnId[]>(displayedColumns)
  const [selectedAvailable, setSelectedAvailable] = useState<SalesColumnId[]>([])
  const [selectedDisplayed, setSelectedDisplayed] = useState<SalesColumnId[]>([])
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available')
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const availableListRef = useRef<HTMLDivElement | null>(null)
  const displayedListRef = useRef<HTMLDivElement | null>(null)

  const availableOptions = allowedColumns.filter(
    col => !MANDATORY_COLUMNS.includes(col) && !draftDisplayed.includes(col)
  )

  useEffect(() => {
    if (open) {
      setDraftDisplayed(displayedColumns)
      setSelectedAvailable([])
      setSelectedDisplayed([])
      setFocusedList('available')
      setFocusedIndex(0)
      setTimeout(() => availableListRef.current?.focus(), 80)
    }
  }, [open, displayedColumns])

  const selectAllAvailable = () => setSelectedAvailable(availableOptions.slice())
  const clearAvailableSelection = () => setSelectedAvailable([])
  const selectAllDisplayed = () => setSelectedDisplayed(draftDisplayed.filter(col => !MANDATORY_COLUMNS.includes(col)))
  const clearDisplayedSelection = () => setSelectedDisplayed([])

  const moveToDisplayed = () => {
    if (selectedAvailable.length === 0) return
    const newDisplayed = anchorMandatory([...draftDisplayed, ...selectedAvailable])
    setDraftDisplayed(newDisplayed)
    setSelectedAvailable([])
  }

  const moveAllToDisplayed = () => {
    if (availableOptions.length === 0) return
    const newDisplayed = anchorMandatory([...draftDisplayed, ...availableOptions])
    setDraftDisplayed(newDisplayed)
    setSelectedAvailable([])
  }

  const moveToAvailable = () => {
    const columnsToRemove = selectedDisplayed.filter(col => !MANDATORY_COLUMNS.includes(col))
    if (columnsToRemove.length === 0) return
    setDraftDisplayed(prev => prev.filter(col => !columnsToRemove.includes(col)))
    setSelectedDisplayed([])
  }

  const moveAllToAvailable = () => {
    setDraftDisplayed([...MANDATORY_COLUMNS])
    setSelectedDisplayed([])
  }

  const moveDisplayed = (dir: 'up' | 'down') => {
    const arr = [...draftDisplayed]
    if (dir === 'up') {
      for (let i = 1; i < arr.length; i++) {
        if (selectedDisplayed.includes(arr[i]) && !selectedDisplayed.includes(arr[i - 1])) {
          [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
        }
      }
    } else {
      for (let i = arr.length - 2; i >= 0; i--) {
        if (selectedDisplayed.includes(arr[i]) && !selectedDisplayed.includes(arr[i + 1])) {
          [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]
        }
      }
    }
    setDraftDisplayed(arr)
  }

  const handleSave = () => {
    setDisplayedColumns(draftDisplayed)
    localStorage.setItem(storageKey, JSON.stringify(draftDisplayed))
    window.dispatchEvent(new CustomEvent('sales-displayed-columns-changed', { detail: draftDisplayed }))
    onOpenChange(false)
  }

  const handleReset = () => {
    const defaultCols = anchorMandatory([...allowedColumns])
    setDraftDisplayed(defaultCols)
    setSelectedAvailable([])
    setSelectedDisplayed([])
  }

  const getColumnLabel = (id: SalesColumnId): string => {
    return SALES_TABLE_COLUMNS.find((c) => c.id === id)?.label || id
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const currentList = focusedList === 'available' ? availableOptions : draftDisplayed
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
            if (focusedList === 'displayed' && MANDATORY_COLUMNS.includes(item)) return
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
            moveToDisplayed()
          }
          break
        }
        case 'ArrowLeft': {
          if (focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            moveToAvailable()
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
            handleSave()
          }
          break
        }
        case 'r':
        case 'R': {
          if (e.ctrlKey) {
            e.preventDefault()
            handleReset()
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
          onOpenChange(false)
          break
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, focusedList, focusedIndex, availableOptions, draftDisplayed, selectedAvailable, selectedDisplayed])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-lg shadow-xl p-8 min-w-[700px] max-w-[95vw] relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold text-lg mb-4">Select Columns to Display
          <div className="text-sm text-gray-600 dark:text-white mb-3 p-3 bg-gray-50 rounded-lg border mt-2">
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Shift+↑↓</kbd> Multi-select</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Tab</kbd> Switch list</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+A</kbd> Select all</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+D</kbd> Deselect all</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-8">
          {/* Available Columns */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Available Columns</div>
            </div>
            <div
              ref={availableListRef}
              className={`w-full h-64 border rounded p-2 overflow-y-auto border-gray-300`}
              style={focusedList === 'available' ? { borderColor: primaryColor } : undefined}
              role="listbox"
              tabIndex={focusedList === 'available' ? 0 : -1}
              aria-label="Available columns"
              onFocus={() => setFocusedList('available')}
            >
              {availableOptions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-white text-sm">
                  All columns are displayed
                </div>
              ) : (
                availableOptions.map((col, idx) => (
                  <label
                    key={col}
                    className={`flex items-center gap-2 py-2 px-2 cursor-pointer rounded ${selectedAvailable.includes(col) ? '' : 'hover:bg-gray-50'}`}
                    style={focusedList === 'available' && focusedIndex === idx
                      ? { backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}4D` }
                      : selectedAvailable.includes(col)
                      ? { backgroundColor: `${primaryColor}0F` }
                      : undefined}
                    onClick={() => {
                      setFocusedList('available')
                      setFocusedIndex(idx)
                      setSelectedAvailable(prev =>
                        prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col]
                      )
                      availableListRef.current?.focus()
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAvailable.includes(col)}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{getColumnLabel(col)}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Move Buttons */}
          <div className="flex flex-col justify-center gap-2">
            <button
              className={`px-3 py-2 rounded flex items-center justify-center transition-colors ${
                selectedAvailable.length === 0
                  ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed'
                  : ''
              }`}
              style={selectedAvailable.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
              onClick={moveToDisplayed}
              disabled={!selectedAvailable.length}
              title="Add Selected (→)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-2 rounded flex items-center justify-center transition-colors ${
                availableOptions.length === 0
                  ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed'
                  : ''
              }`}
              style={availableOptions.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
              onClick={moveAllToDisplayed}
              disabled={!availableOptions.length}
              title="Add All"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-2 rounded flex items-center justify-center transition-colors ${
                selectedDisplayed.length === 0
                  ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed'
                  : ''
              }`}
              style={selectedDisplayed.length === 0 ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
              onClick={moveToAvailable}
              disabled={!selectedDisplayed.length}
              title="Remove Selected (←)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-2 rounded flex items-center justify-center transition-colors ${
                draftDisplayed.length === MANDATORY_COLUMNS.length
                  ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed'
                  : ''
              }`}
              style={draftDisplayed.length === MANDATORY_COLUMNS.length ? undefined : { backgroundColor: `${primaryColor}15`, color: `${primaryColor}CC` }}
              onClick={moveAllToAvailable}
              disabled={draftDisplayed.length === MANDATORY_COLUMNS.length}
              title="Remove All"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Displayed Columns */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="font-semibold">Displayed Columns</div>
                <span className="text-xs text-gray-500 dark:text-white">({draftDisplayed.length})</span>
              </div>
              <div className="flex gap-1">
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${
                    selectedDisplayed.length === 0
                      ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  onClick={() => moveDisplayed('up')}
                  disabled={!selectedDisplayed.length}
                  title="Move Up (Ctrl+PgUp)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${
                    selectedDisplayed.length === 0
                      ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
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
              className={`w-full h-64 border rounded p-2 overflow-y-auto border-gray-300`}
              style={focusedList === 'displayed' ? { borderColor: primaryColor } : undefined}
              role="listbox"
              tabIndex={focusedList === 'displayed' ? 0 : -1}
              aria-label="Displayed columns"
              onFocus={() => setFocusedList('displayed')}
            >
              {draftDisplayed.map((col, idx) => {
                const isRequired = MANDATORY_COLUMNS.includes(col)
                return (
                  <label
                    key={col}
                    className={`flex items-center gap-2 py-2 px-2 rounded ${
                      isRequired ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'cursor-pointer'
                    }`}
                    style={
                      isRequired
                        ? undefined
                        : (focusedList === 'displayed' && focusedIndex === idx)
                        ? { backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}4D` }
                        : selectedDisplayed.includes(col)
                        ? { backgroundColor: `${primaryColor}0F` }
                        : undefined
                    }
                    onClick={() => {
                      if (!isRequired) {
                        setFocusedList('displayed')
                        setFocusedIndex(idx)
                        setSelectedDisplayed(prev =>
                          prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col]
                        )
                        displayedListRef.current?.focus()
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDisplayed.includes(col)}
                      onChange={() => {}}
                      disabled={isRequired}
                      className="w-4 h-4"
                    />
                    <span className={`text-sm ${isRequired ? 'font-medium' : ''}`}>
                      {getColumnLabel(col)}
                    </span>
                    {isRequired && <span className="ml-auto text-xs text-gray-500 dark:text-white italic">(Required)</span>}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 mt-6">
          <button
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={handleReset}
            title="Reset to Default (Ctrl+R)"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 flex items-center gap-2"
              onClick={() => onOpenChange(false)}
              title="Cancel (Escape)"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
                className="px-4 py-2 rounded text-white font-semibold flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              onClick={handleSave}
              title="Save Changes (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
