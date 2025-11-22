/**
 * Payment Storage Helper
 * 
 * This module ensures that payment data is properly stored in both collections:
 * 1. payments - Main payment records (one per student)
 * 2. paymenttransactions - Transaction history (multiple records per student)
 */

import Payment from '@/models/dashboard/payments/Payment';
import PaymentTransaction from '@/models/dashboard/payments/PaymentTransaction';

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
    
    const transaction = await PaymentTransaction.create({
      paymentId: payment._id,
      studentId: transactionData.studentId,
      studentName: transactionData.studentName,
      amount: transactionData.amount,
      paymentOption: transactionData.paymentOption,
      selectedTypes: transactionData.selectedTypes,
      paymentDate: transactionData.paymentDate,
      mode: transactionData.mode,
      receivedBy: transactionData.receivedBy,
      notes: transactionData.notes,
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
 */
export async function verifyPaymentRecords(studentId: string) {
  try {
    const payment = await Payment.findOne({ studentId });
    const transactions = await PaymentTransaction.find({ studentId });
    
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
 */
export async function getPaymentStorageStatus() {
  try {
    const paymentCount = await Payment.countDocuments();
    const transactionCount = await PaymentTransaction.countDocuments();
    
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
