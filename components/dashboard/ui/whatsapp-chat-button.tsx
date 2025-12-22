"use client"

import React from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/dashboard/ui/button"
import { cn } from "@/lib/utils"
import { openWhatsAppChat, isValidWhatsAppNumber } from "@/lib/whatsapp-utils"
import { useToast } from "@/hooks/use-toast"

interface WhatsAppChatButtonProps {
  /** Phone number (can include special chars, will be normalized) */
  phone?: string | null
  /** Country code if not included in phone */
  countryCode?: string | null
  /** Optional pre-filled message */
  message?: string
  /** Name to display in error messages */
  contactName?: string
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "icon"
  /** Button size */
  size?: "sm" | "default" | "lg" | "icon"
  /** Additional class names */
  className?: string
  /** Show label alongside icon */
  showLabel?: boolean
  /** Custom label text */
  label?: string
  /** Disable the button */
  disabled?: boolean
  /** Click handler (called before opening WhatsApp) */
  onClick?: (e: React.MouseEvent) => void
}

/**
 * Reusable WhatsApp Chat Button Component
 * 
 * Opens WhatsApp chat with the specified phone number.
 * Works on both mobile (opens app) and desktop (opens WhatsApp Web).
 * 
 * @example
 * // Basic usage
 * <WhatsAppChatButton phone="+919876543210" />
 * 
 * // With country code
 * <WhatsAppChatButton phone="9876543210" countryCode="+91" />
 * 
 * // With pre-filled message
 * <WhatsAppChatButton phone="+919876543210" message="Hello!" />
 * 
 * // With label
 * <WhatsAppChatButton phone="+919876543210" showLabel label="Chat with Parent" />
 */
export function WhatsAppChatButton({
  phone,
  countryCode,
  message,
  contactName = "contact",
  variant = "outline",
  size = "sm",
  className,
  showLabel = false,
  label = "Open WhatsApp Chat",
  disabled = false,
  onClick,
}: WhatsAppChatButtonProps) {
  const { toast } = useToast()

  const hasValidPhone = isValidWhatsAppNumber(phone, countryCode)
  const isDisabled = disabled || !phone

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Call custom onClick if provided
    onClick?.(e)

    if (!phone) {
      toast({
        title: "No Contact Available",
        description: `No phone number found for ${contactName}`,
        variant: "destructive",
      })
      return
    }

    const success = openWhatsAppChat(phone, countryCode, message)

    if (!success) {
      toast({
        title: "Invalid Phone Number",
        description: `The phone number for ${contactName} appears to be invalid`,
        variant: "destructive",
      })
    }
  }

  // Icon-only variant
  if (variant === "icon" || size === "icon") {
    return (
      <span
        role="button"
        aria-label={label}
        title={hasValidPhone ? label : `No valid phone number for ${contactName}`}
        className={cn(
          "cursor-pointer text-sm p-2 rounded transition-colors inline-block",
          hasValidPhone
            ? "hover:bg-green-100"
            : "opacity-40 cursor-not-allowed",
          className
        )}
        onClick={isDisabled ? undefined : handleClick}
      >
        <MessageCircle className="h-4 w-4 text-green-600" />
      </span>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        !isDisabled && "hover:bg-green-50",
        className
      )}
      style={{ 
        borderColor: isDisabled ? undefined : "#22c55e33", 
        color: isDisabled ? undefined : "#16a34a" 
      }}
      title={hasValidPhone ? label : `No valid phone number for ${contactName}`}
    >
      <MessageCircle className="h-4 w-4" />
      {showLabel && <span className="ml-2">{label}</span>}
    </Button>
  )
}

export default WhatsAppChatButton
