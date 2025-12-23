"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { useCustomColors } from "@/lib/use-custom-colors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Badge } from "@/components/dashboard/ui/badge";
import { X, Mail, Smartphone, MessageSquare, Phone, Loader2 } from "lucide-react";
import { type Payment } from "@/types/dashboard/payment";
import { useToast } from "@/hooks/dashboard/use-toast";

// Cache for academy information to avoid repeated API calls
let cachedAcademyInfo: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ReminderDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestrictedAttempt?: () => void;
}

export function ReminderDialog({
  payment,
  open,
  onOpenChange,
  onRestrictedAttempt,
}: ReminderDialogProps) {
  const { currency } = useCurrency();
  const { primaryColor, secondaryColor } = useCustomColors();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<"email" | "inapp" | "whatsapp" | "sms">("email");
  const [isSending, setIsSending] = useState(false);
  const [academyInfo, setAcademyInfo] = useState<{
    businessName?: string;
    email?: string;
    phone?: string;
  } | null>(() => {
    // Use cached data if available and valid
    if (cachedAcademyInfo && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return cachedAcademyInfo;
    }
    return null;
  });
  const fetchInProgress = useRef(false);

  const communicationModes = [
    { id: "email", label: "Email", icon: Mail },
    { id: "inapp", label: "In App", icon: Smartphone, disabled: true },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, disabled: true },
    { id: "sms", label: "SMS", icon: Phone, disabled: true },
  ];

  // Fetch academy information with caching
  useEffect(() => {
    const fetchAcademyInfo = async () => {
      if (!open) return;

      // Check if we have valid cached data
      const now = Date.now();
      if (cachedAcademyInfo && (now - cacheTimestamp) < CACHE_DURATION) {
        setAcademyInfo(cachedAcademyInfo);
        return;
      }

      // Prevent concurrent fetches
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;

      try {
        const response = await fetch('/api/dashboard/academy-info', {
          credentials: 'include',
          cache: 'force-cache',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.businessInfo) {
            const business = data.businessInfo;
            const info = {
              businessName: business.businessName || business.academyName || 'Academy',
              email: business.businessEmail || business.email || 'contact@academy.com',
              phone: business.phoneNumber || business.phone || '+XX-XXXXX-XXXXX',
            };
            
            // Update cache
            cachedAcademyInfo = info;
            cacheTimestamp = now;
            setAcademyInfo(info);
          }
        }
      } catch (error) {
        console.error('Error fetching academy info:', error);
      } finally {
        fetchInProgress.current = false;
      }
    };

    fetchAcademyInfo();
  }, [open]);

  const handleModeChange = (mode: "email" | "inapp" | "whatsapp" | "sms") => {
    setSelectedMode(mode);
  };

  const handleSendReminder = async () => {
    if (!payment || !payment.studentId) {
      toast({
        title: "Error",
        description: "Student ID is missing. Cannot send reminder.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/dashboard/payments/reminders/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: payment.studentId,
          paymentId: payment.id,
        }),
      });
      if (response.status === 403) {
        onRestrictedAttempt?.();
        onOpenChange(false);
        setIsSending(false);
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reminder');
      }

      toast({
        title: "Reminder Sent Successfully",
        description: `Payment reminder has been sent to ${data.sentTo || 'the student'}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Failed to Send Reminder",
        description: error.message || "An error occurred while sending the reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {selectedMode === "email" ? <Mail className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
            Reminder Preview - {payment.studentName}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="space-y-6 mt-4">
          {/* Communication Mode Selector */}
          <div>
            
            <div className="grid grid-cols-4 gap-2">
              {communicationModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                const isDisabled = mode.disabled;
                
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 font-medium rounded-md transition-all ${
                      isSelected 
                        ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/90" 
                        : "bg-transparent border-secondary text-secondary hover:bg-secondary/10"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isDisabled && handleModeChange(mode.id as any)}
                    disabled={isDisabled}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{mode.label}</span>
                    {isDisabled && <span className="text-xs">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <span className="font-semibold">Student ID:</span> {payment.studentId}
            </div>
            <div>
              <span className="font-semibold">Student Name:</span> {payment.studentName}
            </div>
            <div>
              <span className="font-semibold">Course details:</span> {payment.enrolledCourseName} ({payment.enrolledCourse || "N/A"})
            </div>
            <div>
              <span className="font-semibold">Balance:</span> {currency} {(payment.outstandingAmount || 0).toLocaleString()}
            </div>
          </div>

          {/* Reminder Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Email Reminder</h4>
                <p className="text-sm text-blue-700 mt-1">
                  A payment reminder email will be sent to the student with the following details:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                  <li>Course: {payment.enrolledCourseName}</li>
                  <li>Outstanding Amount: {currency} {(payment.outstandingAmount || 0).toLocaleString()}</li>
                  <li>Next Due Date: {payment.nextDueDate ? new Date(payment.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set'}</li>
                </ul>
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  From: {academyInfo?.businessName || 'Your Academy'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              className="text-white"
              style={{ backgroundColor: selectedMode === "email" ? primaryColor : secondaryColor }}
              onMouseEnter={(e) => !isSending && (e.currentTarget.style.backgroundColor = selectedMode === "email" ? `${primaryColor}dd` : `${secondaryColor}dd`)}
              onMouseLeave={(e) => !isSending && (e.currentTarget.style.backgroundColor = selectedMode === "email" ? primaryColor : secondaryColor)}
              onClick={handleSendReminder}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : selectedMode === "email" ? (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email Reminder
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Send In App Reminder
                </>
              )}
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
