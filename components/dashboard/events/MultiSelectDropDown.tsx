"use client";
import React from "react";
import { useCustomColors } from '@/lib/use-custom-colors';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  // Optional transform for displaying option labels (value stays the same)
  displayTransform?: (value: string) => string;
}

// Lightweight multi-select dropdown used inside filter popovers.
// Opens inline; keeps state controlled via props.
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "All",
  className = "",
  displayTransform,
}) => {
  const { primaryColor } = useCustomColors();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const hasManyOptions = options.length > 5;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter(opt => opt.toLowerCase().includes(normalizedQuery));
  }, [options, normalizedQuery]);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // focus search input when opening if there are many options
  React.useEffect(() => {
    if (open && hasManyOptions) {
      // small timeout to ensure input is mounted
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      // clear query when closing for a fresh view next open
      setQuery('');
    }
  }, [open, hasManyOptions]);

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };

  const toLabel = (v: string) => displayTransform ? displayTransform(v) : v;

  const summary = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? toLabel(selected[0])
      : `${selected.length} selected`;

  return (
    <div className={`mb-4 relative ${className}`} ref={containerRef}>
      <div className="mb-1 font-semibold text-sm select-none">{label}</div>
      <button
        type="button"
        className="w-full text-left text-xs px-3 py-2 rounded-md border dark:border-gray-600 bg-background dark:bg-gray-800 flex items-center justify-between gap-2"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate text-black`}>{summary}</span>
        <span className="ml-auto text-gray-400 dark:text-white">▾</span>
      </button>
      {open && (
        <div
          className={`absolute mt-1 w-full z-50 bg-white border rounded shadow-sm p-2 text-xs ${hasManyOptions ? 'max-h-[20rem] overflow-hidden' : 'max-h-56 overflow-y-auto'}`}
          role="listbox"
          aria-label={label}
        >
          {options.length === 0 && <div className="text-gray-400 dark:text-white italic px-2 py-1">No options</div>}

          {/* Show a small search bar when there are many options */}
          {hasManyOptions && (
            <div className="px-2 pb-2">
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                aria-label={`Search ${label}`}
                className="w-full text-xs px-2 py-1 border rounded focus:outline-none"
              />
            </div>
          )}

          {/** filter options by query when present **/}
          {options.length > 0 && (
            // Separate the options area into its own scrollable box so the scrollbar appears inside the dropdown
            <div className="flex flex-col">
              {/* When many options, constrain height and enable internal scrolling */}
              <div className={hasManyOptions ? "max-h-32 overflow-y-auto pr-1" : ""}>
                {filteredOptions.map(opt => {
                  const checked = selected.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt)}
                        style={{ accentColor: primaryColor }}
                      />
                      <span className="truncate" title={toLabel(opt)}>{toLabel(opt)}</span>
                    </label>
                  );
                })}
              </div>

              {query && filteredOptions.length === 0 && (
                <div className="text-gray-400 dark:text-white italic px-2 py-1">No matches</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
