import React, { useState, useRef } from "react"
import { format as formatDateFns } from "date-fns"

type FormattedDateInputProps = {
  id?: string
  label?: string
  value: string // ISO yyyy-MM-dd or ""
  onChange: (isoDate: string) => void
  onBlur?: (isoDate: string) => void
  required?: boolean
  disabled?: boolean
  min?: string // ISO yyyy-MM-dd
  max?: string // ISO yyyy-MM-dd
  className?: string
  error?: boolean // when true, shows red error styles
  displayFormat?: string // default 'dd-MMM-yy'
  placeholder?: string // default 'dd-mmm-yy'
}

export function FormattedDateInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  required,
  disabled,
  min,
  max,
  className = "",
  error = false,
  displayFormat = "dd-MMM-yy",
  placeholder = "dd-mmm-yy",
}: FormattedDateInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatForDisplay = (iso: string) => {
    if (!iso) return ""
    try {
      return formatDateFns(new Date(iso), displayFormat)
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {/* Left small calendar icon (custom) - clickable to open date picker */}
        <svg
          aria-hidden="true"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          onClick={() => {
            if (!disabled && inputRef.current) {
              inputRef.current.focus()
              inputRef.current.showPicker?.()
            }
          }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>

        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); onBlur?.(e.currentTarget.value); }}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          // Hide only the native right-side indicator; keep our left icon
          className={[
            "no-native-date-indicator w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm",
            "outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent",
            error ? "border-red-300 bg-red-50" : "border-gray-300",
            // When not focused and a value exists, hide the native segmented text so the overlay shows
            !focused && value ? "text-transparent caret-transparent hide-native-date-text" : "text-gray-900",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            className,
          ].join(" ")}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          aria-required={required || undefined}
        />

        {/* Formatted overlay (shows only when not focused and value exists) */}
        {!focused && value ? (
          <div className="absolute inset-y-0 left-9 right-3 flex items-center text-sm text-gray-900 pointer-events-none">
            {formatForDisplay(value)}
          </div>
        ) : null}
      </div>
    </div>
  )
}
