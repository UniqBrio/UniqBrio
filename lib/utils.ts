import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and merges Tailwind classes with tailwind-merge
 * This utility is used throughout the application for conditional className composition
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export for convenience
export { clsx } from "clsx"
export { twMerge } from "tailwind-merge"
