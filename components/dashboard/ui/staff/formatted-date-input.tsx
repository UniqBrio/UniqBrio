"use client"

import * as React from "react"
import { useState } from "react"
import { format as formatDateFns } from "date-fns"
import { cn } from "@/lib/dashboard/staff/utils"

export type FormattedDateInputProps = {
  id?: string
  label?: string
  value: string // ISO yyyy-MM-dd or ""
  onChange: (isoDate: string) => void
  required?: boolean
  disabled?: boolean
  min?: string // ISO yyyy-MM-dd
  max?: string // ISO yyyy-MM-dd
  className?: string
  error?: boolean // when true, shows red error styles
  displayFormat?: string // default 'dd-MMM-yy'
  placeholder?: string // default 'dd-mmm-yy'
  hidePickerIcon?: boolean // when true, do not render the right-side calendar icon button
}

export function FormattedDateInput({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  min,
  max,
  className = "",
  error = false,
  displayFormat = "dd-MMM-yy",
  placeholder = "dd-mmm-yy",
  hidePickerIcon = false,
}: FormattedDateInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const formatForDisplay = (iso: string) => {
    if (!iso) return ""
    try {
      // Constructing with new Date(iso) is safe for yyyy-MM-dd in modern browsers (local time).
      return formatDateFns(new Date(iso), displayFormat)
    } catch {
      return iso
    }
  }
  const openPicker = () => {
    const el = inputRef.current
    if (!el || el.disabled) return
    try {
      ;(el as any).showPicker?.()
    } catch {
      el.focus()
    }
  }

  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-white">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {/* Optional right calendar icon as a button to open the native picker */}
        {!hidePickerIcon ? (
          <button
            type="button"
            aria-label="Choose date"
            onClick={openPicker}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-0",
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
            )}
            tabIndex={-1}
            aria-disabled={disabled || undefined}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-gray-600 dark:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
        ) : null}

        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          // Hide only the native right-side indicator; leave space only when our icon is present
          className={cn(
            "no-native-date-indicator w-full rounded-md border bg-background py-2 pl-3 text-sm",
            hidePickerIcon ? "pr-3" : "pr-9",
            "outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent",
            error ? "border-red-300 bg-red-50" : "border-gray-300",
            // When not focused and a value exists, hide the native text so the overlay shows
            !focused && value ? "text-transparent caret-transparent" : "text-foreground",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            className,
          )}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          aria-required={required || undefined}
        />

        {/* Formatted overlay (shows only when not focused and value exists) */}
        {!focused && value ? (
          <div className={cn(
            "absolute inset-y-0 left-3 flex items-center text-sm text-foreground pointer-events-none",
            hidePickerIcon ? "right-3" : "right-9",
          )}>
            {formatForDisplay(value)}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FormattedDateInput
