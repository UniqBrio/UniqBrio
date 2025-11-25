"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface KYCRejectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rejectionData: {
    reasons: string[]
    customMessage: string
  }) => void
  userInfo?: {
    name?: string
    email?: string
  }
}

const PREDEFINED_REASONS = [
  "Document image quality is poor or blurry",
  "Identity document has expired",
  "Document appears to be altered or tampered",
  "Personal information does not match records",
  "Required documents are missing",
  "Address proof is outdated (older than 3 months)",
  "Selfie does not match identity document",
  "Document type is not accepted",
  "Incomplete application form",
  "Suspicious or fraudulent documents detected"
]

export default function KYCRejectionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userInfo 
}: KYCRejectionModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReasonChange = (reason: string, checked: boolean) => {
    if (checked) {
      setSelectedReasons(prev => [...prev, reason])
    } else {
      setSelectedReasons(prev => prev.filter(r => r !== reason))
    }
  }

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      alert("Please select at least one reason for rejection.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        reasons: selectedReasons,
        customMessage: customMessage.trim()
      })
      
      // Reset form
      setSelectedReasons([])
      setCustomMessage("")
      onClose()
    } catch (error) {
      console.error("Error submitting rejection:", error)
      alert("Failed to send rejection email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReasons([])
      setCustomMessage("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Reject KYC Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {userInfo && (
            <Alert>
              <AlertDescription>
                Drafting rejection email for: <strong>{userInfo.name || userInfo.email}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-base font-semibold">Reasons for Rejection</Label>
            <p className="text-sm text-gray-600 dark:text-white mb-3">
              Select all reasons that apply to this KYC rejection:
            </p>
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50">
              {PREDEFINED_REASONS.map((reason) => (
                <div key={reason} className="flex items-start space-x-2">
                  <Checkbox
                    id={reason}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={(checked) => handleReasonChange(reason, checked as boolean)}
                  />
                  <Label
                    htmlFor={reason}
                    className="text-sm leading-5 cursor-pointer"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="customMessage" className="text-base font-semibold">
              Additional Message (Optional)
            </Label>
            <p className="text-sm text-gray-600 dark:text-white mb-2">
              Add any specific instructions or additional context for the user:
            </p>
            <Textarea
              id="customMessage"
              placeholder="e.g., Please ensure all documents are clearly visible and not cropped. For address proof, please provide a recent utility bill dated within the last 3 months..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {selectedReasons.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <Label className="text-sm font-semibold text-blue-800">Email Preview:</Label>
              <div className="text-sm text-blue-700 mt-1">
                The user will receive a professional email explaining these issues and instructions on how to resubmit their KYC documents.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedReasons.length === 0 || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Rejection Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}