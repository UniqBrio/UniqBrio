"use client";
import { Label } from "@/components/dashboard/ui/label";
import { Input } from "@/components/dashboard/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
// Removed Payment Structure UI previously; adding UPI provider dropdown now
import React from "react";
import { EditFormData } from "./types";

export function PaymentTab({ editForm, setEditForm }: { editForm: EditFormData; setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>; }) {
  return (
    <>
      <div className="border rounded-lg p-4 mb-4 space-y-6">
        {/* 1. Bank Details */}
        <div>
          <h3 className="font-semibold text-base mb-2 text-purple-700">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bank Name</Label>
              <Input placeholder="Enter bank name" value={editForm.paymentInfo.bankName || ''} onChange={e => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, bankName: e.target.value } }))} />
            </div>
            <div>
              <Label>Account Holder Name</Label>
              <Input placeholder="Enter account holder name" value={editForm.paymentInfo.accountHolder || ''} onChange={e => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, accountHolder: e.target.value } }))} />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="Enter account number"
                value={editForm.paymentInfo.accountNumber || ''}
                onKeyDown={(e) => {
                  const allowed = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"]
                  if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return
                  if (/^[0-9]$/.test(e.key)) return
                  e.preventDefault()
                }}
                onChange={e => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, accountNumber: e.target.value.replace(/\D/g, "") } }))}
              />
            </div>
            <div>
              <Label>IFSC/SWIFT/BIC Code</Label>
              <Input placeholder="Enter IFSC/SWIFT/BIC code" value={editForm.paymentInfo.ifsc || ''} onChange={e => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, ifsc: e.target.value } }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Branch Name & Address</Label>
              <Input placeholder="Enter branch name and address" value={editForm.paymentInfo.branchAddress || ''} onChange={e => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, branchAddress: e.target.value } }))} />
            </div>
          </div>
        </div>

        {/* 2. Online Payment (UPI) */}
        <div>
          <h3 className="font-semibold text-base mb-2 text-purple-700">Online Payment (UPI)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Provider</Label>
              <Select
                value={editForm.paymentInfo.upiProvider || ''}
                onValueChange={(v) => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: v } }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpay">Google Pay (GPay)</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                  <SelectItem value="paytm">Paytm</SelectItem>
                  <SelectItem value="amazonpay">Amazon Pay</SelectItem>
                  <SelectItem value="bhim">BHIM</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>UPI ID</Label>
              <Input
                placeholder="yourname@bank or 9876543210@upi"
                value={editForm.paymentInfo.upiId || ''}
                onChange={(e) => setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiId: e.target.value } }))}
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
