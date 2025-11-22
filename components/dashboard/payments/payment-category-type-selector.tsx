"use client";

import { useEffect } from "react";
import { Control, Controller, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/ui/select";
import { Label } from "@/components/dashboard/ui/label";
import {
  PaymentCategory,
  PaymentType,
  PaymentTypeMap,
  PaymentCategoryLabels,
  PaymentTypeLabels,
} from "@/types/dashboard/payment-categories";

interface PaymentCategoryAndTypeSelectorProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  categoryName?: string;
  typeName?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PaymentCategoryAndTypeSelector({
  control,
  watch,
  setValue,
  categoryName = "paymentCategory",
  typeName = "paymentType",
  disabled = false,
  required = true,
}: PaymentCategoryAndTypeSelectorProps) {
  const selectedCategory = watch(categoryName) as PaymentCategory;

  // Reset payment type when category changes
  useEffect(() => {
    if (selectedCategory) {
      const allowedTypes = PaymentTypeMap[selectedCategory];
      const currentType = watch(typeName);
      
      // If current type is not in allowed types, reset it
      if (currentType && !allowedTypes.includes(currentType)) {
        setValue(typeName, undefined);
      }
    }
  }, [selectedCategory, setValue, typeName, watch]);

  // Get allowed payment types based on selected category
  const allowedPaymentTypes = selectedCategory 
    ? PaymentTypeMap[selectedCategory] 
    : [];

  return (
    <div className="space-y-4">
      {/* Payment Category Selector */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          Payment Category {required && <span className="text-red-500">*</span>}
        </Label>
        <Controller
          name={categoryName}
          control={control}
          rules={{ required: required ? "Payment category is required" : false }}
          render={({ field, fieldState }) => (
            <>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger className={fieldState.error ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select payment category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {PaymentCategoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <p className="text-sm text-red-500 mt-1">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Payment Type Selector - Only show when category is selected */}
      {selectedCategory && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Payment Type {required && <span className="text-red-500">*</span>}
          </Label>
          <Controller
            name={typeName}
            control={control}
            rules={{ required: required ? "Payment type is required" : false }}
            render={({ field, fieldState }) => (
              <>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger className={fieldState.error ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedPaymentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PaymentTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
          <p className="text-xs text-gray-500">
            {selectedCategory === PaymentCategory.ONE_TIME_PAYMENT && 
              "One-time payment for the entire amount"}
            {selectedCategory === PaymentCategory.MONTHLY_SUBSCRIPTION && 
              "Recurring monthly subscription plans"}
            {selectedCategory === PaymentCategory.MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS && 
              "Prepaid multi-month plans with discounts"}
            {selectedCategory === PaymentCategory.ONE_TIME_WITH_INSTALLMENTS_EMI && 
              "Installment-based payment schedule"}
          </p>
        </div>
      )}
    </div>
  );
}
