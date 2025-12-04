/**
 * cn utility function
 * Combines clsx for conditional classes and tailwind-merge for Tailwind CSS class merging
 * 
 * This is an alternative import location if @/lib/utils doesn't resolve properly
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default cn
