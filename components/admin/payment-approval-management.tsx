"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { DollarSign, Plus, Loader2, Trash2 } from "lucide-react"

export default function PaymentApprovalManagement() {
  const [paymentRecords, setPaymentRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    businessName: "",
    ownerAdminName: "",
    email: "",
    phone: "",
    plan: "",
    academyId: "",
    userId: "",
    startDate: "",
    endDate: "",
    status: "pending",
    amount: "",
    dueMonth: "",
  })

  useEffect(() => {
    fetchPaymentRecords()
  }, [])

  const fetchPaymentRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin-payment-records")
      if (response.ok) {
        const data = await response.json()
        setPaymentRecords(data.data || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payment records",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payment records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payment records",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      "businessName",
      "ownerAdminName",
      "email",
      "phone",
      "plan",
      "academyId",
      "userId",
      "startDate",
      "endDate",
      "amount",
      "dueMonth",
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error",
          description: `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/admin-payment-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment record created successfully",
        })
        setIsModalOpen(false)
        setFormData({
          businessName: "",
          ownerAdminName: "",
          email: "",
          phone: "",
          plan: "",
          academyId: "",
          userId: "",
          startDate: "",
          endDate: "",
          status: "pending",
          amount: "",
          dueMonth: "",
        })
        fetchPaymentRecords()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create payment record",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating payment record:", error)
      toast({
        title: "Error",
        description: "Failed to create payment record",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin-payment-records?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment record deleted successfully",
        })
        fetchPaymentRecords()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete payment record",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting payment record:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment record",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      overdue: { color: "bg-red-100 text-red-800", label: "Overdue" },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge className={`${variant.color} border-0`}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-purple-600" />
                Payment & Approval Management
              </CardTitle>
              <CardDescription>
                Manage payment records and billing for all academies
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Payment Record
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : paymentRecords.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No payment records yet</p>
              <p className="text-gray-400 text-sm mb-6">
                Create your first payment record to get started
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Payment Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-orange-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Business Name
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Owner/Admin
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Phone
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Plan
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Academy ID
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      User ID
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Start Date
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      End Date
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Due Month
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {record.businessName}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {record.ownerAdminName}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {record.email}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {record.phone}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        <Badge className="bg-gradient-to-r from-purple-100 to-orange-100 text-purple-800 border-0">
                          {record.plan}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-mono">
                        {record.academyId}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-mono">
                        {record.userId}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {new Date(record.startDate).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {new Date(record.endDate).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-semibold">
                        ₹{record.amount.toLocaleString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {record.dueMonth}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(record._id)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Record Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Create Payment Record
            </DialogTitle>
            <DialogDescription>
              Fill in the details to create a new payment record
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                placeholder="Enter business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerAdminName">Owner/Admin Name <span className="text-red-500">*</span></Label>
              <Input
                id="ownerAdminName"
                value={formData.ownerAdminName}
                onChange={(e) => handleInputChange("ownerAdminName", e.target.value)}
                placeholder="Enter owner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan <span className="text-red-500">*</span></Label>
              <Select value={formData.plan} onValueChange={(value) => handleInputChange("plan", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="grow">Grow</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academyId">Academy ID <span className="text-red-500">*</span></Label>
              <Input
                id="academyId"
                value={formData.academyId}
                onChange={(e) => handleInputChange("academyId", e.target.value)}
                placeholder="e.g., AC000001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID <span className="text-red-500">*</span></Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => handleInputChange("userId", e.target.value)}
                placeholder="e.g., AD000001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) <span className="text-red-500">*</span></Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueMonth">Due Month <span className="text-red-500">*</span></Label>
              <Input
                id="dueMonth"
                value={formData.dueMonth}
                onChange={(e) => handleInputChange("dueMonth", e.target.value)}
                placeholder="e.g., January 2025"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
