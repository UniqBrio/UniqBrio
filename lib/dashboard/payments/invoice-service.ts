import { PaymentRecord } from '@/types/dashboard/payment';
import { sendPaymentConfirmationEmail } from '../email-service';
import { sendPaymentConfirmationNotification } from '../notification-service';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  studentId: string;
  studentName: string;
  courseName: string;
  cohortName: string;
  paymentAmount: number;
  paymentMode: string;
  receivedBy: string;
  planType: string;
  paymentOption?: string; // Payment category
  paymentSubType?: string; // Payment subcategory
  emiDetails?: {
    emiNumber: number;
    totalEmis: number;
  };
  discount?: number;
  specialCharges?: number;
  finalAmount: number;
  notes?: string;
  paymentHistory?: Array<{
    date: Date;
    amount: number;
    mode: string;
    invoiceNumber: string;
    paymentSubType?: string;
  }>;
  totalPaidToDate?: number;
  remainingBalance?: number;
  nextPaymentDate?: Date; // For monthly subscriptions
  monthlyInstallment?: number; // Monthly subscription amount
  currency?: string; // Currency code (e.g., "USD", "EUR", "CAD")
}

/**
 * Generate invoice data structure
 */
export function generateInvoiceData(
  payment: any,
  transaction: any, // Transaction object with extended properties
  invoiceNumber: string,
  previousTransactions?: any[],
  currency: string = '' // Currency symbol
): InvoiceData {
  const finalAmount =
    transaction.amount +
    (transaction.specialCharges || 0) -
    (transaction.discount || 0);

  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate: transaction.paymentDate,
    studentId: payment.studentId,
    studentName: payment.studentName,
    courseName: payment.enrolledCourseName,
    cohortName: payment.cohortName,
    paymentAmount: transaction.amount,
    paymentMode: transaction.paymentMode,
    receivedBy: transaction.receivedBy,
    planType: transaction.planType,
    paymentOption: transaction.paymentOption,
    paymentSubType: transaction.paymentSubType,
    discount: transaction.discount,
    specialCharges: transaction.specialCharges,
    finalAmount,
    notes: transaction.notes,
    currency,
  };

  // Add EMI details if applicable
  if (transaction.planType === 'EMI' && transaction.emiIndex !== undefined && payment.emiSchedule) {
    invoiceData.emiDetails = {
      emiNumber: transaction.emiIndex + 1,
      totalEmis: payment.emiSchedule.length,
    };
  }

  // Always add payment history for partial payments (EMI, Installments, and One-Time with multiple payments)
  const totalFees = (payment.courseFee || 0) + (payment.courseRegistrationFee || 0) + (payment.studentRegistrationFee || 0);
  const isPartialPayment = transaction.paymentSubType === 'Partial Payment' || 
                          (previousTransactions && previousTransactions.length > 0);
  
  if (isPartialPayment || (previousTransactions && previousTransactions.length > 0)) {
    // Create comprehensive payment history including previous transactions
    invoiceData.paymentHistory = (previousTransactions || []).map((txn) => ({
      date: txn.paymentDate,
      amount: txn.amount,
      mode: txn.paymentMode || txn.mode,
      invoiceNumber: txn.invoiceNumber || 'N/A',
      paymentSubType: txn.paymentSubType || 'Payment',
    }));

    // Calculate totals including the current payment
    const totalPaidBefore = (previousTransactions || []).reduce(
      (sum, txn) => sum + (txn.amount || 0),
      0
    );
    const totalPaidToDate = totalPaidBefore + transaction.amount;
    
    invoiceData.totalPaidToDate = totalPaidToDate;
    invoiceData.remainingBalance = Math.max(totalFees - totalPaidToDate, 0);
    
    console.log(`Payment History: ${(previousTransactions || []).length} previous payments, Total paid: ${currency}${totalPaidToDate}, Remaining: ${currency}${invoiceData.remainingBalance}`);
  } else {
    // For single payments, still calculate totals
    invoiceData.totalPaidToDate = transaction.amount;
    invoiceData.remainingBalance = Math.max(totalFees - transaction.amount, 0);
  }

  return invoiceData;
}

/**
 * Generate invoice PDF (placeholder - implement with actual PDF library)
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  // TODO: Implement PDF generation using a library like jsPDF or pdfkit
  // For now, return a mock URL
  const mockUrl = `/invoices/${invoiceData.invoiceNumber}.pdf`;
  console.log('Invoice PDF generated:', mockUrl);
  return mockUrl;
}

/**
 * Save invoice to storage
 */
export async function saveInvoice(
  invoiceData: InvoiceData,
  pdfUrl: string
): Promise<void> {
  // TODO: Implement invoice storage (could be MongoDB, S3, etc.)
  console.log('Invoice saved:', {
    invoiceNumber: invoiceData.invoiceNumber,
    pdfUrl,
  });
}

/**
 * Send invoice email to payer
 */
export async function sendInvoiceEmail(
  invoiceData: InvoiceData,
  recipientEmail: string,
  pdfUrl: string
): Promise<void> {
  try {
    await sendPaymentConfirmationEmail(
      recipientEmail,
      invoiceData.studentName,
      {
        amount: invoiceData.finalAmount,
        paymentDate: invoiceData.invoiceDate,
        paymentMode: invoiceData.paymentMode,
        courseName: invoiceData.courseName,
        invoiceNumber: invoiceData.invoiceNumber,
        paymentOption: invoiceData.paymentOption,
        paymentSubType: invoiceData.paymentSubType,
        invoiceUrl: pdfUrl,
      }
    );
    console.log('Invoice email sent successfully:', {
      to: recipientEmail,
      invoiceNumber: invoiceData.invoiceNumber,
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation(
  payment: any,
  transaction: any, // Transaction object with extended properties
  invoiceUrl: string,
  isLastPayment: boolean = false
): Promise<void> {
  try {
    // Use studentEmail from payment object
    const recipientEmail = payment.studentEmail;
    
    if (!recipientEmail) {
      console.warn('No student email found, skipping notifications');
      return;
    }
    
    // Send both email and in-app notifications
    const results = await sendPaymentConfirmationNotification(
      payment.studentId,
      recipientEmail,
      payment.studentName,
      {
        amount: transaction.amount,
        paymentDate: transaction.paymentDate,
        paymentMode: transaction.paymentMode,
        courseName: payment.enrolledCourseName,
        invoiceNumber: transaction.invoiceNumber || '',
        paymentOption: transaction.paymentOption,
        paymentSubType: transaction.paymentSubType,
        invoiceUrl,
        nextPaymentDate: payment.nextPaymentDate,
        monthlyInstallment: payment.monthlyInstallment,
        isLastPayment,
        dueAmount: payment.dueAmount || payment.outstandingAmount || 0,
      }
    );
    
    console.log('Payment confirmation notifications sent:', {
      studentId: payment.studentId,
      studentName: payment.studentName,
      emailSent: results.emailSent,
      inAppCreated: results.inAppCreated,
      isLastPayment,
    });
  } catch (error) {
    console.error('Error sending payment confirmation notifications:', error);
    // Don't throw - we don't want to fail payment recording if notifications fail
  }
}

/**
 * Generate thank you email content
 */
export function generateThankYouEmail(
  payment: any,
  transaction: any, // Transaction object with extended properties
  isLastPayment: boolean
): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const subject = isLastPayment
    ? '🎉 All Payments Complete - Thank You!'
    : '✅ Payment Received - Thank You!';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Payment Received Successfully</h2>
      
      <p>Dear ${payment.studentName},</p>
      
      <p>We have received your payment. Thank you!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Payment Details</h3>
        <p><strong>Amount:</strong> ${transaction.currency}${transaction.amount.toLocaleString()}</p>
        <p><strong>Payment Date:</strong> ${new Date(transaction.paymentDate).toLocaleDateString()}</p>
        <p><strong>Payment Mode:</strong> ${transaction.paymentMode}</p>
        <p><strong>Course:</strong> ${payment.enrolledCourseName}</p>
      </div>
      
      ${
        isLastPayment
          ? `
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">🎉 Congratulations!</h3>
          <p>All your dues have been cleared. Thank you for your timely payments!</p>
        </div>
      `
          : payment.nextPaymentDate
          ? `
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #e65100; margin-top: 0;">Next Payment Due</h3>
          <p><strong>Date:</strong> ${new Date(payment.nextPaymentDate).toLocaleDateString()}</p>
          <p><strong>Amount:</strong> ${payment.currency}${(payment.monthlyInstallment || 0).toLocaleString()}</p>
        </div>
      `
          : ''
      }
      
      <p>Your invoice is attached to this email.</p>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      UniqBrio Team</p>
    </div>
  `;

  const textBody = `
Payment Received Successfully

Dear ${payment.studentName},

We have received your payment. Thank you!

Payment Details:
- Amount: ${transaction.currency}${transaction.amount.toLocaleString()}
- Payment Date: ${new Date(transaction.paymentDate).toLocaleDateString()}
- Payment Mode: ${transaction.paymentMode}
- Course: ${payment.enrolledCourseName}

${
  isLastPayment
    ? '\n🎉 Congratulations! All your dues have been cleared. Thank you for your timely payments!\n'
    : payment.nextPaymentDate
    ? `\nNext Payment Due:\n- Date: ${new Date(payment.nextPaymentDate).toLocaleDateString()}\n- Amount: ${payment.currency}${(payment.monthlyInstallment || 0).toLocaleString()}\n`
    : ''
}

Your invoice is attached to this email.

If you have any questions, please don't hesitate to contact us.

Best regards,
UniqBrio Team
  `;

  return { subject, htmlBody, textBody };
}
