'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { Label } from '@/components/dashboard/ui/label';
import { Textarea } from '@/components/dashboard/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Alert, AlertDescription } from '@/components/dashboard/ui/alert';
import { Badge } from '@/components/dashboard/ui/badge';
import {
  formatCurrency,
  formatDate,
  calculateNetAmount,
  generatePaymentSuggestions,
  isValidPaymentAmount,
} from '@/lib/dashboard/payments/payment-record-helper';
import { AddPaymentRecordData, PaymentBalance } from '@/types/dashboard/payment';
import { Calendar, AlertCircle, CheckCircle, DollarSign, CreditCard } from 'lucide-react';

interface PartialPaymentFormProps {
  paymentId: string;
  studentId: string;
  studentName: string;
  enrollmentId?: string;
  courseId?: string;
  courseName?: string;
  cohortId?: string;
  remainingBalance: PaymentBalance;
  onSubmit: (data: AddPaymentRecordData) => Promise<void>;
  onCancel?: () => void;
  receivedBy?: string;
}

export default function PartialPaymentForm({
  paymentId,
  studentId,
  studentName,
  enrollmentId,
  courseId,
  courseName,
  cohortId,
  remainingBalance,
  onSubmit,
  onCancel,
  receivedBy = '',
}: PartialPaymentFormProps) {
  const [formData, setFormData] = useState<Partial<AddPaymentRecordData>>({
    paymentId,
    studentId,
    studentName,
    enrollmentId,
    courseId,
    courseName,
    cohortId,
    paidAmount: 0,
    paidDate: new Date(),
    paymentMode: 'Cash',
    payerType: 'student',
    receivedBy,
    discount: 0,
    specialCharges: 0,
    taxAmount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [netAmount, setNetAmount] = useState(0);
  const [suggestions, setSuggestions] = useState<number[]>([]);

  // Calculate net amount whenever relevant fields change
  useEffect(() => {
    const net = calculateNetAmount(
      formData.paidAmount || 0,
      formData.discount || 0,
      formData.specialCharges || 0,
      formData.taxAmount || 0
    );
    setNetAmount(net);
  }, [formData.paidAmount, formData.discount, formData.specialCharges, formData.taxAmount]);

  // Generate payment suggestions
  useEffect(() => {
    const suggestions = generatePaymentSuggestions(remainingBalance.remainingAmount);
    setSuggestions(suggestions.slice(0, 4));
  }, [remainingBalance.remainingAmount]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newWarnings: string[] = [];

    // Required field validation
    if (!formData.paidAmount || formData.paidAmount <= 0) {
      newErrors.paidAmount = 'Payment amount must be greater than zero';
    }

    if (!formData.paidDate) {
      newErrors.paidDate = 'Payment date is required';
    }

    if (!formData.paymentMode) {
      newErrors.paymentMode = 'Payment mode is required';
    }

    if (!formData.receivedBy || formData.receivedBy.trim() === '') {
      newErrors.receivedBy = 'Received by is required';
    }

    // Amount validation
    if (formData.paidAmount && formData.paidAmount > 0) {
      const validation = isValidPaymentAmount(
        netAmount,
        remainingBalance.remainingAmount,
        false
      );

      if (!validation.valid) {
        newWarnings.push(validation.message || 'Invalid payment amount');
      }
    }

    // Date validation
    if (formData.paidDate) {
      const paymentDate = new Date(formData.paidDate);
      const today = new Date();

      if (paymentDate > today) {
        newWarnings.push('Payment date is in the future');
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData as AddPaymentRecordData);
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestion = (amount: number) => {
    handleInputChange('paidAmount', amount);
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Record Partial Payment
        </CardTitle>
        <CardDescription>
          Add a new payment record for {studentName}
          {courseName && ` - ${courseName}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Balance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Fee</p>
              <p className="text-lg font-semibold">{formatCurrency(remainingBalance.totalFee)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Already Paid</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(remainingBalance.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatCurrency(remainingBalance.remainingAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={
                  remainingBalance.status === 'PAID'
                    ? 'default'
                    : remainingBalance.status === 'PARTIAL'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {remainingBalance.status}
              </Badge>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="paidAmount">
              Payment Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paidAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.paidAmount || ''}
              onChange={(e) => handleInputChange('paidAmount', parseFloat(e.target.value) || 0)}
              className={errors.paidAmount ? 'border-red-500' : ''}
              placeholder="Enter amount"
            />
            {errors.paidAmount && (
              <p className="text-sm text-red-500">{errors.paidAmount}</p>
            )}

            {/* Quick Amount Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-muted-foreground w-full">Quick suggestions:</p>
                {suggestions.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applySuggestion(amount)}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paidDate">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="paidDate"
                type="date"
                value={
                  formData.paidDate
                    ? new Date(formData.paidDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleInputChange('paidDate', new Date(e.target.value))}
                className={`pl-10 ${errors.paidDate ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.paidDate && <p className="text-sm text-red-500">{errors.paidDate}</p>}
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label htmlFor="paymentMode">
              Payment Mode <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.paymentMode}
              onValueChange={(value) => handleInputChange('paymentMode', value)}
            >
              <SelectTrigger className={errors.paymentMode ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">?? Cash</SelectItem>
                <SelectItem value="Card">?? Card</SelectItem>
                <SelectItem value="Online">?? Online</SelectItem>
                <SelectItem value="UPI">?? UPI</SelectItem>
                <SelectItem value="Cheque">?? Cheque</SelectItem>
                <SelectItem value="Bank Transfer">?? Bank Transfer</SelectItem>
                <SelectItem value="Others">?? Others</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMode && (
              <p className="text-sm text-red-500">{errors.paymentMode}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                type="text"
                value={formData.transactionId || ''}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                placeholder="e.g., TXN123456"
              />
            </div>

            {/* Reference ID */}
            <div className="space-y-2">
              <Label htmlFor="referenceId">Reference ID (Optional)</Label>
              <Input
                id="referenceId"
                type="text"
                value={formData.referenceId || ''}
                onChange={(e) => handleInputChange('referenceId', e.target.value)}
                placeholder="e.g., REF123456"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold">Additional Details (Optional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount || 0}
                  onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Special Charges */}
              <div className="space-y-2">
                <Label htmlFor="specialCharges">Special Charges</Label>
                <Input
                  id="specialCharges"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.specialCharges || 0}
                  onChange={(e) =>
                    handleInputChange('specialCharges', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              {/* Tax Amount */}
              <div className="space-y-2">
                <Label htmlFor="taxAmount">Tax Amount</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.taxAmount || 0}
                  onChange={(e) => handleInputChange('taxAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Net Amount Display */}
            {(formData.discount || formData.specialCharges || formData.taxAmount) && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Net Payment Amount: <strong>{formatCurrency(netAmount)}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payer Type */}
            <div className="space-y-2">
              <Label htmlFor="payerType">Payer Type</Label>
              <Select
                value={formData.payerType}
                onValueChange={(value) => handleInputChange('payerType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payer Name */}
            <div className="space-y-2">
              <Label htmlFor="payerName">Payer Name (Optional)</Label>
              <Input
                id="payerName"
                type="text"
                value={formData.payerName || ''}
                onChange={(e) => handleInputChange('payerName', e.target.value)}
                placeholder="Enter payer name"
              />
            </div>
          </div>

          {/* Received By */}
          <div className="space-y-2">
            <Label htmlFor="receivedBy">
              Received By <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receivedBy"
              type="text"
              value={formData.receivedBy || ''}
              onChange={(e) => handleInputChange('receivedBy', e.target.value)}
              className={errors.receivedBy ? 'border-red-500' : ''}
              placeholder="Enter staff name"
            />
            {errors.receivedBy && <p className="text-sm text-red-500">{errors.receivedBy}</p>}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.remarks || '').length}/500 characters
            </p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
