/**
 * Payment Storage Helper
 * 
 * This module ensures that payment data is properly stored in both collections:
 * 1. payments - Main payment records (one per student)
 * 2. paymenttransactions - Transaction history (multiple records per student)
 */

import Payment from '@/models/dashboard/payments/Payment';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';
import { getTenantContext } from '@/lib/tenant/tenant-context';

interface PaymentData {
  studentId: string;
  studentName: string;
  amount: number;
  paymentOption: 'One Time' | 'Monthly';
  selectedTypes: {
    coursePayment: boolean;
    studentRegistrationFee: boolean;
    courseRegistrationFee: boolean;
  };
  paymentDate: Date;
  mode: string;
  receivedBy: string;
  notes?: string;
  tenantId?: string; // Optional - will use context if not provided
}

/**
 * Validates that both collections are properly configured
 */
export function validateCollections() {
  const paymentCollectionName = Payment.collection.name;
  const transactionCollectionName = PaymentTransaction.collection.name;
  
  if (paymentCollectionName !== 'payments') {
    throw new Error(`Payment collection misconfigured: expected 'payments', got '${paymentCollectionName}'`);
  }
  
  if (transactionCollectionName !== 'paymenttransactions') {
    throw new Error(`Transaction collection misconfigured: expected 'paymenttransactions', got '${transactionCollectionName}'`);
  }
  
  console.log('✓ Collections validated successfully');
  console.log('  - Payment collection:', paymentCollectionName);
  console.log('  - Transaction collection:', transactionCollectionName);
  
  return {
    paymentCollection: paymentCollectionName,
    transactionCollection: transactionCollectionName,
  };
}

/**
 * Creates a payment transaction record
 * This is called after successfully saving a payment
 */
export async function createPaymentTransaction(
  payment: any,
  transactionData: PaymentData
): Promise<any> {
  try {
    console.log('Creating transaction record...');
    console.log('  - Payment ID:', payment._id);
    console.log('  - Student ID:', transactionData.studentId);
    console.log('  - Amount:', transactionData.amount);
    
    // Get tenantId from data, payment, or context
    const tenantId = transactionData.tenantId || payment.tenantId || getTenantContext()?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID is required for creating payment transaction');
    }
    
    const transaction = await PaymentTransaction.create({
      tenantId, // Explicit tenant isolation
      paymentId: payment._id,
      studentId: transactionData.studentId,
      studentName: transactionData.studentName,
      paidAmount: transactionData.amount, // Use correct field name
      paymentOption: transactionData.paymentOption,
      selectedTypes: transactionData.selectedTypes,
      paidDate: transactionData.paymentDate, // Use correct field name
      paymentMode: transactionData.mode, // Use correct field name
      receivedBy: transactionData.receivedBy,
      notes: transactionData.notes,
      status: 'CONFIRMED',
    });
    
    console.log('✓ Transaction created successfully');
    console.log('  - Transaction ID:', transaction._id);
    console.log('  - Collection:', PaymentTransaction.collection.name);
    
    return transaction;
  } catch (error: any) {
    console.error('✗ Failed to create transaction record');
    console.error('  - Error:', error.message);
    throw new Error(`Transaction creation failed: ${error.message}`);
  }
}

/**
 * Verifies that a payment and its transactions exist
 * @param studentId Student ID
 * @param tenantId Optional tenant ID (uses context if not provided)
 */
export async function verifyPaymentRecords(studentId: string, tenantId?: string) {
  try {
    // Get tenantId from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant ID is required for verifying payment records');
    }
    
    const payment = await Payment.findOne({ studentId, tenantId: effectiveTenantId });
    const transactions = await PaymentTransaction.find({ studentId, tenantId: effectiveTenantId });
    
    return {
      paymentExists: !!payment,
      transactionCount: transactions.length,
      payment,
      transactions,
      isValid: !!payment && transactions.length > 0,
    };
  } catch (error: any) {
    console.error('Error verifying payment records:', error);
    throw error;
  }
}

/**
 * Gets a summary of payment storage status
 * @param tenantId Optional tenant ID (uses context if not provided)
 */
export async function getPaymentStorageStatus(tenantId?: string) {
  try {
    // Get tenantId from parameter or context
    const effectiveTenantId = tenantId || getTenantContext()?.tenantId;
    if (!effectiveTenantId) {
      throw new Error('Tenant ID is required for getting payment storage status');
    }
    
    const paymentCount = await Payment.countDocuments({ tenantId: effectiveTenantId });
    const transactionCount = await PaymentTransaction.countDocuments({ tenantId: effectiveTenantId });
    
    return {
      collections: {
        payments: {
          name: Payment.collection.name,
          count: paymentCount,
        },
        paymenttransactions: {
          name: PaymentTransaction.collection.name,
          count: transactionCount,
        },
      },
      status: {
        bothConfigured: Payment.collection.name === 'payments' && 
                       PaymentTransaction.collection.name === 'paymenttransactions',
        bothHaveData: paymentCount > 0 && transactionCount > 0,
      },
    };
  } catch (error: any) {
    console.error('Error getting storage status:', error);
    throw error;
  }
}
