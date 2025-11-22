import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats month labels into the pattern MMM'YY (e.g., Jul'25)
// Accepts already formatted values and leaves them unchanged.
// If only a month (e.g., "Jul") is provided, it appends the supplied baseYear (default current year).
// Non-month strings (like categories or totals) are returned untouched.
const MONTH_ABBRS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
export function formatMonthLabel(value: string, baseYear?: number): string {
  if (!value) return value;
  // Already in format MMM'YY
  if (/^[A-Za-z]{3}'\d{2}$/.test(value)) return value;
  const prefix = value.slice(0,3);
  if (MONTH_ABBRS.includes(prefix as any)) {
    const year = baseYear ?? new Date().getFullYear();
    return `${prefix}'${year.toString().slice(-2)}`;
  }
  return value; // Not a month label
}
