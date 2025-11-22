"use client"

import { useEffect, useState } from "react"

export interface BreakpointState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenSize: "mobile" | "tablet" | "desktop"
}

/**
 * Custom breakpoints matching your requirements:
 * Mobile: max-width 640px
 * Tablet: 641px – 1024px  
 * Desktop: min-width 1025px
 */
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const

export function useResponsiveBreakpoints(): BreakpointState {
  const [breakpoints, setBreakpoints] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenSize: "mobile",
  })

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth
      
      const isMobile = width <= BREAKPOINTS.mobile
      const isTablet = width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet
      const isDesktop = width > BREAKPOINTS.tablet
      
      let screenSize: "mobile" | "tablet" | "desktop" = "mobile"
      if (isDesktop) screenSize = "desktop"
      else if (isTablet) screenSize = "tablet"
      else screenSize = "mobile"

      setBreakpoints({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
      })
    }

    // Initial check
    checkBreakpoints()

    // Add event listener for resize
    window.addEventListener("resize", checkBreakpoints)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkBreakpoints)
    }
  }, [])

  return breakpoints
}

/**
 * Hook to get responsive values based on current breakpoint
 * @param values Object with mobile, tablet, and desktop values
 * @returns The appropriate value for current screen size
 */
export function useResponsiveValue<T>(values: {
  mobile: T
  tablet?: T
  desktop?: T
}): T {
  const { screenSize } = useResponsiveBreakpoints()
  
  switch (screenSize) {
    case "desktop":
      return values.desktop || values.tablet || values.mobile
    case "tablet":
      return values.tablet || values.mobile
    case "mobile":
    default:
      return values.mobile
  }
}

/**
 * CSS class generator for responsive grid columns
 */
export function getResponsiveGridClasses(columns: {
  mobile?: number
  tablet?: number
  desktop?: number
}) {
  const mobile = columns.mobile || 1
  const tablet = columns.tablet || 2
  const desktop = columns.desktop || 3

  return `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop}`
}

/**
 * CSS class generator for responsive gaps
 */
export function getResponsiveGapClasses(gaps: {
  mobile?: string
  tablet?: string
  desktop?: string
}) {
  const mobile = gaps.mobile || "gap-4"
  const tablet = gaps.tablet || "sm:gap-6"
  const desktop = gaps.desktop || "lg:gap-8"

  return `${mobile} ${tablet} ${desktop}`
}

/**
 * CSS class generator for responsive padding
 */
export function getResponsivePaddingClasses(padding: {
  mobile?: string
  tablet?: string
  desktop?: string
}) {
  const mobile = padding.mobile || "p-4"
  const tablet = padding.tablet || "sm:p-6"
  const desktop = padding.desktop || "lg:p-8"

  return `${mobile} ${tablet} ${desktop}`
}

/**
 * CSS class generator for responsive text sizes
 */
export function getResponsiveTextClasses(textSizes: {
  mobile?: string
  tablet?: string
  desktop?: string
}) {
  const mobile = textSizes.mobile || "text-sm"
  const tablet = textSizes.tablet || "sm:text-base"
  const desktop = textSizes.desktop || "lg:text-lg"

  return `${mobile} ${tablet} ${desktop}`
}

export default useResponsiveBreakpoints