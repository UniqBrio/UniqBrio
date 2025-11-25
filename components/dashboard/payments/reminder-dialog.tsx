"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/currency-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Badge } from "@/components/dashboard/ui/badge";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { X, Mail, Smartphone, MessageSquare, Phone, Edit, Eye } from "lucide-react";
import { type Payment } from "@/types/dashboard/payment";

interface ReminderDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReminderDialog({
  payment,
  open,
  onOpenChange,
}: ReminderDialogProps) {
  const { currency } = useCurrency();
  const [selectedMode, setSelectedMode] = useState<"email" | "inapp" | "whatsapp" | "sms">("email");
  const [isEditing, setIsEditing] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  const communicationModes = [
    { id: "email", label: "Email", icon: Mail },
    { id: "inapp", label: "In App", icon: Smartphone, disabled: true },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, disabled: true },
    { id: "sms", label: "SMS", icon: Phone, disabled: true },
  ];

  const getDefaultMessageContent = () => {
    if (!payment) return "";
    
    if (selectedMode === "inapp") {
      return `?? In-App Notification

Payment Reminder for ${payment.studentName}

Student ID: ${payment.studentId}
Student Name: ${payment.studentName}
Course ID: ${payment.enrolledCourse || "N/A"}
Course: ${payment.enrolledCourseName}
Outstanding: ${currency}${(payment.outstandingAmount || 0).toLocaleString()}

Tap to pay now via:
� UPI: -
� Payment Link: -

- UniqBrio Team`;
    }

    return `Subject: Payment Reminder - ${payment.enrolledCourseName}

Dear ${payment.studentName},

This is a payment reminder for your enrollment in ${payment.enrolledCourseName}.

Student ID: ${payment.studentId}
Student Name: ${payment.studentName}
Course ID: ${payment.enrolledCourse || "N/A"}
Course: ${payment.enrolledCourseName}
Outstanding: ${currency} ${(payment.outstandingAmount || 0).toLocaleString()}

Tap to pay now via:
� UPI: -
� Payment Link: -

Best regards,
UniqBrio Academic Team
support@uniqbrio.com

___________________________________________

Best regards,
UniqBrio Academic Team

?? Email: support@uniqbrio.com
?? Phone: +91-XXXXX-XXXXX
?? Website: www.uniqbrio.com

Payment QR

Included Payment Options:
� UPI ID: -
� Payment Link
� Amount: ${currency} ${(payment.outstandingAmount || 0).toLocaleString()}
� Course: ${payment.enrolledCourse || "N/A"}

QR auto-generated for Email & WhatsApp previews.`;
  };

  // Update message content when mode changes or dialog opens
  useEffect(() => {
    if (open && payment) {
      setMessageContent(getDefaultMessageContent());
      setIsEditing(false);
    }
  }, [open, selectedMode, payment]);

  const handleModeChange = (mode: "email" | "inapp" | "whatsapp" | "sms") => {
    setSelectedMode(mode);
    setIsEditing(false);
  };

  const handleResetMessage = () => {
    setMessageContent(getDefaultMessageContent());
  };

  const handleSendReminder = () => {
    // Implement send reminder logic here
    console.log(`Sending ${selectedMode} reminder for payment:`, payment?.id);
    console.log("Message content:", messageContent);
    onOpenChange(false);
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
                    {isDisabled && <span className="text-xs">??</span>}
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

          

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Message Content:</h3>
              <div className="flex gap-2">
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetMessage}
                    className="text-sm"
                  >
                    Reset to Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm"
                >
                  {isEditing ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Message
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Edit your reminder message here..."
                />
                <p className="text-xs text-gray-500 dark:text-white">
                  ?? Tip: You can customize the message above. Click "Reset to Default" to restore the original template.
                </p>
              </div>
            ) : (
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-white">
                  {messageContent}
                </pre>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              className={selectedMode === "email" ? "bg-purple-600 hover:bg-purple-700" : "bg-orange-500 hover:bg-orange-600"}
              onClick={handleSendReminder}
            >
              {selectedMode === "email" ? (
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
