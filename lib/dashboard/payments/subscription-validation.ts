import { z } from 'zod';

/**
 * Validation schemas for monthly subscription payments
 * Comprehensive form validation with business logic validation
 */

// Base subscription form validation
export const subscriptionFormSchema = z.object({
  // Student and course information
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course selection is required'),
  cohortId: z.string().min(1, 'Cohort selection is required'),
  enrollmentId: z.string().optional(),
  
  // Subscription type
  subscriptionType: z.enum(['monthly-subscription', 'monthly-subscription-discounted'], {
    errorMap: () => ({ message: 'Please select a valid subscription type' })
  }),
  
  // Financial details
  courseFee: z.number().min(0, 'Course fee cannot be negative'),
  registrationFee: z.number().min(0, 'Registration fee cannot be negative'),
  originalMonthlyAmount: z.number().min(0.01, 'Monthly amount must be greater than zero'),
  discountedMonthlyAmount: z.number().min(0).optional(),
  
  // Discount configuration (conditional validation)
  discountType: z.enum(['percentage', 'amount']).optional(),
  discountValue: z.number().min(0).optional(),
  commitmentPeriod: z.union([z.literal(3), z.literal(6), z.literal(9), z.literal(12), z.literal(24)]).optional(),
  
  // Payment details
  paymentMethod: z.enum(['cash', 'bank-transfer', 'card', 'cheque'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),
  paymentDate: z.date({
    errorMap: () => ({ message: 'Please select a valid payment date' })
  }),
  
  // Optional fields
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  transactionId: z.string().optional(),
  receivedBy: z.string().min(1, 'Received by field is required'),
}).superRefine((data, ctx) => {
  // Conditional validation for discounted subscriptions
  if (data.subscriptionType === 'monthly-subscription-discounted') {
    // Discount type is required
    if (!data.discountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountType'],
        message: 'Discount type is required for discounted subscriptions'
      });
    }
    
    // Discount value is required
    if (!data.discountValue || data.discountValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Discount value must be greater than zero for discounted subscriptions'
      });
    }
    
    // Commitment period is required
    if (!data.commitmentPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['commitmentPeriod'],
        message: 'Commitment period is required for discounted subscriptions'
      });
    }
    
    // Validate discount value ranges
    if (data.discountType === 'percentage' && data.discountValue) {
      if (data.discountValue >= 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountValue'],
          message: 'Percentage discount must be less than 100%'
        });
      }
    }
    
    if (data.discountType === 'amount' && data.discountValue) {
      if (data.discountValue >= data.originalMonthlyAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountValue'],
          message: 'Discount amount cannot be greater than or equal to monthly subscription fee'
        });
      }
    }
  }
  
  // Validate payment date is not in the future (with some tolerance)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (data.paymentDate > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['paymentDate'],
      message: 'Payment date cannot be in the future'
    });
  }
  
  // Validate payment date is not too far in the past (e.g., more than 1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (data.paymentDate < oneYearAgo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['paymentDate'],
      message: 'Payment date cannot be more than one year in the past'
    });
  }
});

// Schema for recurring payment validation
export const recurringPaymentSchema = z.object({
  monthlySubscriptionId: z.string().min(1, 'Monthly subscription ID is required'),
  paymentAmount: z.number().min(0.01, 'Payment amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'bank-transfer', 'card', 'cheque'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),
  paymentDate: z.date({
    errorMap: () => ({ message: 'Please select a valid payment date' })
  }),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  transactionId: z.string().optional(),
  receivedBy: z.string().min(1, 'Received by field is required'),
}).superRefine((data, ctx) => {
  // Validate payment date
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (data.paymentDate > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['paymentDate'],
      message: 'Payment date cannot be in the future'
    });
  }
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  if (data.paymentDate < threeMonthsAgo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['paymentDate'],
      message: 'Payment date cannot be more than three months in the past'
    });
  }
});

// Schema for subscription status update
export const subscriptionStatusUpdateSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  reason: z.string().min(1, 'Reason for status change is required').max(500, 'Reason cannot exceed 500 characters'),
  updatedBy: z.string().min(1, 'Updated by field is required'),
});

// Schema for subscription modification
export const subscriptionModificationSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  originalMonthlyAmount: z.number().min(0.01, 'Monthly amount must be greater than zero').optional(),
  discountType: z.enum(['percentage', 'amount']).optional(),
  discountValue: z.number().min(0).optional(),
  commitmentPeriod: z.union([z.literal(3), z.literal(6), z.literal(9), z.literal(12), z.literal(24)]).optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  modifiedBy: z.string().min(1, 'Modified by field is required'),
}).superRefine((data, ctx) => {
  // If discount is being modified, validate the values
  if (data.discountType && data.discountValue !== undefined) {
    if (data.discountType === 'percentage' && data.discountValue >= 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Percentage discount must be less than 100%'
      });
    }
    
    if (data.discountType === 'amount' && data.originalMonthlyAmount && data.discountValue >= data.originalMonthlyAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Discount amount cannot be greater than or equal to monthly subscription fee'
      });
    }
  }
});

// Type exports for TypeScript
export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;
export type RecurringPaymentData = z.infer<typeof recurringPaymentSchema>;
export type SubscriptionStatusUpdateData = z.infer<typeof subscriptionStatusUpdateSchema>;
export type SubscriptionModificationData = z.infer<typeof subscriptionModificationSchema>;

// Validation helper functions
export const validateSubscriptionForm = (data: unknown) => {
  return subscriptionFormSchema.safeParse(data);
};

export const validateRecurringPayment = (data: unknown) => {
  return recurringPaymentSchema.safeParse(data);
};

export const validateSubscriptionStatusUpdate = (data: unknown) => {
  return subscriptionStatusUpdateSchema.safeParse(data);
};

export const validateSubscriptionModification = (data: unknown) => {
  return subscriptionModificationSchema.safeParse(data);
};

// Custom validation functions for business logic
export const validateCommitmentPeriod = (
  currentMonth: number, 
  commitmentPeriod: number | undefined, 
  subscriptionType: string
): { isValid: boolean; message?: string } => {
  if (subscriptionType !== 'monthly-subscription-discounted') {
    return { isValid: true };
  }
  
  if (!commitmentPeriod) {
    return { 
      isValid: false, 
      message: 'Commitment period is required for discounted subscriptions' 
    };
  }
  
  if (currentMonth > commitmentPeriod) {
    return { 
      isValid: false, 
      message: 'Cannot modify commitment period after it has ended' 
    };
  }
  
  return { isValid: true };
};

export const validateDiscountEligibility = (
  currentMonth: number,
  commitmentPeriod: number | undefined,
  subscriptionType: string
): { isEligible: boolean; message?: string } => {
  if (subscriptionType !== 'monthly-subscription-discounted') {
    return { isEligible: false, message: 'Discount only available for discounted subscriptions' };
  }
  
  if (!commitmentPeriod) {
    return { isEligible: false, message: 'Commitment period not set' };
  }
  
  if (currentMonth > commitmentPeriod) {
    return { 
      isEligible: false, 
      message: `Discount period ended at month ${commitmentPeriod}. Now paying regular rate.` 
    };
  }
  
  return { 
    isEligible: true, 
    message: `Discount applies for ${commitmentPeriod - currentMonth + 1} more month(s)` 
  };
};

export const validatePaymentAmount = (
  expectedAmount: number,
  paidAmount: number,
  tolerance: number = 0.01
): { isValid: boolean; message?: string } => {
  const difference = Math.abs(expectedAmount - paidAmount);
  
  if (difference > tolerance) {
    return {
      isValid: false,
      message: `Payment amount (${paidAmount.toFixed(2)}) does not match expected amount (${expectedAmount.toFixed(2)})`
    };
  }
  
  return { isValid: true };
};