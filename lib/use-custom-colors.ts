/**
 * Hook to use custom colors from the app context
 * Usage: const { primaryColor, secondaryColor, customColor } = useCustomColors()
 */

import { useApp } from "@/contexts/dashboard/app-context"
import type React from "react"

export function useCustomColors() {
  const { customColors } = useApp()

  return {
    primaryColor: customColors[0] || "#8b5cf6",
    secondaryColor: customColors[1] || "#fd9c2d",
    customColor: (index: number) => customColors[index] || "#000000",
    allColors: customColors,
  }
}

/**
 * Helper to get CSS variable for custom colors
 * Usage: getCustomColorVar(1) returns "var(--custom-color-1)"
 */
export function getCustomColorVar(index: number): string {
  return `var(--custom-color-${index})`
}

/**
 * Helper to apply custom colors to inline styles
 * Usage: <div style={getCustomColorStyle(1, 'background')} />
 */
export function getCustomColorStyle(
  index: number,
  property: "color" | "background" | "backgroundColor" | "borderColor"
): React.CSSProperties {
  const value = getCustomColorVar(index)
  return { [property]: value }
}
