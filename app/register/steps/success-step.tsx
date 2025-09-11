"use client"

import { CheckCircle } from "lucide-react"

export default function SuccessStep() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="rounded-full bg-green-100 p-3 mb-4">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-center mb-2">Registration Successful!</h3>
      <p className="text-center text-muted-foreground mb-6">
        Your business workspace is being created. You will be redirected to the onboarding page shortly.
      </p>
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}
