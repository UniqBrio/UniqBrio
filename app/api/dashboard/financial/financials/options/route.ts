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
          IncomeModel.distinct("incomeCategory", { tenantId: session.tenantId }),
          IncomeModel.distinct("sourceType", { tenantId: session.tenantId }),
          IncomeModel.distinct("paymentMode", { tenantId: session.tenantId }),
          IncomeModel.distinct("addToAccount", { tenantId: session.tenantId }),
          ExpenseModel.distinct("paymentMode", { tenantId: session.tenantId }),
          ExpenseModel.distinct("expenseCategory", { tenantId: session.tenantId }),
          ExpenseModel.distinct("vendorName", { tenantId: session.tenantId }),
          ExpenseModel.distinct("vendorType", { tenantId: session.tenantId }),
          ExpenseModel.distinct("addFromAccount", { tenantId: session.tenantId }),
        ]);

        // Combine payment modes from both income and expense records
        const paymentModes = Array.from(new Set([
          ...incomePaymentModesRaw.filter(Boolean),
          ...expensePaymentModesRaw.filter(Boolean),
        ]));

        // Bank accounts -> use a friendly display label
        const bankAccounts = await BankAccountModel.find({ tenantId: session.tenantId }, "bankName accountNumber holderName").lean();
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

        // Default options for new tenants with no existing records
        const defaultIncomeCategories = ['Course Fee', 'Registration Fee', 'Coaching Fee', 'Equipment Sale', 'Event Fee', 'Sponsorship', 'Donation', 'Membership Fee', 'Merchandise', 'Other'];
        const defaultIncomeSources = ['Student', 'Parent', 'Corporate', 'Government Grant', 'Sponsorship', 'Event', 'Online', 'Walk-in', 'Referral', 'Other'];
        const defaultPaymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Net Banking', 'Wallet'];
        const defaultExpenseCategories = ['Salaries', 'Rent', 'Utilities', 'Equipment', 'Maintenance', 'Marketing', 'Travel', 'Supplies', 'Insurance', 'Other'];
        const defaultVendorTypes = ['Supplier', 'Service Provider', 'Contractor', 'Utility', 'Government', 'Other'];

        // Merge existing records with defaults (existing values take priority, defaults fill in gaps)
        const mergeWithDefaults = (existing: any[], defaults: string[]) => {
          const normalized = normalize(existing);
          if (normalized.length === 0) {
            return defaults;
          }
          // Return existing values plus any defaults not already present
          const existingLower = normalized.map(s => s.toLowerCase());
          const additionalDefaults = defaults.filter(d => !existingLower.includes(d.toLowerCase()));
          return [...normalized, ...additionalDefaults];
        };

        const data = {
          incomeCategories: mergeWithDefaults(incomeCategoriesRaw, defaultIncomeCategories),
          incomeSources: mergeWithDefaults(incomeSourcesRaw, defaultIncomeSources),
          paymentModes: mergeWithDefaults(paymentModes, defaultPaymentModes),
          accounts: normalize(allAccounts), // No defaults for accounts - they should come from bank setup
          expenseCategories: mergeWithDefaults(expenseCategoriesRaw, defaultExpenseCategories),
          vendorNames: normalize(vendorNamesRaw), // No defaults for vendor names
          vendorTypes: mergeWithDefaults(vendorTypesRaw, defaultVendorTypes),
        };

        return NextResponse.json(data);
      } catch (err: any) {
        console.error("/api/dashboard/financials/options error", err);
        return NextResponse.json({ error: err?.message || "Failed to load options" }, { status: 500 });
      }
    }
  );
}
