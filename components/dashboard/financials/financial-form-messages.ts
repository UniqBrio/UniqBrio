export const FINANCIAL_FORM_MESSAGES = {
  genericError: "Please fix the highlighted fields before continuing.",
  requiredWithoutAccount: "Date, Amount, and Category are required.",
  requiredWithAccount: "Date, Amount, Category, and From Account are required for non-cash payments.",
  draftSaveFailed: "Unable to save draft. Please try again.",
  submitFailed: "Unable to save changes. Please try again.",
} as const;

export const getRequiredFieldsMessage = (requiresAccount: boolean) =>
  requiresAccount
    ? FINANCIAL_FORM_MESSAGES.requiredWithAccount
    : FINANCIAL_FORM_MESSAGES.requiredWithoutAccount;
