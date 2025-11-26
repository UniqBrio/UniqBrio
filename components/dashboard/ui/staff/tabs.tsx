"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/dashboard/staff/utils"
import { useCustomColors } from "@/lib/use-custom-colors"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "rounded-lg bg-[#f8fafc] p-1 flex gap-2",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { primaryColor, secondaryColor } = useCustomColors()
  const [isActive, setIsActive] = React.useState(false)
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold border-2 bg-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{
        borderColor: secondaryColor,
        color: secondaryColor,
        ...(props['data-state'] === 'active' && {
          backgroundColor: primaryColor,
          color: 'white',
          borderColor: primaryColor
        })
      }}
      onMouseEnter={(e) => {
        if (props['data-state'] !== 'active') {
          e.currentTarget.style.backgroundColor = primaryColor
          e.currentTarget.style.color = 'white'
          e.currentTarget.style.borderColor = primaryColor
        }
      }}
      onMouseLeave={(e) => {
        if (props['data-state'] !== 'active') {
          e.currentTarget.style.backgroundColor = ''
          e.currentTarget.style.color = secondaryColor
          e.currentTarget.style.borderColor = secondaryColor
        }
      }}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
