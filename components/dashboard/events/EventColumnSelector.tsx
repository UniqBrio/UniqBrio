import React from 'react'
import { useCustomColors } from '@/lib/use-custom-colors'
import { Save, RotateCcw, X, ChevronsRight, ChevronsLeft, ArrowRight, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react'

export type EventColumnId = 'name' | 'sport' | 'type' | 'startDate' | 'endDate' | 'venue' | 'staff' | 'participants' | 'maxParticipants' | 'skillLevel' | 'format' | 'ageGroup' | 'entryFee' | 'status' | 'revenue'

export const allEventColumns: EventColumnId[] = [
  'name',
  'sport',
  'type',
  'startDate',
  'endDate',
  'venue',
  'staff',
  'participants',
  'maxParticipants',
  'skillLevel',
  'format',
  'ageGroup',
  'entryFee',
  'status',
  'revenue'
]

export const getEventColumnLabel = (col: EventColumnId): string => {
  const labels: Record<EventColumnId, string> = {
    name: 'Event Name',
    sport: 'Sport',
    type: 'Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    venue: 'Venue',
    staff: 'Staff',
    participants: 'Participants',
    maxParticipants: 'Max Participants',
    skillLevel: 'Skill Level',
    format: 'Format',
    ageGroup: 'Age Group',
    entryFee: 'Entry Fee',
    status: 'Status',
    revenue: 'Revenue'
  }
  return labels[col]
}

interface EventColumnSelectorProps {
  show: boolean
  onClose: () => void
  visibleColumns: EventColumnId[]
  onSave: (columns: EventColumnId[]) => void
}

export default function EventColumnSelector({
  show,
  onClose,
  visibleColumns,
  onSave
}: EventColumnSelectorProps) {
  const { primaryColor } = useCustomColors();
  const [draftDisplayed, setDraftDisplayed] = React.useState<EventColumnId[]>(visibleColumns)
  const [selectedAvailable, setSelectedAvailable] = React.useState<EventColumnId[]>([])
  const [selectedDisplayed, setSelectedDisplayed] = React.useState<EventColumnId[]>([])

  // Keyboard navigation state
  const [focusedList, setFocusedList] = React.useState<'available' | 'displayed'>('available')
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0)

  // Refs
  const availableListRef = React.useRef<HTMLDivElement>(null)
  const displayedListRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (show) {
      setDraftDisplayed(visibleColumns)
      setSelectedAvailable([])
      setSelectedDisplayed([])
      setFocusedList('available')
      setFocusedIndex(0)
      setTimeout(() => availableListRef.current?.focus(), 80)
    }
  }, [show, visibleColumns])

  const availableOptions = React.useMemo(
    () => allEventColumns.filter(col => !draftDisplayed.includes(col)),
    [draftDisplayed]
  )

  const selectAllAvailable = () => setSelectedAvailable(availableOptions.slice())
  const clearAvailableSelection = () => setSelectedAvailable([])
  const selectAllDisplayed = () => setSelectedDisplayed(draftDisplayed.slice())
  const clearDisplayedSelection = () => setSelectedDisplayed([])

  const addSelected = () => {
    const next = [...draftDisplayed, ...selectedAvailable]
    setDraftDisplayed(next)
    setSelectedAvailable([])
  }

  const removeSelected = () => {
    const next = draftDisplayed.filter(col => !selectedDisplayed.includes(col))
    setDraftDisplayed(next)
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
    onSave(draftDisplayed)
    onClose()
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!show) return
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
            addSelected()
          }
          break
        }
        case 'ArrowLeft': {
          if (focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            removeSelected()
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
          onClose()
          break
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [show, focusedList, focusedIndex, availableOptions, draftDisplayed, selectedAvailable, selectedDisplayed, onClose, handleSave])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow-xl p-8 min-w-[500px] max-w-[95vw]">
        <div className="font-bold text-lg mb-4">Select Columns to Display
          <div className="text-sm text-gray-600 dark:text-white mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Shift+↑↓</kbd> Multi-select</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Tab</kbd> Switch list</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+A</kbd> Select all</div>
              <div><kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-gray-700 dark:text-white">Ctrl+D</kbd> Deselect all</div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="font-semibold mb-2">Available Columns</div>
            <div
              ref={availableListRef}
              className={`w-full h-40 border rounded p-2 overflow-y-auto ${focusedList === 'available' ? 'border-purple-300 ring-1 ring-purple-200' : ''}`}
              role="listbox"
              tabIndex={focusedList === 'available' ? 0 : -1}
              aria-label="Available columns"
              onFocus={() => setFocusedList('available')}
            >
              {availableOptions.map((col, idx) => (
                <label
                  key={col}
                  className={`flex items-center gap-2 py-1 cursor-pointer rounded px-2 ${focusedList === 'available' && focusedIndex === idx ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setFocusedList('available')
                    setFocusedIndex(idx)
                    availableListRef.current?.focus()
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAvailable.includes(col)}
                    onChange={() => setSelectedAvailable(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                  />
                  <span>{getEventColumnLabel(col)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2">
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedAvailable.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={addSelected}
              disabled={selectedAvailable.length === 0}
              title="Add Selected (→)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${availableOptions.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={() => { setDraftDisplayed(prev => [...prev, ...availableOptions]); setSelectedAvailable([]); }}
              disabled={availableOptions.length === 0}
              title="Add All"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${draftDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={() => { setDraftDisplayed([]); setSelectedDisplayed([]); }}
              disabled={draftDisplayed.length === 0}
              title="Remove All"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center justify-center transition-colors ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              onClick={removeSelected}
              disabled={selectedDisplayed.length === 0}
              title="Remove Selected (←)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Displayed Columns</div>
              <div className="flex gap-1">
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => moveDisplayed('up')}
                  disabled={selectedDisplayed.length === 0}
                  title="Move Up (Ctrl+PgUp)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded flex items-center justify-center ${selectedDisplayed.length === 0 ? 'bg-gray-100 text-gray-400 dark:text-white cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
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
                  onClick={() => {
                    setFocusedList('displayed')
                    setFocusedIndex(idx)
                    displayedListRef.current?.focus()
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDisplayed.includes(col)}
                    onChange={() => setSelectedDisplayed(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                  />
                  <span>{getEventColumnLabel(col)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded text-white font-semibold flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            onClick={handleSave}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={() => {
              setDraftDisplayed(['name', 'sport', 'startDate', 'venue', 'participants', 'status'])
              setSelectedAvailable([])
              setSelectedDisplayed([])
            }}
            title="Reset (Ctrl+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 flex items-center gap-2"
            onClick={onClose}
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
