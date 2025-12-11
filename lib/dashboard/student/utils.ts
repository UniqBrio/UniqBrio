import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts an ISO date string (e.g. "2025-10-10")
 * into a readable format like "10-Oct-25".
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd-MMM-yy');
  } catch {
    return dateString; // fallback if parsing fails
  }
}

/**
 * Parses a user-entered date string in dd-mm-yyyy or dd/mm/yyyy format
 * and converts it to dd-MMM-yyyy format (e.g., "10-10-2025" → "10-Oct-2025").
 * Also handles ISO format and returns formatted output.
 */
export function parseAndFormatDate(dateInput: string): string {
  if (!dateInput) return '';
  
  try {
    // Try parsing as dd-mm-yyyy or dd/mm/yyyy
    const cleanedInput = dateInput.trim();
    
    // Check if it's in dd-mm-yyyy or dd/mm/yyyy format
    const ddmmyyyyPattern = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
    const match = cleanedInput.match(ddmmyyyyPattern);
    
    if (match) {
      // Parse as dd-mm-yyyy or dd/mm/yyyy
      const parsedDate = parse(cleanedInput, cleanedInput.includes('/') ? 'dd/MM/yyyy' : 'dd-MM-yyyy', new Date());
      return format(parsedDate, 'dd-MMM-yyyy');
    }
    
    // Try parsing as ISO format (yyyy-mm-dd) or other formats
    const parsedDate = new Date(cleanedInput);
    if (!isNaN(parsedDate.getTime())) {
      return format(parsedDate, 'dd-MMM-yyyy');
    }
    
    // If nothing works, return original
    return dateInput;
  } catch {
    return dateInput; // fallback if parsing fails
  }
}

/**
 * Converts a display format date (dd-MMM-yyyy) back to ISO format (yyyy-mm-dd)
 * for storage in the database.
 */
export function convertDisplayDateToISO(displayDate: string): string {
  if (!displayDate) return '';
  
  try {
    // Try parsing as dd-MMM-yyyy first
    const ddMmmYyyyPattern = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
    if (ddMmmYyyyPattern.test(displayDate)) {
      const parsedDate = parse(displayDate, 'dd-MMM-yyyy', new Date());
      return format(parsedDate, 'yyyy-MM-dd');
    }
    
    // Try parsing as dd-mm-yyyy or dd/mm/yyyy
    const ddmmyyyyPattern = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
    if (ddmmyyyyPattern.test(displayDate)) {
      const parsedDate = parse(displayDate, displayDate.includes('/') ? 'dd/MM/yyyy' : 'dd-MM-yyyy', new Date());
      return format(parsedDate, 'yyyy-MM-dd');
    }
    
    // Try as ISO (already in correct format)
    const parsedDate = new Date(displayDate);
    if (!isNaN(parsedDate.getTime())) {
      return format(parsedDate, 'yyyy-MM-dd');
    }
    
    return displayDate;
  } catch {
    return displayDate;
  }
}

/**
 * Converts a 24-hour time string (HH:mm) to 12-hour format with AM/PM.
 * Examples: "00:00" -> "12:00 AM", "13:05" -> "1:05 PM", "12:30" -> "12:30 PM".
 * Returns the original input if parsing fails.
 */
export function formatTimeTo12Hour(time24?: string): string {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const [hhStr, mm] = parts;
  const hh = parseInt(hhStr, 10);
  if (isNaN(hh) || isNaN(parseInt(mm, 10))) return time24;
  const meridiem = hh >= 12 ? 'PM' : 'AM';
  let hour12 = hh % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${mm} ${meridiem}`;
}

/**
 * Replaces all HH:mm occurrences in a text with 12-hour formatted times.
 * Keeps the rest of the string intact (useful for strings like "Mon–Fri • 14:00 - 16:00").
 */
export function formatTimesInTextTo12Hour(text?: string): string {
  if (!text) return '';
  const timeRegex = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g; // matches 0:00..23:59 and 00:00..23:59
  return text.replace(timeRegex, (match) => formatTimeTo12Hour(match));
}
