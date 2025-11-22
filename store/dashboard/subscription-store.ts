import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  MonthlySubscription, 
  MonthlyPayment, 
  SubscriptionInvoice, 
  SubscriptionFormData, 
  SubscriptionState 
} from '@/types/dashboard/subscription';

const initialFormData: SubscriptionFormData = {
  courseId: '',
  cohortId: '',
  subscriptionType: 'monthly-subscription',
  courseFee: 0,
  registrationFee: 0,
  originalMonthlyAmount: 0,
  paymentMethod: '',
  paymentDate: new Date(),
};

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    (set: any, get: any) => ({
      // State
      currentSubscription: null,
      payments: [],
      invoices: [],
      formData: initialFormData,
      isLoading: false,
      error: null,
      showPaymentDialog: false,
      editMode: 'first-payment',

      // Actions
      setCurrentSubscription: (subscription: MonthlySubscription | null) => {
        set({ 
          currentSubscription: subscription,
          editMode: subscription?.isFirstPaymentCompleted ? 'recurring-payment' : 'first-payment'
        });
      },

      loadSubscription: async (studentId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/dashboard/payments/monthly-subscriptions?studentId=${studentId}`);
          
          if (response.status === 404) {
            // No subscription found - this is OK, user can create new one
            set({
              currentSubscription: null,
              payments: [],
              invoices: [],
              isLoading: false,
              editMode: 'first-payment'
            });
            return null;
          }
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load subscription');
          }
          
          const result = await response.json();
          
          set({
            currentSubscription: result.subscription,
            payments: result.subscription.paymentRecords || [],
            invoices: [], // Will be populated separately if needed
            isLoading: false,
            editMode: result.subscription.isFirstPaymentCompleted ? 'recurring-payment' : 'first-payment'
          });
          
          return result.subscription;
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load subscription',
            isLoading: false 
          });
          return null;
        }
      },

      updateFormData: (data: Partial<SubscriptionFormData>) => {
        set((state: SubscriptionState) => ({
          formData: { ...state.formData, ...data }
        }));
      },

      processFirstPayment: async (data: SubscriptionFormData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Call API to create subscription and process first payment
          const response = await fetch('/api/dashboard/payments/monthly-subscriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...data,
              studentId: data.studentId || 'temp-student-id', // Should be provided by the calling component
              receivedBy: 'current-user' // Should be provided by auth context
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create subscription');
          }
          
          const result = await response.json();
          
          // Update state with created subscription
          set({
            currentSubscription: result.subscription,
            payments: [result.paymentRecord],
            invoices: [], // Will be populated when invoice is generated
            isLoading: false,
            editMode: 'recurring-payment',
            showPaymentDialog: false
          });        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process first payment',
            isLoading: false 
          });
        }
      },

      processRecurringPayment: async (monthlyAmount: number, paymentDate: Date = new Date()) => {
        set({ isLoading: true, error: null });
        
        try {
          const { currentSubscription } = get();
          if (!currentSubscription) {
            throw new Error('No active subscription found');
          }

          // Call API to process recurring payment
          const response = await fetch(`/api/dashboard/payments/monthly-subscriptions/${currentSubscription._id}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentAmount: monthlyAmount,
              paymentMethod: 'cash', // Should be provided by form
              paymentDate,
              receivedBy: 'current-user', // Should be provided by auth context
              notes: '' // Optional notes
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process payment');
          }
          
          const result = await response.json();
          
          // Update state with updated subscription and new payment record
          set((state: SubscriptionState) => ({
            currentSubscription: result.subscription,
            payments: [...state.payments, result.paymentRecord],
            invoices: [...state.invoices], // Invoice will be generated separately
            isLoading: false,
            showPaymentDialog: false
          }));

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process recurring payment',
            isLoading: false 
          });
        }
      },

      calculateDiscountedAmount: (originalAmount: number, discountType: 'percentage' | 'amount', discountValue: number) => {
        if (discountType === 'percentage') {
          return originalAmount * (1 - discountValue / 100);
        } else {
          return Math.max(0, originalAmount - discountValue);
        }
      },

      calculateTotalForMonth: (monthNumber: number) => {
        const { currentSubscription } = get();
        if (!currentSubscription) return 0;

        if (monthNumber === 1) {
          // First month: Course fee + Registration fee + Monthly amount - Discount
          const monthlyAmount = currentSubscription.subscriptionType === 'monthly-subscription-discounted' 
            && currentSubscription.discountedMonthlyAmount
            ? currentSubscription.discountedMonthlyAmount
            : currentSubscription.originalMonthlyAmount;
          
          return currentSubscription.courseFee + currentSubscription.registrationFee + monthlyAmount;
        } else {
          // Recurring months: Check if still in discount period
          const isDiscounted = currentSubscription.subscriptionType === 'monthly-subscription-discounted'
            && currentSubscription.commitmentPeriod
            && monthNumber <= currentSubscription.commitmentPeriod;

          return isDiscounted && currentSubscription.discountedMonthlyAmount
            ? currentSubscription.discountedMonthlyAmount
            : currentSubscription.originalMonthlyAmount;
        }
      },

      generateMonthlyInvoice: async (payment: MonthlyPayment) => {
        const { currentSubscription } = get();
        if (!currentSubscription) {
          throw new Error('No active subscription found');
        }

        const invoice: SubscriptionInvoice = {
          id: `inv-${Date.now()}`,
          subscriptionId: currentSubscription.id,
          paymentId: payment.id,
          monthNumber: payment.monthNumber,
          invoiceNumber: payment.invoiceNumber,
          invoiceDate: payment.paymentDate,
          dueDate: payment.dueDate,
          courseFee: payment.isFirstPayment ? currentSubscription.courseFee : undefined,
          registrationFee: payment.isFirstPayment ? currentSubscription.registrationFee : undefined,
          monthlyAmount: payment.isDiscounted && currentSubscription.discountedMonthlyAmount
            ? currentSubscription.discountedMonthlyAmount
            : currentSubscription.originalMonthlyAmount,
          discountAmount: payment.isDiscounted && currentSubscription.discountedMonthlyAmount
            ? currentSubscription.originalMonthlyAmount - currentSubscription.discountedMonthlyAmount
            : undefined,
          totalAmount: payment.amountPaid,
          isFirstMonth: payment.isFirstPayment,
          isDiscounted: payment.isDiscounted,
          status: 'Paid',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return invoice;
      },

      getPaymentReason: (monthNumber: number, isDiscounted: boolean, commitmentPeriod?: number) => {
        if (monthNumber === 1) {
          return isDiscounted 
            ? `First Month Payment with Discount (${commitmentPeriod} month commitment)`
            : 'First Month Payment';
        } else {
          return isDiscounted && commitmentPeriod && monthNumber <= commitmentPeriod
            ? `Discounted Monthly Payment (Month ${monthNumber} of ${commitmentPeriod})`
            : 'Regular Monthly Payment';
        }
      },

      calculateNextDueDate: (paymentDate: Date = new Date()) => {
        const nextDate = new Date(paymentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        return nextDate;
      },

      calculateReminderDate: (dueDate: Date) => {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - 3);
        return reminderDate;
      },

      resetForm: () => {
        set({
          formData: initialFormData,
          error: null,
          showPaymentDialog: false,
        });
      },
    }),
    {
      name: 'subscription-store',
    }
  )
);