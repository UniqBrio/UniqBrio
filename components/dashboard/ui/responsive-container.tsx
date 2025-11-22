"use client"

import * as React from "react"
import { cn } from "@/lib/dashboard/utils"
import { useIsMobile } from "@/hooks/dashboard/use-mobile"

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /**
   * Layout type for different screen sizes
   * - grid: Grid layout that adapts columns based on screen size
   * - stack: Stacked layout for mobile, side-by-side for larger screens
   * - flow: Flexible flow layout
   */
  layout?: "grid" | "stack" | "flow"
  /**
   * Number of columns for different breakpoints
   */
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  /**
   * Gap between items for different breakpoints
   */
  gap?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ className, children, layout = "grid", columns, gap, ...props }, ref) => {
    const isMobile = useIsMobile()
    
    // Default column configuration
    const defaultColumns = {
      mobile: columns?.mobile || 1,
      tablet: columns?.tablet || 2,
      desktop: columns?.desktop || 2
    }

    // Default gap configuration
    const defaultGap = {
      mobile: gap?.mobile || "gap-4",
      tablet: gap?.tablet || "sm:gap-6", 
      desktop: gap?.desktop || "lg:gap-6"
    }

    const getLayoutClasses = () => {
      switch (layout) {
        case "grid":
          return cn(
            "grid w-full",
            `grid-cols-${defaultColumns.mobile}`,
            `sm:grid-cols-${defaultColumns.tablet}`,
            `lg:grid-cols-${defaultColumns.desktop}`,
            defaultGap.mobile,
            defaultGap.tablet,
            defaultGap.desktop
          )
        case "stack":
          return cn(
            "flex flex-col lg:flex-row w-full",
            defaultGap.mobile,
            defaultGap.tablet,
            defaultGap.desktop
          )
        case "flow":
          return cn(
            "flex flex-wrap w-full",
            defaultGap.mobile,
            defaultGap.tablet,
            defaultGap.desktop
          )
        default:
          return cn("w-full", defaultGap.mobile)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(getLayoutClasses(), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveContainer.displayName = "ResponsiveContainer"

/**
 * Responsive card wrapper with mobile-optimized padding and sizing
 */
interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /**
   * Card size variant
   */
  size?: "sm" | "md" | "lg"
}

const ResponsiveCard = React.forwardRef<HTMLDivElement, ResponsiveCardProps>(
  ({ className, children, size = "md", ...props }, ref) => {
    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "p-3 sm:p-4 lg:p-6"
        case "md":
          return "p-4 sm:p-6 lg:p-8"
        case "lg":
          return "p-6 sm:p-8 lg:p-10"
        default:
          return "p-4 sm:p-6 lg:p-8"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-card text-card-foreground shadow-sm",
          getSizeClasses(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveCard.displayName = "ResponsiveCard"

/**
 * Responsive text component that adjusts font sizes across breakpoints
 */
interface ResponsiveTextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  variant?: "title" | "heading" | "subheading" | "body" | "caption"
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"
}

const ResponsiveText = React.forwardRef<HTMLElement, ResponsiveTextProps>(
  ({ className, children, variant = "body", as = "p", ...props }, ref) => {
    const Component = as

    const getVariantClasses = () => {
      switch (variant) {
        case "title":
          return "text-2xl sm:text-3xl lg:text-4xl font-bold"
        case "heading":
          return "text-lg sm:text-xl lg:text-2xl font-semibold"
        case "subheading":
          return "text-base sm:text-lg lg:text-xl font-medium"
        case "body":
          return "text-sm sm:text-base"
        case "caption":
          return "text-xs sm:text-sm"
        default:
          return "text-sm sm:text-base"
      }
    }

    return (
      <Component
        ref={ref as any}
        className={cn(getVariantClasses(), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ResponsiveText.displayName = "ResponsiveText"

/**
 * Chart container with responsive height and proper mobile optimization
 */
interface ResponsiveChartContainerProps {
  children: React.ReactNode
  height?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
  className?: string
}

const ResponsiveChartContainer: React.FC<ResponsiveChartContainerProps> = ({
  children,
  height,
  className
}) => {
  const defaultHeight = {
    mobile: height?.mobile || "h-[250px]",
    tablet: height?.tablet || "sm:h-[300px]",
    desktop: height?.desktop || "lg:h-[320px]"
  }

  return (
    <div className={cn(
      "w-full",
      defaultHeight.mobile,
      defaultHeight.tablet,
      defaultHeight.desktop,
      className
    )}>
      {children}
    </div>
  )
}

export { ResponsiveContainer, ResponsiveCard, ResponsiveText, ResponsiveChartContainer }