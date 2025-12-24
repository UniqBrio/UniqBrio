"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/currency-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Label } from "@/components/dashboard/ui/label";
import { Textarea } from "@/components/dashboard/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/dashboard/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/dashboard/ui/popover";
import { Checkbox } from "@/components/dashboard/ui/checkbox";
import { Switch } from "@/components/dashboard/ui/switch";
import { Badge } from "@/components/dashboard/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/dashboard/ui/accordion";
import { 
  X, 
  Clock, 
  Pencil, 
  Check, 
  ChevronsUpDown, 
  AlertCircle,
  CreditCard,
  Lightbulb,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Timer,
  BarChart3,
  Gift,
  FileText,
  XCircle,
  DollarSign,
  Snowflake,
  Wallet,
  PartyPopper,
  CheckCircle2,
  Bell,
  Settings,
  XOctagon,
  Info,
  ClipboardList,
  Bot,
  ShieldAlert
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/ui/alert";
import { type Payment } from "@/types/dashboard/payment";
import { 
  calculateMonthsBetween, 
  formatDateForInput, 
  formatDateForDisplay,
  getTomorrowDate,
  autoUpdateReminderDate
} from "@/lib/dashboard/payments/payment-date-helpers";
import {
  generateOneTimeInstallments,
  markInstallmentAsPaid,
  getNextUnpaidInstallment,
  calculateRemainingBalance,
  formatInstallmentSummary,
  validateInstallmentConfig,
  areAllInstallmentsPaid,
  type OneTimeInstallmentsConfig,
} from "@/lib/dashboard/payments/one-time-installments-helper";
import { useToast } from "@/hooks/dashboard/use-toast";
import { fetchCoursePaymentDetails } from "@/lib/dashboard/payments/course-payment-client";
import {
  MonthlySubscriptionRecord,
  MonthlySubscriptionState,
  getCurrentMonth,
  calculateCurrentMonthFee,
  calculateTotalPaymentAmount,
  initializeMonthlySubscription,
  getCurrentMonthRecord,
  markMonthAsPaid,
  generateNextMonthRecord,
  formatMonthlySubscriptionSummary,
  validateMonthlySubscription,
  isFirstPayment as isFirstMonthlyPayment
} from "@/lib/dashboard/payments/monthly-subscription-helper";

interface ManualPaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (paymentData: any) => void;
  onRestrictedAttempt?: () => void;
}

interface Person {
  _id: string;
  name: string;
  displayName: string;
  instructorId?: string;
  externalId?: string;
}

export function ManualPaymentDialog({
  payment,
  open,
  onOpenChange,
  onSave,
  onRestrictedAttempt,
}: ManualPaymentDialogProps) {
  const { currency } = useCurrency();
  const { toast } = useToast();
  
  // Payment Settings from localStorage
  const [paymentSettings, setPaymentSettings] = useState({
    partialPaymentEnabled: true,
    oneTimeInstallmentsEnabled: true,
    installmentsCount: 3,
    discountedSubscriptionEnabled: true,
    autoRemindersEnabled: true,
    autoInvoiceGeneration: true,
  });
  
  // Basic payment fields
  const [paymentOption, setPaymentOption] = useState("Monthly");
  const [planType, setPlanType] = useState<'ONE_TIME' | 'MONTHLY_SUBSCRIPTION' | 'EMI' | 'CUSTOM' | 'ONE_TIME_WITH_INSTALLMENTS'>('MONTHLY_SUBSCRIPTION');
  const [paymentSubType, setPaymentSubType] = useState<string>(''); // For subcategories
  const [paymentAmount, setPaymentAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("Cash");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  
  // Enhanced fields
  const [payerType, setPayerType] = useState<'student' | 'parent' | 'guardian' | 'other'>('student');
  const [customPayerType, setCustomPayerType] = useState("");
  const [payerName, setPayerName] = useState("");
  const [discount, setDiscount] = useState("");
  
  // EMI fields
  const [emiIndex, setEmiIndex] = useState<number>(0);
  const [showEmiSelector, setShowEmiSelector] = useState(false);
  const [receivedBySearch, setReceivedBySearch] = useState("");
  const [customPayers, setCustomPayers] = useState<string[]>([]);
  
  // Load custom payers from database on mount
  useEffect(() => {
    const loadCustomPayers = async () => {
      try {
        const res = await fetch('/api/dashboard/payments/custom-payers', {
          credentials: 'include'
        });
        if (res.ok) {
          const payers = await res.json();
          if (Array.isArray(payers)) {
            setCustomPayers(payers);
          }
        }
      } catch (e) {
        console.error('Failed to load custom payers from database', e);
      }
    };
    loadCustomPayers();
  }, []);
  
  // One Time with Installments fields
  const [installmentsConfig, setInstallmentsConfig] = useState<OneTimeInstallmentsConfig | null>(null);
  const [currentInstallmentNumber, setCurrentInstallmentNumber] = useState<number>(1);
  
  // Ongoing Training - Monthly Subscription fields
  const [baseMonthlyAmount, setBaseMonthlyAmount] = useState<number>(0);
  const [isDiscountedPlan, setIsDiscountedPlan] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [lockInMonths, setLockInMonths] = useState<number>(0);
  const [discountedMonthlyAmount, setDiscountedMonthlyAmount] = useState<number>(0);
  const [totalPayable, setTotalPayable] = useState<number>(0);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [allowEditMonthlyFee, setAllowEditMonthlyFee] = useState<boolean>(false);
  
  // Additional Monthly Subscription fields
  const [billingDueDate, setBillingDueDate] = useState<number>(1); // Day of month (1-31)
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [lateFeeRule, setLateFeeRule] = useState<string>('');
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(0);
  const [autoRenewOption, setAutoRenewOption] = useState<'same_discount' | 'normal_rate' | 'ask_again'>('ask_again');
  const [refundPolicy, setRefundPolicy] = useState<'no_refund' | 'prorated' | 'freeze_option'>('no_refund');
  
  // Existing fields
  const [selectedTypes, setSelectedTypes] = useState({
    coursePayment: true,
    studentRegistrationFee: false,
    courseRegistrationFee: false,
  });
  const [instructors, setInstructors] = useState<Person[]>([]);
  const [nonInstructors, setNonInstructors] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [courseCategory, setCourseCategory] = useState<string | null>(null);
  const [isPaymentOptionDisabled, setIsPaymentOptionDisabled] = useState(false);
  const [courseInfo, setCourseInfo] = useState<{
    courseType: string | null;
    courseCategory: string | null;
    paymentCategory: string | null;
  }>({ courseType: null, courseCategory: null, paymentCategory: null });
  
  // Guardian information
  const [guardianInfo, setGuardianInfo] = useState<{
    fullName: string | null;
    relationship: string | null;
    contact: string | null;
  }>({ fullName: null, relationship: null, contact: null });
  
  const [cohortDates, setCohortDates] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);
  const [numberOfMonths, setNumberOfMonths] = useState<number>(0);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [nextReminderDate, setNextReminderDate] = useState<string>("");
  const [isReminderDisabled, setIsReminderDisabled] = useState<boolean>(false);
  const [paymentAmountError, setPaymentAmountError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  // Store fetched course fees when payment record has zero fees
  const [fetchedFees, setFetchedFees] = useState<{
    courseFee: number;
    courseRegistrationFee: number;
    studentRegistrationFee: number;
  } | null>(null);
  
  // New reminder fields for One-Time partial payments
  const [preReminderEnabled, setPreReminderEnabled] = useState<boolean>(false);
  const [stopReminders, setStopReminders] = useState<boolean>(false);
  const [reminderFrequency, setReminderFrequency] = useState<'DAILY' | 'WEEKLY' | 'NONE'>('DAILY');

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Monthly Subscription tracking state
  const [monthlySubscriptionState, setMonthlySubscriptionState] = useState<MonthlySubscriptionState>({
    isFirstPayment: true,
    monthlyRecords: [],
    originalMonthlyFee: 0,
    discountedMonthlyFee: 0,
    currentMonth: new Date().toISOString().slice(0, 7) // "YYYY-MM" format
  });
  const [commitmentPeriod, setCommitmentPeriod] = useState<number>(3); // Default 3 months
  const [showCommitmentSelector, setShowCommitmentSelector] = useState<boolean>(false);

  // Initialize Monthly Subscription state based on payment option
  useEffect(() => {
    if (!payment) return;

    const isMonthlySubscription = paymentOption === 'Monthly' || paymentOption.includes('Monthly');
    const isDiscountedPlan = paymentOption.includes('Discounts');

    if (isMonthlySubscription) {
      // For Monthly Subscription, course fee IS the monthly fee (not divided)
      const originalMonthlyFee = fetchedFees?.courseFee || payment.courseFee || 0;
      const discountedFee = isDiscountedPlan ? discountedMonthlyAmount : 0;

      // Initialize or update monthly subscription state
      const newState = initializeMonthlySubscription(
        originalMonthlyFee,
        discountedFee,
        isDiscountedPlan ? commitmentPeriod : undefined
      );

      // Check if this is truly the first payment by looking at payment history
      const hasExistingPayments = payment.receivedAmount > 0 || paymentHistory.length > 0;
      newState.isFirstPayment = !hasExistingPayments;

      setMonthlySubscriptionState(newState);
      setShowCommitmentSelector(isDiscountedPlan);

      // Calculate and set payment amount for current month
      const courseRegFee = fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 1000;
      const studentRegFee = fetchedFees?.studentRegistrationFee || 500;
      
      // For first payment: monthly fee + registration fees
      // For subsequent payments: only monthly fee
      const monthlyFee = isDiscountedPlan && discountedFee > 0 ? discountedFee : originalMonthlyFee;
      const isFirst = !payment.receivedAmount || payment.receivedAmount === 0;
      const totalAmount = monthlyFee + (isFirst ? courseRegFee + studentRegFee : 0);

      setPaymentAmount(totalAmount.toString());
      
      console.log('Monthly Subscription Payment Calculation:', {
        originalMonthlyFee,
        discountedFee,
        monthlyFee,
        isFirst,
        courseRegFee: isFirst ? courseRegFee : 0,
        studentRegFee: isFirst ? studentRegFee : 0,
        totalAmount
      });
    }
  }, [paymentOption, commitmentPeriod, baseMonthlyAmount, discountedMonthlyAmount, payment, fetchedFees, paymentHistory]);

  // Fetch instructors and non-instructors
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const [instructorsRes, nonInstructorsRes] = await Promise.all([
          fetch('/api/dashboard/payments/instructors', { credentials: 'include' }),
          fetch('/api/dashboard/payments/non-instructors', { credentials: 'include' })
        ]);

        if (instructorsRes.ok && nonInstructorsRes.ok) {
          const [instructorsData, nonInstructorsData] = await Promise.all([
            instructorsRes.json(),
            nonInstructorsRes.json()
          ]);
          setInstructors(instructorsData);
          setNonInstructors(nonInstructorsData);
        }
      } catch (error) {
        console.error('Error fetching people:', error);
      }
    };

    if (open) {
      fetchPeople();
    }
  }, [open]);

  // Reset form when dialog closes - immediate cleanup
  useEffect(() => {
    if (!open) {
      // Reset form immediately when dialog closes
      resetForm();
    }
  }, [open]);

  // Additional cleanup when component unmounts or payment changes
  useEffect(() => {
    return () => {
      // Cleanup when payment changes or component unmounts
      if (!open) {
        resetForm();
      }
    };
  }, [payment?.id, open]);

  // Fetch payment history for existing payments
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!payment?.id || !open) return;
      
      // Only fetch history for payments that have been made
      if (!payment.receivedAmount || payment.receivedAmount === 0) {
        setPaymentHistory([]);
        return;
      }

      setLoadingHistory(true);
      try {
        // Try PaymentRecord first (new system)
        let response = await fetch(
          `/api/dashboard/payments/payment-records?action=history&paymentId=${payment.id}&sortBy=paidDate&sortOrder=asc`,
          {
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.records && data.records.length > 0) {
            setPaymentHistory(data.records);
            setLoadingHistory(false);
            return;
          }
        }

        // Fallback to PaymentTransaction (current system)
        response = await fetch(`/api/dashboard/payments/manual?paymentId=${payment.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.transactions && data.transactions.length > 0) {
            // Convert PaymentTransaction format to PaymentRecord format
            const convertedHistory = data.transactions.map((txn: any) => ({
              _id: txn._id,
              paidAmount: txn.amount,
              paidDate: txn.paymentDate,
              paymentMode: txn.mode || txn.paymentMode,
              transactionId: txn._id,
              notes: txn.notes,
              payerType: txn.payerType,
              customPayerType: txn.customPayerType,
              payerName: txn.payerName,
            }));
            setPaymentHistory(convertedHistory);
          }
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchPaymentHistory();
  }, [payment?.id, payment?.receivedAmount, open]);

  // Fetch student details to get course ID and cohort ID
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!payment) return;
      
      try {
        console.log('Fetching student details for studentId:', payment.studentId);
        
        // Prepare parallel fetch calls based on what data we need
        const fetchPromises: Promise<any>[] = [
          fetch(`/api/dashboard/payments/student-details?studentId=${payment.studentId}`, { credentials: 'include' })
            .then(async r => {
              if (r.ok) return r.json();
              const errorText = await r.text();
              throw new Error(`Student details fetch failed (${r.status}): ${errorText || r.statusText}`);
            })
        ];
        
        // If payment already has course and cohort info, we can fetch those in parallel
        const courseId = payment.enrolledCourse || payment.enrolledCourseId;
        const cohortId = payment.cohortId;
        
        if (courseId) {
          fetchPromises.push(
            fetchCoursePaymentDetails(courseId).catch(err => {
              console.warn('Course details fetch failed:', err);
              return null; // Return null instead of failing the entire Promise.all
            })
          );
        }
        
        if (cohortId) {
          fetchPromises.push(
            fetch(`/api/dashboard/payments/cohort-dates?cohortId=${cohortId}`, { credentials: 'include' })
              .then(async r => {
                if (r.ok) return r.json();
                console.warn(`Cohort dates fetch failed (${r.status}): ${r.statusText}`);
                return null; // Return null instead of failing
              })
              .catch(err => {
                console.warn('Cohort dates fetch error:', err);
                return null;
              })
          );
        }
        
        // Execute all fetches in parallel
        const results = await Promise.all(fetchPromises);
        const data = results[0];
        const courseData = results[1];
        const cohortData = results[2];
        
        console.log('All data received:', { student: data, course: courseData, cohort: cohortData });
        
        // Process course data if available - this takes priority
        if (courseData) {
          console.log('Course data from course payment helper:', courseData);
          setCourseCategory(courseData.courseCategory);
          setCourseInfo({
            courseType: courseData.courseType || data.courseType || payment.courseType,
            courseCategory: courseData.courseCategory, // Use course data as primary source
            paymentCategory: courseData.paymentCategory
          });
          
          // Store fetched fees if payment record has zero/missing fees
          if (!payment.courseFee || payment.courseFee === 0) {
            console.log('Storing course fees:', {
              courseFee: courseData.price,
              courseRegistrationFee: courseData.registrationFee
            });
            
            setFetchedFees({
              courseFee: Number(courseData.price || 0),
              courseRegistrationFee: Number(courseData.registrationFee || 1000),
              studentRegistrationFee: Number(500)
            });
          }
        } else {
          // Fallback to student data only if no course data available
          console.log('No course data available, using student data as fallback');
          setCourseInfo({
            courseType: data?.courseType || payment.courseType || null,
            courseCategory: data?.category || null, // Fallback to student category
            paymentCategory: null
          });
        }
        
        // Process guardian data if available
        if (data && (data.guardian || data.guardianName)) {
          console.log('Guardian data from student:', data.guardian);
          setGuardianInfo({
            fullName: data.guardian?.fullName || data.guardianName || null,
            relationship: data.guardian?.relationship || null,
            contact: data.guardian?.contact || null
          });
        }
        
        // Process cohort data if available
        if (cohortData && !cohortData.error) {
          console.log('Cohort data:', cohortData);
          
          // For Ongoing Training, endDate may be null/undefined
          setCohortDates({
            startDate: cohortData.startDate,
            endDate: cohortData.endDate || undefined
          });
          
          // Calculate monthly installment ONLY if both dates exist (not for Ongoing Training)
          if (cohortData.startDate && cohortData.endDate) {
            const months = calculateMonthsBetween(new Date(cohortData.startDate), new Date(cohortData.endDate));
            setNumberOfMonths(months);
            
            const courseFeeOnly = payment.courseFee || 0;
            const installment = courseFeeOnly > 0 ? Math.ceil(courseFeeOnly / months) : 0;
            setMonthlyInstallment(installment);
            
            console.log('Calculated monthly installment:', {
              installment,
              courseFee: courseFeeOnly,
              months
            });
          } else {
            console.log('Ongoing Training or missing end date - skipping monthly calculation');
          }
        } else if (payment.startDate && payment.endDate) {
          // Use dates from payment object if available
          setCohortDates({
            startDate: payment.startDate,
            endDate: payment.endDate
          });
          
          const months = calculateMonthsBetween(new Date(payment.startDate), new Date(payment.endDate));
          setNumberOfMonths(months);
          
          const courseFeeOnly = payment.courseFee || 0;
          const installment = courseFeeOnly > 0 ? Math.ceil(courseFeeOnly / months) : 0;
          setMonthlyInstallment(installment);
        }
        
      } catch (error) {
        console.error('Error fetching student details:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          studentId: payment?.studentId,
          paymentId: payment?.id
        });
        toast({
          title: "Error Loading Student Info",
          description: error instanceof Error ? error.message : "Could not load student details. Please check console for details.",
          variant: "destructive",
        });
      }
    };

    if (open && payment) {
      fetchStudentDetails();
    }
  }, [open, payment, toast]);

  // Note: Course data fetching is now handled in the main useEffect above to prevent race conditions

  // Generate One Time with Installments configuration when plan type changes
  useEffect(() => {
    const generateInstallments = async () => {
      if (planType !== 'ONE_TIME_WITH_INSTALLMENTS') {
        setInstallmentsConfig(null);
        return;
      }

      if (!cohortDates.startDate || !cohortDates.endDate || !payment) {
        console.warn('Cannot generate installments: missing cohort dates or payment');
        return;
      }

      try {
        const startDate = new Date(cohortDates.startDate);
        const endDate = new Date(cohortDates.endDate);
        
        // Use fetched fees or payment record fees
        const courseFee = fetchedFees?.courseFee || payment.courseFee || 0;
        const courseRegFee = fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 0;
        const studentRegFee = fetchedFees?.studentRegistrationFee || payment.studentRegistrationFee || 0;
        const totalAmount = courseFee + courseRegFee + studentRegFee;

        if (totalAmount === 0) {
          console.warn('Total amount is 0, cannot generate installments');
          return;
        }

        console.log('Generating One Time with Installments:', {
          startDate: startDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
          totalAmount,
          fees: { courseFee, courseRegFee, studentRegFee }
        });

        const config = generateOneTimeInstallments(startDate, endDate, totalAmount, 3);
        
        // Validate the configuration
        const validation = validateInstallmentConfig(config);
        if (!validation.valid) {
          console.error('Installment config validation failed:', validation.errors);
          toast({
            title: "Installment Generation Failed",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        // Mark installments as PAID based on received amount
        const receivedAmount = payment.receivedAmount || 0;
        let remainingAmount = receivedAmount;
        
        if (receivedAmount > 0) {
          console.log('Marking installments as paid based on received amount:', receivedAmount);
          config.installments.forEach((inst) => {
            if (remainingAmount >= inst.amount) {
              inst.status = 'PAID';
              inst.paidAmount = inst.amount;
              inst.paidDate = payment.lastPaymentDate ? new Date(payment.lastPaymentDate) : new Date();
              remainingAmount -= inst.amount;
              console.log(`Installment ${inst.installmentNumber} marked as PAID`);
            }
          });
        }

        setInstallmentsConfig(config);
        console.log('Installments generated successfully:', config);
        
        // Set the first unpaid installment as current
        const nextUnpaid = getNextUnpaidInstallment(config);
        if (nextUnpaid) {
          setCurrentInstallmentNumber(nextUnpaid.installmentNumber);
          setPaymentAmount(nextUnpaid.amount.toString());
        }

        toast({
          title: "Installments Generated",
          description: `3 installments created for ${currency} ${totalAmount.toLocaleString()}`,
        });
      } catch (error: any) {
        console.error('Error generating installments:', error);
        toast({
          title: "Error",
          description: error.message || 'Failed to generate installments',
          variant: "destructive",
        });
      }
    };

    if (open && payment && planType === 'ONE_TIME_WITH_INSTALLMENTS') {
      generateInstallments();
    }
  }, [open, payment, planType, cohortDates, fetchedFees, toast]);

  // Auto-update payment amount when installment selection changes
  useEffect(() => {
    if (planType === 'ONE_TIME_WITH_INSTALLMENTS' && installmentsConfig) {
      const selectedInstallment = installmentsConfig.installments[currentInstallmentNumber - 1];
      if (selectedInstallment) {
        console.log('Auto-updating payment amount to:', selectedInstallment.amount);
        setPaymentAmount(selectedInstallment.amount.toString());
      }
    }
  }, [currentInstallmentNumber, installmentsConfig, planType]);

  // Fallback: Fetch cohort dates from payment record if not already loaded via student details
  useEffect(() => {
    const fetchCohortDatesFromPayment = async () => {
      // Skip if we already have cohort dates from student details
      if (cohortDates.startDate) {
        console.log('Cohort dates already loaded from student details');
        return;
      }
      
      if (!payment?.cohortId) {
        console.warn('No cohort ID found in payment record');
        return;
      }
      
      try {
        console.log('Fetching cohort dates from payment record for cohortId:', payment.cohortId);
        const response = await fetch(`/api/dashboard/payments/cohort-dates?cohortId=${payment.cohortId}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to fetch cohort dates from payment record:', {
            status: response.status,
            error: data.error,
            cohortId: payment.cohortId
          });
          return;
        }
        
        console.log('Cohort dates from payment record received:', data);
        
        // For Ongoing Training, only startDate may be available, endDate can be null/undefined
        setCohortDates({
          startDate: data.startDate,
          endDate: data.endDate || undefined
        });
        
        // Calculate number of months ONLY if both dates are available (not for Ongoing Training)
        if (data.startDate && data.endDate) {
          const months = calculateMonthsBetween(new Date(data.startDate), new Date(data.endDate));
          setNumberOfMonths(months);
          
          // Calculate monthly installment (ONLY from course fee, NOT registration fees)
          const courseFeeOnly = payment.courseFee || 0;
          const installment = courseFeeOnly > 0 ? Math.ceil(courseFeeOnly / months) : 0;
          setMonthlyInstallment(installment);
          
          console.log('Calculated monthly installment from payment record:', {
            installment,
            courseFee: courseFeeOnly,
            months,
            calculation: `${courseFeeOnly} × ${months} months`
          });
        } else {
          console.log('Ongoing Training or missing end date - no monthly calculation needed');
        }
      } catch (error) {
        console.error('Error fetching cohort dates from payment record:', error);
      }
    };

    if (open && payment && !cohortDates.startDate) {
      // Only fetch if we don't have start date yet
      setTimeout(fetchCohortDatesFromPayment, 500);
    }
  }, [open, payment]);

  // Set default payment amount after monthlyInstallment is calculated
  useEffect(() => {
    if (payment && open && monthlyInstallment > 0) {
      if (paymentOption === 'Monthly') {
        // Check if this is the first payment (receivedAmount is 0)
        const isFirstPayment = !payment.receivedAmount || payment.receivedAmount === 0;
        
        if (isFirstPayment) {
          // First payment: Include monthly installment + registration fees
          let firstPaymentAmount = monthlyInstallment;
          
          // Add student registration fee if not yet paid
          if (selectedTypes.studentRegistrationFee && payment.studentRegistrationFee) {
            firstPaymentAmount += payment.studentRegistrationFee;
          }
          
          // Add course registration fee if not yet paid
          if (selectedTypes.courseRegistrationFee && payment.courseRegistrationFee) {
            firstPaymentAmount += payment.courseRegistrationFee;
          }
          
          setPaymentAmount(firstPaymentAmount.toString());
        } else {
          // Subsequent payments: Only monthly installment
          setPaymentAmount(monthlyInstallment.toString());
        }
      } else {
        // For one-time, suggest the outstanding amount
        setPaymentAmount((payment.outstandingAmount || 0).toString());
      }
    }
  }, [monthlyInstallment, payment, open, paymentOption, selectedTypes]);

  useEffect(() => {
    if (payment && open) {
      // Only initialize when dialog is actually open to prevent overriding reset
      // Initialize form with current date and time
      const now = new Date();
      setDate(now.toISOString().split("T")[0]);
      setTime(now.toTimeString().slice(0, 5));

      // Initialize reminder settings
      if (payment.nextReminderDate) {
        const updatedReminder = autoUpdateReminderDate(new Date(payment.nextReminderDate));
        setNextReminderDate(formatDateForInput(updatedReminder));
      } else {
        setNextReminderDate(formatDateForInput(getTomorrowDate()));
      }
      
      setReminderEnabled(payment.reminderEnabled || false);
      
      console.log('Payment dialog opening with data:', {
        studentId: payment.studentId,
        paymentOption: payment.paymentOption,
        planType: payment.planType,
        hasInstallmentsConfig: !!payment.installmentsConfig,
        installmentsConfigLength: payment.installmentsConfig?.installments?.length || 0,
        installmentsConfig: payment.installmentsConfig
      });
      
      // Load saved installments configuration if exists (check this FIRST before paymentOption)
      if (payment.installmentsConfig && payment.installmentsConfig.installments && payment.installmentsConfig.installments.length > 0) {
        console.log('Loading saved installments config:', payment.installmentsConfig);
        
        // Override payment option to correct value
        setPaymentOption('One Time With Installments');
        setPlanType('ONE_TIME_WITH_INSTALLMENTS');
        setInstallmentsConfig(payment.installmentsConfig);
        
        // Find next unpaid installment
        const nextUnpaid = payment.installmentsConfig.installments.find((inst: any) => inst.status === 'UNPAID');
        if (nextUnpaid) {
          console.log('Setting next unpaid installment:', nextUnpaid.installmentNumber);
          setCurrentInstallmentNumber(nextUnpaid.installmentNumber);
          setPaymentAmount(nextUnpaid.amount.toString());
        } else {
          console.warn('No unpaid installments found!');
        }
      } else {
        console.log('No installments config found, using payment record values');
        // Set payment option from payment record or default to Monthly
        if (payment.paymentOption) {
          setPaymentOption(payment.paymentOption);
        }

        // Initialize plan type from payment record
        if (payment.planType) {
          setPlanType(payment.planType);
        } else {
          // Default based on paymentOption
          if (payment.paymentOption === 'One Time') {
            setPlanType('ONE_TIME');
          } else if (payment.paymentOption === 'One Time With Installments') {
            setPlanType('ONE_TIME_WITH_INSTALLMENTS');
          } else if (payment.paymentOption === 'EMI') {
            setPlanType('EMI');
          } else {
            setPlanType('MONTHLY_SUBSCRIPTION');
          }
        }
      }

      // Initialize EMI data if available
      if (payment.emiSchedule && payment.emiSchedule.length > 0) {
        setShowEmiSelector(true);
        // Find first unpaid EMI
        const firstUnpaidIndex = payment.emiSchedule.findIndex(emi => emi.status !== 'PAID');
        setEmiIndex(firstUnpaidIndex >= 0 ? firstUnpaidIndex : 0);
      }

      // Initialize payer name with student name
      setPayerName(payment.studentName);
      
      // Set selected types based on what hasn't been paid yet
      setSelectedTypes({
        coursePayment: true, // Always enabled for monthly payments
        studentRegistrationFee: !payment.studentRegistrationFeePaid, // Only if not paid
        courseRegistrationFee: !payment.courseRegistrationFeePaid, // Only if not paid
      });
      
      // Apply course-based defaults ONLY if payment has no saved paymentOption
      // This runs AFTER payment values are loaded, preventing race conditions
      if (!payment.paymentOption && courseInfo.courseCategory) {
        console.log('Applying course-based defaults for category:', courseInfo.courseCategory);
        if (courseInfo.courseCategory === "Ongoing Training") {
          setPaymentOption("Monthly");
          setPlanType('MONTHLY_SUBSCRIPTION');
        } else {
          setPaymentOption("One Time");
          setPaymentSubType('Full Payment');
          setPlanType('ONE_TIME');
        }
      }
      
      // Clear error messages when dialog opens
      setPaymentAmountError("");
    }
  }, [payment, open, courseInfo.courseCategory]);

  // Auto-enable reminders for partial One-Time payments ONLY
  useEffect(() => {
    if (!payment || !paymentAmount || paymentOption !== 'One Time') return;
    
    const enteredAmount = parseFloat(paymentAmount);
    if (isNaN(enteredAmount) || enteredAmount <= 0) return;
    
    // Calculate total fees
    const totalFees = (payment.courseFee || 0) + 
                      (payment.courseRegistrationFee || 0) + 
                      (payment.studentRegistrationFee || 0);
    
    const currentlyPaid = payment.receivedAmount || 0;
    const totalAfterPayment = currentlyPaid + enteredAmount;
    
    // Check if payment will be partial
    const willBePartial = totalAfterPayment < totalFees;
    const willBeFullyPaid = totalAfterPayment >= totalFees;
    
    if (willBePartial) {
      // Auto-enable reminders for partial payments
      if (!stopReminders) {
        setReminderEnabled(true);
        setReminderFrequency('DAILY');
        
        // Set next reminder to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setNextReminderDate(formatDateForInput(tomorrow));
      }
    } else if (willBeFullyPaid) {
      // Disable reminders for fully paid
      setReminderEnabled(false);
      setStopReminders(true);
    }
  }, [paymentAmount, payment, paymentOption, stopReminders]);

  // Auto-enable reminders for installment and subscription payments
  useEffect(() => {
    if (!paymentOption) return;
    
    // Auto-enable for payment types with automatic schedules
    const autoScheduleTypes = [
      'One Time With Installments',
      'EMI',
      'Monthly',
      'Monthly With Discounts'
    ];
    
    if (autoScheduleTypes.includes(paymentOption)) {
      // Enable reminders by default for these types
      if (!stopReminders) {
        setReminderEnabled(true);
      }
    }
  }, [paymentOption, stopReminders]);

  // Calculate Ongoing Training subscription values in real-time
  useEffect(() => {
    if (courseInfo.courseCategory !== "Ongoing Training") return;
    if (!payment) return;

    const courseFee = fetchedFees?.courseFee || payment.courseFee || 0;
    
    // For Monthly Subscription, course fee IS the monthly amount (not divided)
    // This is different from EMI where we divide total by installments
    const baseMonthly = courseFee; // Use course fee directly as monthly amount
    setBaseMonthlyAmount(baseMonthly);

    // Calculate discounted subscription if applicable
    if (paymentOption === 'Monthly With Discounts' && lockInMonths > 0) {
      setIsDiscountedPlan(true);
      
      const discountVal = parseFloat(discountValue) || 0;
      let discounted = baseMonthly;
      
      if (discountType === 'percentage') {
        discounted = baseMonthly - (baseMonthly * discountVal / 100);
      } else if (discountType === 'amount') {
        discounted = baseMonthly - discountVal;
      }
      
      // Ensure discounted amount is not negative
      discounted = Math.max(0, discounted);
      
      setDiscountedMonthlyAmount(Math.ceil(discounted));
      
      // Calculate total payable and savings
      const totalPay = Math.ceil(discounted * lockInMonths);
      const totalSave = (baseMonthly * lockInMonths) - totalPay;
      
      setTotalPayable(totalPay);
      setTotalSavings(Math.max(0, totalSave));
    } else {
      setIsDiscountedPlan(false);
      setDiscountedMonthlyAmount(0);
      setTotalPayable(0);
      setTotalSavings(0);
    }
  }, [courseInfo.courseCategory, payment, fetchedFees, numberOfMonths, paymentOption, lockInMonths, discountType, discountValue]);

  // Reset Monthly Subscription fields when switching away from Ongoing Training
  useEffect(() => {
    if (courseInfo.courseCategory !== "Ongoing Training") {
      // Reset all Monthly Subscription specific fields
      setBaseMonthlyAmount(0);
      setIsDiscountedPlan(false);
      setDiscountValue('');
      setLockInMonths(0);
      setDiscountedMonthlyAmount(0);
      setTotalPayable(0);
      setTotalSavings(0);
      setBillingDueDate(1);
      setAutoRenew(false);
      setLateFeeRule('');
      setGracePeriodDays(0);
      setAutoRenewOption('ask_again');
      setRefundPolicy('no_refund');
    }
  }, [courseInfo.courseCategory]);

  // Auto-populate payment amount for Ongoing Training Monthly Subscriptions
  useEffect(() => {
    if (courseInfo.courseCategory !== "Ongoing Training" || !payment || !open) return;

    // For Monthly Subscription (Normal Billing)
    if (paymentOption === 'Monthly' && baseMonthlyAmount > 0) {
      const isFirstPayment = !payment.receivedAmount || payment.receivedAmount === 0;
      
      if (isFirstPayment) {
        // First payment: Include monthly amount + registration fees if NOT already paid
        let firstPaymentAmount = baseMonthlyAmount;
        
        // Only add student registration fee if not yet paid
        if (!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee && payment.studentRegistrationFee) {
          firstPaymentAmount += payment.studentRegistrationFee;
        }
        
        // Only add course registration fee if not yet paid
        if (!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee && payment.courseRegistrationFee) {
          firstPaymentAmount += payment.courseRegistrationFee;
        }
        
        setPaymentAmount(firstPaymentAmount.toString());
        console.log('Set first payment amount for Monthly Subscription:', firstPaymentAmount);
      } else {
        // Subsequent payments (2nd month onwards): ONLY base monthly amount, NO registration fees
        setPaymentAmount(baseMonthlyAmount.toString());
        console.log('Set recurring payment amount for Monthly Subscription (no reg fees):', baseMonthlyAmount);
      }
    }
    
    // For Monthly Subscription With Discounts
    if (paymentOption === 'Monthly With Discounts' && discountedMonthlyAmount > 0 && lockInMonths > 0) {
      const isFirstPayment = !payment.receivedAmount || payment.receivedAmount === 0;
      
      if (isFirstPayment) {
        // First payment: Include discounted monthly amount + registration fees if NOT already paid
        let firstPaymentAmount = discountedMonthlyAmount;
        
        // Only add student registration fee if not yet paid
        if (!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee && payment.studentRegistrationFee) {
          firstPaymentAmount += payment.studentRegistrationFee;
        }
        
        // Only add course registration fee if not yet paid
        if (!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee && payment.courseRegistrationFee) {
          firstPaymentAmount += payment.courseRegistrationFee;
        }
        
        setPaymentAmount(firstPaymentAmount.toString());
        console.log('Set first payment amount for Discounted Subscription:', firstPaymentAmount);
      } else {
        // Subsequent payments (2nd month onwards): ONLY discounted monthly amount, NO registration fees
        setPaymentAmount(discountedMonthlyAmount.toString());
        console.log('Set recurring payment amount for Discounted Subscription (no reg fees):', discountedMonthlyAmount);
      }
    }
  }, [
    courseInfo.courseCategory, 
    paymentOption, 
    baseMonthlyAmount, 
    discountedMonthlyAmount, 
    lockInMonths, 
    payment, 
    open, 
    selectedTypes
  ]);

  // Revalidate payment amount when registration fee checkboxes change
  useEffect(() => {
    if (paymentAmount && payment) {
      validatePaymentAmount(paymentAmount);
    }
  }, [selectedTypes, payment, paymentAmount]);

  const handleTypeToggle = (type: keyof typeof selectedTypes) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const calculateDefaultMonthly = () => {
    if (!payment) return 0;
    
    const courseFee = payment.courseFee || 0;
    const installment = monthlyInstallment || Math.ceil(courseFee / 6);
    
    // Check if this is the first payment
    const isFirstPayment = !payment.receivedAmount || payment.receivedAmount === 0;
    
    let total = 0;
    if (selectedTypes.coursePayment) total += installment;
    
    // Only add registration fees for first payment
    if (isFirstPayment) {
      if (selectedTypes.studentRegistrationFee) total += payment.studentRegistrationFee || 0;
      if (selectedTypes.courseRegistrationFee) total += payment.courseRegistrationFee || 0;
    }
    
    return total;
  };

  const validatePaymentAmount = (amount: string) => {
    if (!payment) return;
    
    const numAmount = parseFloat(amount);
    const receivedAmount = payment.receivedAmount || 0;
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentAmountError("");
      return;
    }
    
    // Skip validation for Monthly Subscription (Ongoing Training) - it's a recurring payment model
    if (courseInfo.courseCategory === "Ongoing Training" && 
        (paymentOption === 'Monthly' || paymentOption === 'Monthly With Discounts')) {
      setPaymentAmountError("");
      return;
    }
    
    // Calculate the actual maximum allowed amount based on total fees and what's been paid
    const isFirstPayment = receivedAmount === 0;
    
    // Get effective fees
    const courseFee = fetchedFees?.courseFee || payment.courseFee || 0;
    const studentRegistrationFee = fetchedFees?.studentRegistrationFee || payment.studentRegistrationFee || 0;
    const courseRegistrationFee = fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 0;
    
    // Calculate total fees
    let totalFees = courseFee;
    
    // Add registration fees if not already paid and if selected
    if (!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee) {
      totalFees += studentRegistrationFee;
    }
    if (!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee) {
      totalFees += courseRegistrationFee;
    }
    
    // Maximum allowed is total fees minus what's already been received
    const maxAllowedAmount = Math.max(0, totalFees - receivedAmount);
    
    if (numAmount > maxAllowedAmount) {
      if (maxAllowedAmount === 0) {
        setPaymentAmountError(`Payment already completed. No additional payment required.`);
      } else {
        setPaymentAmountError(`Payment cannot exceed ${currency} ${maxAllowedAmount.toLocaleString()} (remaining balance)`);
      }
    } else {
      setPaymentAmountError("");
    }
  };

  const handlePaymentAmountChange = (value: string) => {
    if (!payment) return;
    
    const numAmount = parseFloat(value);
    
    // Allow empty input
    if (value === '') {
      setPaymentAmount(value);
      validatePaymentAmount(value);
      return;
    }
    
    // Only allow positive numbers
    if (numAmount < 0) {
      return;
    }
    
    // Skip validation for Monthly Subscription (Ongoing Training) - it's a recurring payment model
    const isOngoingMonthly = courseInfo.courseCategory === "Ongoing Training" && 
                             (paymentOption === 'Monthly' || paymentOption === 'Monthly With Discounts');
    
    if (!isOngoingMonthly) {
      // Calculate maximum allowed amount
      const receivedAmount = payment.receivedAmount || 0;
      const courseFee = fetchedFees?.courseFee || payment.courseFee || 0;
      const studentRegistrationFee = fetchedFees?.studentRegistrationFee || payment.studentRegistrationFee || 0;
      const courseRegistrationFee = fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 0;
      
      let totalFees = courseFee;
      if (!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee) {
        totalFees += studentRegistrationFee;
      }
      if (!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee) {
        totalFees += courseRegistrationFee;
      }
      
      const maxAllowedAmount = Math.max(0, totalFees - receivedAmount);
      
      // Prevent entering amount greater than balance
      if (!isNaN(numAmount) && numAmount > maxAllowedAmount && maxAllowedAmount > 0) {
        // Set to max allowed amount instead and show inline error
        setPaymentAmount(maxAllowedAmount.toString());
        setPaymentAmountError(`Payment amount cannot exceed ${currency} ${maxAllowedAmount.toLocaleString()} (remaining balance)`);
        return;
      }
    }
    
    setPaymentAmount(value);
    validatePaymentAmount(value);
  };

  const handleSave = async () => {
    if (!payment) return;
    
    // Validate that fees are set
    const totalFees = (payment.courseFee || 0) + 
                      (payment.courseRegistrationFee || 0) + 
                      (payment.studentRegistrationFee || 0);
    
    if (totalFees === 0) {
      toast({
        title: "Cannot Record Payment",
        description: "Total fees are not set for this student. Please update the course fees first.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate payment amount
    if (paymentAmountError) {
      toast({
        title: "Validation Error",
        description: paymentAmountError,
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!paymentAmount || !date || !time || !receivedBy) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate payment method and type selection
    if (!paymentOption) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    // Payment type is only required for EMI payment option
    if (!paymentSubType && paymentOption === 'EMI') {
      toast({
        title: "Payment Type Required",
        description: "Please select which EMI installment is being paid",
        variant: "destructive",
      });
      return;
    }

    // Validate EMI index for EMI plan
    if (paymentOption === 'EMI' && payment.emiSchedule && emiIndex === undefined) {
      toast({
        title: "EMI Selection Required",
        description: "Please select which EMI installment is being paid",
        variant: "destructive",
      });
      return;
    }

    // Validate Ongoing Training - Monthly Subscription with Discount
    if (courseInfo.courseCategory === "Ongoing Training" && paymentOption === 'Monthly With Discounts') {
      if (!discountValue || parseFloat(discountValue) === 0) {
        toast({
          title: "Discount Value Required",
          description: "Please enter a discount value for the subscription plan",
          variant: "destructive",
        });
        return;
      }
      
      if (!lockInMonths || lockInMonths === 0) {
        toast({
          title: "Lock-in Period Required",
          description: "Please select a lock-in period for the discounted subscription",
          variant: "destructive",
        });
        return;
      }

      if (discountedMonthlyAmount <= 0) {
        toast({
          title: "Invalid Discount",
          description: "Discount cannot exceed the monthly amount",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      // Prepare payment date with time
      const paymentDateTime = new Date(`${date}T${time}`);

      // Handle Monthly Subscription logic
      const isMonthlySubscription = paymentOption === 'Monthly' || paymentOption.includes('Monthly');
      const isDiscountedPlan = paymentOption.includes('Discounts');
      
      let monthlySubscriptionData = null;
      let finalAmount = parseFloat(paymentAmount);
      
      if (isMonthlySubscription) {
        // For Monthly Subscriptions, use the calculated amount from monthly subscription logic
        const { totalAmount, monthlyFee, courseRegistrationFee, studentRegistrationFee, isDiscountApplied } = 
          calculateTotalPaymentAmount(
            monthlySubscriptionState,
            isDiscountedPlan,
            fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 1000,
            fetchedFees?.studentRegistrationFee || 500
          );
        
        finalAmount = totalAmount;
        
        // Prepare monthly subscription data for the API
        const currentMonthRecord = getCurrentMonthRecord(monthlySubscriptionState, isDiscountedPlan);
        
        monthlySubscriptionData = {
          monthlySubscriptionType: isDiscountedPlan ? 'WITH_DISCOUNTS' : 'REGULAR',
          currentMonth: currentMonthRecord.month,
          monthlyFee,
          isFirstPayment: monthlySubscriptionState.isFirstPayment,
          isDiscountApplied,
          commitmentPeriod: isDiscountedPlan ? commitmentPeriod : undefined,
          originalMonthlyFee: monthlySubscriptionState.originalMonthlyFee,
          discountedMonthlyFee: monthlySubscriptionState.discountedMonthlyFee,
          courseRegistrationFee,
          studentRegistrationFee,
          monthlyRecords: [...monthlySubscriptionState.monthlyRecords, {
            ...currentMonthRecord,
            status: 'PAID',
            paidOn: new Date()
          }]
        };
        
        console.log('Monthly Subscription Data:', monthlySubscriptionData);
        
      } else {
        // For non-monthly subscriptions, use existing discount logic
        const baseAmount = parseFloat(paymentAmount);
        const discountPercentage = discount ? parseFloat(discount) : 0;
        finalAmount = baseAmount - ((baseAmount * discountPercentage) / 100);
      }

      // Calculate discount amount for the API call
      const discountAmount = isMonthlySubscription ? 0 : 
        (discount ? (parseFloat(paymentAmount) * parseFloat(discount)) / 100 : 0);

      // Calculate total fees to determine if payment is partial (for One-Time payments only)
      const totalFees = (payment.courseFee || 0) + 
                        (payment.courseRegistrationFee || 0) + 
                        (payment.studentRegistrationFee || 0);
      const currentlyPaid = payment.receivedAmount || 0;
      const totalAfterPayment = currentlyPaid + finalAmount;
      
      // Auto-determine if payment is partial (for One-Time payments only)
      const isPartialPayment = planType === 'ONE_TIME' && totalAfterPayment < totalFees;
      const isFullyPaid = !isMonthlySubscription && totalAfterPayment >= totalFees;
      
      // Auto-enable reminders for partial One-Time payments (unless manually stopped)
      const autoReminderEnabled = isPartialPayment && !stopReminders;
      
      // Set next reminder date for partial payments (next day)
      let autoNextReminderDate = null;
      if (isPartialPayment && autoReminderEnabled) {
        const tomorrow = new Date(paymentDateTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        autoNextReminderDate = tomorrow.toISOString();
      }

      // Ensure installmentsConfig is sent for One Time With Installments
      // even on first payment (when it doesn't exist in DB yet)
      let finalInstallmentsConfig = installmentsConfig;
      if (paymentOption === 'One Time With Installments' && !installmentsConfig) {
        console.warn('installmentsConfig is missing, attempting to generate on-the-fly...');
        
        // Try to generate installments if we have the necessary data
        if (cohortDates.startDate && cohortDates.endDate) {
          try {
            const startDate = new Date(cohortDates.startDate);
            const endDate = new Date(cohortDates.endDate);
            
            const courseFee = fetchedFees?.courseFee || payment.courseFee || 0;
            const courseRegFee = fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 0;
            const studentRegFee = fetchedFees?.studentRegistrationFee || payment.studentRegistrationFee || 0;
            const totalAmount = courseFee + courseRegFee + studentRegFee;
            
            if (totalAmount > 0) {
              finalInstallmentsConfig = generateOneTimeInstallments(startDate, endDate, totalAmount, 3);
              
              // Mark installments as PAID based on received amount
              const receivedAmount = payment.receivedAmount || 0;
              let remainingAmount = receivedAmount;
              
              if (receivedAmount > 0) {
                finalInstallmentsConfig.installments = finalInstallmentsConfig.installments.map((inst) => {
                  if (remainingAmount >= inst.amount) {
                    remainingAmount -= inst.amount;
                    return { ...inst, status: 'PAID' as const, paidDate: new Date(), paidAmount: inst.amount };
                  }
                  return inst;
                });
              }
              
              console.log('Generated installments config on-the-fly:', finalInstallmentsConfig);
              setInstallmentsConfig(finalInstallmentsConfig);
            }
          } catch (error) {
            console.error('Failed to generate installments on-the-fly:', error);
          }
        }
        
        // If we still don't have config, show error
        if (!finalInstallmentsConfig) {
          console.error('installmentsConfig is missing and cannot be generated!');
          toast({
            title: "Configuration Error",
            description: "Installments configuration is missing. Please ensure course dates are set.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      // Call the new manual payment API
      const response = await fetch('/api/dashboard/payments/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: payment.id,
          studentId: payment.studentId,
          amount: finalAmount,
          paymentMode: mode,
          paymentDate: paymentDateTime.toISOString(),
          paymentTime: time,
          notes,
          payerType,
          customPayerType: payerType === 'other' ? customPayerType : undefined,
          payerName: payerName || payment.studentName,
          planType: planType === 'ONE_TIME_WITH_INSTALLMENTS' ? 'ONE_TIME' : planType,
          paymentOption,
          ...(paymentSubType && { paymentSubType }), // Only include if not empty
          emiIndex: planType === 'EMI' ? emiIndex : undefined,
          installmentNumber: paymentOption === 'One Time With Installments' ? currentInstallmentNumber : undefined,
          installmentsConfig: paymentOption === 'One Time With Installments' ? finalInstallmentsConfig : undefined,
          discount: isMonthlySubscription ? 0 : (discountAmount || 0),
          receivedBy,
          reminderEnabled: isFullyPaid ? false : (stopReminders ? false : (autoReminderEnabled || reminderEnabled)),
          nextReminderDate: isFullyPaid ? null : (autoNextReminderDate || (reminderEnabled && !stopReminders ? nextReminderDate : null)),
          preReminderEnabled: isFullyPaid ? false : preReminderEnabled,
          reminderFrequency: isFullyPaid ? 'NONE' : (stopReminders ? 'NONE' : reminderFrequency),
          stopReminders: isFullyPaid ? true : stopReminders,
          // Monthly Subscription data (new system)
          ...(monthlySubscriptionData && {
            monthlySubscription: monthlySubscriptionData,
          }),
          // Legacy Ongoing Training - Monthly Subscription data (keep for backward compatibility)
          ...(courseInfo.courseCategory === "Ongoing Training" && !isMonthlySubscription && {
            courseCategory: courseInfo.courseCategory,
            courseDurationInMonths: numberOfMonths,
            baseMonthlyAmount,
            isDiscountedPlan: isDiscountedPlan,
            ...(paymentOption === 'Monthly' && {
              billingDueDate,
              autoRenew,
              lateFeeRule,
              gracePeriodDays,
            }),
            ...(isDiscountedPlan && paymentOption === 'Monthly With Discounts' && {
              discountType,
              discountValue: parseFloat(discountValue) || 0,
              lockInMonths,
              discountedMonthlyAmount,
              totalPayable,
              totalSavings,
              autoRenewOption,
              refundPolicy,
            }),
          }),
        }),
      });

      let result;
      const responseText = await response.text();
      
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse API response:', responseText);
        throw new Error(`Invalid API response: ${responseText.substring(0, 200)}`);
      }
      
      console.log('Manual payment API response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        result
      });

      if (response.status === 403) {
        onRestrictedAttempt?.();
        onOpenChange(false);
        setSubmitting(false);
        return;
      }
      if (!response.ok) {
        const errorMessage = result.error || result.details || result.message || `Failed to record payment (HTTP ${response.status})`;
        console.error('Payment API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          details: result.details,
          errorName: result.errorName,
          fullResult: result
        });
        throw new Error(errorMessage);
      }

      // Close dialog first
      onOpenChange(false);
      
      // Reset form
      resetForm();
      
      // Call the parent onSave callback with the result AFTER closing
      // This ensures the refresh happens after the dialog is fully closed
      setTimeout(() => {
        onSave(result);
        
        // Show success toast AFTER refresh
        toast({
          title: "Payment Recorded Successfully",
          description: `Invoice ${result.invoice.invoiceNumber} has been generated and sent.`,
        });
      }, 100);
      
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: "Payment Recording Failed",
        description: error.message || 'An error occurred while recording the payment',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    // Basic payment fields - Reset to defaults
    setPaymentOption("Monthly");
    setPlanType('MONTHLY_SUBSCRIPTION');
    setPaymentSubType('');
    setPaymentAmount("");
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
    setMode("Cash");
    setReceivedBy("");
    setNotes("");
    
    // Enhanced fields - Clear all user input
    setPayerType('student');
    setCustomPayerType("");
    setPayerName("");
    setDiscount("");
    
    // EMI fields - Reset to defaults
    setEmiIndex(0);
    setShowEmiSelector(false);
    setReceivedBySearch("");
    // Don't reset customPayers - keep them loaded from database
    
    // One Time with Installments fields - Clear configuration
    setInstallmentsConfig(null);
    setCurrentInstallmentNumber(1);
    
    // Ongoing Training - Monthly Subscription fields - Reset all
    setBaseMonthlyAmount(0);
    setIsDiscountedPlan(false);
    setDiscountType('percentage');
    setDiscountValue('');
    setLockInMonths(0);
    setDiscountedMonthlyAmount(0);
    setTotalPayable(0);
    setTotalSavings(0);
    setAllowEditMonthlyFee(false);
    
    // Monthly subscription billing fields - Reset to defaults
    setBillingDueDate(1);
    setAutoRenew(false);
    setLateFeeRule('');
    setGracePeriodDays(0);
    setAutoRenewOption('ask_again');
    setRefundPolicy('no_refund');
    
    // Reminder fields - Reset all
    setReminderEnabled(false);
    setNextReminderDate("");
    setPreReminderEnabled(false);
    setStopReminders(false);
    setReminderFrequency('DAILY');
    setIsReminderDisabled(false);
    
    // Error states - Clear all errors
    setPaymentAmountError("");
    
    // UI states - Reset all
    setOpenCombobox(false);
    setShowCommitmentSelector(false);
    setLoading(false);
    setSubmitting(false);
    setLoadingHistory(false);
    setIsPaymentOptionDisabled(false);
    
    // Payment types selection - Reset to defaults
    setSelectedTypes({
      coursePayment: true,
      studentRegistrationFee: false,
      courseRegistrationFee: false,
    });
    
    // Monthly subscription state - Reset to initial state
    setMonthlySubscriptionState({
      isFirstPayment: true,
      monthlyRecords: [],
      originalMonthlyFee: 0,
      discountedMonthlyFee: 0,
      currentMonth: new Date().toISOString().slice(0, 7) // "YYYY-MM" format
    });
    
    // Commitment and subscription fields - Reset
    setCommitmentPeriod(3);
    setShowCommitmentSelector(false);
    
    // Clear data states that might persist user entries
    setPaymentHistory([]);
    setFetchedFees(null);
    setCourseInfo({ courseType: null, courseCategory: null, paymentCategory: null });
    setGuardianInfo({ fullName: null, relationship: null, contact: null });
    setCohortDates({ startDate: null, endDate: null });
    setMonthlyInstallment(0);
    setNumberOfMonths(0);
    setCourseCategory(null);
  };

  if (!payment) return null;

  // Helper function to get effective fees (fetched or from payment record)
  const getEffectiveFees = () => ({
    courseFee: Number(fetchedFees?.courseFee ?? payment.courseFee ?? 0),
    courseRegistrationFee: Number(fetchedFees?.courseRegistrationFee ?? payment.courseRegistrationFee ?? 0),
    studentRegistrationFee: Number(fetchedFees?.studentRegistrationFee ?? payment.studentRegistrationFee ?? 0),
  });

  const defaultMonthly = calculateDefaultMonthly();
  // Use fetched fees if available, otherwise use payment record fees
  const courseFee = fetchedFees?.courseFee || payment.courseFee || 0;
  const courseRegistrationFee = fetchedFees?.courseRegistrationFee || payment.courseRegistrationFee || 0;
  const studentRegistrationFee = fetchedFees?.studentRegistrationFee || payment.studentRegistrationFee || 0;
  const displayMonthlyInstallment = monthlyInstallment || Math.ceil(courseFee / numberOfMonths || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogTitle className="text-xl font-bold">Manual Payment</DialogTitle>
          <DialogDescription className="text-sm">
            Record a manual payment for the student's course enrollment
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Warning Alert for Zero Fees */}
          {(() => {
          const totalFees = (payment.courseFee || 0) + 
                            (payment.courseRegistrationFee || 0) + 
                            (payment.studentRegistrationFee || 0);
          if (totalFees === 0) {
            return (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fee Configuration Required</AlertTitle>
                <AlertDescription>
                  The total fees (Course Fee + Registration Fees) are currently set to {currency} 0. 
                  Please update the student's fee information before recording a payment.
                  <br />
                  <strong>Expected Total: {currency} 31,500</strong> (or your actual total)
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Left Column - Student Information */}
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
              <h3 className="font-semibold text-medium mb-2">Student Information</h3>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Student: </span>
                <span className="font-medium text-sm">
                  {payment.studentName} ({payment.studentId})
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Course: </span>
                <span className="font-medium text-sm">
                  {payment.enrolledCourseName} ({payment.enrolledCourseId || payment.enrolledCourse})
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Course Type: </span>
                <span className="font-medium text-sm">
                  {courseInfo.courseType || payment.courseType || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Course Category: </span>
                <span className="font-medium text-sm">
                  {courseInfo.courseCategory || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Start Date: </span>
                <span className="font-medium text-sm">
                  {formatDateForDisplay(cohortDates.startDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">End Date: </span>
                <span className="font-medium text-sm">
                  {formatDateForDisplay(cohortDates.endDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Duration: </span>
                <span className="font-medium text-sm">
                  {numberOfMonths > 0 ? `${numberOfMonths} months` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Course Fee: </span>
                <span className="font-medium text-sm">{currency} {((fetchedFees?.courseFee || payment.courseFee) || 0).toLocaleString()}</span>
              </div>
              {/* Outstanding Amount - Only show for non-monthly subscription payment categories */}
              {courseInfo.paymentCategory !== 'Monthly subscription' && (
                <div>
                  <span className="text-gray-600 dark:text-white text-sm">Outstanding Amount (Total): </span>
                  <span className="font-medium text-orange-600 text-sm">{currency} {(payment.outstandingAmount || 0).toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600 dark:text-white text-sm">Status: </span>
                <span className="font-medium text-sm">{payment.status}</span>
              </div>
            </div>

            {/* Course Payment Category Display */}
            {courseInfo.paymentCategory && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-800">Course Payment Category:</span>
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {courseInfo.paymentCategory}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Option - Main Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={paymentOption} 
                onValueChange={(value) => {
                  setPaymentOption(value);
                  
                  // Auto-select payment subtype for One Time (only has Full Payment)
                  if (value === 'One Time') {
                    setPaymentSubType('Full Payment');
                    setPlanType('ONE_TIME');
                    setShowEmiSelector(false);
                  } else if (value === 'One Time With Installments') {
                    setPaymentSubType('');
                    setPlanType('ONE_TIME_WITH_INSTALLMENTS');
                    setShowEmiSelector(false);
                  } else {
                    setPaymentSubType(''); // Reset subcategory for other categories
                    
                    if (value === 'Monthly' || value === 'Monthly With Discounts') {
                      setPlanType('MONTHLY_SUBSCRIPTION');
                      setShowEmiSelector(false);
                    } else if (value === 'EMI') {
                      setPlanType('EMI');
                      if (payment.emiSchedule && payment.emiSchedule.length > 0) {
                        setShowEmiSelector(true);
                      }
                    }
                  }
                }}
                disabled={isPaymentOptionDisabled}
              >
                <SelectTrigger className={isPaymentOptionDisabled ? "opacity-60 cursor-not-allowed" : ""}>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {courseInfo.courseCategory === "Ongoing Training" ? (
                    <>
                      <SelectItem value="Monthly">Monthly Subscription</SelectItem>
                      {paymentSettings.discountedSubscriptionEnabled && (
                        <SelectItem value="Monthly With Discounts">Monthly Subscription With Discounts</SelectItem>
                      )}
                    </>
                  ) : (
                    <>
                      <SelectItem value="One Time">One-Time Payment</SelectItem>
                      {paymentSettings.oneTimeInstallmentsEnabled && (
                        <SelectItem value="One Time With Installments">
                          One-Time With Installments ({paymentSettings.installmentsCount} EMIs)
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {courseInfo.courseCategory === "Ongoing Training" && (
                <p className="text-xs text-gray-500 dark:text-white mt-1">
                  Monthly Subscription options are available for Ongoing Training courses
                </p>
              )}
              {courseInfo.courseCategory && courseInfo.courseCategory !== "Ongoing Training" && (
                <p className="text-xs text-gray-500 dark:text-white mt-1">
                  Monthly Subscription is only available for Ongoing Training courses
                </p>
              )}
              {!paymentSettings.oneTimeInstallmentsEnabled && courseInfo.courseCategory !== "Ongoing Training" && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  One-Time Installments is disabled in Payment Settings
                </p>
              )}
              {!paymentSettings.discountedSubscriptionEnabled && courseInfo.courseCategory === "Ongoing Training" && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Discounted Subscriptions are disabled in Payment Settings
                </p>
              )}
            </div>

            {/* Payment Sub-Type - Only for EMI payment option */}
            {paymentOption === 'EMI' && !isPaymentOptionDisabled && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Payment Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={paymentSubType} 
                  onValueChange={setPaymentSubType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First EMI">First EMI</SelectItem>
                    <SelectItem value="Middle EMI">Middle EMI</SelectItem>
                    <SelectItem value="Last EMI">Last EMI</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-white">
                  Installment-based payment schedule
                </p>
              </div>
            )}

            {/* EMI Selector - Only show for EMI payment option */}
            {paymentOption === 'EMI' && payment.emiSchedule && payment.emiSchedule.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Select EMI Installment <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={emiIndex.toString()} 
                  onValueChange={(value) => setEmiIndex(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select EMI installment" />
                  </SelectTrigger>
                  <SelectContent>
                    {payment.emiSchedule.map((emi, index) => (
                      <SelectItem 
                        key={index} 
                        value={index.toString()}
                        disabled={emi.status === 'PAID'}
                      >
                        EMI {emi.emiNumber} - {currency} {emi.amount.toLocaleString()} 
                        {emi.status === 'PAID' ? ' (PAID)' : ` (Due: ${formatDateForDisplay(emi.dueDate)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {payment.emiSchedule[emiIndex] && (
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    <p><strong>EMI {payment.emiSchedule[emiIndex].emiNumber}:</strong></p>
                    <p>Amount: {currency} {payment.emiSchedule[emiIndex].amount.toLocaleString()}</p>
                    <p>Due Date: {formatDateForDisplay(payment.emiSchedule[emiIndex].dueDate)}</p>
                    <p>Status: {payment.emiSchedule[emiIndex].status}</p>
                  </div>
                )}
              </div>
            )}

            {/* One Time with Installments Selector */}
            {planType === 'ONE_TIME_WITH_INSTALLMENTS' && installmentsConfig && (
              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">
                  Installment Schedule ({paymentSettings.installmentsCount} EMIs) <span className="text-red-500">*</span>
                </Label>
                
                {/* Installments Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900">Payment Plan Overview</h4>
                    <Badge variant="outline" className="bg-white">
                      {areAllInstallmentsPaid(installmentsConfig) ? '? Fully Paid' : `${installmentsConfig.installments.filter(i => i.status === 'PAID').length}/${paymentSettings.installmentsCount} Paid`}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-white">Total Amount:</p>
                      <p className="font-bold text-lg">{currency} {installmentsConfig.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-white">Remaining Balance:</p>
                      <p className="font-bold text-lg text-orange-600">
                        {currency} {calculateRemainingBalance(installmentsConfig).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-white">Course Duration:</p>
                      <p className="font-medium">{installmentsConfig.courseDuration.durationInDays} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-white">Per Installment:</p>
                      <p className="font-medium">~{currency} {Math.round(installmentsConfig.totalAmount / paymentSettings.installmentsCount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Select Current Installment */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Select Installment to Pay <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={currentInstallmentNumber.toString()} 
                    onValueChange={(value) => {
                      const num = parseInt(value);
                      setCurrentInstallmentNumber(num);
                      const inst = installmentsConfig.installments.find(i => i.installmentNumber === num);
                      if (inst) {
                        setPaymentAmount(inst.amount.toString());
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select installment" />
                    </SelectTrigger>
                    <SelectContent>
                      {installmentsConfig.installments.map((inst) => (
                        <SelectItem 
                          key={inst.installmentNumber} 
                          value={inst.installmentNumber.toString()}
                          disabled={inst.status === 'PAID'}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {inst.stage === 'first' && '1st'} 
                              {inst.stage === 'middle' && '2nd'}
                              {inst.stage === 'last' && 'Final'} 
                              {' '}Installment
                            </span>
                            <span className="ml-4">{currency} {inst.amount.toLocaleString()}</span>
                            {inst.status === 'PAID' && <span className="ml-2 text-green-600">? Paid</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Current Installment Details */}
                {installmentsConfig.installments[currentInstallmentNumber - 1] && (
                  <div className="bg-white border-2 border-purple-200 rounded-lg p-4 space-y-2">
                    {(() => {
                      const inst = installmentsConfig.installments[currentInstallmentNumber - 1];
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-purple-900">
                              {inst.stage === 'first' && '1st Installment Details'}
                              {inst.stage === 'middle' && '2nd Installment Details'}
                              {inst.stage === 'last' && 'Final Installment Details'}
                            </h5>
                            <Badge variant={inst.status === 'PAID' ? 'default' : 'destructive'}>
                              {inst.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-white">Amount:</p>
                              <p className="font-bold">{currency} {inst.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-white">Due Date:</p>
                              <p className="font-medium">{formatDateForDisplay(inst.dueDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-white">Reminder Date:</p>
                              <p className="font-medium">{formatDateForDisplay(inst.reminderDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-white">Reminder Days:</p>
                              <p className="font-medium">{inst.reminderDaysBefore} days before</p>
                            </div>
                          </div>

                          {/* Stage-specific features */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 dark:text-white mb-2">Features:</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {inst.invoiceOnPayment ? '✓ Invoice on payment' : '✗ No invoice'}
                              </Badge>
                              {inst.finalInvoice && (
                                <Badge variant="outline" className="text-xs bg-green-50">
                                  ✓ Final invoice
                                </Badge>
                              )}
                              {inst.stopReminderToggle && (
                                <Badge variant="outline" className="text-xs bg-yellow-50">
                                  ✓ Stop reminder toggle
                                </Badge>
                              )}
                              {inst.stopAccessToggle && (
                                <Badge variant="outline" className="text-xs bg-red-50">
                                  ✓ Stop access toggle
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {inst.status === 'PAID' && inst.paidDate && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-green-600">
                                ✓ Paid on {formatDateForDisplay(inst.paidDate)} 
                                {inst.transactionId && ` - ${inst.transactionId}`}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {/* Warning if all paid */}
                {areAllInstallmentsPaid(installmentsConfig) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 flex items-center">
                      <span className="mr-2">?</span>
                      All installments have been paid. All reminders will be automatically stopped.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== ONGOING TRAINING - MONTHLY SUBSCRIPTION UI ==================== */}
            {courseInfo.courseCategory === "Ongoing Training" && (
              <div className="space-y-4 border-t-4 border-orange-300 pt-4 bg-gradient-to-b from-orange-50 to-transparent p-4 rounded-lg">
                
                {/* A) MONTHLY SUBSCRIPTION (NORMAL BILLING) */}
                {paymentOption === 'Monthly' && (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 space-y-4 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                          <CreditCard className="h-5 w-5" /> Monthly Subscription
                        </h3>
                        <p className="text-xs text-blue-600 mt-1">Fixed monthly billing without discount</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-900 font-semibold">
                        Normal Billing
                      </Badge>
                    </div>
                    
                    {/* Base Monthly Fee (Read-only) */}
                    <div className="bg-white rounded-lg p-4 space-y-3 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-white font-medium">Base Monthly Fee:</span>
                        <span className="text-2xl font-bold text-blue-900">{currency} {baseMonthlyAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white">Calculated from course fee and duration</p>
                    </div>

                    {/* Billing Due Date */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Billing Due Date <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={billingDueDate.toString()} 
                        onValueChange={(val) => setBillingDueDate(parseInt(val))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day of month" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of every month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-white">Payment will be due on this day each month</p>
                    </div>

                    {/* Auto-Renew Toggle */}
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" /> Auto-Renew Subscription
                          </Label>
                          <p className="text-xs text-gray-500 dark:text-white">Automatically renew subscription each month</p>
                        </div>
                        <Switch
                          checked={autoRenew}
                          onCheckedChange={setAutoRenew}
                        />
                      </div>
                    </div>

                    {/* Late Fee Rule (Optional) */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Late Fee Rule (Optional)
                      </Label>
                      <Input
                        type="text"
                        value={lateFeeRule}
                        onChange={(e) => setLateFeeRule(e.target.value)}
                        placeholder="e.g., 100 per day after grace period"
                      />
                      <p className="text-xs text-gray-500 dark:text-white">Penalty for late payments</p>
                    </div>

                    {/* Grace Period */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Timer className="h-4 w-4" /> Grace Period (Optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={gracePeriodDays}
                          onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          max="30"
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600 dark:text-white">days after due date</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white">Buffer time before late fees apply</p>
                    </div>

                    {/* Information Text */}
                    <Alert className="bg-blue-100 border-blue-300">
                      <AlertCircle className="h-4 w-4 text-blue-700" />
                      <AlertDescription className="text-sm text-blue-900">
                        <strong>Flexible Billing:</strong> Billed monthly at a fixed rate. Cancel anytime as per academy policy.
                      </AlertDescription>
                    </Alert>

                    {/* Monthly Subscription Summary */}
                    <div className="bg-white rounded-lg p-3 border-2 border-blue-300 mb-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly Subscription Status</h4>
                      <p className="text-sm text-gray-700 dark:text-white whitespace-pre-line">
                        {formatMonthlySubscriptionSummary(monthlySubscriptionState, false)}
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-4 border-2 border-blue-400">
                      <p className="text-sm text-gray-800 dark:text-white leading-relaxed">
                        <ClipboardList className="h-4 w-4 inline mr-1" /> <strong>Summary:</strong> Pay{' '}
                        <span className="font-bold text-blue-900 text-lg">{currency} {baseMonthlyAmount.toLocaleString()}</span>{' '}
                        on the <span className="font-bold">{billingDueDate}{billingDueDate === 1 ? 'st' : billingDueDate === 2 ? 'nd' : billingDueDate === 3 ? 'rd' : 'th'}</span> of every month.
                        {autoRenew && <span className="text-blue-700 inline-flex items-center gap-1"> Auto-renewal enabled <Check className="h-3 w-3" /></span>}
                        {monthlySubscriptionState.isFirstPayment && <span className="text-orange-600 inline-flex items-center gap-1"><br/><AlertTriangle className="h-3 w-3" /> First payment includes registration fees</span>}
                      </p>
                    </div>
                  </div>
                )}

                {/* B) MONTHLY SUBSCRIPTION WITH DISCOUNTS */}
                {paymentOption === 'Monthly With Discounts' && (
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300 rounded-lg p-5 space-y-4 shadow-md">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                          <Gift className="h-5 w-5" /> Monthly Subscription with Discounts
                        </h3>
                        <p className="text-xs text-purple-600 mt-1">Long-term commitment with discounted pricing</p>
                      </div>
                      <Badge variant="secondary" className="bg-purple-200 text-purple-900 font-semibold">
                        Lock-in Plan
                      </Badge>
                    </div>

                    {/* Base Monthly Fee (Read-only) */}
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-white">Base Monthly Fee:</span>
                        <span className="font-bold text-lg line-through text-gray-400 dark:text-white">{currency} {baseMonthlyAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Commitment Period Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Commitment Period <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={commitmentPeriod.toString()} 
                          onValueChange={(val) => setCommitmentPeriod(parseInt(val))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="9">9 Months</SelectItem>
                            <SelectItem value="12">12 Months</SelectItem>
                            <SelectItem value="24">24 Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-purple-600">Discounted rate applies for this period</p>
                      </div>
                      
                      {/* Monthly Subscription Summary */}
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-gray-600 dark:text-white mb-1">Current Payment Details:</p>
                        <p className="text-sm font-bold text-purple-900">
                          {formatMonthlySubscriptionSummary(monthlySubscriptionState, true)}
                        </p>
                      </div>
                    </div>

                    {/* Discount Configuration Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Discount Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Discount Type <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={discountType} 
                          onValueChange={(val: 'percentage' | 'amount') => setDiscountType(val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage" className="flex items-center gap-2"><BarChart3 className="h-3 w-3 inline mr-1" /> Percentage (%)</SelectItem>
                            <SelectItem value="amount" className="flex items-center gap-2"><DollarSign className="h-3 w-3 inline mr-1" /> Flat Amount ({currency})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Discount Value */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Discount Value <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder={discountType === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                          min="0"
                          step={discountType === 'percentage' ? '1' : '100'}
                        />
                        <p className="text-xs text-gray-500 dark:text-white">
                          {discountType === 'percentage' ? 'Percentage discount (0-100)' : 'Fixed amount in {currency}'}
                        </p>
                      </div>
                    </div>

                    {/* Commitment Period */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Commitment Period <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={lockInMonths.toString()} 
                        onValueChange={(val) => setLockInMonths(parseInt(val) || 0)}
                      >
                        <SelectTrigger className="font-semibold">
                          <SelectValue placeholder="Select commitment duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Months - Short Term</SelectItem>
                          <SelectItem value="6">6 Months - Popular Choice</SelectItem>
                          <SelectItem value="9">9 Months - Extended</SelectItem>
                          <SelectItem value="12">12 Months - Best Value</SelectItem>
                          <SelectItem value="24">24 Months - Maximum Savings</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-purple-600 font-medium">
                        Longer commitments = Greater savings!
                      </p>
                    </div>

                    {/* Auto-Renew Option */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Auto-Renew Option After Term
                      </Label>
                      <Select 
                        value={autoRenewOption} 
                        onValueChange={(val: 'same_discount' | 'normal_rate' | 'ask_again') => setAutoRenewOption(val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="same_discount"><CheckCircle2 className="h-3 w-3 inline mr-1" /> Renew with same discount</SelectItem>
                          <SelectItem value="normal_rate"><CreditCard className="h-3 w-3 inline mr-1" /> Renew at normal rate</SelectItem>
                          <SelectItem value="ask_again"><AlertCircle className="h-3 w-3 inline mr-1" /> Ask again after completion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Refund/Exit Policy */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Refund / Exit Policy
                      </Label>
                      <Select 
                        value={refundPolicy} 
                        onValueChange={(val: 'no_refund' | 'prorated' | 'freeze_option') => setRefundPolicy(val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_refund"><XCircle className="h-3 w-3 inline mr-1" /> Strict No Refund</SelectItem>
                          <SelectItem value="prorated"><DollarSign className="h-3 w-3 inline mr-1" /> Pro-Rated Refund</SelectItem>
                          <SelectItem value="freeze_option"><Snowflake className="h-3 w-3 inline mr-1" /> Subscription Freeze Option</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CALCULATIONS DISPLAY */}
                    {lockInMonths > 0 && parseFloat(discountValue || '0') > 0 && discountedMonthlyAmount > 0 && (
                      <div className="space-y-3">
                        {/* Breakdown Card */}
                        <div className="bg-white rounded-lg p-4 space-y-3 border-2 border-purple-400 shadow-sm">
                          <h4 className="font-bold text-purple-900 text-sm border-b border-purple-200 pb-2 flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Payment Breakdown
                          </h4>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-white">Base Fee:</span>
                              <span className="font-medium line-through text-gray-400 dark:text-white">{currency} {baseMonthlyAmount.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-white">Discount:</span>
                              <span className="font-semibold text-green-600">
                                {discountType === 'percentage' 
                                  ? `${discountValue}% OFF` 
                                  : `-{currency} ${parseFloat(discountValue).toLocaleString()}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-purple-100 pt-2">
                              <span className="text-sm font-semibold text-purple-900">Final Monthly Price:</span>
                              <span className="text-2xl font-bold text-purple-900">{currency} {discountedMonthlyAmount.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-white">Commitment Months:</span>
                              <span className="font-bold text-purple-700">{lockInMonths} months</span>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-purple-100 pt-2 bg-purple-50 -mx-4 px-4 py-2">
                              <span className="text-sm font-bold text-purple-900">Total Payable:</span>
                              <span className="text-2xl font-bold text-purple-900">{currency} {totalPayable.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-300">
                              <span className="text-sm font-bold text-green-700 flex items-center gap-1"><PartyPopper className="h-4 w-4" /> Total Savings:</span>
                              <span className="text-2xl font-bold text-green-700">{currency} {totalSavings.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary Text */}
                        <Alert className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 border-2 border-purple-400">
                          <AlertDescription className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                            <PartyPopper className="h-4 w-4 inline mr-1" /> <strong>Your Plan:</strong> Pay{' '}
                            <span className="font-bold text-purple-900 text-lg">{currency} {discountedMonthlyAmount.toLocaleString()}/month</span>{' '}
                            for <span className="font-bold text-purple-900">{lockInMonths} months</span>.{' '}
                            <br />
                            <span className="text-green-700 font-bold">
                              Save {currency} {totalSavings.toLocaleString()} compared to normal billing!
                            </span>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Validation Warning */}
                    {(lockInMonths === 0 || !discountValue || parseFloat(discountValue) === 0 || discountedMonthlyAmount <= 0) && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Configuration Required</AlertTitle>
                        <AlertDescription>
                          {!discountValue || parseFloat(discountValue) === 0 
                            ? "Please enter a valid discount value." 
                            : lockInMonths === 0 
                            ? "Please select a commitment period." 
                            : "Discounted amount must be greater than 0."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Date, Time, Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Mode <span className="text-red-500">*</span>
                </Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Received By */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Payment Received By (Name) <span className="text-red-500">*</span>
              </Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {receivedBy
                      ? receivedBy
                      : "Select person receiving payment"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search staff or type name..." 
                      value={receivedBySearch}
                      onValueChange={setReceivedBySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loading ? (
                          <div className="py-6 text-center text-sm">Loading...</div>
                        ) : receivedBySearch.trim() ? (
                          <div className="p-1">
                            <div 
                              onClick={async () => {
                                const newPayerName = receivedBySearch.trim();
                                // Save to database
                                try {
                                  const res = await fetch('/api/dashboard/payments/custom-payers', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ payerName: newPayerName })
                                  });
                                  if (res.ok) {
                                    // Add to local state if not already present
                                    setCustomPayers(prev => 
                                      prev.includes(newPayerName) ? prev : [...prev, newPayerName]
                                    );
                                  }
                                } catch (e) {
                                  console.error('Failed to save custom payer', e);
                                }
                                setReceivedBy(newPayerName);
                                setOpenCombobox(false);
                                setReceivedBySearch("");
                              }}
                              className="cursor-pointer px-2 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded"
                            >
                              Add "{receivedBySearch.trim()}" as new payer
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-sm">No staff found.</div>
                        )}
                      </CommandEmpty>
                      {instructors.length > 0 && (
                        <CommandGroup heading="Instructors">
                          {instructors.map((instructor) => (
                            <CommandItem
                              key={instructor._id}
                              value={instructor.displayName}
                              onSelect={(currentValue) => {
                                setReceivedBy(currentValue === receivedBy ? "" : instructor.displayName);
                                setOpenCombobox(false);
                                setReceivedBySearch("");
                              }}
                              className={`cursor-pointer ${
                                receivedBy === instructor.displayName
                                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
                                  : "hover:bg-purple-50 data-[selected=true]:bg-purple-50 data-[selected=true]:text-gray-900 dark:text-white"
                              }`}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  receivedBy === instructor.displayName
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {instructor.displayName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {nonInstructors.length > 0 && (
                        <CommandGroup heading="Non-Instructors">
                          {nonInstructors.map((person) => (
                            <CommandItem
                              key={person._id}
                              value={person.displayName}
                              onSelect={(currentValue) => {
                                setReceivedBy(currentValue === receivedBy ? "" : person.displayName);
                                setOpenCombobox(false);
                                setReceivedBySearch("");
                              }}
                              className={`cursor-pointer ${
                                receivedBy === person.displayName
                                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
                                  : "hover:bg-purple-50 data-[selected=true]:bg-purple-50 data-[selected=true]:text-gray-900 dark:text-white"
                              }`}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  receivedBy === person.displayName
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {person.displayName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {customPayers.length > 0 && (
                        <CommandGroup heading="Other Payers">
                          {customPayers
                            .filter(payerName => 
                              payerName.toLowerCase().includes(receivedBySearch.toLowerCase())
                            )
                            .map((payerName, index) => (
                            <CommandItem
                              key={`custom-${index}-${payerName}`}
                              value={payerName}
                              onSelect={(currentValue) => {
                                setReceivedBy(currentValue === receivedBy ? "" : payerName);
                                setOpenCombobox(false);
                                setReceivedBySearch("");
                              }}
                              className={`cursor-pointer ${
                                receivedBy === payerName
                                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
                                  : "hover:bg-purple-50 data-[selected=true]:bg-purple-50 data-[selected=true]:text-gray-900 dark:text-white"
                              }`}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  receivedBy === payerName
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {payerName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Right Column - Payment Types & Amount */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Payment Types (Select Multiple) <span className="text-red-500">*</span>
              </Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={selectedTypes.coursePayment}
                    onCheckedChange={() => handleTypeToggle("coursePayment")}
                  />
                  <label className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">Course Payment </span>
                    <span className="text-gray-600 dark:text-white">{currency} {courseFee.toLocaleString()}</span>
                  </label>
                </div>

                <div className={`flex items-center space-x-2 p-2 border rounded-lg ${payment.studentRegistrationFeePaid ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}`}>
                  <Checkbox
                    checked={selectedTypes.studentRegistrationFee}
                    onCheckedChange={() => handleTypeToggle("studentRegistrationFee")}
                    disabled={payment.studentRegistrationFeePaid}
                  />
                  <label className={`flex-1 text-sm ${payment.studentRegistrationFeePaid ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <span className="font-medium">Student Registration Fee </span>
                    <span className="text-gray-600 dark:text-white">{currency} {studentRegistrationFee.toLocaleString()}</span>
                    {payment.studentRegistrationFeePaid && (
                      <span className="ml-2 text-xs text-green-600 font-semibold">✓ PAID</span>
                    )}
                  </label>
                </div>

                <div className={`flex items-center space-x-2 p-2 border rounded-lg ${payment.courseRegistrationFeePaid ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}`}>
                  <Checkbox
                    checked={selectedTypes.courseRegistrationFee}
                    onCheckedChange={() => handleTypeToggle("courseRegistrationFee")}
                    disabled={payment.courseRegistrationFeePaid}
                  />
                  <label className={`flex-1 text-sm ${payment.courseRegistrationFeePaid ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <span className="font-medium">Course Registration Fee </span>
                    <span className="text-gray-600 dark:text-white">{currency} {courseRegistrationFee.toLocaleString()}</span>
                    {payment.courseRegistrationFeePaid && (
                      <span className="ml-2 text-xs text-green-600 font-semibold">✓ PAID</span>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Payment Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={paymentAmount}
                onChange={(e) => handlePaymentAmountChange(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent typing minus sign
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                className={`text-base font-semibold ${paymentAmountError ? 'border-red-500' : ''}`}
              />
              {paymentAmountError && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {paymentAmountError}
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-white space-y-1">
                {/* Ongoing Training - Monthly Subscription */}
                {courseInfo.courseCategory === "Ongoing Training" && paymentOption === "Monthly" && baseMonthlyAmount > 0 && (
                  <>
                    <p className="font-medium text-blue-700">Monthly Subscription Amount: {currency} {baseMonthlyAmount.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Course fee is charged monthly (not divided by duration)</p>
                    {(!payment.receivedAmount || payment.receivedAmount === 0) ? (
                      // First payment - show registration fees if applicable
                      <>
                        {((!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee && payment.studentRegistrationFee) || 
                          (!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee && payment.courseRegistrationFee)) && (
                          <p className="text-xs">
                            First payment includes: Base monthly {currency} {baseMonthlyAmount.toLocaleString()}
                            {!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee && payment.studentRegistrationFee && ` + Student Reg {currency} ${payment.studentRegistrationFee.toLocaleString()}`}
                            {!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee && payment.courseRegistrationFee && ` + Course Reg {currency} ${payment.courseRegistrationFee.toLocaleString()}`}
                          </p>
                        )}
                      </>
                    ) : (
                      // Recurring payment - no registration fees
                      <p className="text-xs text-gray-500 dark:text-white">Recurring monthly payment (no registration fees)</p>
                    )}
                  </>
                )}
                
                {/* Ongoing Training - Monthly Subscription With Discounts */}
                {courseInfo.courseCategory === "Ongoing Training" && paymentOption === "Monthly With Discounts" && discountedMonthlyAmount > 0 && (
                  <>
                    <p className="font-medium text-purple-700">
                      Discounted Monthly: {currency}{discountedMonthlyAmount.toLocaleString()} 
                      <span className="text-gray-500 dark:text-white line-through ml-2">{currency}{baseMonthlyAmount.toLocaleString()}</span>
                    </p>
                    {(!payment.receivedAmount || payment.receivedAmount === 0) ? (
                      // First payment - show registration fees if applicable
                      <>
                        {((!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee && payment.studentRegistrationFee) || 
                          (!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee && payment.courseRegistrationFee)) && (
                          <p className="text-xs">
                            First payment includes: Discounted monthly {currency} {discountedMonthlyAmount.toLocaleString()}
                            {!payment.studentRegistrationFeePaid && selectedTypes.studentRegistrationFee && payment.studentRegistrationFee && ` + Student Reg {currency} ${payment.studentRegistrationFee.toLocaleString()}`}
                            {!payment.courseRegistrationFeePaid && selectedTypes.courseRegistrationFee && payment.courseRegistrationFee && ` + Course Reg {currency} ${payment.courseRegistrationFee.toLocaleString()}`}
                          </p>
                        )}
                      </>
                    ) : (
                      // Recurring payment - no registration fees
                      <p className="text-xs text-gray-500 dark:text-white">Recurring monthly payment (no registration fees)</p>
                    )}
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> Saving {currency} {(baseMonthlyAmount - discountedMonthlyAmount).toLocaleString()}/month
                    </p>
                  </>
                )}

                {/* Other payment types (non-Ongoing Training) */}
                {paymentOption === "Monthly" && courseInfo.courseCategory !== "Ongoing Training" && (
                  <>
                    <p>Default monthly total: {currency} {defaultMonthly.toLocaleString()}</p>
                    {(!payment.receivedAmount || payment.receivedAmount === 0) ? (
                      <p className="text-xs">
                        Includes: Monthly installment {currency} {displayMonthlyInstallment.toLocaleString()} + Registration fees {currency}
                        {((payment.studentRegistrationFee || 0) + (payment.courseRegistrationFee || 0)).toLocaleString()} 
                        (Student {currency} {(payment.studentRegistrationFee || 0).toLocaleString()} + Course {currency} {(payment.courseRegistrationFee || 0).toLocaleString()})
                      </p>
                    ) : (
                      <p className="text-xs">
                        Monthly installment: {currency} {displayMonthlyInstallment.toLocaleString()}
                      </p>
                    )}
                  </>
                )}
                
                <p className="text-green-600 flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  You can edit the payment amount as needed.
                </p>
              </div>
            </div>

            {/* Payment History Section */}
            {payment.receivedAmount > 0 && (
              <div className="space-y-2 p-3 border-2 border-indigo-200 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-indigo-900">
                  <Clock className="h-4 w-4" />
                  Previous Payment History
                </h3>
                
                {loadingHistory ? (
                  <div className="text-sm text-gray-600 dark:text-white animate-pulse">Loading payment history...</div>
                ) : paymentHistory.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-indigo-100">
                            <th className="px-2 py-1.5 text-left font-semibold">#</th>
                            <th className="px-2 py-1.5 text-left font-semibold">Date</th>
                            <th className="px-2 py-1.5 text-left font-semibold">Amount</th>
                            <th className="px-2 py-1.5 text-left font-semibold">Mode</th>
                            {paymentOption === 'EMI' && <th className="px-2 py-1.5 text-left font-semibold">EMI #</th>}
                            {paymentOption === 'One Time With Installments' && <th className="px-2 py-1.5 text-left font-semibold">Inst. #</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((record, index) => (
                            <tr key={record._id} className="border-t hover:bg-indigo-50">
                              <td className="px-2 py-1.5">{index + 1}</td>
                              <td className="px-2 py-1.5">
                                {formatDateForDisplay(record.paidDate)}
                              </td>
                              <td className="px-2 py-1.5 font-semibold text-green-700">
                                {currency} {(record.paidAmount || 0).toLocaleString()}
                              </td>
                              <td className="px-2 py-1.5">
                                <Badge variant="outline" className="text-xs">
                                  {record.paymentMode || 'Cash'}
                                </Badge>
                              </td>
                              {paymentOption === 'EMI' && (
                                <td className="px-2 py-1.5">
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    EMI {(record.emiNumber || index + 1)}
                                  </Badge>
                                </td>
                              )}
                              {paymentOption === 'One Time With Installments' && (
                                <td className="px-2 py-1.5">
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Inst. {(record.installmentNumber || index + 1)}
                                  </Badge>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-indigo-100 border-t-2 border-indigo-300 font-semibold">
                            <td colSpan={2} className="px-3 py-2 text-right">Total Paid:</td>
                            <td className="px-3 py-2 text-green-700">
                              {currency} {paymentHistory.reduce((sum, r) => sum + (r.paidAmount || 0), 0).toLocaleString()}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-indigo-200">
                        <p className="text-gray-600 dark:text-white">Course Fee</p>
                        <p className="font-bold text-indigo-900">{currency} {(payment.courseFee || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <p className="text-gray-600 dark:text-white">Total Paid</p>
                        <p className="font-bold text-green-700">{currency} {(payment.receivedAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded border border-orange-200">
                        <p className="text-gray-600 dark:text-white">Balance Due {courseInfo.paymentCategory === 'Monthly subscription' ? '(Monthly)' : '(Total)'}</p>
                        <p className="font-bold text-orange-700">{currency} {(payment.outstandingAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {paymentOption === 'One Time' && payment.outstandingAmount > 0 && (
                      <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> This is a <strong>partial payment</strong>. Recording this payment will update the balance.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-white">No previous payments recorded yet.</p>
                )}
              </div>
            )}

            {/* Payer Details */}
            <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
              <h3 className="font-semibold text-sm">Payer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Payer Type</Label>
                  <Select 
                    value={payerType} 
                    onValueChange={(value) => {
                      setPayerType(value as any);
                      
                      // Auto-populate payer name based on selection
                      if (value === 'student') {
                        setPayerName(payment.studentName || '');
                      } else if (value === 'guardian' && guardianInfo.fullName) {
                        setPayerName(guardianInfo.fullName);
                      } else {
                        setPayerName('');
                      }
                      
                      // Clear custom type when switching away from 'other'
                      if (value !== 'other') {
                        setCustomPayerType('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {payerType === 'other' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Specify Payer Type</Label>
                    <Input
                      type="text"
                      value={customPayerType}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow letters and spaces
                        if (/^[a-zA-Z\s]*$/.test(value)) {
                          setCustomPayerType(value);
                        }
                      }}
                      placeholder="e.g., Sponsor, Organization"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Payer Name (Optional)</Label>
                  <Input
                    type="text"
                    value={payerName}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow letters and spaces
                      if (/^[a-zA-Z\s]*$/.test(value)) {
                        setPayerName(value);
                      }
                    }}
                    placeholder={payment.studentName}
                  />
                </div>
              </div>
            </div>

            {/* Discount - Only for Monthly With Discounts */}
            {paymentOption === 'Monthly With Discounts' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}

            {/* Final Amount Calculation */}
            {discount && paymentAmount && paymentOption === 'Monthly With Discounts' && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-medium">{currency} {parseFloat(paymentAmount || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({parseFloat(discount)}%):</span>
                    <span>- {currency} {((parseFloat(paymentAmount || '0') * parseFloat(discount)) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
                    <span>Final Amount:</span>
                    <span>{currency} {(
                      parseFloat(paymentAmount || '0') - 
                      ((parseFloat(paymentAmount || '0') * parseFloat(discount || '0')) / 100)
                    ).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this payment..."
                className="text-sm"
                rows={3}
              />
            </div>

            {/* Real-time Due Amount Calculator - Shows remaining balance after current payment */}
            {(() => {
              // For ONE_TIME, include ALL fees (course + registrations)
              const effectiveFees = getEffectiveFees();
              const totalFees = effectiveFees.courseFee + 
                                effectiveFees.courseRegistrationFee + 
                                effectiveFees.studentRegistrationFee;
              const currentlyPaid = payment?.receivedAmount || 0;
              const enteredAmount = parseFloat(paymentAmount || '0');
              const totalAfterPayment = currentlyPaid + enteredAmount;
              const remainingBalance = totalFees - totalAfterPayment;
              
              // Determine status and color
              const isFullyPaid = remainingBalance <= 0;
              const isPartial = remainingBalance > 0 && enteredAmount > 0;
              const isOverpaid = remainingBalance < 0;

              if (!paymentAmount || enteredAmount === 0) return null;

              return (
                <div 
                  className={`p-4 border-l-4 rounded-lg ${
                    isFullyPaid 
                      ? 'bg-green-50 border-green-500' 
                      : isPartial 
                      ? 'bg-amber-50 border-amber-500' 
                      : 'bg-gray-50 border-gray-400'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-white">Total Fees:</span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">{currency} {totalFees.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-white">Already Paid:</span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">{currency} {currentlyPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-white">Current Payment:</span>
                      <span className="text-base font-bold text-blue-700">{currency} {enteredAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-300 my-2"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        {isFullyPaid ? <><CheckCircle2 className="h-4 w-4" /> Remaining Balance:</> : <><AlertTriangle className="h-4 w-4" /> Remaining Balance:</>}
                      </span>
                      <span 
                        className={`text-xl font-extrabold ${
                          isFullyPaid 
                            ? 'text-green-700' 
                            : isPartial 
                            ? 'text-amber-700' 
                            : 'text-gray-700 dark:text-white'
                        }`}
                      >
                        {currency} {Math.max(0, remainingBalance).toLocaleString()}
                      </span>
                    </div>
                    
                    {isFullyPaid && !isOverpaid && (
                      <p className="text-xs text-green-700 bg-green-100 p-2 rounded mt-2 flex items-center gap-1">
                        <PartyPopper className="h-3 w-3" /> Payment complete! Reminders will be automatically disabled.
                      </p>
                    )}
                    
                    {isOverpaid && (
                      <p className="text-xs text-green-700 bg-green-100 p-2 rounded mt-2 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Overpaid by {currency} {Math.abs(remainingBalance).toLocaleString()}. Payment marked as complete.
                      </p>
                    )}
                    
                    {isPartial && paymentOption === 'One Time' && (
                      <p className="text-xs text-amber-700 bg-amber-100 p-2 rounded mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Daily reminders will be automatically enabled for the remaining balance.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Reminder Settings - Enhanced for One-Time Partial Payments */}
            <Accordion type="single" collapsible className="border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <AccordionItem value="reminder-settings" className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <Label className="text-lg font-bold text-gray-800 dark:text-white cursor-pointer">Payment Reminder Settings</Label>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* One-Time Partial Payment Reminder Info Box */}
              {paymentOption === 'One Time' && (() => {
                const effectiveFees = getEffectiveFees();
                const totalFees = effectiveFees.courseFee + 
                                  effectiveFees.courseRegistrationFee + 
                                  effectiveFees.studentRegistrationFee;
                const currentlyPaid = payment?.receivedAmount || 0;
                const enteredAmount = parseFloat(paymentAmount || '0');
                const totalAfterPayment = currentlyPaid + enteredAmount;
                const willBePartial = totalAfterPayment < totalFees && enteredAmount > 0;
                
                if (willBePartial) {
                  return (
                    <div className="p-4 bg-blue-100 border-l-4 border-blue-600 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2 text-sm">
                          <p className="font-bold text-blue-900">Automatic Reminder Settings for Partial Payment:</p>
                          <ul className="space-y-1.5 text-blue-800">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">✓</span>
                              <span><strong>Next Payment Date:</strong> Tomorrow (day after this payment)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">✓</span>
                              <span><strong>Reminder Frequency:</strong> Daily at 10:00 AM</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">✓</span>
                              <span><strong>Duration:</strong> Unlimited until fully paid</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">✓</span>
                              <span><strong>Status:</strong> Auto-enabled (can be disabled below)</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Calculate and show due amount for One-Time partial payments */}
              {paymentOption === 'One Time' && payment.receivedAmount > 0 && (
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Partial Payment Detected</p>
                      <p className="text-sm text-amber-800 mt-1">
                        Current Due: <span className="font-bold">{currency} {(() => {
                          const effectiveFees = getEffectiveFees();
                          return (Number(effectiveFees.courseFee || 0) + Number(effectiveFees.courseRegistrationFee || 0) + Number(effectiveFees.studentRegistrationFee || 0) - (payment.receivedAmount || 0)).toLocaleString();
                        })()}</span>
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Daily reminders will continue until fully paid
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ========== AUTO-SCHEDULED PAYMENTS (Read-Only Display) ========== */}
              {(paymentOption === 'One Time With Installments' || paymentOption === 'EMI' || 
                paymentOption === 'Monthly' || paymentOption === 'Monthly With Discounts') && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div className="space-y-2 flex-1">
                      <p className="font-bold text-green-900">Automatic Reminder Schedule Active</p>
                      <ul className="text-sm text-gray-700 dark:text-white space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span>
                            {paymentOption === 'One Time With Installments' && 
                              'Reminder and due dates are shown in the installment details above'}
                            {paymentOption === 'EMI' && 
                              'Reminders are sent based on EMI schedule (X days before each due date)'}
                            {(paymentOption === 'Monthly' || paymentOption === 'Monthly With Discounts') && 
                              'Reminders are sent before each monthly billing cycle'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span><strong>No manual configuration needed</strong> - System handles everything automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span>You can disable reminders below if needed</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ONE-TIME PARTIAL PAYMENTS (Automatic Reminders Info) ========== */}
              {paymentOption === 'One Time' && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-900">Automatic Reminder Management</h4>
                      <p className="text-sm text-blue-800">
                        Reminders are <strong>automatically enabled</strong> when a partial payment is detected.
                      </p>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold">✓</span>
                          <div>
                            <span className="font-semibold">Partial Payment Detected?</span>
                            <p className="text-xs">Reminders auto-enable with daily frequency</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold">✓</span>
                          <div>
                            <span className="font-semibold">Next Reminder:</span>
                            <p className="text-xs">Tomorrow (1 day after payment)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold">✓</span>
                          <div>
                            <span className="font-semibold">Frequency:</span>
                            <p className="text-xs">Daily at 10:00 AM until fully paid</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold">✓</span>
                          <div>
                            <span className="font-semibold">Fully Paid?</span>
                            <p className="text-xs">Reminders automatically stop</p>
                          </div>
                        </div>
                      </div>
                      {payment.receivedAmount > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" /> <strong>Current Status:</strong> {payment.outstandingAmount > 0 
                              ? `Partial payment recorded (${currency} ${payment.receivedAmount.toLocaleString()} paid, ${currency} ${payment.outstandingAmount.toLocaleString()} remaining) - Reminders are active`
                              : 'Fully paid - No reminders needed'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ADMIN OVERRIDE: Stop Reminders (One-Time Only if needed) ========== */}
              {paymentOption === 'One Time' && payment.receivedAmount > 0 && payment.outstandingAmount > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-red-700 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" /> Stop Automatic Reminders
                    </Label>
                    <p className="text-xs text-red-600">
                      Override automatic reminders for this partial payment (not recommended)
                    </p>
                  </div>
                  <Switch
                    checked={stopReminders}
                    onCheckedChange={(checked) => {
                      setStopReminders(checked);
                      if (checked) setReminderEnabled(false);
                    }}
                  />
                </div>
              )}

              {/* ========== ADMIN OVERRIDE: Stop All Reminders (Other Payment Types) ========== */}
              {(paymentOption === 'One Time With Installments' || paymentOption === 'EMI' || 
                paymentOption === 'Monthly' || paymentOption === 'Monthly With Discounts') && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-red-700 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" /> Disable Automatic Reminders
                    </Label>
                    <p className="text-xs text-red-600">
                      Admin override to stop all scheduled reminders for this payment
                    </p>
                  </div>
                  <Switch
                    checked={stopReminders}
                    onCheckedChange={(checked) => {
                      setStopReminders(checked);
                      if (checked) setReminderEnabled(false);
                      else setReminderEnabled(true);
                    }}
                  />
                </div>
              )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSave}
            disabled={
              !paymentAmount || 
              !date || 
              !time || 
              !receivedBy || 
              !!paymentAmountError ||
              submitting ||
              (planType === 'EMI' && !payment.emiSchedule)
            }
          >
            {submitting ? 'Processing...' : 'Save & Generate Invoice'}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
