// d:\UB\components\ui\toaster.tsx
"use client"

import { useToast } from "@/components/ui/use-toast"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport, // Import Viewport from toast.tsx
} from "@/components/ui/toast" // Ensure this path is correct

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Pass the variant prop down to the Toast component
        return (
          <Toast key={id} {...props}>
            {/* Content structure is now inside the Toast component */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      {/* Apply top-right positioning classes to the Viewport */}
      <ToastViewport className="fixed top-0 right-0 flex-col" />
    </ToastProvider>
  )
}
