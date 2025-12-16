import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { PaymentTransactionModel, IncomeModel } from "@/lib/dashboard/models";
import { processDropdownValues } from "@/lib/dashboard/dropdown-utils";
import { getUserSession } from "@/lib/tenant/api-helpers";
import { runWithTenantContext } from "@/lib/tenant/tenant-context";
import Payment from "@/models/dashboard/payments/Payment";

/**
 * Helper function to create an income record from a payment transaction
 */
async function createIncomeFromPaymentTransaction(paymentTransaction: any, tenantId: string) {
  try {
    // Convert to plain object to access fields properly
    const txn = paymentTransaction.toObject ? paymentTransaction.toObject() : paymentTransaction;
    
    // Ensure date is properly formatted
    const paymentDate = txn.paidDate || txn.paymentDate || txn.createdAt;
    if (!paymentDate) {
      throw new Error('Payment transaction has no date');
    }
    
    // Ensure amount is a valid number
    const amount = Number(txn.paidAmount || txn.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${txn.paidAmount}`);
    }

    // Map payment transaction fields to income fields directly from transaction
    const incomeData = {
      tenantId: tenantId, // Explicit tenant ID
      date: new Date(paymentDate),
      amount: amount,
      description: txn.courseName 
        ? `${txn.courseId || ''} - ${txn.courseName}`.trim() 
        : txn.notes || 'Course Payment',
      incomeCategory: "Course Fees",
      sourceType: "Students",
      paymentMode: txn.paymentMode || "Cash",
      status: "Completed",
      addToAccount: "", // Can be set based on business logic
      receivedBy: txn.receivedBy || "",
      receivedFrom: txn.studentName 
        ? `${txn.studentId || ''} - ${txn.studentName}`.trim()
        : txn.payerName || "",
      receiptNumber: "", // Leave empty when creating from payment transactions
    };

    console.log('Creating income with data:', { 
      date: incomeData.date, 
      amount: incomeData.amount,
      studentName: txn.studentName,
      transactionId: txn._id 
    });

    // Create the income record
    const createdIncome = await IncomeModel.create(incomeData);
    
    // Auto-add dropdown values to their respective collections
    await processDropdownValues(incomeData, 'income');
    
    return createdIncome;
  } catch (error: any) {
    console.error("Failed to create income record:", error);
    throw error;
  }
}

/**
 * GET /api/dashboard/financial/payments/migrate-incomes
 * Migration endpoint to create income records for existing payment transactions
 */
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");

        // Get all payment transactions that don't have corresponding income records
        const paymentTransactions = await PaymentTransactionModel.find({ 
          tenantId: session.tenantId,
          status: 'CONFIRMED' 
        }).sort({ paidDate: 1 });

        console.log(`Found ${paymentTransactions.length} payment transactions to process`);

        const results = {
          total: paymentTransactions.length,
          created: 0,
          alreadyExists: 0,
          failed: 0,
          errors: [] as any[]
        };

        // Check each payment transaction
        for (const transaction of paymentTransactions) {
          try {
            // Log the transaction fields to debug
            console.log('Processing transaction:', {
              _id: transaction._id,
              paidDate: transaction.paidDate,
              paymentDate: transaction.paymentDate,
              paidAmount: transaction.paidAmount,
              amount: transaction.amount,
              availableFields: Object.keys(transaction.toObject ? transaction.toObject() : transaction)
            });

            // Convert transaction to plain object
            const txn = transaction.toObject ? transaction.toObject() : transaction;
            
            // Check if income already exists for this transaction
            // We identify payment-generated incomes by: Course Fees category, Students source, empty receipt number
            const existingIncome = await IncomeModel.findOne({
              tenantId: session.tenantId,
              date: txn.paidDate || txn.paymentDate || txn.createdAt,
              amount: txn.paidAmount,
              incomeCategory: "Course Fees",
              sourceType: "Students",
              $or: [
                { receiptNumber: "" },
                { receiptNumber: { $exists: false } }
              ],
              receivedFrom: { $regex: new RegExp(txn.studentId, 'i') }
            });

            if (existingIncome) {
              console.log(`Income already exists for transaction ${transaction._id}`);
              results.alreadyExists++;
              continue;
            }

            // Create income record
            const income = await createIncomeFromPaymentTransaction(transaction, session.tenantId);
            console.log(`✓ Created income ${income._id} for transaction ${transaction._id}`);
            results.created++;

          } catch (error: any) {
            console.error(`✗ Failed to process transaction ${transaction._id}:`, error);
            results.failed++;
            results.errors.push({
              transactionId: transaction._id,
              error: error.message
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Migration completed: ${results.created} income records created, ${results.alreadyExists} already existed, ${results.failed} failed`,
          results
        }, { status: 200 });

      } catch (err: any) {
        console.error("Migration error:", err);
        return NextResponse.json({ 
          error: "Migration failed", 
          details: err?.message 
        }, { status: 500 });
      }
    }
  );
}
