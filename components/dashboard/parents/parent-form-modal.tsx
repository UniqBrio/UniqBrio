'use client'

import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { useState, useEffect } from 'react'
import { PhoneCountryCodeSelect } from '@/components/dashboard/student/common/phone-country-code-select'
import { type Parent } from '@/types/dashboard/parent'

interface ParentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (parentData: Parent) => void
  categoriesList: string[]
  studentIds: string[]
  initialParent?: Parent
  isEditing?: boolean
}

const PHONE_CODE_DIGITS: Record<string, number> = {
  '+1': 10,
  '+91': 10,
  '+44': 10,
  '+61': 9,
  '+65': 8,
  '+81': 10,
  '+86': 11,
  '+33': 9,
  '+49': 11,
}

export function ParentFormModal({
  open,
  onOpenChange,
  onSave,
  categoriesList,
  studentIds,
  initialParent,
  isEditing = false,
}: ParentFormModalProps) {
  const [formData, setFormData] = useState<Parent>({
    parentId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobile: '',
    countryCode: '+91',
    country: 'India',
    dob: '',
    linkedStudentId: '',
    categories: [],
    paymentStatus: 'Pending',
    totalFees: 0,
    amountPaid: 0,
    dueAmount: 0,
    currency: 'INR',
    verificationStatus: 'Pending',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    address: '',
    city: '',
    stateProvince: '',
    pincode: '',
    engagementScore: 50,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form when modal opens or initial parent data changes
  useEffect(() => {
    if (open) {
      if (initialParent) {
        setFormData({
          parentId: initialParent.parentId || '',
          firstName: initialParent.firstName || '',
          middleName: initialParent.middleName || '',
          lastName: initialParent.lastName || '',
          email: initialParent.email || '',
          mobile: initialParent.mobile || '',
          countryCode: initialParent.countryCode || '+91',
          country: initialParent.country || 'India',
          dob: initialParent.dob ? String(initialParent.dob) : '',
          linkedStudentId: initialParent.linkedStudentId || '',
          categories: initialParent.categories || [],
          paymentStatus: initialParent.paymentStatus || 'Pending',
          totalFees: initialParent.totalFees || 0,
          amountPaid: initialParent.amountPaid || 0,
          dueAmount: initialParent.dueAmount || 0,
          currency: initialParent.currency || 'INR',
          verificationStatus: initialParent.verificationStatus || 'Pending',
          status: initialParent.status || 'Active',
          joinDate: initialParent.joinDate ? String(initialParent.joinDate) : new Date().toISOString().split('T')[0],
          address: initialParent.address || '',
          city: initialParent.city || '',
          stateProvince: initialParent.stateProvince || '',
          pincode: initialParent.pincode || '',
          engagementScore: initialParent.engagementScore || 50,
        })
      } else {
        setFormData({
          parentId: '',
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          mobile: '',
          countryCode: '+91',
          country: 'India',
          dob: '',
          linkedStudentId: '',
          categories: [],
          paymentStatus: 'Pending',
          totalFees: 0,
          amountPaid: 0,
          dueAmount: 0,
          currency: 'INR',
          verificationStatus: 'Pending',
          status: 'Active',
          joinDate: new Date().toISOString().split('T')[0],
          address: '',
          city: '',
          stateProvince: '',
          pincode: '',
          engagementScore: 50,
        })
      }
      setErrors({})
    }
  }, [open, initialParent])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Phone number is required'
    } else {
      const phoneDigits = formData.mobile.replace(/\D/g, '')
      const requiredDigits = PHONE_CODE_DIGITS[formData.countryCode] || 10
      if (phoneDigits.length < requiredDigits) {
        newErrors.mobile = `Phone must have at least ${requiredDigits} digits`
      }
    }
    
    if (!formData.linkedStudentId) newErrors.linkedStudentId = 'Student ID is required'
    if (formData.categories.length === 0) newErrors.categories = 'Select at least one category'
    
    if (formData.dob) {
      const dobDate = new Date(formData.dob)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dobDate.setHours(0, 0, 0, 0)
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be a future date'
      }
    }
    
    if (formData.totalFees < 0) newErrors.totalFees = 'Total fees cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCountryCodeChange = (code: string) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code,
    }))
    if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
    if (errors.categories) setErrors(prev => ({ ...prev, categories: '' }))
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const dueAmount = isEditing 
      ? formData.dueAmount 
      : Math.max(0, formData.totalFees - (formData.amountPaid || 0));

    onSave({
      ...formData,
      totalFees: parseFloat(String(formData.totalFees)) || 0,
      amountPaid: isEditing ? (formData.amountPaid || 0) : 0,
      dueAmount: dueAmount,
    })

    handleClose()
  }

  const handleClose = () => {
    setFormData({
      parentId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      mobile: '',
      countryCode: '+91',
      country: 'India',
      dob: '',
      linkedStudentId: '',
      categories: [],
      paymentStatus: 'Pending',
      totalFees: 0,
      amountPaid: 0,
      dueAmount: 0,
      currency: 'INR',
      verificationStatus: 'Pending',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      address: '',
      city: '',
      stateProvince: '',
      pincode: '',
      engagementScore: 50,
    })
    setErrors({})
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Parent' : 'Add New Parent'}</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[0-9]/g, '')
                    setFormData({ ...formData, firstName: value })
                    if (errors.firstName) setErrors({ ...errors, firstName: '' })
                  }}
                  placeholder="e.g., John"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[0-9]/g, '')
                    setFormData({ ...formData, middleName: value })
                  }}
                  placeholder="e.g., Kumar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[0-9]/g, '')
                    setFormData({ ...formData, lastName: value })
                    if (errors.lastName) setErrors({ ...errors, lastName: '' })
                  }}
                  placeholder="e.g., Doe"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: '' })
                  }}
                  placeholder="e.g., john@example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob instanceof Date ? formData.dob.toISOString().split('T')[0] : String(formData.dob || '')}
                  onChange={(e) => {
                    setFormData({ ...formData, dob: e.target.value })
                    if (errors.dob) setErrors({ ...errors, dob: '' })
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.dob ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dob && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dob}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code <span className="text-red-500">*</span>
                </label>
                <PhoneCountryCodeSelect
                  value={formData.countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-full"
                />
                {errors.countryCode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.countryCode}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => {
                    const numericOnly = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({ ...formData, mobile: numericOnly })
                    if (errors.mobile) setErrors({ ...errors, mobile: '' })
                  }}
                  placeholder="e.g., 9876543210"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.mobile ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.mobile && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.mobile}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Categories & Status */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 p-3 border border-gray-300 rounded-lg">
                  {categoriesList.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
                {errors.categories && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.categories}
                  </p>
                )}
              </div>

              {/* Student ID & Status */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linked Student ID <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.linkedStudentId}
                    onChange={(e) => {
                      setFormData({ ...formData, linkedStudentId: e.target.value })
                      if (errors.linkedStudentId) setErrors({ ...errors, linkedStudentId: '' })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.linkedStudentId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a student</option>
                    {studentIds.map((studentId) => (
                      <option key={studentId} value={studentId}>
                        {studentId}
                      </option>
                    ))}
                  </select>
                  {errors.linkedStudentId && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.linkedStudentId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'Paid' | 'Pending' | 'Overdue' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              {/* Total Fees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Fees <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalFees}
                  onChange={(e) => {
                    setFormData({ ...formData, totalFees: parseFloat(e.target.value) || 0 })
                    if (errors.totalFees) setErrors({ ...errors, totalFees: '' })
                  }}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.totalFees ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalFees && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.totalFees}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., 123 Main Street"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Mumbai"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.stateProvince}
                    onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                    placeholder="e.g., Maharashtra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g., 400001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isEditing ? 'Update Parent' : 'Add Parent'}
          </Button>
        </div>
      </div>
    </div>
  )
}
