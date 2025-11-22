"use client";

import { useForm } from "react-hook-form";
import { PaymentCategoryAndTypeSelector } from "@/components/dashboard/payments/payment-category-type-selector";
import { Button } from "@/components/dashboard/ui/button";
import { PaymentCategory, PaymentType } from "@/types/dashboard/payment-categories";

interface PaymentFormData {
  paymentCategory: PaymentCategory;
  paymentType: PaymentType;
  amount: number;
  // ... other payment fields
}

export function PaymentDialogExample() {
  const { control, handleSubmit, watch, setValue } = useForm<PaymentFormData>({
    defaultValues: {
      paymentCategory: undefined,
      paymentType: undefined,
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    console.log("Payment data:", data);
    // Handle payment submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <PaymentCategoryAndTypeSelector
        control={control}
        watch={watch}
        setValue={setValue}
        categoryName="paymentCategory"
        typeName="paymentType"
        required={true}
      />

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">Submit Payment</Button>
      </div>
    </form>
  );
}
