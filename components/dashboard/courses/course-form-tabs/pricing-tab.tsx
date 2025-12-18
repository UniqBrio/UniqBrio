"use client"

import { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import Image from "next/image"
import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Button } from "@/components/dashboard/ui/button"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Calendar } from "@/components/dashboard/ui/calendar"
import { Plus, CalendarIcon } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context";
import { format } from "date-fns"

interface PricingTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
  mockReferralCodes?: any[]
  courses?: any[]
}

export default function PricingTab({ 
  formData, 
  onFormChange, 
  mockReferralCodes = [], 
  courses = [] 
}: PricingTabProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const { currency } = useCurrency();
  
  // State for calendar open/close control
  const [isReferralStartCalendarOpen, setIsReferralStartCalendarOpen] = useState(false)
  const [isReferralEndCalendarOpen, setIsReferralEndCalendarOpen] = useState(false)
  
  const validateDateTimeRange = (startDateTime: string, endDateTime: string): boolean => {
    if (!startDateTime || !endDateTime) return true;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return start < end;
  };

  // Function to calculate referral duration in days
  const calculateReferralDuration = (startDateTime: string, endDateTime: string): number => {
    if (!startDateTime || !endDateTime) return 0;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Function to validate pricing periods
  const validatePricingPeriods = (periods: any[]): string[] => {
    const errors: string[] = [];
    
    if (!periods || periods.length === 0) return errors;
    
    // Sort periods by start month
    const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);
    
    for (let i = 0; i < sortedPeriods.length; i++) {
      const period = sortedPeriods[i];
      
      // Check if end month is greater than start month
      if (period.endMonth <= period.startMonth) {
        errors.push(`Period ${i + 1}: End month must be greater than start month`);
      }
      
      // Check if price is valid
      if (!period.price || isNaN(parseFloat(period.price)) || parseFloat(period.price) <= 0) {
        errors.push(`Period ${i + 1}: Price must be a valid positive number`);
      }
      
      // Check for overlaps with next period
      if (i < sortedPeriods.length - 1) {
        const nextPeriod = sortedPeriods[i + 1];
        if (period.endMonth >= nextPeriod.startMonth) {
          errors.push(`Period ${i + 1} and ${i + 2}: Periods cannot overlap`);
        }
      }
    }
    
    return errors;
  };

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 compact-form px-2 sm:px-0">
      <div className="max-w-full sm:max-w-md md:max-w-lg">
        <div>
          <Label htmlFor="paymentCategory" className="mb-0.5 sm:mb-1 text-xs sm:text-sm">
            Payment Category <span className="text-red-500">*</span>
          </Label>
          <select
            id="paymentCategory"
            className="w-full border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:border-transparent mb-1.5 sm:mb-2"
            style={{ borderColor: '#d1d5db' }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}66`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = 'none';
            }}
            value={formData.paymentCategory || ''}
            onChange={e => onFormChange('paymentCategory', e.target.value)}
          >
            <option value="">Select Payment Category</option>
            <option value="One-time">One-time</option>
            <option value="One-time with installments">One-time with installments</option>
            <option value="Monthly subscription">Monthly subscription</option>
            <option value="Monthly subscription with discounts">Monthly subscription with discounts</option>
          </select>
        </div>
        <div>
          <Label htmlFor="price" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">
            {formData.courseCategory === 'Ongoing Training' 
              ? `Price per Month (${currency})` 
              : `Price (${currency})`} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              min="1"
              placeholder={formData.courseCategory === 'Ongoing Training' ? '5000' : '25000'}
              className="pl-6 sm:pl-8 border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-transparent"
              style={{ borderColor: '#d1d5db' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}66`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              value={formData.price || ''}
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  onFormChange('price', '');
                  e.preventDefault();
                }
              }}
              onChange={e => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  onFormChange('price', '');
                  return;
                }
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue > 0) {
                  onFormChange('price', numValue.toString());
                } else if (value === '0' || numValue === 0) {
                  // Don't set 0 values, keep field empty
                  onFormChange('price', '');
                }
              }}
            />
          </div>
          {formData.courseCategory === 'Ongoing Training' && (
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-white mt-0.5 sm:mt-1">
              This price will be charged monthly
            </p>
          )}
        </div>
      </div>

      {/* Ongoing Training Pricing Section */}
      {formData.courseCategory === 'Ongoing Training' && (
        <>
          <Separator />
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2">Ongoing Training Pricing <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h4>
            
            {/* Payment Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="paymentFrequency" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Payment Frequency</Label>
                <select
                  id="paymentFrequency"
                  className="w-full border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 cursor-not-allowed focus:outline-none focus:border-transparent"
                  style={{ borderColor: '#d1d5db' }}
                  value="monthly"
                  disabled
                >
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="trainingDuration" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Total Training Duration</Label>
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    id="trainingDuration"
                    type="number"
                    placeholder="12"
                    className="border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 cursor-not-allowed focus:outline-none focus:border-transparent flex-1"
                    style={{ borderColor: '#d1d5db' }}
                    disabled
                  />
                  <select
                    id="durationUnit"
                    className="border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 cursor-not-allowed focus:outline-none focus:border-transparent min-w-[70px] sm:min-w-[80px]"
                    style={{ borderColor: '#d1d5db' }}
                    value="months"
                    disabled
                  >
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Periods */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2">Pricing Periods <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h4>

              <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
                <Switch id="enablePricingPeriods" disabled/>
                <Label htmlFor="enablePricingPeriods" className="text-[10px] sm:text-xs">Enable Pricing Periods</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <Label htmlFor="periodDuration" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Period Duration (months)</Label>
                  <Input disabled id="periodDuration" placeholder="4" type="number" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="priceEscalation" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Price Escalation (%)</Label>
                  <Input disabled id="priceEscalation" placeholder="5" type="number" step="0.1" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="totalPeriods" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Total Periods</Label>
                  <Input disabled id="totalPeriods" placeholder="3" type="number" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-2 sm:space-y-3">
        <h4 className="font-medium text-xs sm:text-sm">Affiliate Tracking</h4>

        <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
          <Switch 
            id="enableAffiliate" 
            checked={formData.affiliateEnabled || false}
            onCheckedChange={(checked) => onFormChange('affiliateEnabled', checked)}
          />
          <Label htmlFor="enableAffiliate" className="text-[10px] sm:text-xs">Enable Affiliate Tracking</Label>
        </div>

        {/* Referral Code Dropdown - Only active codes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="referralCode" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Referral Code</Label>
            <select
              id="referralCode"
              className="w-full border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white focus:outline-none focus:border-transparent"
              style={{ borderColor: '#d1d5db' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}66`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              value={formData.referralCode || ''}
              onChange={e => {
                const selectedCode = e.target.value;
                // Find mock data for selected code
                const mock = mockReferralCodes.find(r => r.code === selectedCode);
                // Example mock data for demonstration
                let commissionRate = '';
                let referralStart = '';
                let referralEnd = '';
                if (mock) {
                  // Example: hardcoded values for demo, replace with real data as needed
                  if (mock.code === 'ART2024') {
                    commissionRate = '10';
                    referralStart = '2025-08-01T09:00';
                    referralEnd = '2025-08-31T23:59';
                  } else if (mock.code === 'PAINT50') {
                    commissionRate = '15';
                    referralStart = '2025-09-01T09:00';
                    referralEnd = '2025-09-30T23:59';
                  } else if (mock.code === 'NEWUSER10') {
                    commissionRate = '5';
                    referralStart = '2025-07-01T09:00';
                    referralEnd = '2025-07-31T23:59';
                  } else if (mock.code === 'SUMMER25') {
                    commissionRate = '8';
                    referralStart = '2025-06-01T09:00';
                    referralEnd = '2025-06-30T23:59';
                  } else if (mock.code === 'DIWALI2025') {
                    commissionRate = '20';
                    referralStart = '2025-10-15T09:00';
                    referralEnd = '2025-11-15T23:59';
                  }
                }
                onFormChange('referralCode', selectedCode);
                onFormChange('commissionRate', commissionRate);
                onFormChange('referralStart', referralStart);
                onFormChange('referralEnd', referralEnd);
              }}
            >
              <option value="">Select Referral Code</option>
              {/* Only show active referral codes (mock + from courses) */}
              {[
                ...mockReferralCodes.filter(r => r.status === 'Active').map(r => r.code),
                ...((Array.isArray(courses) ? courses : [])
                  .flatMap(c => c.affiliateTracking && c.affiliateTracking.enabled && (c.affiliateTracking as any).status === 'Active' ? [c.affiliateTracking.referralCode] : [])
                  .filter((v, i, arr) => v && arr.indexOf(v) === i))
              ]
                .filter((v, i, arr) => v && arr.indexOf(v) === i)
                .map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
            </select>
          </div> 
          <div>
            <Label htmlFor="commissionRate" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              placeholder="10"
              type="number"
              min="0"
              max="100"
              value={formData.commissionRate || ''}
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  onFormChange('commissionRate', '');
                  e.preventDefault();
                }
              }}
              onChange={e => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  onFormChange('commissionRate', '');
                  return;
                }
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                  onFormChange('commissionRate', numValue.toString());
                }
              }}
              className="border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-transparent"
              style={{ borderColor: '#d1d5db' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}66`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Set Referral Code Start/End Date & Time */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mt-1.5 sm:mt-2">
          <div>
            <Label htmlFor="referralStart" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Referral Start Date</Label>
            <div className="space-y-0.5 sm:space-y-1">
              <Popover open={isReferralStartCalendarOpen} onOpenChange={setIsReferralStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal bg-transparent border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {formData.referralStart ? format(new Date(formData.referralStart), "dd-MMM-yy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={formData.referralStart ? new Date(formData.referralStart) : undefined} 
                    onSelect={(date) => {
                      if (date) {
                        const dateString = format(date, "yyyy-MM-dd");
                        if (formData.referralEnd && !validateDateTimeRange(dateString, formData.referralEnd)) {
                          return; // Don't update if start date is after end date
                        }
                        onFormChange('referralStart', dateString);
                        
                        // Calculate and update duration if both dates are available
                        if (dateString && formData.referralEnd) {
                          const duration = calculateReferralDuration(dateString, formData.referralEnd);
                          onFormChange('referralDuration', duration.toString());
                        }
                        setIsReferralStartCalendarOpen(false);
                      }
                    }} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
              {formData.referralStart && formData.referralEnd && 
                !validateDateTimeRange(formData.referralStart, formData.referralEnd) && (
                <p className="text-red-500 text-[9px] sm:text-xs">Start date must be before end date</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="referralEnd" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Referral End Date</Label>
            <div className="space-y-0.5 sm:space-y-1">
              <Popover open={isReferralEndCalendarOpen} onOpenChange={setIsReferralEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal bg-transparent border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {formData.referralEnd ? format(new Date(formData.referralEnd), "dd-MMM-yy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={formData.referralEnd ? new Date(formData.referralEnd) : undefined} 
                    onSelect={(date) => {
                      if (date) {
                        const dateString = format(date, "yyyy-MM-dd");
                        if (formData.referralStart && !validateDateTimeRange(formData.referralStart, dateString)) {
                          return; // Don't update if end date is before start date
                        }
                        onFormChange('referralEnd', dateString);
                        
                        // Calculate and update duration if both dates are available
                        if (formData.referralStart && dateString) {
                          const duration = calculateReferralDuration(formData.referralStart, dateString);
                          onFormChange('referralDuration', duration.toString());
                        }
                        setIsReferralEndCalendarOpen(false);
                      }
                    }} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
              {formData.referralStart && formData.referralEnd && 
                !validateDateTimeRange(formData.referralStart, formData.referralEnd) && (
                <p className="text-red-500 text-[9px] sm:text-xs">End date must be after start date</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="referralDuration" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Referral Duration (Days)</Label>
            <Input
              id="referralDuration"
              type="number"
              value={formData.referralDuration || ''}
              readOnly
              className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-50 cursor-not-allowed focus:outline-none"
              title="This field is automatically calculated based on start and end dates"
            />
          </div>
        </div>
      </div>
      
      <Separator />

      <div className="space-y-2 sm:space-y-3">
        <h4 className="font-medium text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2">Dynamic Pricing <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h4>

        <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs">
          <Switch id="enableDynamicPricing" disabled/>
          <Label htmlFor="enableDynamicPricing" className="text-[10px] sm:text-xs">Enable Dynamic Pricing</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="demandMultiplier" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Demand Multiplier</Label>
            <Input disabled id="demandMultiplier" placeholder="1.2" type="number" step="0.1" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="performanceBonus" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Performance Bonus</Label>
            <Input disabled id="performanceBonus" placeholder="0.1" type="number" step="0.1" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="enrollmentThreshold" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Enrollment Threshold</Label>
            <Input disabled id="enrollmentThreshold" placeholder="18" type="number" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2 sm:space-y-3">
        <h4 className="font-medium text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2">EMI Plans <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h4>

        <div className="space-y-2 sm:space-y-3">
          <div className="border rounded-lg p-2 sm:p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3">
              <div>
                <Label htmlFor="emi3Name" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Plan Name</Label>
                <Input disabled id="emi3Name" placeholder="3-Month Plan" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
              </div>
              <div>
                <Label htmlFor="emi3Installments" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Installments</Label>
                <Input disabled id="emi3Installments" placeholder="3" type="number" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
              </div>
              <div>
                <Label htmlFor="emi3Interest" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Interest Rate (%)</Label>
                <Input disabled id="emi3Interest" placeholder="0" type="number" step="0.1" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
              </div>
              <div>
                <Label htmlFor="emi3Processing" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Processing Fee</Label>
                <Input disabled id="emi3Processing" placeholder="99" type="number" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm" />
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs" disabled>
          <Plus className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Add EMI Plan <Image src="/Coming soon.svg" alt="Coming Soon" width={12} height={12} className="inline-block ml-1" />
        </Button>
      </div>
    </div>
  )
}
