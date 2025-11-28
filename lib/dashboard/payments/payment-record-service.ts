import PaymentRecordModel from '@/models/dashboard/payments/PaymentRecord';
import Payment from '@/models/dashboard/payments/Payment';
import mongoose from 'mongoose';
import { getTenantContext, requireTenantId } from '@/lib/tenant/tenant-context';
import {
  PaymentRecord,
  PaymentBalance,
  InvoiceBreakdown,
  PaymentValidation,
  AddPaymentRecordData,
} from '@/types/dashboard/payment';

/**
 * Payment Record Service
 * Handles all operations related to payment records for one-time payments
 * including partial payments, EMI installments, and payment history tracking
 */

/**
 * Validate payment data before recording
 */
export function validatePaymentRecord(
  data: AddPaymentRecordData,
  currentBalance?: PaymentBalance
): PaymentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!data.paymentId) {
    errors.push('Payment ID is required');
  }
  if (!data.studentId) {
    errors.push('Student ID is required');
  }
  if (!data.studentName) {
    errors.push('Student name is required');
  }
  if (!data.paidAmount || data.paidAmount <= 0) {
    errors.push('Payment amount must be greater than zero');
  }
  if (!data.paidDate) {
    errors.push('Payment date is required');
  }
  if (!data.paymentMode) {
    errors.push('Payment mode is required');
  }
  if (!data.receivedBy) {
    errors.push('Received by is required');
  }

  // Business logic validation
  if (data.paidAmount < 0) {
    errors.push('Payment amount cannot be negative');
  }

  if (data.discount && data.discount < 0) {
    errors.push('Discount cannot be negative');
  }

  if (data.specialCharges && data.specialCharges < 0) {
    errors.push('Special charges cannot be negative');
  }

  if (data.taxAmount && data.taxAmount < 0) {
    errors.push('Tax amount cannot be negative');
  }

  // Check if payment exceeds remaining balance
  if (currentBalance && currentBalance.remainingAmount > 0) {
    const netPayment = data.paidAmount + (data.specialCharges || 0) + (data.taxAmount || 0) - (data.discount || 0);
    
    if (netPayment > currentBalance.remainingAmount) {
      warnings.push(
        `Payment amount (${netPayment}) exceeds remaining balance (${currentBalance.remainingAmount}). This will result in an overpayment.`
      );
    }
  }

  // Date validation
  if (data.paidDate) {
    const paymentDate = new Date(data.paidDate);
    const today = new Date();
    
    if (paymentDate > today) {
      warnings.push('Payment date is in the future');
    }

    // Check if date is more than 1 year old
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (paymentDate < oneYearAgo) {
      warnings.push('Payment date is more than 1 year old');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Add a new payment record
 * @param data Payment record data
 * @param tenantId Optional tenant ID (uses context if not provided)
 * @returns Created payment record
 */
export async function addPaymentRecord(
  data: AddPaymentRecordData,
  tenantId?: string
): Promise<{ success: boolean; record?: PaymentRecord; error?: string }> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      return {
        success: false,
        error: 'Tenant context required for payment operations',
      };
    }

    // Validate payment data
    const currentBalance = await calculateRemainingBalance(data.paymentId, effectiveTenantId);
    const validation = validatePaymentRecord(data, currentBalance);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Create payment record with tenant isolation
    const recordData: any = {
      tenantId: effectiveTenantId,
      paymentId: new mongoose.Types.ObjectId(data.paymentId),
      studentId: data.studentId,
      studentName: data.studentName,
      enrollmentId: data.enrollmentId,
      courseId: data.courseId,
      courseName: data.courseName,
      cohortId: data.cohortId,
      paidAmount: data.paidAmount,
      paidDate: new Date(data.paidDate),
      paymentMode: data.paymentMode,
      transactionId: data.transactionId,
      referenceId: data.referenceId,
      remarks: data.remarks,
      notes: data.notes,
      payerType: data.payerType || 'student',
      payerName: data.payerName,
      paymentOption: data.paymentOption,
      paymentSubType: data.paymentSubType,
      installmentNumber: data.installmentNumber,
      emiNumber: data.emiNumber,
      discount: data.discount || 0,
      specialCharges: data.specialCharges || 0,
      taxAmount: data.taxAmount || 0,
      receivedBy: data.receivedBy,
      processedBy: data.processedBy,
      paymentTime: data.paymentTime,
      attachments: data.attachments || [],
      metadata: data.metadata,
      status: 'CONFIRMED',
    };

    const paymentRecord = await PaymentRecordModel.create(recordData);

    // Generate receipt number
    if (!paymentRecord.receiptNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      paymentRecord.receiptNumber = `RCP-${year}${month}${day}-${random}`;
      await paymentRecord.save();
    }

    // Update main payment document
    await updatePaymentTotals(data.paymentId, effectiveTenantId);

    return {
      success: true,
      record: {
        ...paymentRecord.toObject(),
        _id: paymentRecord._id.toString(),
        paymentId: paymentRecord.paymentId.toString(),
      } as unknown as PaymentRecord,
    };
  } catch (error: any) {
    console.error('Error adding payment record:', error);
    return {
      success: false,
      error: error.message || 'Failed to add payment record',
    };
  }
}

/**
 * Get payment history for a specific payment
 * @param paymentId Payment ID
 * @param options Query options
 * @param tenantId Optional tenant ID (uses context if not provided)
 * @returns Array of payment records
 */
export async function getPaymentHistory(
  paymentId: string,
  options?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    skip?: number;
    includeDeleted?: boolean;
  },
  tenantId?: string
): Promise<PaymentRecord[]> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      console.error('Tenant context required for getPaymentHistory');
      return [];
    }

    const query: any = {
      paymentId: new mongoose.Types.ObjectId(paymentId),
      tenantId: effectiveTenantId,
    };

    if (!options?.includeDeleted) {
      query.isDeleted = false;
    }

    const sortBy = options?.sortBy || 'paidDate';
    const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

    const records = await PaymentRecordModel.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(options?.limit || 0)
      .skip(options?.skip || 0)
      .lean();

    return records.map(record => ({
      ...record,
      _id: record._id?.toString(),
      paymentId: record.paymentId?.toString(),
    })) as unknown as PaymentRecord[];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

/**
 * Calculate remaining balance for a payment
 * @param paymentId Payment ID
 * @param tenantId Optional tenant ID (uses context if not provided)
 * @returns Payment balance details
 */
export async function calculateRemainingBalance(
  paymentId: string,
  tenantId?: string
): Promise<PaymentBalance> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant context required for payment operations');
    }
    
    // Get payment document with tenant isolation
    const payment = await Payment.findOne({ _id: paymentId, tenantId: effectiveTenantId });
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Calculate total paid from payment records with tenant isolation
    const totalPaidResult = await PaymentRecordModel.aggregate([
      {
        $match: {
          paymentId: new mongoose.Types.ObjectId(paymentId),
          tenantId: effectiveTenantId,
          isDeleted: false,
          status: { $in: ['VERIFIED', 'CONFIRMED'] },
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].totalPaid : 0;
    const paymentCount = totalPaidResult.length > 0 ? totalPaidResult[0].count : 0;

    // Get total fee from payment document
    const totalFee = payment.courseFee || 0;

    // Calculate remaining amount
    const remainingAmount = Math.max(0, totalFee - totalPaid);

    // Calculate collection rate
    const collectionRate = totalFee > 0 ? (totalPaid / totalFee) * 100 : 0;

    // Determine status
    let status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID' = 'PENDING';
    if (totalPaid === 0) {
      status = 'PENDING';
    } else if (totalPaid >= totalFee) {
      status = totalPaid > totalFee ? 'OVERPAID' : 'PAID';
    } else {
      status = 'PARTIAL';
    }

    // Get last payment date with tenant isolation
    const lastPayment = await PaymentRecordModel.findOne({
      paymentId: new mongoose.Types.ObjectId(paymentId),
      tenantId: effectiveTenantId,
      isDeleted: false,
    })
      .sort({ paidDate: -1 })
      .lean();

    return {
      totalFee,
      totalPaid,
      remainingAmount,
      paymentCount,
      collectionRate,
      status,
      lastPaymentDate: lastPayment?.paidDate,
    };
  } catch (error) {
    console.error('Error calculating remaining balance:', error);
    throw error;
  }
}

/**
 * Update payment totals in the main Payment document
 * @param paymentId Payment ID
 * @param tenantId Tenant ID for isolation
 */
async function updatePaymentTotals(paymentId: string, tenantId?: string): Promise<void> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant context required for updatePaymentTotals');
    }

    const balance = await calculateRemainingBalance(paymentId, effectiveTenantId);

    // Update payment document with tenant isolation
    await Payment.findOneAndUpdate(
      { _id: paymentId, tenantId: effectiveTenantId },
      {
        receivedAmount: balance.totalPaid,
        outstandingAmount: balance.remainingAmount,
        collectionRate: balance.collectionRate,
        lastPaymentDate: balance.lastPaymentDate,
        paymentStatus: balance.status,
        status:
          balance.status === 'PAID' || balance.status === 'OVERPAID'
            ? 'Completed'
            : balance.status === 'PARTIAL'
            ? 'Partial'
            : 'Pending',
      }
    );
  } catch (error) {
    console.error('Error updating payment totals:', error);
    throw error;
  }
}

/**
 * Generate invoice breakdown with payment history
 * @param paymentId Payment ID
 * @returns Invoice breakdown details
 */
export async function generateInvoiceBreakdown(
  paymentId: string,
  tenantId?: string
): Promise<InvoiceBreakdown | null> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant context required for payment operations');
    }
    
    // Get payment document with tenant isolation
    const payment = await Payment.findOne({ _id: paymentId, tenantId: effectiveTenantId });
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Get payment history with tenant isolation
    const paymentRecords = await getPaymentHistory(paymentId, {
      sortBy: 'paidDate',
      sortOrder: 'asc',
    }, effectiveTenantId);

    // Calculate totals
    const totalPaid = paymentRecords.reduce((sum, record) => sum + record.paidAmount, 0);
    const totalDiscount = paymentRecords.reduce((sum, record) => sum + (record.discount || 0), 0);
    const totalSpecialCharges = paymentRecords.reduce(
      (sum, record) => sum + (record.specialCharges || 0),
      0
    );
    const totalTax = paymentRecords.reduce((sum, record) => sum + (record.taxAmount || 0), 0);

    const baseFee = payment.courseFee || 0;
    const totalFee = baseFee + totalSpecialCharges + totalTax - totalDiscount;
    const outstandingBalance = Math.max(0, totalFee - totalPaid);

    // Determine payment status
    let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID' = 'PENDING';
    if (totalPaid === 0) {
      paymentStatus = 'PENDING';
    } else if (totalPaid >= totalFee) {
      paymentStatus = totalPaid > totalFee ? 'OVERPAID' : 'PAID';
    } else {
      paymentStatus = 'PARTIAL';
    }

    // Format payment history for invoice
    const payments = paymentRecords.map((record) => ({
      date: record.paidDate,
      amount: record.paidAmount,
      mode: record.paymentMode,
      transactionId: record.transactionId,
      receiptNumber: record.receiptNumber,
      invoiceNumber: record.invoiceNumber,
      remarks: record.remarks,
    }));

    const breakdown: InvoiceBreakdown = {
      studentId: payment.studentId,
      studentName: payment.studentName,
      courseId: payment.enrolledCourseId,
      courseName: payment.enrolledCourseName,
      cohortId: payment.cohortId,
      cohortName: payment.cohortName,
      baseFee,
      discount: totalDiscount,
      specialCharges: totalSpecialCharges,
      taxAmount: totalTax,
      totalFee,
      payments,
      totalPaid,
      outstandingBalance,
      paymentStatus,
      generatedAt: new Date(),
    };

    return breakdown;
  } catch (error) {
    console.error('Error generating invoice breakdown:', error);
    return null;
  }
}

/**
 * Get payment record by ID
 * @param recordId Payment record ID
 * @returns Payment record
 */
export async function getPaymentRecordById(
  recordId: string,
  tenantId?: string
): Promise<PaymentRecord | null> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant context required for payment operations');
    }
    
    const record = await PaymentRecordModel.findOne({ _id: recordId, tenantId: effectiveTenantId }).lean();
    if (!record) return null;
    return {
      ...record,
      _id: record._id?.toString(),
      paymentId: record.paymentId?.toString(),
    } as unknown as PaymentRecord;
  } catch (error) {
    console.error('Error fetching payment record:', error);
    return null;
  }
}

/**
 * Update payment record
 * @param recordId Payment record ID
 * @param updates Update data
 * @returns Updated payment record
 */
export async function updatePaymentRecord(
  recordId: string,
  updates: Partial<PaymentRecord>,
  tenantId?: string
): Promise<{ success: boolean; record?: PaymentRecord; error?: string }> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      return {
        success: false,
        error: 'Tenant context required for payment operations',
      };
    }
    
    // Prevent updating critical fields
    const { _id, paymentId, studentId, createdAt, ...allowedUpdates } = updates;

    const record = await PaymentRecordModel.findOneAndUpdate(
      { _id: recordId, tenantId: effectiveTenantId },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).lean();

    if (!record) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    // Update payment totals if amount changed with tenant isolation
    if (updates.paidAmount) {
      await updatePaymentTotals(record.paymentId.toString(), effectiveTenantId);
    }

    return {
      success: true,
      record: {
        ...record,
        _id: record._id?.toString(),
        paymentId: record.paymentId?.toString(),
      } as unknown as PaymentRecord,
    };
  } catch (error: any) {
    console.error('Error updating payment record:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment record',
    };
  }
}

/**
 * Soft delete payment record
 * @param recordId Payment record ID
 * @param deletedBy User who deleted the record
 * @param tenantId Optional tenant ID (uses context if not provided)
 * @returns Success status
 */
export async function deletePaymentRecord(
  recordId: string,
  deletedBy: string,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      return {
        success: false,
        error: 'Tenant context required for payment operations',
      };
    }

    const record = await PaymentRecordModel.findOneAndUpdate(
      { _id: recordId, tenantId: effectiveTenantId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
        },
      },
      { new: true }
    );

    if (!record) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    // Update payment totals with tenant isolation
    await updatePaymentTotals(record.paymentId.toString(), effectiveTenantId);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting payment record:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete payment record',
    };
  }
}

/**
 * Get payment summary for a student
 * @param studentId Student ID
 * @param tenantId Optional tenant ID (uses context if not provided)
 * @returns Array of payment summaries
 */
export async function getStudentPaymentSummary(studentId: string, tenantId?: string) {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      console.error('Tenant context required for getStudentPaymentSummary');
      return [];
    }

    return await PaymentRecordModel.aggregate([
      {
        $match: {
          studentId,
          tenantId: effectiveTenantId,
          isDeleted: false,
          status: { $in: ['VERIFIED', 'CONFIRMED'] },
        },
      },
      {
        $group: {
          _id: '$paymentId',
          totalPaid: { $sum: '$paidAmount' },
          paymentCount: { $sum: 1 },
          lastPaymentDate: { $max: '$paidDate' },
          paymentModes: { $addToSet: '$paymentMode' },
        },
      },
      {
        $sort: { lastPaymentDate: -1 },
      },
    ]);
  } catch (error) {
    console.error('Error fetching student payment summary:', error);
    return [];
  }
}

/**
 * Verify payment record
 * @param recordId Payment record ID
 * @param verifiedBy User who verified the record
 * @param tenantId Optional tenant ID (uses context if not provided)
 * @returns Success status
 */
export async function verifyPaymentRecord(
  recordId: string,
  verifiedBy: string,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get tenant ID from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      return {
        success: false,
        error: 'Tenant context required for payment operations',
      };
    }

    const record = await PaymentRecordModel.findOneAndUpdate(
      { _id: recordId, tenantId: effectiveTenantId },
      {
        $set: {
          status: 'VERIFIED',
          verifiedBy,
          verifiedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!record) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error verifying payment record:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment record',
    };
  }
}
