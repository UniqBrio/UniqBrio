import React from 'react'
import { useCustomColors } from "@/lib/use-custom-colors"
import { Badge } from "@/components/dashboard/ui/badge"
import { Clock, RefreshCw, XCircle, AlertTriangle } from "lucide-react"

interface SessionModificationBadgeProps {
  modificationType?: "rescheduled" | "instructor_changed" | "cancelled"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  showText?: boolean
  className?: string
  variant?: "default" | "compact" | "detailed"
}

const SessionModificationBadge: React.FC<SessionModificationBadgeProps> = ({
  modificationType,
  size = "sm",
  showIcon = true,
  showText = true,
  className = "",
  variant = "default"
}) => {
  const { primaryColor } = useCustomColors()
  if (!modificationType) return null

  const getConfig = () => {
    switch (modificationType) {
      case "rescheduled":
        return {
          icon: Clock,
          text: variant === "compact" ? "Rescheduled" : "Session Rescheduled",
          colorClasses: "border-blue-400 text-blue-700 bg-blue-50 hover:bg-blue-100",
          dotColor: "bg-blue-500"
        }
      case "instructor_changed":
        return {
          icon: RefreshCw,
          text: variant === "compact" ? "Instructor Changed" : "Instructor Reassigned",
          colorClasses: "",
          dotColor: "",
          dynamicStyles: {
            borderColor: primaryColor,
            color: primaryColor,
            backgroundColor: `${primaryColor}15`
          },
          dynamicDotStyle: { backgroundColor: primaryColor }
        }
      case "cancelled":
        return {
          icon: XCircle,
          text: variant === "compact" ? "Cancelled" : "Session Cancelled",
          colorClasses: "border-red-400 text-red-700 bg-red-50 hover:bg-red-100",
          dotColor: "bg-red-500"
        }
      default:
        return {
          icon: AlertTriangle,
          text: "Modified",
          colorClasses: "border-gray-400 text-gray-700 dark:text-white bg-gray-50 hover:bg-gray-100",
          dotColor: "bg-gray-500"
        }
    }
  }

  const config = getConfig()
  const IconComponent = config.icon

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1"
      case "md":
        return "text-sm px-3 py-1.5"
      case "lg":
        return "text-base px-4 py-2"
      default:
        return "text-xs px-2 py-1"
    }
  }

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3"
      case "md":
        return "h-4 w-4"
      case "lg":
        return "h-5 w-5"
      default:
        return "h-3 w-3"
    }
  }

  if (variant === "detailed") {
    return (
      <div 
        className={`inline-flex items-center gap-2 rounded-lg border-2 ${config.colorClasses || ''} ${getSizeClasses()} ${className}`}
        style={config.dynamicStyles || {}}
      >
        <div className="flex items-center gap-2">
          {showIcon && <IconComponent className={getIconSize()} />}
          {showText && <span className="font-medium">{config.text}</span>}
        </div>
        <div 
          className={`w-2 h-2 rounded-full ${config.dotColor || ''} animate-pulse`}
          style={config.dynamicDotStyle || {}}
        ></div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div 
        className={`inline-flex items-center gap-1 rounded-full ${config.colorClasses || ''} ${getSizeClasses()} ${className}`}
        style={config.dynamicStyles || {}}
      >
        <div 
          className={`w-1.5 h-1.5 rounded-full ${config.dotColor || ''}`}
          style={config.dynamicDotStyle || {}}
        ></div>
        {showText && <span className="font-medium text-xs">Modified</span>}
      </div>
    )
  }

  // Default variant
  return (
    <Badge 
      variant="outline" 
      className={`border-2 ${config.colorClasses || ''} ${getSizeClasses()} ${className}`}
      style={config.dynamicStyles || {}}
      title={`This session has been ${modificationType?.replace('_', ' ')}`}
    >
      {showIcon && <IconComponent className={`${getIconSize()} mr-1`} />}
      {showText && (size === "sm" ? "Modified" : config.text)}
    </Badge>
  )
}

export default SessionModificationBadge