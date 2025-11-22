"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/dashboard/ui/dialog"
import { Label } from "@/components/dashboard/ui/label"
import { Button } from "@/components/dashboard/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { toast } from "@/components/dashboard/ui/use-toast"
import { BankFormData } from "./types"

interface BankAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BankAccountDialog({ open, onOpenChange }: BankAccountDialogProps) {
  const [bankForm, setBankForm] = useState<BankFormData>({
    holderName: "",
    accountNumber: "",
    accountType: "",
    bankName: "",
    ifsc: "",
    branch: "",
    micr: ""
  })
  const [bankFormError, setBankFormError] = useState("")
    // Check if all mandatory fields are filled
    const isFormValid = bankForm.holderName && bankForm.accountNumber && bankForm.accountType && bankForm.bankName && bankForm.ifsc && bankForm.branch;

  function handleBankChange(field: string, value: any) {
    setBankForm((prev) => ({ ...prev, [field]: value }))
    setBankFormError("")
  }

  function handleBankSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bankForm.holderName || !bankForm.accountNumber || !bankForm.accountType || !bankForm.bankName || !bankForm.ifsc || !bankForm.branch) {
      setBankFormError("All fields except MICR Code are required.")
      return
    }
    // Optionally: validate IFSC, account number, etc.
    onOpenChange(false)
    toast({ title: "Bank Account Added", description: "Bank account details have been saved." })
    setBankForm({
      holderName: "",
      accountNumber: "",
      accountType: "",
      bankName: "",
      ifsc: "",
      branch: "",
      micr: ""
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bank Account Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleBankSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Account Holder Name<span className="text-red-500">*</span></Label>
              <input type="text" className="input input-bordered w-full" value={bankForm.holderName} onChange={e => handleBankChange("holderName", e.target.value)} required />
            </div>
            <div>
              <Label>Account Number<span className="text-red-500">*</span></Label>
              <input type="text" className="input input-bordered w-full" value={bankForm.accountNumber} onChange={e => handleBankChange("accountNumber", e.target.value.replace(/[^0-9]/g, ""))} required maxLength={20} />
            </div>
            <div>
              <Label>Account Type<span className="text-red-500">*</span></Label>
              <Select value={bankForm.accountType} onValueChange={v => handleBankChange("accountType", v)} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="NRE">NRE</SelectItem>
                  <SelectItem value="NRO">NRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bank Name<span className="text-red-500">*</span></Label>
              <input type="text" className="input input-bordered w-full" value={bankForm.bankName} onChange={e => handleBankChange("bankName", e.target.value)} required />
            </div>
            <div>
              <Label>IFSC Code<span className="text-red-500">*</span></Label>
              <input type="text" className="input input-bordered w-full uppercase" value={bankForm.ifsc} onChange={e => handleBankChange("ifsc", e.target.value.toUpperCase())} required maxLength={11} pattern="^[A-Z]{4}0[A-Z0-9]{6}$" title="Enter valid IFSC code" />
            </div>
            <div>
              <Label>Branch Name<span className="text-red-500">*</span></Label>
              <input type="text" className="input input-bordered w-full" value={bankForm.branch} onChange={e => handleBankChange("branch", e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <Label>MICR Code</Label>
              <input type="text" className="input input-bordered w-full" value={bankForm.micr} onChange={e => handleBankChange("micr", e.target.value.replace(/[^0-9]/g, ""))} maxLength={9} />
            </div>
          </div>
          {bankFormError && <div className="text-red-600 text-sm mt-2">{bankFormError}</div>}
          <DialogFooter className="mt-4">
              <Button type="submit" disabled={!isFormValid}>Add Account</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}