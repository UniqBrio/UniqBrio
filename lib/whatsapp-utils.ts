/**
 * WhatsApp Utilities
 * 
 * Reusable utility functions for opening WhatsApp chats.
 * Works on both mobile and desktop - opens WhatsApp app if installed,
 * otherwise opens WhatsApp Web.
 */

/**
 * Normalizes a phone number to E.164 format for WhatsApp deep links.
 * Removes spaces, dashes, parentheses, and other special characters.
 * Ensures the number starts with a country code.
 * 
 * @param phone - The phone number to normalize
 * @param countryCode - Optional country code (e.g., "+91" or "91")
 * @returns Normalized phone number without the + prefix (as required by wa.me links)
 */
export function normalizePhoneForWhatsApp(
  phone: string | undefined | null,
  countryCode?: string | undefined | null
): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If it starts with +, remove it (wa.me doesn't use + in URLs)
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }

  // If the number doesn't look like it has a country code (too short or starts with 0),
  // prepend the country code
  if (normalized.length <= 10 || normalized.startsWith('0')) {
    // Remove leading 0 if present
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }

    // Add country code
    if (countryCode) {
      const cleanCode = countryCode.replace(/[^\d]/g, '');
      normalized = cleanCode + normalized;
    } else {
      // Default to India if no country code provided
      normalized = '91' + normalized;
    }
  }

  // Validate: should be between 10-15 digits for a valid international number
  if (normalized.length < 10 || normalized.length > 15) {
    return null;
  }

  return normalized;
}

/**
 * Opens WhatsApp chat with a specific phone number.
 * Uses the wa.me deep link format which works on both mobile and desktop.
 * 
 * @param phone - Phone number (can include special chars, will be normalized)
 * @param countryCode - Optional country code if not included in phone
 * @param message - Optional pre-filled message
 * @returns true if the link was opened, false if phone was invalid
 * 
 * @example
 * // Open chat with a parent
 * openWhatsAppChat('9876543210', '+91');
 * 
 * // Open chat with pre-filled message
 * openWhatsAppChat('+919876543210', undefined, 'Hello!');
 */
export function openWhatsAppChat(
  phone: string | undefined | null,
  countryCode?: string | undefined | null,
  message?: string
): boolean {
  const normalizedPhone = normalizePhoneForWhatsApp(phone, countryCode);

  if (!normalizedPhone) {
    console.warn('[WhatsApp] Invalid phone number:', phone);
    return false;
  }

  // Build the WhatsApp URL
  let url = `https://wa.me/${normalizedPhone}`;

  // Add message if provided
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }

  // Open in new tab - this will trigger WhatsApp app on mobile or WhatsApp Web on desktop
  window.open(url, '_blank', 'noopener,noreferrer');

  return true;
}

/**
 * Opens WhatsApp chat for batch/cohort communication with the academy's official number.
 * Pre-fills a message with batch context for easier discussion.
 * 
 * @param officialNumber - The academy's official WhatsApp number
 * @param batchName - Name of the batch/cohort
 * @param date - Optional date for context (defaults to today)
 * @returns true if the link was opened, false if number was invalid
 * 
 * @example
 * openWhatsAppBatchChat('+919876543210', 'Morning Batch A', '2025-12-22');
 */
export function openWhatsAppBatchChat(
  officialNumber: string | undefined | null,
  batchName: string,
  date?: string
): boolean {
  const normalizedPhone = normalizePhoneForWhatsApp(officialNumber);

  if (!normalizedPhone) {
    console.warn('[WhatsApp] Invalid official number:', officialNumber);
    return false;
  }

  // Format the date
  const displayDate = date || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Build the pre-filled message
  const message = `Attendance discussion – Batch ${batchName} – ${displayDate}`;

  // Build the WhatsApp URL with message
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

  // Open in new tab
  window.open(url, '_blank', 'noopener,noreferrer');

  return true;
}

/**
 * Checks if a phone number appears to be valid for WhatsApp.
 * 
 * @param phone - Phone number to validate
 * @param countryCode - Optional country code
 * @returns true if the phone number appears valid
 */
export function isValidWhatsAppNumber(
  phone: string | undefined | null,
  countryCode?: string | undefined | null
): boolean {
  return normalizePhoneForWhatsApp(phone, countryCode) !== null;
}

/**
 * Gets the guardian/parent phone number from a student object.
 * Tries multiple sources to find the contact number.
 * 
 * @param student - Student object with guardian information
 * @returns Object with phone and countryCode, or null if not found
 */
export function getStudentGuardianPhone(student: {
  guardian?: { contact?: string };
  guardianCountryCode?: string;
}): { phone: string; countryCode?: string } | null {
  const phone = student.guardian?.contact;
  
  if (!phone) {
    return null;
  }

  return {
    phone,
    countryCode: student.guardianCountryCode,
  };
}
