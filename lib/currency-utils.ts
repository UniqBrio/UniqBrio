// Utility script to find and replace hardcoded INR references
// Run this to identify files that need currency updates

export const filesWithHardcodedCurrency = [
  "app/dashboard/financials/page.tsx",
  "components/dashboard/financials/StatsOverview.tsx",
  "components/dashboard/financials/IncomeDialog.tsx",
  "components/dashboard/financials/ExpenseDialog.tsx",
  "components/dashboard/financials/ReportsSection.tsx",
  "components/dashboard/financials/ROICalculator.tsx",
  "components/dashboard/financials/ForecastSection.tsx",
  "components/dashboard/payments/page.tsx",
  // Add more files as needed
]

// Helper hook to use in components
export { useCurrency, formatCurrency } from "@/contexts/currency-context"
