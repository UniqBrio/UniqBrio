"use client"

import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Textarea } from "@/components/dashboard/ui/textarea"
import { Checkbox } from "@/components/dashboard/ui/checkbox"
import { Separator } from "@/components/dashboard/ui/separator"

interface MarketingTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
}

export default function MarketingTab({ formData, onFormChange }: MarketingTabProps) {
  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 compact-form px-2 sm:px-0">
  <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs sm:text-sm text-blue-700 text-center italic">
          Coming Soon
        </p>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        <h4 className="font-medium text-xs sm:text-sm">Promotion Templates</h4>

        <div className="space-y-2 sm:space-y-3">
          <div>
            <Label htmlFor="promoTemplate" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Template Message</Label>
            <Textarea
              id="promoTemplate"
              placeholder="?? New Course Alert! {courseName} starting {startDate}. Early bird discount: {discount}%"
              rows={2}
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              value={formData.promotionTemplate?.message || ''}
              onChange={(e) => {
                const updated = { ...formData.promotionTemplate, message: e.target.value };
                onFormChange('promotionTemplate', updated);
              }}
            />
          </div>

          <div>
            <Label htmlFor="promoChannels" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Marketing Channels</Label>
            <div className="flex gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <div className="flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs">
                <Checkbox 
                  id="emailChannel" 
                  checked={formData.promotionTemplate?.channels?.email || false}
                  onCheckedChange={(checked) => {
                    const channels = { ...formData.promotionTemplate?.channels, email: checked };
                    const updated = { ...formData.promotionTemplate, channels };
                    onFormChange('promotionTemplate', updated);
                  }}
                />
                <Label htmlFor="emailChannel" className="text-[10px] sm:text-xs">Email</Label>
              </div>
              <div className="flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs">
                <Checkbox 
                  id="socialChannel" 
                  checked={formData.promotionTemplate?.channels?.social || false}
                  onCheckedChange={(checked) => {
                    const channels = { ...formData.promotionTemplate?.channels, social: checked };
                    const updated = { ...formData.promotionTemplate, channels };
                    onFormChange('promotionTemplate', updated);
                  }}
                />
                <Label htmlFor="socialChannel" className="text-[10px] sm:text-xs">Social Media</Label>
              </div>
              <div className="flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs">
                <Checkbox 
                  id="websiteChannel" 
                  checked={formData.promotionTemplate?.channels?.website || false}
                  onCheckedChange={(checked) => {
                    const channels = { ...formData.promotionTemplate?.channels, website: checked };
                    const updated = { ...formData.promotionTemplate, channels };
                    onFormChange('promotionTemplate', updated);
                  }}
                />
                <Label htmlFor="websiteChannel" className="text-[10px] sm:text-xs">Website</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2 sm:space-y-3">
        <h4 className="font-medium text-xs sm:text-sm">Seasonal Promotions</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="promoName" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Promotion Name</Label>
            <Input 
              id="promoName" 
              placeholder="Diwali Special"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              value={formData.seasonalPromotion?.name || ''}
              onChange={(e) => {
                const updated = { ...formData.seasonalPromotion, name: e.target.value };
                onFormChange('seasonalPromotion', updated);
              }}
            />
          </div>
          <div>
            <Label htmlFor="discountPercent" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Discount Percentage</Label>
            <Input 
              id="discountPercent" 
              placeholder="25" 
              type="number" 
              min="0" 
              max="100"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              value={formData.seasonalPromotion?.discount || ''}
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  const updated = { ...formData.seasonalPromotion, discount: '' };
                  onFormChange('seasonalPromotion', updated);
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  const updated = { ...formData.seasonalPromotion, discount: '' };
                  onFormChange('seasonalPromotion', updated);
                  return;
                }
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                  const updated = { ...formData.seasonalPromotion, discount: numValue.toString() };
                  onFormChange('seasonalPromotion', updated);
                }
              }}
            />
          </div>
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label htmlFor="promoStart" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Start Date</Label>
            <Input 
              id="promoStart" 
              type="date"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              value={formData.seasonalPromotion?.startDate || ''}
              onChange={(e) => {
                const updated = { ...formData.seasonalPromotion, startDate: e.target.value };
                onFormChange('seasonalPromotion', updated);
              }}
            />
          </div>
          <div>
            <Label htmlFor="promoEnd" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">End Date</Label>
            <Input 
              id="promoEnd" 
              type="date"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              value={formData.seasonalPromotion?.endDate || ''}
              onChange={(e) => {
                const updated = { ...formData.seasonalPromotion, endDate: e.target.value };
                onFormChange('seasonalPromotion', updated);
              }}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="promoConditions" className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Conditions</Label>
          <Textarea
            id="promoConditions"
            placeholder="New enrollments only, Valid for first 50 students"
            rows={1}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            value={formData.seasonalPromotion?.conditions || ''}
            onChange={(e) => {
              const updated = { ...formData.seasonalPromotion, conditions: e.target.value };
              onFormChange('seasonalPromotion', updated);
            }}
          />
        </div>
      </div>
    </div>
  )
}
