import { dbConnect } from '@/lib/mongodb';
import { PaymentTransactionModel, IncomeModel } from '@/lib/dashboard/models';
import { processDropdownValues } from './dropdown-utils';

/**
 * Creates an income record from a payment transaction
 */
async function createIncomeFromPayment(paymentData: any) {
  try {
    // Map payment transaction fields to income fields
    const incomeData = {
      date: paymentData.paymentDate || new Date(),
      amount: paymentData.amount,
      description: paymentData.courseName 
        ? `${paymentData.courseId || ''} - ${paymentData.courseName}`.trim() 
        : paymentData.notes || 'Course Payment',
      incomeCategory: "Course Fees",
      sourceType: "Students",
      paymentMode: paymentData.mode || "Cash",
      status: "Completed",
      addToAccount: "", // Can be set based on business logic
      receivedBy: paymentData.receivedBy || "",
      receivedFrom: paymentData.studentName 
        ? `${paymentData.studentId || ''} - ${paymentData.studentName}`.trim()
        : paymentData.payerName || "",
      receiptNumber: "", // Leave empty when creating from payment transactions
    };

    console.log('[Payment Watcher] Creating income record:', incomeData);

    // Create the income record
    const createdIncome = await IncomeModel.create(incomeData);
    
    // Auto-add dropdown values to their respective collections
    await processDropdownValues(incomeData, 'income');
    
    console.log('[Payment Watcher] ✅ Income record created:', createdIncome._id);
    return createdIncome;
  } catch (error: any) {
    console.error('[Payment Watcher] ❌ Failed to create income record:', error);
    throw error;
  }
}

/**
 * Watches the paymenttransactions collection for new inserts
 * and automatically creates corresponding income records
 */
export async function startPaymentWatcher() {
  try {
    await connectMongo();
    console.log('[Payment Watcher] 🔍 Starting payment transaction watcher...');

    // Watch for changes in paymenttransactions collection
    const changeStream = PaymentTransactionModel.watch([
      { $match: { operationType: 'insert' } }
    ] as any, { fullDocument: 'updateLookup' } as any);

    changeStream.on('change', async (change: any) => {
      console.log('[Payment Watcher] 📝 New payment detected:', change.documentKey);
      
      if (change.operationType === 'insert' && change.fullDocument) {
        try {
          await createIncomeFromPayment(change.fullDocument);
        } catch (error) {
          console.error('[Payment Watcher] Error processing payment:', error);
        }
      }
    });

    changeStream.on('error', (error) => {
      console.error('[Payment Watcher] ❌ Change stream error:', error);
      // Attempt to restart the watcher after a delay
      setTimeout(() => {
        console.log('[Payment Watcher] 🔄 Attempting to restart watcher...');
        startPaymentWatcher();
      }, 5000);
    });

    console.log('[Payment Watcher] ✅ Watcher started successfully');
    return changeStream;
  } catch (error: any) {
    console.error('[Payment Watcher] ❌ Failed to start watcher:', error);
    
    // If change streams aren't supported (e.g., standalone MongoDB instead of replica set)
    if (error.message?.includes('$changeStream') || error.codeName === 'ChangeStreamFatalError') {
      console.warn('[Payment Watcher] ⚠️ Change streams not supported. Using polling fallback...');
      return startPollingFallback();
    }
    
    throw error;
  }
}

/**
 * Fallback polling mechanism if MongoDB change streams aren't available
 * (change streams require MongoDB replica set or sharded cluster)
 */
async function startPollingFallback() {
  console.log('[Payment Watcher] 🔄 Starting polling fallback (checking every 10 seconds)...');
  
  let lastCheckedAt = new Date();
  
  const pollInterval = setInterval(async () => {
    try {
      // Find payments created since last check
      const newPayments = await PaymentTransactionModel.find({
        createdAt: { $gt: lastCheckedAt }
      }).sort({ createdAt: 1 });

      if (newPayments.length > 0) {
        console.log(`[Payment Watcher] Found ${newPayments.length} new payment(s)`);
        
        for (const payment of newPayments) {
          // Check if income already exists for this payment
          const existingIncome = await IncomeModel.findOne({
            receiptNumber: payment.paymentId?.toString() || payment._id.toString()
          });

          if (!existingIncome) {
            try {
              await createIncomeFromPayment(payment);
            } catch (error) {
              console.error('[Payment Watcher] Error processing payment:', error);
            }
          } else {
            console.log('[Payment Watcher] Income already exists for payment:', payment._id);
          }
        }
      }

      lastCheckedAt = new Date();
    } catch (error) {
      console.error('[Payment Watcher] Polling error:', error);
    }
  }, 10000); // Check every 10 seconds

  return {
    stop: () => clearInterval(pollInterval)
  };
}

/**
 * Backfill: Create income records for existing payments that don't have them
 */
export async function backfillIncomeFromPayments() {
  try {
    await connectMongo();
    console.log('[Payment Backfill] 🔄 Starting backfill process...');

    const payments = await PaymentTransactionModel.find({});
    console.log(`[Payment Backfill] Found ${payments.length} total payments`);

    let created = 0;
    let skipped = 0;

    for (const payment of payments) {
      // Check if income already exists
      const receiptNumber = payment.paymentId?.toString() || payment._id.toString();
      const existingIncome = await IncomeModel.findOne({ receiptNumber });

      if (!existingIncome) {
        try {
          await createIncomeFromPayment(payment);
          created++;
        } catch (error) {
          console.error(`[Payment Backfill] Failed to create income for payment ${payment._id}:`, error);
        }
      } else {
        skipped++;
      }
    }

    console.log(`[Payment Backfill] ✅ Complete: ${created} created, ${skipped} skipped`);
    return { created, skipped, total: payments.length };
  } catch (error) {
    console.error('[Payment Backfill] ❌ Backfill failed:', error);
    throw error;
  }
}
