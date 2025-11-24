# Currency Management System

## Overview
This system allows dynamic currency changes throughout the entire application, replacing hardcoded "INR" references.

## How It Works

### 1. Currency Context (`contexts/currency-context.tsx`)
- Provides global currency state across all dashboard pages
- Fetches current currency from backend on load
- Exposes `useCurrency()` hook for components

### 2. Currency Provider
- Wrapped around dashboard layout in `app/dashboard/layout.tsx`
- Ensures all dashboard pages have access to current currency

### 3. Currency Change Dialog
- Located in `components/dashboard/settings/academy-info-settings.tsx`
- Shows when user selects a new currency
- Two options:
  - **Replace Currency Code**: Changes display only (INR 5,000 → CAD 5,000)
  - **Convert Currency**: Recalculates all prices (INR 5,000 → CAD 82)

### 4. Currency Conversion API (`app/api/dashboard/convert-currency/route.ts`)
- Fetches live exchange rates from exchangerate-api.com
- Converts all prices in database when "Convert Currency" is selected
- Has fallback rates if API is unavailable

## Usage in Components

### Import the hook:
```tsx
import { useCurrency, formatCurrency } from "@/contexts/currency-context"
```

### Use in component:
```tsx
function MyComponent() {
  const { currency } = useCurrency()
  
  return <div>{formatCurrency(5000, currency)}</div>
  // Output: "CAD 5,000" or "INR 5,000" etc.
}
```

## Updated Components
- ✅ `components/dashboard/financials/StatsOverview.tsx` - Uses dynamic currency
- ✅ `components/dashboard/settings/academy-info-settings.tsx` - Currency change dialog
- ✅ `app/dashboard/layout.tsx` - Wrapped with CurrencyProvider

## Components That Need Updating
Replace hardcoded "INR" with `useCurrency()` hook in:
- `components/dashboard/financials/IncomeDialog.tsx`
- `components/dashboard/financials/ExpenseDialog.tsx`
- `components/dashboard/financials/ReportsSection.tsx`
- `components/dashboard/financials/ROICalculator.tsx`
- `components/dashboard/financials/ForecastSection.tsx`
- `components/dashboard/payments/*` (all payment components)
- Any other component displaying currency

## Database Schema Updates Needed
The `convert-currency` API needs to be customized to update your specific price fields:
- Course prices
- Fee structures
- Payment records
- Invoice amounts
- Any other monetary values

## Testing
1. Go to Settings → Academy Info
2. Change currency from INR to CAD
3. Select "Replace Currency Code" - prices stay same, code changes
4. OR select "Convert Currency" - prices recalculate based on exchange rate
5. Page reloads and all components show new currency
