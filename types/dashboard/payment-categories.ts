// Payment Category Enums
export enum PaymentCategory {
  ONE_TIME_PAYMENT = 'ONE_TIME_PAYMENT',
  MONTHLY_SUBSCRIPTION = 'MONTHLY_SUBSCRIPTION',
  MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS = 'MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS',
  ONE_TIME_WITH_INSTALLMENTS_EMI = 'ONE_TIME_WITH_INSTALLMENTS_EMI',
}

// Payment Type Enums
export enum PaymentType {
  // ONE_TIME_PAYMENT types
  FULL_PAYMENT = 'FULL_PAYMENT',
  
  // MONTHLY_SUBSCRIPTION types
  NORMAL_MONTHLY_BILLING = 'NORMAL_MONTHLY_BILLING',
  AUTO_RENEW = 'AUTO_RENEW',
  
  // MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS types
  PLAN_3_MONTHS = 'PLAN_3_MONTHS',
  PLAN_6_MONTHS = 'PLAN_6_MONTHS',
  PLAN_9_MONTHS = 'PLAN_9_MONTHS',
  PLAN_12_MONTHS = 'PLAN_12_MONTHS',
  PLAN_24_MONTHS = 'PLAN_24_MONTHS',
  
  // ONE_TIME_WITH_INSTALLMENTS_EMI types
  EMI_FIRST = 'EMI_FIRST',
  EMI_MIDDLE = 'EMI_MIDDLE',
  EMI_LAST = 'EMI_LAST',
}

// Dynamic mapping: Payment Category -> Allowed Payment Types
export const PaymentTypeMap: Record<PaymentCategory, PaymentType[]> = {
  [PaymentCategory.ONE_TIME_PAYMENT]: [
    PaymentType.FULL_PAYMENT,
  ],
  [PaymentCategory.MONTHLY_SUBSCRIPTION]: [
    PaymentType.NORMAL_MONTHLY_BILLING,
    PaymentType.AUTO_RENEW,
  ],
  [PaymentCategory.MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS]: [
    PaymentType.PLAN_3_MONTHS,
    PaymentType.PLAN_6_MONTHS,
    PaymentType.PLAN_9_MONTHS,
    PaymentType.PLAN_12_MONTHS,
    PaymentType.PLAN_24_MONTHS,
  ],
  [PaymentCategory.ONE_TIME_WITH_INSTALLMENTS_EMI]: [
    PaymentType.EMI_FIRST,
    PaymentType.EMI_MIDDLE,
    PaymentType.EMI_LAST,
  ],
};

// Display labels for UI
export const PaymentCategoryLabels: Record<PaymentCategory, string> = {
  [PaymentCategory.ONE_TIME_PAYMENT]: 'One-Time Payment',
  [PaymentCategory.MONTHLY_SUBSCRIPTION]: 'Monthly Subscription',
  [PaymentCategory.MONTHLY_SUBSCRIPTION_WITH_DISCOUNTS]: 'Monthly Subscription With Discounts',
  [PaymentCategory.ONE_TIME_WITH_INSTALLMENTS_EMI]: 'One-Time With Installments (EMI)',
};

export const PaymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.FULL_PAYMENT]: 'Full Payment',
  [PaymentType.NORMAL_MONTHLY_BILLING]: 'Normal Monthly Billing',
  [PaymentType.AUTO_RENEW]: 'Auto Renew',
  [PaymentType.PLAN_3_MONTHS]: '3 Months Plan',
  [PaymentType.PLAN_6_MONTHS]: '6 Months Plan',
  [PaymentType.PLAN_9_MONTHS]: '9 Months Plan',
  [PaymentType.PLAN_12_MONTHS]: '12 Months Plan',
  [PaymentType.PLAN_24_MONTHS]: '24 Months Plan',
  [PaymentType.EMI_FIRST]: 'First EMI',
  [PaymentType.EMI_MIDDLE]: 'Middle EMI',
  [PaymentType.EMI_LAST]: 'Last EMI',
};
