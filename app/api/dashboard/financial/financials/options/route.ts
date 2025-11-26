import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { IncomeModel, ExpenseModel, BankAccountModel } from "@/lib/dashboard/models";
import { getUserSession } from "@/lib/tenant/api-helpers";
import { runWithTenantContext } from "@/lib/tenant/tenant-context";

// GET /api/financials/options
// Returns dropdown options extracted dynamically from existing income/expense records
export async function GET(_req: NextRequest) {
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
        // Connect to MongoDB with retry logic
        const maxRetries = 3;
        let connection;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            connection = await dbConnect("uniqbrio");
            break;
          } catch (error) {
            console.error(`MongoDB connection attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }

        // Get dropdown options ONLY from existing records using distinct() queries
        const [
          incomeCategoriesRaw,
          incomeSourcesRaw,
          incomePaymentModesRaw,
          incomeAccountsRaw,
          expensePaymentModesRaw,
          expenseCategoriesRaw,
          vendorNamesRaw,
          vendorTypesRaw,
          expenseAccountsRaw,
        ] = await Promise.all([
          IncomeModel.distinct("incomeCategory"),
          IncomeModel.distinct("sourceType"),
          IncomeModel.distinct("paymentMode"),
          IncomeModel.distinct("addToAccount"),
          ExpenseModel.distinct("paymentMode"),
          ExpenseModel.distinct("expenseCategory"),
          ExpenseModel.distinct("vendorName"),
          ExpenseModel.distinct("vendorType"),
          ExpenseModel.distinct("addFromAccount"),
        ]);

        // Combine payment modes from both income and expense records
        const paymentModes = Array.from(new Set([
          ...incomePaymentModesRaw.filter(Boolean),
          ...expensePaymentModesRaw.filter(Boolean),
        ]));

        // Bank accounts -> use a friendly display label
        const bankAccounts = await BankAccountModel.find({}, "bankName accountNumber holderName").lean();
        const accountLabelsFromBanks = bankAccounts.map((b: any) => {
          const parts = [b.bankName, b.accountNumber].filter(Boolean).join(" • ");
          return parts || b.holderName || "Account";
        });
        
        // Combine all account options from records and bank accounts
        const allAccounts = Array.from(new Set([
          ...incomeAccountsRaw.filter(Boolean),
          ...expenseAccountsRaw.filter(Boolean),
          ...accountLabelsFromBanks,
        ])).filter(l => l && !/^others?$/i.test(l)).map(s => String(s).trim());

        // Ensure unique, trimmed, non-empty strings for all fields
        const normalize = (arr: any[]) =>
          Array.from(new Set((arr || []).map((s) => String(s || "").trim()).filter(Boolean)));

        const data = {
          incomeCategories: normalize(incomeCategoriesRaw),
          incomeSources: normalize(incomeSourcesRaw),
          paymentModes: normalize(paymentModes),
          accounts: normalize(allAccounts),
          expenseCategories: normalize(expenseCategoriesRaw),
          vendorNames: normalize(vendorNamesRaw),
          vendorTypes: normalize(vendorTypesRaw),
        };

        return NextResponse.json(data);
      } catch (err: any) {
        console.error("/api/dashboard/financials/options error", err);
        return NextResponse.json({ error: err?.message || "Failed to load options" }, { status: 500 });
      }
    }
  );
}
