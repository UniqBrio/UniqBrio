"use client"

import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dashboard/ui/dialog"
import { QrCode, Download, Share } from "lucide-react"
import { toast } from "@/components/dashboard/ui/use-toast"

interface QRCodeGeneratorProps {
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime: string
  location: string
}

export default function QRCodeGenerator({ eventId, eventTitle, eventDate, eventTime, location }: QRCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Generate QR code data
  const qrData = JSON.stringify({
    eventId,
    eventTitle,
    eventDate,
    eventTime,
    location,
    checkInUrl: `https://uniqbrio.com/checkin/${eventId}`,
  })

  // Generate QR code URL (using a placeholder service)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-code-${eventId}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "QR Code Downloaded",
        description: "QR code has been saved to your device.",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code for ${eventTitle}`,
          text: `Check-in QR code for ${eventTitle} on ${eventDate} at ${eventTime}`,
          url: qrCodeUrl,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(qrCodeUrl)
      toast({
        title: "Link Copied",
        description: "QR code link copied to clipboard.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Class Check-in QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img src={qrCodeUrl || "/placeholder.svg"} alt={`QR Code for ${eventTitle}`} className="w-64 h-64" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-medium">{eventTitle}</h3>
            <p className="text-sm text-gray-600">
              {eventDate} at {eventTime}
            </p>
            <p className="text-sm text-gray-600">{location}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 bg-transparent">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">Students can scan this QR code to check in to the class</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
