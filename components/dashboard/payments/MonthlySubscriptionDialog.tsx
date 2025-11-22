"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Label } from "@/components/dashboard/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select";
import { Switch } from "@/components/dashboard/ui/switch";
import { Badge } from "@/components/dashboard/ui/badge";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Receipt,
  Percent,
  DollarSign
} from "lucide-react";
import { useSubscriptionStore } from '@/stores/subscription-store';
import { SubscriptionFormData } from '@/types/dashboard/subscription';

interface MonthlySubscriptionDialogProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MonthlySubscriptionDialog({ 
  studentId, 
  onClose, 
  onSuccess 
}: MonthlySubscriptionDialogProps) {
  const {
    currentSubscription,
    formData,
    isLoading,
    error,
    editMode,
    updateFormData,
    processFirstPayment,
    processRecurringPayment,
    calculateDiscountedAmount,
    calculateTotalForMonth,
    resetForm
  } = useSubscriptionStore();

  const [calculatedDiscountedAmount, setCalculatedDiscountedAmount] = useState<number>(0);
  const [totalPayable, setTotalPayable] = useState<number>(0);

  // Calculate discounted amount when discount fields change
  useEffect(() => {
    if (
      formData.subscriptionType === 'monthly-subscription-discounted' &&
      formData.discountType &&
      formData.discountValue &&
      formData.originalMonthlyAmount > 0
    ) {
      const discounted = calculateDiscountedAmount(
        formData.originalMonthlyAmount,
        formData.discountType,
        formData.discountValue
      );
      setCalculatedDiscountedAmount(discounted);
      updateFormData({ discountedMonthlyAmount: discounted });
    } else {
      setCalculatedDiscountedAmount(0);
    }
  }, [formData.discountType, formData.discountValue, formData.originalMonthlyAmount, formData.subscriptionType]);

  // Calculate total payable
  useEffect(() => {
    if (editMode === 'first-payment') {
      const courseFee = formData.courseFee || 0;
      const registrationFee = formData.registrationFee || 0;
      const monthlyAmount = formData.subscriptionType === 'monthly-subscription-discounted' && calculatedDiscountedAmount > 0
        ? calculatedDiscountedAmount
        : formData.originalMonthlyAmount || 0;
      
      setTotalPayable(courseFee + registrationFee + monthlyAmount);
    } else {
      // For recurring payments, show the monthly amount only
      const monthNumber = currentSubscription?.currentMonth ? currentSubscription.currentMonth + 1 : 2;
      setTotalPayable(calculateTotalForMonth(monthNumber));
    }
  }, [
    formData.courseFee, 
    formData.registrationFee, 
    formData.originalMonthlyAmount,
    formData.subscriptionType,
    calculatedDiscountedAmount,
    editMode,
    currentSubscription,
    calculateTotalForMonth
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editMode === 'first-payment') {
      await processFirstPayment(formData);
      if (!error) {
        onSuccess();
      }
    } else {
      const monthlyAmount = currentSubscription?.subscriptionType === 'monthly-subscription-discounted'
        && currentSubscription.commitmentPeriod
        && currentSubscription.currentMonth < currentSubscription.commitmentPeriod
        ? currentSubscription.discountedMonthlyAmount || currentSubscription.originalMonthlyAmount
        : currentSubscription?.originalMonthlyAmount || 0;

      await processRecurringPayment(monthlyAmount, formData.paymentDate);
      if (!error) {
        onSuccess();
      }
    }
  };

  const isFirstPayment = editMode === 'first-payment';
  const isDiscountedSubscription = formData.subscriptionType === 'monthly-subscription-discounted';
  
  // Determine current month display
  const currentMonthNumber = isFirstPayment ? 1 : (currentSubscription?.currentMonth || 0) + 1;
  const isInDiscountPeriod = isDiscountedSubscription && 
    currentSubscription?.commitmentPeriod && 
    currentMonthNumber <= currentSubscription.commitmentPeriod;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                {isFirstPayment ? 'Monthly Subscription - First Payment' : 'Monthly Subscription - Recurring Payment'}
              </CardTitle>
              <CardDescription>
                {isFirstPayment 
                  ? 'Set up your monthly subscription with course fees and registration'
                  : `Process payment for Month ${currentMonthNumber}`
                }
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>�</Button>
          </div>

          {/* Month Indicator */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={isFirstPayment ? "default" : "secondary"} className="bg-purple-600">
              Month {currentMonthNumber}
            </Badge>
            {isInDiscountPeriod && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Discounted Rate
              </Badge>
            )}
            {!isFirstPayment && !isInDiscountPeriod && isDiscountedSubscription && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Regular Rate
              </Badge>
            )}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Course Selection - Only for first payment */}
            {isFirstPayment && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseId" className="text-sm font-medium">Course</Label>
                  <Select 
                    value={formData.courseId} 
                    onValueChange={(value) => updateFormData({ courseId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course-1">Web Development Bootcamp</SelectItem>
                      <SelectItem value="course-2">Data Science Program</SelectItem>
                      <SelectItem value="course-3">Mobile App Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cohortId" className="text-sm font-medium">Cohort</Label>
                  <Select 
                    value={formData.cohortId} 
                    onValueChange={(value) => updateFormData({ cohortId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cohort-1">COH-2024-001</SelectItem>
                      <SelectItem value="cohort-2">COH-2024-002</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Subscription Type Selection - Only for first payment */}
            {isFirstPayment && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Subscription Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      formData.subscriptionType === 'monthly-subscription' 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => updateFormData({ subscriptionType: 'monthly-subscription' })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Regular Monthly</span>
                      </div>
                      <p className="text-sm text-gray-600">Standard monthly subscription without commitment</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-colors ${
                      formData.subscriptionType === 'monthly-subscription-discounted' 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => updateFormData({ subscriptionType: 'monthly-subscription-discounted' })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Discounted Monthly</span>
                      </div>
                      <p className="text-sm text-gray-600">Discounted rate with commitment period</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Course Fee - Only editable for first payment */}
              <div>
                <Label htmlFor="courseFee" className="text-sm font-medium">
                  Course Fee
                  {!isFirstPayment && <span className="text-gray-400 ml-1">(Already paid)</span>}
                </Label>
                <Input
                  id="courseFee"
                  type="number"
                  placeholder="0.00"
                  value={formData.courseFee || ''}
                  onChange={(e) => updateFormData({ courseFee: parseFloat(e.target.value) || 0 })}
                  disabled={!isFirstPayment}
                  required={isFirstPayment}
                />
              </div>

              {/* Registration Fee - Only editable for first payment */}
              <div>
                <Label htmlFor="registrationFee" className="text-sm font-medium">
                  Registration Fee
                  {!isFirstPayment && <span className="text-gray-400 ml-1">(Already paid)</span>}
                </Label>
                <Input
                  id="registrationFee"
                  type="number"
                  placeholder="0.00"
                  value={formData.registrationFee || ''}
                  onChange={(e) => updateFormData({ registrationFee: parseFloat(e.target.value) || 0 })}
                  disabled={!isFirstPayment}
                  required={isFirstPayment}
                />
              </div>

              {/* Original Monthly Amount */}
              <div>
                <Label htmlFor="originalMonthlyAmount" className="text-sm font-medium">
                  Monthly Subscription Fee
                </Label>
                <Input
                  id="originalMonthlyAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.originalMonthlyAmount || ''}
                  onChange={(e) => updateFormData({ originalMonthlyAmount: parseFloat(e.target.value) || 0 })}
                  disabled={!isFirstPayment}
                  required
                />
              </div>
            </div>

            {/* Discount Settings - Only for discounted subscription and first payment */}
            {isFirstPayment && isDiscountedSubscription && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Percent className="h-5 w-5 text-green-600" />
                    Discount Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="commitmentPeriod" className="text-sm font-medium">
                        Commitment Period
                      </Label>
                      <Select 
                        value={formData.commitmentPeriod?.toString() || ''} 
                        onValueChange={(value) => updateFormData({ commitmentPeriod: parseInt(value) as 3|6|9|12|24 })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="9">9 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="discountType" className="text-sm font-medium">
                        Discount Type
                      </Label>
                      <Select 
                        value={formData.discountType || ''} 
                        onValueChange={(value) => updateFormData({ discountType: value as 'percentage' | 'amount' })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="discountValue" className="text-sm font-medium">
                        Discount Value
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                        value={formData.discountValue || ''}
                        onChange={(e) => updateFormData({ discountValue: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  {calculatedDiscountedAmount > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Discounted Monthly Amount:</span>
                        <span className="text-lg font-bold text-green-600">
                          ${calculatedDiscountedAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Original: ${formData.originalMonthlyAmount?.toFixed(2)} | 
                        Savings: ${(formData.originalMonthlyAmount - calculatedDiscountedAmount).toFixed(2)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => updateFormData({ paymentMethod: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentDate" className="text-sm font-medium">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate.toISOString().split('T')[0]}
                  onChange={(e) => updateFormData({ paymentDate: new Date(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes || ''}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Payment Summary */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  Payment Summary - Month {currentMonthNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isFirstPayment && (
                  <>
                    <div className="flex justify-between">
                      <span>Course Fee:</span>
                      <span>${(formData.courseFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registration Fee:</span>
                      <span>${(formData.registrationFee || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span>Monthly Subscription:</span>
                  <span>
                    {isFirstPayment && isDiscountedSubscription && calculatedDiscountedAmount > 0
                      ? `$${calculatedDiscountedAmount.toFixed(2)}`
                      : `$${(formData.originalMonthlyAmount || 0).toFixed(2)}`
                    }
                  </span>
                </div>

                {isFirstPayment && isDiscountedSubscription && calculatedDiscountedAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Applied:</span>
                    <span>-${(formData.originalMonthlyAmount - calculatedDiscountedAmount).toFixed(2)}</span>
                  </div>
                )}

                <hr className="my-2" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Payable:</span>
                  <span className="text-purple-600">${totalPayable.toFixed(2)}</span>
                </div>

                {!isFirstPayment && currentSubscription && (
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Next due date: {currentSubscription.nextDueDate.toLocaleDateString()}</p>
                    <p>Reminder date: {currentSubscription.reminderDate.toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 pt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || totalPayable <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Processing...' : `Process Payment ($${totalPayable.toFixed(2)})`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}