/**
 * WhatsApp Cloud API Service
 * 
 * Reusable service for sending WhatsApp template messages via Meta WhatsApp Cloud API.
 * Designed for attendance notifications and other transactional messages.
 * 
 * Environment Variables Required:
 * - WHATSAPP_TOKEN: Meta WhatsApp Cloud API access token
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business Phone Number ID
 */

import { dbConnect } from '@/lib/mongodb';
import WhatsAppLog from '@/models/dashboard/WhatsAppLog';
import { getTenantContext } from '@/lib/tenant/tenant-context';

// WhatsApp Cloud API Base URL
const WHATSAPP_API_BASE_URL = 'https://graph.facebook.com/v18.0';

// Pre-approved template name for attendance notifications
const ATTENDANCE_PRESENT_TEMPLATE = 'attendance_present_notification';

export interface AttendanceMessageParams {
  parentPhone: string; // E.164 format (e.g., +919876543210)
  parentName: string;
  studentName: string;
  batchName: string;
  sessionDate: string;
  sessionTime: string;
  academyName: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface WhatsAppLogEntry {
  studentId: string;
  sessionId?: string;
  phone: string;
  status: 'SENT' | 'FAILED';
  providerMessageId?: string;
  errorMessage?: string;
  templateName: string;
  messageType: 'ATTENDANCE_PRESENT' | 'ATTENDANCE_ABSENT' | 'OTHER';
}

/**
 * Validates E.164 phone number format
 * @param phone - Phone number to validate
 * @returns boolean indicating if the phone is in valid E.164 format
 */
function isValidE164(phone: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Normalizes a phone number to E.164 format
 * @param phone - Phone number (may include spaces, dashes, or be missing +)
 * @param countryCode - Optional country code to prepend if missing
 * @returns Normalized phone number or null if invalid
 */
export function normalizePhoneToE164(phone: string, countryCode?: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If it doesn't start with +, try to add country code
  if (!normalized.startsWith('+')) {
    if (countryCode) {
      // Remove leading + from country code if present
      const cleanCountryCode = countryCode.replace(/^\+/, '');
      normalized = `+${cleanCountryCode}${normalized}`;
    } else {
      // Default to India if no country code provided
      normalized = `+91${normalized}`;
    }
  }

  // Validate final format
  return isValidE164(normalized) ? normalized : null;
}

/**
 * Logs a WhatsApp send attempt to MongoDB
 */
async function logWhatsAppSend(entry: WhatsAppLogEntry): Promise<void> {
  try {
    await dbConnect();
    
    const tenantContext = getTenantContext();
    
    const log = new WhatsAppLog({
      tenantId: tenantContext?.tenantId || 'default',
      ...entry,
    });
    
    await log.save();
  } catch (error) {
    // Log error but don't throw - logging should not break the main flow
    console.error('[WhatsApp] Failed to log WhatsApp send attempt:', error);
  }
}

/**
 * Sends an attendance notification message via WhatsApp
 * 
 * @param params - Message parameters including recipient and content
 * @param studentId - Student ID for logging purposes
 * @param sessionId - Optional session ID for logging purposes
 * @returns WhatsAppSendResult with success status and message ID or error
 */
export async function sendAttendanceMessage(
  params: AttendanceMessageParams,
  studentId: string,
  sessionId?: string
): Promise<WhatsAppSendResult> {
  const {
    parentPhone,
    parentName,
    studentName,
    batchName,
    sessionDate,
    sessionTime,
    academyName,
  } = params;

  // Get environment variables
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Validate environment configuration
  if (!token || !phoneNumberId) {
    const error = 'WhatsApp API credentials not configured. Please set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.';
    console.error('[WhatsApp]', error);
    
    await logWhatsAppSend({
      studentId,
      sessionId,
      phone: parentPhone,
      status: 'FAILED',
      errorMessage: error,
      templateName: ATTENDANCE_PRESENT_TEMPLATE,
      messageType: 'ATTENDANCE_PRESENT',
    });

    return { success: false, error };
  }

  // Validate phone number format
  if (!isValidE164(parentPhone)) {
    const error = `Invalid phone number format. Expected E.164 format (e.g., +919876543210), received: ${parentPhone}`;
    console.error('[WhatsApp]', error);
    
    await logWhatsAppSend({
      studentId,
      sessionId,
      phone: parentPhone,
      status: 'FAILED',
      errorMessage: error,
      templateName: ATTENDANCE_PRESENT_TEMPLATE,
      messageType: 'ATTENDANCE_PRESENT',
    });

    return { success: false, error };
  }

  // Build the API URL
  const apiUrl = `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/messages`;

  // Build the message payload
  // Template format with positional parameters:
  // {{1}} - Parent Name
  // {{2}} - Student Name  
  // {{3}} - Batch Name
  // {{4}} - Session Date
  // {{5}} - Session Time
  // {{6}} - Academy Name
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: parentPhone.replace('+', ''), // Remove + for API
    type: 'template',
    template: {
      name: ATTENDANCE_PRESENT_TEMPLATE,
      language: {
        code: 'en',
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: parentName },
            { type: 'text', text: studentName },
            { type: 'text', text: batchName },
            { type: 'text', text: sessionDate },
            { type: 'text', text: sessionTime },
            { type: 'text', text: academyName },
          ],
        },
      ],
    },
  };

  try {
    console.log(`[WhatsApp] Sending attendance notification to ${parentPhone} for student ${studentName}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('[WhatsApp] API Error:', error, responseData);

      await logWhatsAppSend({
        studentId,
        sessionId,
        phone: parentPhone,
        status: 'FAILED',
        errorMessage: error,
        templateName: ATTENDANCE_PRESENT_TEMPLATE,
        messageType: 'ATTENDANCE_PRESENT',
      });

      return { success: false, error };
    }

    // Extract message ID from successful response
    const messageId = responseData.messages?.[0]?.id;
    
    console.log(`[WhatsApp] Successfully sent message. ID: ${messageId}`);

    await logWhatsAppSend({
      studentId,
      sessionId,
      phone: parentPhone,
      status: 'SENT',
      providerMessageId: messageId,
      templateName: ATTENDANCE_PRESENT_TEMPLATE,
      messageType: 'ATTENDANCE_PRESENT',
    });

    return { success: true, messageId };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error occurred while sending WhatsApp message';
    console.error('[WhatsApp] Error sending message:', errorMessage);

    await logWhatsAppSend({
      studentId,
      sessionId,
      phone: parentPhone,
      status: 'FAILED',
      errorMessage,
      templateName: ATTENDANCE_PRESENT_TEMPLATE,
      messageType: 'ATTENDANCE_PRESENT',
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Sends attendance notifications to all present students in a batch
 * 
 * @param attendanceRecords - Array of attendance records with student info
 * @param sessionInfo - Session details (date, time, batch name)
 * @param academyName - Name of the academy
 * @returns Summary of sent/failed messages
 */
export interface BulkAttendanceNotificationParams {
  attendanceRecords: Array<{
    studentId: string;
    studentName: string;
    status: 'present' | 'absent';
    parentPhone?: string;
    parentName?: string;
    guardianContact?: string;
    guardianFullName?: string;
    guardianCountryCode?: string;
  }>;
  sessionId?: string;
  sessionDate: string;
  sessionTime: string;
  batchName: string;
  academyName: string;
}

export interface BulkSendResult {
  totalPresent: number;
  sent: number;
  failed: number;
  skipped: number; // No phone number available
  details: Array<{
    studentId: string;
    studentName: string;
    status: 'SENT' | 'FAILED' | 'SKIPPED';
    messageId?: string;
    error?: string;
  }>;
}

export async function sendBulkAttendanceNotifications(
  params: BulkAttendanceNotificationParams
): Promise<BulkSendResult> {
  const { attendanceRecords, sessionId, sessionDate, sessionTime, batchName, academyName } = params;

  const result: BulkSendResult = {
    totalPresent: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  // Filter only present students
  const presentStudents = attendanceRecords.filter(
    (record) => record.status.toLowerCase() === 'present'
  );

  result.totalPresent = presentStudents.length;

  console.log(`[WhatsApp] Processing ${presentStudents.length} present students for attendance notifications`);

  for (const student of presentStudents) {
    // Get parent phone - try multiple sources
    let parentPhone = student.parentPhone || student.guardianContact;
    const parentName = student.parentName || student.guardianFullName || 'Parent';
    const guardianCountryCode = student.guardianCountryCode;

    // Normalize phone number to E.164 format
    if (parentPhone) {
      parentPhone = normalizePhoneToE164(parentPhone, guardianCountryCode) || undefined;
    }

    // Skip if no valid phone number
    if (!parentPhone) {
      console.log(`[WhatsApp] Skipping ${student.studentName} - no valid parent phone number`);
      result.skipped++;
      result.details.push({
        studentId: student.studentId,
        studentName: student.studentName,
        status: 'SKIPPED',
        error: 'No valid parent phone number available',
      });
      continue;
    }

    // Send the notification
    const sendResult = await sendAttendanceMessage(
      {
        parentPhone,
        parentName,
        studentName: student.studentName,
        batchName,
        sessionDate,
        sessionTime,
        academyName,
      },
      student.studentId,
      sessionId
    );

    if (sendResult.success) {
      result.sent++;
      result.details.push({
        studentId: student.studentId,
        studentName: student.studentName,
        status: 'SENT',
        messageId: sendResult.messageId,
      });
    } else {
      result.failed++;
      result.details.push({
        studentId: student.studentId,
        studentName: student.studentName,
        status: 'FAILED',
        error: sendResult.error,
      });
    }
  }

  console.log(
    `[WhatsApp] Bulk notification complete. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`
  );

  return result;
}
