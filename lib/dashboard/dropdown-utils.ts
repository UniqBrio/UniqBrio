/**
 * Simplified dropdown utilities - dropdown values are automatically populated
 * from existing income/expense records using distinct() queries.
 * No separate collections or custom dropdown management needed.
 */

/**
 * Process dropdown values from income/expense data
 * Since we're using only distinct() from main collections, this function is now a no-op
 * but kept for backward compatibility with existing API calls
 */
export async function processDropdownValues(data: any, type: 'income' | 'expense'): Promise<void> {
  // No longer needed - dropdown values are automatically available via distinct() queries
  // on the main income/expense collections in /api/financials/options
  return;
}

/**
 * Process dropdown values from multiple records (for bulk operations)
 * Since we're using only distinct() from main collections, this function is now a no-op
 * but kept for backward compatibility with existing API calls
 */
export async function processBulkDropdownValues(dataArray: any[], type: 'income' | 'expense'): Promise<void> {
  // No longer needed - dropdown values are automatically available via distinct() queries
  // on the main income/expense collections in /api/financials/options
  return;
}