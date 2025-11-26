"use client"

import React, { useState, useRef } from "react"
import { format as formatDateFns } from "date-fns"
import { useCustomColors } from "@/lib/use-custom-colors"

type FormattedDateInputProps = {
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
  displayFormat?: string // default 'dd-MMM-yyyy'
  placeholder?: string // default 'dd-mmm-yyyy'
  tabIndex?: number // support for tab navigation
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
  displayFormat = "dd-MMM-yyyy",
  placeholder = "dd-mmm-yyyy",
  tabIndex,
}: FormattedDateInputProps) {
  const { primaryColor } = useCustomColors()
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
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-white">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {/* Left small calendar icon (clickable to open date picker) */}
        <svg
          onClick={() => {
            if (!disabled && inputRef.current) {
              inputRef.current.focus()
              // Use showPicker if available (modern browsers), otherwise just focus
              if (inputRef.current.showPicker) {
                inputRef.current.showPicker()
              } else {
                // Fallback: simulate click to open date picker in older browsers
                inputRef.current.click()
              }
            }
          }}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white z-10 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={!disabled ? { color: primaryColor } : {}}
          onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = '1')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          role="button"
          aria-label="Open date picker"
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
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          tabIndex={tabIndex}
          // Hide only the native right-side indicator; keep our left icon
          className={[
            "no-native-date-indicator w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm",
            "outline-none focus:ring-1 focus:border-transparent",
            error ? "border-red-300 bg-red-50" : "border-gray-300",
            // When not focused and a value exists, hide the native text so the overlay shows
            !focused && value ? "text-transparent caret-transparent" : "text-foreground",
            disabled ? "opacity-60 cursor-not-allowed" : "",
            className,
          ].join(" ")}
          style={focused ? { borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` } : {}}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          aria-required={required || undefined}
        />

        {/* Formatted overlay (shows only when not focused and value exists) */}
        {!focused && value ? (
          <div className="absolute inset-y-0 left-9 right-3 flex items-center text-sm text-foreground pointer-events-none">
            {formatForDisplay(value)}
          </div>
        ) : null}
      </div>

      <style jsx>{`
        /* Hides browser's native date picker indicator for inputs that opt-in */
        .no-native-date-indicator::-webkit-calendar-picker-indicator {
          opacity: 0;
          display: none;
        }
        .no-native-date-indicator::-webkit-inner-spin-button {
          display: none;
        }
        .no-native-date-indicator::-webkit-clear-button {
          display: none;
        }
        /* Firefox */
        .no-native-date-indicator {
          -moz-appearance: textfield;
        }
        /* Edge/Chromium safe fallback */
        .no-native-date-indicator {
          background-position: -9999px -9999px;
        }
      `}</style>
    </div>
  )
}