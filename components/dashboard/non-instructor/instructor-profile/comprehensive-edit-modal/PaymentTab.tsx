"use client";
import React from "react";
import { Label } from "@/components/dashboard/ui/label";
import { Input } from "@/components/dashboard/ui/input";
import { Button } from "@/components/dashboard/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/dashboard/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/dashboard/staff/utils";
import { useCustomUpiProviders } from "@/hooks/dashboard/staff/use-custom-upi-providers";
import { EditFormData } from "./types";

export function PaymentTab({ editForm, setEditForm }: { editForm: EditFormData; setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>; }) {
  const { getAllProviders, addCustomProvider, loading, refresh } = useCustomUpiProviders()
  const [providerOpen, setProviderOpen] = React.useState(false)
  const [providerSearch, setProviderSearch] = React.useState("")

  React.useEffect(() => {
    if (providerOpen) {
      try { refresh() } catch {}
    }
  }, [providerOpen, refresh])
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
              <Popover open={providerOpen} onOpenChange={(open) => { setProviderOpen(open); if (!open) setProviderSearch("") }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {editForm.paymentInfo.upiProvider ? editForm.paymentInfo.upiProvider : "Select provider"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or add providers..."
                      value={providerSearch}
                      onValueChange={(value) => {
                        // Only allow letters, spaces, and basic punctuation (no numbers)
                        const filtered = value.replace(/[0-9]/g, '')
                        setProviderSearch(filtered)
                      }}
                      onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                        const query = providerSearch.trim()
                        const exists = getAllProviders().some(p => p.label.toLowerCase() === query.toLowerCase())
                        if (e.key === 'Enter' && query && !exists) {
                          const ok = await addCustomProvider(query)
                          if (ok) {
                            setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: query } }))
                            setProviderOpen(false)
                            setProviderSearch("")
                          }
                        }
                      }}
                      className="h-9"
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                      {loading ? (
                        <div className="px-2 py-1 text-sm text-gray-500 dark:text-white">Loading providers...</div>
                      ) : (
                        <>
                          <CommandEmpty>No provider found.</CommandEmpty>
                          {(() => {
                            const query = providerSearch.trim()
                            const exists = getAllProviders().some(p => p.label.toLowerCase() === query.toLowerCase())
                            if (!query || exists) return null
                            return (
                              <CommandItem
                                onSelect={async () => {
                                  const ok = await addCustomProvider(query)
                                  if (ok) {
                                    setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: query } }))
                                    setProviderOpen(false)
                                    setProviderSearch("")
                                  }
                                }}
                                className="text-blue-600 font-medium"
                              >
                                <div className="mr-2 h-4 w-4 rounded border-2 border-blue-600 flex items-center justify-center text-xs">+</div>
                                Add "{query}" as new provider
                              </CommandItem>
                            )
                          })()}

                          <CommandGroup>
                            {getAllProviders()
                              .filter(p => p.label.toLowerCase().includes(providerSearch.toLowerCase()))
                              .map(p => (
                                <CommandItem
                                  key={p.value}
                                  value={p.value}
                                  className="flex items-center justify-between"
                                  onSelect={() => {
                                    setEditForm(f => ({ ...f, paymentInfo: { ...f.paymentInfo, upiProvider: p.label } }))
                                    setProviderOpen(false)
                                  }}
                                >
                                  <div className="flex items-center">
                                    <Check className={cn("mr-2 h-4 w-4", editForm.paymentInfo.upiProvider === p.label ? "opacity-100" : "opacity-0")} />
                                    {p.label}
                                  </div>
                                  {null}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
