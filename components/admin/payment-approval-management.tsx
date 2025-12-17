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

interface RegistrationData {
  userId: string
  academyId: string
  businessName: string
  ownerName: string
  email: string
  phone: string
}

export default function PaymentApprovalManagement() {
  const [paymentRecords, setPaymentRecords] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<RegistrationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [formData, setFormData] = useState({
    businessName: "",
    ownerAdminName: "",
    email: "",
    phone: "",
    plan: "",
    studentSize: "",
    academyId: "",
    userId: "",
    numberOfDays: "",
    startDate: "",
    endDate: "",
    status: "pending",
    amount: "",
    dueMonth: "",
  })

  useEffect(() => {
    fetchPaymentRecords()
    fetchRegistrations()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations-list")
      console.log("Registrations API response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Registrations data received:", data)
        console.log("Number of registrations:", data.registrations?.length)
        setRegistrations(data.registrations || [])
      } else {
        const errorText = await response.text()
        console.error("Registrations API error:", errorText)
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
    }
  }

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

  const handleRegistrationSelect = (field: string, value: string) => {
    // Find the registration based on the selected field
    let registration: RegistrationData | undefined

    if (field === "businessName") {
      registration = registrations.find((r) => r.businessName === value)
    } else if (field === "ownerAdminName") {
      registration = registrations.find((r) => r.ownerName === value)
    } else if (field === "userId") {
      registration = registrations.find((r) => r.userId === value)
    } else if (field === "academyId") {
      registration = registrations.find((r) => r.academyId === value)
    }

    if (registration) {
      setFormData({
        ...formData,
        businessName: registration.businessName,
        ownerAdminName: registration.ownerName,
        userId: registration.userId,
        academyId: registration.academyId,
        email: registration.email,
        phone: registration.phone,
      })
    }
  }

  const calculateEndDate = (startDate: string, days: number) => {
    if (!startDate || !days || days <= 0) return ""
    
    const start = new Date(startDate)
    // Subtract 1 because start date is Day 1, not Day 0
    start.setDate(start.getDate() + days - 1)
    
    const year = start.getFullYear()
    const month = String(start.getMonth() + 1).padStart(2, '0')
    const day = String(start.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate end date when numberOfDays or startDate changes
      if (field === "numberOfDays" || field === "startDate") {
        const days = field === "numberOfDays" ? parseInt(value) : parseInt(prev.numberOfDays)
        const startDate = field === "startDate" ? value : prev.startDate
        
        if (days && startDate) {
          updated.endDate = calculateEndDate(startDate, days)
        }
      }
      
      return updated
    })
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    setFormData({
      businessName: record.businessName,
      ownerAdminName: record.ownerAdminName,
      email: record.email,
      phone: record.phone,
      plan: record.plan,
      studentSize: record.studentSize || "",
      academyId: record.academyId,
      userId: record.userId,
      numberOfDays: "",
      startDate: new Date(record.startDate).toISOString().split('T')[0],
      endDate: new Date(record.endDate).toISOString().split('T')[0],
      status: record.status,
      amount: record.amount.toString(),
      dueMonth: record.dueMonth,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      "businessName",
      "ownerAdminName",
      "email",
      "phone",
      "plan",
      "studentSize",
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
      const isEditing = !!editingRecord
      const response = await fetch("/api/admin-payment-records", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...formData, id: editingRecord._id } : formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Payment record ${isEditing ? 'updated' : 'created'} successfully`,
        })
        setIsModalOpen(false)
        setEditingRecord(null)
        setFormData({
          businessName: "",
          ownerAdminName: "",
          email: "",
          phone: "",
          plan: "",
          studentSize: "",
          academyId: "",
          userId: "",
          numberOfDays: "",
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
          description: errorData.error || `Failed to ${isEditing ? 'update' : 'create'} payment record`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting payment record:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingRecord ? 'update' : 'create'} payment record`,
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
                      User ID
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Academy ID
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
                      Student Size
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
                      <td className="border border-gray-200 px-4 py-3 text-sm font-mono">
                        {record.userId}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-mono">
                        {record.academyId}
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
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {record.studentSize}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {formatDate(record.startDate)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {formatDate(record.endDate)}
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(record)}
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(record._id)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          setEditingRecord(null)
          setFormData({
            businessName: "",
            ownerAdminName: "",
            email: "",
            phone: "",
            plan: "",
            studentSize: "",
            academyId: "",
            userId: "",
            numberOfDays: "",
            startDate: "",
            endDate: "",
            status: "pending",
            amount: "",
            dueMonth: "",
          })
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingRecord ? 'Edit Payment Record' : 'Create Payment Record'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update the payment record details' : 'Fill in the details to create a new payment record'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
              <Select
                value={formData.businessName}
                onValueChange={(value) => {
                  console.log("Business name selected:", value)
                  handleRegistrationSelect("businessName", value)
                }}
              >
                <SelectTrigger onClick={() => console.log("Business dropdown opened, registrations count:", registrations.length)}>
                  <SelectValue placeholder="Select business name" />
                </SelectTrigger>
                <SelectContent>
                  {registrations.length === 0 ? (
                    <SelectItem value="no-data" disabled>No registrations found</SelectItem>
                  ) : (
                    registrations
                      .filter((reg) => reg.businessName) // Filter out empty business names
                      .map((reg) => (
                        <SelectItem key={`business-${reg.academyId}`} value={reg.businessName}>
                          {reg.businessName}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerAdminName">Owner/Admin Name <span className="text-red-500">*</span></Label>
              <Select
                value={formData.ownerAdminName}
                onValueChange={(value) => handleRegistrationSelect("ownerAdminName", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner name" />
                </SelectTrigger>
                <SelectContent>
                  {registrations.length === 0 ? (
                    <SelectItem value="no-data" disabled>No registrations found</SelectItem>
                  ) : (
                    registrations
                      .filter((reg) => reg.ownerName)
                      .map((reg) => (
                        <SelectItem key={`owner-${reg.academyId}`} value={reg.ownerName}>
                          {reg.ownerName}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID <span className="text-red-500">*</span></Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => handleRegistrationSelect("userId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user ID" />
                </SelectTrigger>
                <SelectContent>
                  {registrations.length === 0 ? (
                    <SelectItem value="no-data" disabled>No registrations found</SelectItem>
                  ) : (
                    registrations
                      .filter((reg) => reg.userId)
                      .map((reg) => (
                        <SelectItem key={`user-${reg.academyId}`} value={reg.userId}>
                          {reg.userId}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academyId">Academy ID <span className="text-red-500">*</span></Label>
              <Select
                value={formData.academyId}
                onValueChange={(value) => handleRegistrationSelect("academyId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academy ID" />
                </SelectTrigger>
                <SelectContent>
                  {registrations.length === 0 ? (
                    <SelectItem value="no-data" disabled>No registrations found</SelectItem>
                  ) : (
                    registrations
                      .filter((reg) => reg.academyId)
                      .map((reg) => (
                        <SelectItem key={`academy-${reg.academyId}`} value={reg.academyId}>
                          {reg.academyId}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Auto-filled from registration"
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Auto-filled from registration"
                disabled
                className="bg-gray-50"
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
              <Label htmlFor="studentSize">Student Size <span className="text-red-500">*</span></Label>
              <Input
                id="studentSize"
                type="number"
                min="1"
                value={formData.studentSize}
                onChange={(e) => handleInputChange("studentSize", e.target.value)}
                placeholder="Enter number of students"
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
              <Label htmlFor="numberOfDays">No of Days <span className="text-red-500">*</span></Label>
              <Input
                id="numberOfDays"
                type="number"
                min="1"
                value={formData.numberOfDays}
                onChange={(e) => handleInputChange("numberOfDays", e.target.value)}
                placeholder="Enter number of days"
              />
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
                disabled
                className="bg-gray-50 cursor-not-allowed"
                placeholder="Auto-calculated"
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
              <Select value={formData.dueMonth} onValueChange={(value) => handleInputChange("dueMonth", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select due month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="January">January</SelectItem>
                  <SelectItem value="February">February</SelectItem>
                  <SelectItem value="March">March</SelectItem>
                  <SelectItem value="April">April</SelectItem>
                  <SelectItem value="May">May</SelectItem>
                  <SelectItem value="June">June</SelectItem>
                  <SelectItem value="July">July</SelectItem>
                  <SelectItem value="August">August</SelectItem>
                  <SelectItem value="September">September</SelectItem>
                  <SelectItem value="October">October</SelectItem>
                  <SelectItem value="November">November</SelectItem>
                  <SelectItem value="December">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingRecord(null)
              }}
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
                  {editingRecord ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingRecord ? 'Update Record' : 'Create Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
