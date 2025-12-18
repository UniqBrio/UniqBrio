import nodemailer from 'nodemailer';

// Email configuration from environment variables - Using Zoho ZeptoMail
const SMTP_CONFIG = {
  host: process.env.ZEPTO_HOST || 'smtp.zeptomail.in',
  port: parseInt(process.env.ZEPTO_PORT || '587'),
  secure: false, // true for 465, false for other ports (use TLS for 587)
  auth: {
    user: process.env.ZEPTO_USER || 'info@uniqbotz.com',
    pass: process.env.ZEPTO_PASS || '',
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
};

const FROM_EMAIL = process.env.ZEPTO_FROM_EMAIL || process.env.ZEPTO_USER || 'info@uniqbotz.com';
const FROM_NAME = process.env.FROM_NAME || 'UniqBrio';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Send email using Zoho ZeptoMail SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if SMTP credentials are configured
    if (!SMTP_CONFIG.auth.pass) {
      console.error('❌ Zepto email credentials not configured. Please set ZEPTO_PASS environment variable.');
      console.log('Email would have been sent to:', options.to);
      console.log('Subject:', options.subject);
      return false;
    }

    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html,
      attachments: options.attachments || [],
    };

    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error: any) {
    console.error('❌ Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
}

/**
 * Send payment confirmation email with invoice
 */
export async function sendPaymentConfirmationEmail(
  recipientEmail: string,
  studentName: string,
  paymentDetails: {
    amount: number;
    paymentDate: Date;
    paymentMode: string;
    courseName: string;
    invoiceNumber: string;
    paymentOption?: string;
    paymentSubType?: string;
    invoiceUrl?: string;
    nextPaymentDate?: Date;
    monthlyInstallment?: number;
    isLastPayment?: boolean;
    dueAmount?: number;
    currency?: string; // Currency symbol
  }
): Promise<boolean> {
  const { amount, paymentDate, paymentMode, courseName, invoiceNumber, paymentOption, paymentSubType, invoiceUrl, nextPaymentDate, monthlyInstallment, isLastPayment, dueAmount, currency = '' } = paymentDetails;

  // Determine if this is a One-Time payment
  const isOneTimePayment = paymentOption === 'One Time' || paymentOption === 'ONE_TIME_PAYMENT';

  const subject = isLastPayment
    ? '🎉 Payment Complete - Thank You!'
    : '✅ Payment Received - Thank You!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .details-box { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
        .details-box h3 { margin-top: 0; color: #4CAF50; }
        .details-box p { margin: 10px 0; }
        .details-box strong { color: #333; }
        .success-box { background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2e7d32; }
        .success-box h3 { margin-top: 0; color: #2e7d32; }
        .warning-box { background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e65100; }
        .warning-box h3 { margin-top: 0; color: #e65100; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${isLastPayment ? '🎉 Payment Complete - Thank You!' : '✅ Payment Received'}</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          ${isLastPayment && isOneTimePayment ? `
            <p><strong>Thank you for your full payment!</strong></p>
            <p>We have successfully received your complete course fee payment. Your invoice is attached with this email for your records.</p>
          ` : `
            <p>We have successfully received your payment. Thank you for your prompt payment!</p>
          `}
          
          <div class="details-box">
            <h3>Payment Details</h3>
            <p><strong>Amount:</strong> ${currency}${amount.toLocaleString('en-IN')}</p>
            <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
            <p><strong>Payment Mode:</strong> ${paymentMode}</p>
            ${paymentOption ? `<p><strong>Payment Category:</strong> ${paymentOption}</p>` : ''}
            ${paymentSubType ? `<p><strong>Payment Type:</strong> ${paymentSubType}</p>` : ''}
            <p><strong>Course:</strong> ${courseName}</p>
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          </div>
          
          ${isLastPayment ? `
          <div class="success-box">
            <h3>🎉 ${isOneTimePayment ? 'Payment Complete!' : 'Congratulations!'}</h3>
            ${isOneTimePayment ? `
              <p><strong>Your course fee has been paid in full.</strong></p>
              <p>No further payments are required. You are all set to continue your learning journey!</p>
              <p>Your invoice is attached to this email and is also available in your student portal.</p>
            ` : `
              <p>All your dues have been cleared. Thank you for your timely payments throughout the course!</p>
              <p>We wish you all the best in your learning journey.</p>
            `}
            <p style="margin-top: 15px;">If you have any questions, feel free to reach out to us.</p>
          </div>
          ` : nextPaymentDate ? `
          <div class="warning-box">
            <h3>${isOneTimePayment ? '⏰ Partial Payment - Due Balance' : 'Next Payment Due'}</h3>
            ${dueAmount && dueAmount > 0 ? `
              <p><strong>Remaining Due Amount:</strong> ${currency}${dueAmount.toLocaleString('en-IN')}</p>
            ` : ''}
            <p><strong>${isOneTimePayment ? 'Due Date' : 'Due Date'}:</strong> ${new Date(nextPaymentDate).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
            ${monthlyInstallment ? `<p><strong>Amount:</strong> ${currency}${monthlyInstallment.toLocaleString('en-IN')}</p>` : ''}
            ${isOneTimePayment ? `
              <p><strong>Reminder Frequency:</strong> Daily at 10:00 AM</p>
              <p><strong>Duration:</strong> Unlimited reminders until fully paid</p>
              <p>We'll send you daily reminders starting tomorrow until the remaining balance is paid in full.</p>
            ` : `
              <p>We'll send you a reminder before the due date.</p>
            `}
          </div>
          ` : ''}
          
          ${invoiceUrl ? `
          <p style="text-align: center;">
            <a href="${invoiceUrl}" class="button">Download Invoice</a>
          </p>
          ` : ''}
          
          <p>If you have any questions about your payment or need any assistance, please don't hesitate to contact us.</p>
          
          <p>Thank you for choosing UniqBrio!</p>
          
          <p>Best regards,<br>
          <strong>UniqBrio Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Received Successfully

Dear ${studentName},

We have successfully received your payment. Thank you for your prompt payment!

Payment Details:
- Amount: ${currency}${amount.toLocaleString('en-IN')}
- Payment Date: ${new Date(paymentDate).toLocaleDateString('en-IN')}
- Payment Mode: ${paymentMode}
- Course: ${courseName}
- Invoice Number: ${invoiceNumber}

${isLastPayment 
  ? '\n🎉 Congratulations! All your dues have been cleared. Thank you for your timely payments throughout the course!\n' 
  : nextPaymentDate 
  ? `\n${paymentOption === 'One Time' || paymentOption === 'ONE_TIME_PAYMENT' ? 'Partial Payment - Next Payment Due' : 'Next Payment Due'}:\n- Due Date: ${new Date(nextPaymentDate).toLocaleDateString('en-IN')}\n${dueAmount && dueAmount > 0 ? `- Remaining Due Amount: ${currency}${dueAmount.toLocaleString('en-IN')}\n` : ''}${monthlyInstallment ? `- Amount: ${currency}${monthlyInstallment.toLocaleString('en-IN')}\n` : ''}${paymentOption === 'One Time' || paymentOption === 'ONE_TIME_PAYMENT' ? '\n- Reminder Frequency: Daily at 10:00 AM\n- Duration: Unlimited reminders until fully paid\n- We will send you daily reminders starting tomorrow until the balance is paid in full.\n' : '\n'}\n` 
  : ''
}

If you have any questions about your payment or need any assistance, please don't hesitate to contact us.

Thank you for choosing UniqBrio!

Best regards,
UniqBrio Team

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} UniqBrio. All rights reserved.
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  recipientEmail: string,
  studentName: string,
  reminderDetails: {
    courseName: string;
    dueDate: Date;
    amount: number;
    outstandingBalance: number;
    currency?: string; // Currency symbol
    academyName?: string; // Academy name from settings
  }
): Promise<boolean> {
  const { courseName, dueDate, amount, outstandingBalance, currency = '', academyName = 'Academy' } = reminderDetails;

  const subject = `⏰ Payment Reminder - ${academyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .details-box { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF9800; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⏰ Payment Reminder</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>This is a friendly reminder that your payment is due soon.</p>
          
          <div class="details-box">
            <h3>Payment Details</h3>
            <p><strong>Course:</strong> ${courseName}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
            <p><strong>Amount Due:</strong> ${currency}${amount.toLocaleString('en-IN')}</p>
            <p><strong>Outstanding Balance:</strong> ${currency}${outstandingBalance.toLocaleString('en-IN')}</p>
          </div>
          
          <p>Please make your payment before the due date to avoid any inconvenience.</p>
          
          <p>If you have already made the payment, please ignore this reminder.</p>
          
          <p>Thank you for your cooperation!</p>
          
          <p>Best regards,<br>
          <strong>${academyName} Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${academyName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}

/**
 * Send ticket creation confirmation email
 */
export async function sendTicketCreationEmail(
  recipientEmail: string,
  ticketDetails: {
    ticketId: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    createdAt: Date;
  }
): Promise<boolean> {
  const { ticketId, title, description, priority, status, createdAt } = ticketDetails;

  const subject = `Support Ticket Confirmation: We're Here to Help`;

  const formattedDate = new Date(createdAt).toLocaleString('en-US', { 
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { background-color: #7C3AED; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { background-color: #f9f9f9; padding: 30px 25px; border-radius: 0 0 8px 8px; }
        .content p { margin: 15px 0; line-height: 1.8; }
        .ticket-table { width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .ticket-table th { background-color: #7C3AED; color: white; padding: 12px; text-align: left; font-weight: 600; }
        .ticket-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .ticket-table tr:last-child td { border-bottom: none; }
        .section-title { color: #7C3AED; font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; }
        .expectations-list { background-color: #ffffff; padding: 20px 25px; border-radius: 8px; border-left: 4px solid #7C3AED; margin: 20px 0; }
        .expectations-list ol { margin: 10px 0; padding-left: 20px; }
        .expectations-list li { margin: 10px 0; line-height: 1.6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; margin-top: 20px; border-top: 1px solid #e5e7eb; }
        .signature { margin-top: 25px; }
        .signature p { margin: 5px 0; }
        strong { color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Support Ticket Confirmation: We're Here to Help</h2>
        </div>
        <div class="content">
          <p><strong>Dear Customer,</strong></p>
          
          <p>Thank you for reaching out to Uniqbrio Support. We understand how important it is to have your issue resolved quickly, and we are committed to providing you with our full support.</p>
          
          <p>We have successfully received your request and are already reviewing the details.</p>
          
          <h3 class="section-title">🎫 Your Support Ticket Details</h3>
          
          <table class="ticket-table">
            <tr>
              <th>Detail</th>
              <th>Information</th>
            </tr>
            <tr>
              <td><strong>Ticket Number</strong></td>
              <td>${ticketId}</td>
            </tr>
            <tr>
              <td><strong>Issue Type</strong></td>
              <td>${title}</td>
            </tr>
            <tr>
              <td><strong>Date Submitted</strong></td>
              <td>${formattedDate}</td>
            </tr>
          </table>
          
          <h3 class="section-title">⏱️ What You Can Expect Next</h3>
          
          <div class="expectations-list">
            <ol>
              <li><strong>Review:</strong> Our dedicated support team will immediately review the information you provided.</li>
              <li><strong>Response:</strong> We guarantee a response from a support agent via email within <strong>24 hours</strong>.</li>
              <li><strong>Resolution:</strong> We assure you that we will work diligently and collaboratively with you until your issue is fully resolved to your satisfaction.</li>
            </ol>
          </div>
          
          <p>If you have any additional details or information that could help us resolve your issue faster, please simply reply to this email.</p>
          
          <p>We appreciate your patience and look forward to helping you succeed.</p>
          
          <div class="signature">
            <p><strong>Sincerely,</strong></p>
            <p><strong>The Uniqbrio Support Team</strong></p>
            <p><a href="mailto:support@uniqbrio.com" style="color: #7C3AED; text-decoration: none;">support@uniqbrio.com</a></p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Uniqbrio. All rights reserved.</p>
          <p>This is an automated confirmation message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Support Ticket Confirmation: We're Here to Help

Dear Customer,

Thank you for reaching out to Uniqbrio Support. We understand how important it is to have your issue resolved quickly, and we are committed to providing you with our full support.

We have successfully received your request and are already reviewing the details.

🎫 Your Support Ticket Details
--------------------------------
Ticket Number: ${ticketId}
Issue Type: ${title}
Date Submitted: ${formattedDate}

⏱️ What You Can Expect Next
----------------------------
1. Review: Our dedicated support team will immediately review the information you provided.
2. Response: We guarantee a response from a support agent via email within 24 hours.
3. Resolution: We assure you that we will work diligently and collaboratively with you until your issue is fully resolved to your satisfaction.

If you have any additional details or information that could help us resolve your issue faster, please simply reply to this email.

We appreciate your patience and look forward to helping you succeed.

Sincerely,
The Uniqbrio Support Team
support@uniqbrio.com

---
© ${new Date().getFullYear()} Uniqbrio. All rights reserved.
This is an automated confirmation message.
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send subscription plan expiry reminder email
 */
export async function sendPlanExpiryReminderEmail(
  recipientEmail: string,
  businessName: string,
  ownerName: string,
  planDetails: {
    planName: string;
    endDate: Date;
    daysRemaining: number;
    studentSize: number;
  }
): Promise<boolean> {
  const { planName, endDate, daysRemaining, studentSize } = planDetails;

  const subject = `⏰ Subscription Reminder: Your ${planName} Plan Expires in ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'}`;

  const formattedEndDate = new Date(endDate).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7C3AED; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .alert-box { background: linear-gradient(135deg, #ff9800 0%, #ff6b35 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .alert-box h2 { margin: 0 0 10px 0; font-size: 28px; }
        .alert-box p { margin: 5px 0; font-size: 18px; }
        .details-box { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #7C3AED; }
        .details-box p { margin: 10px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .urgent-notice { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .benefits { background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4caf50; }
        .benefits ul { margin: 10px 0; padding-left: 25px; }
        .benefits li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⏰ Subscription Expiry Reminder</h2>
        </div>
        <div class="content">
          <p>Dear ${ownerName},</p>
          <p>This is an important reminder about your <strong>UniqBrio ${planName}</strong> subscription for <strong>${businessName}</strong>.</p>
          
          <div class="alert-box">
            <h2>⏰ ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'} Remaining</h2>
            <p>Your subscription expires on ${formattedEndDate}</p>
          </div>
          
          <div class="details-box">
            <h3>📋 Current Subscription Details</h3>
            <p><strong>Plan:</strong> ${planName.charAt(0).toUpperCase() + planName.slice(1)}</p>
            <p><strong>Academy:</strong> ${businessName}</p>
            <p><strong>Expiry Date:</strong> ${formattedEndDate}</p>
            <p><strong>Days Remaining:</strong> ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</p>
            <p><strong>Student Capacity:</strong> ${studentSize} students</p>
          </div>
          
          <div class="urgent-notice">
            <h3 style="margin-top: 0; color: #ff9800;">⚠️ Action Required</h3>
            <p style="margin-bottom: 0;">To avoid any interruption to your academy management services, please renew your subscription before the expiry date. After expiration, you may lose access to premium features and student data management capabilities.</p>
          </div>

          <div class="benefits">
            <h3 style="margin-top: 0; color: #4caf50;">✨ Continue Enjoying These Benefits</h3>
            <ul>
              <li><strong>Unlimited Access</strong> to all premium features</li>
              <li><strong>Student Management</strong> tools and analytics</li>
              <li><strong>Payment Tracking</strong> and automated reminders</li>
              <li><strong>Course & Batch Management</strong> capabilities</li>
              <li><strong>Priority Support</strong> from our team</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance with the renewal process, please don't hesitate to contact our support team.</p>
          
          <p>Thank you for being a valued UniqBrio customer!</p>
          
          <p>Best regards,<br>
          <strong>UniqBrio Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Subscription Expiry Reminder

Dear ${ownerName},

This is an important reminder about your UniqBrio ${planName} subscription for ${businessName}.

⏰ ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'} Remaining

Your subscription expires on ${formattedEndDate}

Current Subscription Details:
- Plan: ${planName.charAt(0).toUpperCase() + planName.slice(1)}
- Academy: ${businessName}
- Expiry Date: ${formattedEndDate}
- Days Remaining: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}
- Student Capacity: ${studentSize} students

⚠️ Action Required
To avoid any interruption to your academy management services, please renew your subscription before the expiry date. After expiration, you may lose access to premium features and student data management capabilities.

✨ Continue Enjoying These Benefits:
- Unlimited Access to all premium features
- Student Management tools and analytics
- Payment Tracking and automated reminders
- Course & Batch Management capabilities
- Priority Support from our team

Renew your subscription now: https://app.uniqbrio.in/dashboard/settings/billing

If you have any questions or need assistance with the renewal process, please don't hesitate to contact our support team.

Thank you for being a valued UniqBrio customer!

Best regards,
UniqBrio Team

---
This is an automated reminder. Please do not reply to this email.
© ${new Date().getFullYear()} UniqBrio. All rights reserved.
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send subscription plan EXPIRED reminder email (after expiry date)
 */
export async function sendPlanExpiredReminderEmail(
  recipientEmail: string,
  businessName: string,
  ownerName: string,
  planDetails: {
    planName: string;
    endDate: Date;
    daysAfterExpiry: number;
    studentSize: number;
    currentStudents?: number;
  }
): Promise<boolean> {
  const { planName, endDate, daysAfterExpiry, studentSize, currentStudents } = planDetails;

  const subject = `🚨 URGENT: Your ${planName} Plan Expired ${daysAfterExpiry} ${daysAfterExpiry === 1 ? 'Day' : 'Days'} Ago - Renew Now`;

  const formattedEndDate = new Date(endDate).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .alert-box { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .alert-box h2 { margin: 0 0 10px 0; font-size: 28px; }
        .alert-box p { margin: 5px 0; font-size: 18px; }
        .details-box { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .details-box p { margin: 10px 0; }
        .urgent-notice { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .urgent-notice h3 { margin-top: 0; color: #dc2626; }
        .consequences { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
        .consequences ul { margin: 10px 0; padding-left: 25px; }
        .consequences li { margin: 8px 0; color: #92400e; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Subscription Expired</h2>
        </div>
        <div class="content">
          <p>Dear ${ownerName},</p>
          <p><strong>URGENT NOTICE:</strong> Your <strong>UniqBrio ${planName}</strong> subscription for <strong>${businessName}</strong> has expired.</p>
          
          <div class="alert-box">
            <h2>🚨 Expired ${daysAfterExpiry} ${daysAfterExpiry === 1 ? 'Day' : 'Days'} Ago</h2>
            <p>Your subscription expired on ${formattedEndDate}</p>
          </div>
          
          <div class="details-box">
            <h3>📋 Expired Subscription Details</h3>
            <p><strong>Plan:</strong> ${planName.charAt(0).toUpperCase() + planName.slice(1)}</p>
            <p><strong>Academy:</strong> ${businessName}</p>
            <p><strong>Expiry Date:</strong> ${formattedEndDate}</p>
            <p><strong>Days Since Expiry:</strong> ${daysAfterExpiry} ${daysAfterExpiry === 1 ? 'day' : 'days'}</p>
            <p><strong>Previous Capacity:</strong> ${studentSize} students</p>
            ${currentStudents ? `<p><strong>Current Enrolled Students:</strong> ${currentStudents}</p>` : ''}
          </div>
          
          <div class="urgent-notice">
            <h3>⚠️ Immediate Action Required</h3>
            <p>Your academy is currently operating <strong>without an active subscription</strong>. To restore full access to all premium features and ensure uninterrupted service, please renew your subscription immediately.</p>
          </div>

          <div class="consequences">
            <h3 style="margin-top: 0; color: #f59e0b;">⚠️ Impact of Expired Subscription</h3>
            <ul>
              <li>Limited access to premium features</li>
              <li>Student management capabilities may be restricted</li>
              <li>Payment tracking and reminders may be disabled</li>
              <li>Course and batch management limitations</li>
              <li>Risk of data access interruption</li>
            </ul>
          </div>
          
          <p><strong>Renew now to:</strong></p>
          <ul>
            <li>Restore full access to all premium features</li>
            <li>Continue managing ${currentStudents || studentSize} students without interruption</li>
            <li>Maintain your academy's operational efficiency</li>
            <li>Access priority support</li>
          </ul>
          
          <p>Please log in to your UniqBrio account and navigate to Settings → Billing to renew your subscription.</p>
          
          <p>If you have already renewed, please disregard this message. If you're experiencing any issues or need assistance, our support team is here to help.</p>
          
          <p>Thank you for your prompt attention to this matter.</p>
          
          <p>Best regards,<br>
          <strong>UniqBrio Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
URGENT: Subscription Expired

Dear ${ownerName},

URGENT NOTICE: Your UniqBrio ${planName} subscription for ${businessName} has expired.

🚨 Expired ${daysAfterExpiry} ${daysAfterExpiry === 1 ? 'Day' : 'Days'} Ago

Your subscription expired on ${formattedEndDate}

Expired Subscription Details:
- Plan: ${planName.charAt(0).toUpperCase() + planName.slice(1)}
- Academy: ${businessName}
- Expiry Date: ${formattedEndDate}
- Days Since Expiry: ${daysAfterExpiry} ${daysAfterExpiry === 1 ? 'day' : 'days'}
- Previous Capacity: ${studentSize} students
${currentStudents ? `- Current Enrolled Students: ${currentStudents}` : ''}

⚠️ Immediate Action Required
Your academy is currently operating without an active subscription. To restore full access to all premium features and ensure uninterrupted service, please renew your subscription immediately.

⚠️ Impact of Expired Subscription:
- Limited access to premium features
- Student management capabilities may be restricted
- Payment tracking and reminders may be disabled
- Course and batch management limitations
- Risk of data access interruption

Renew now to:
- Restore full access to all premium features
- Continue managing ${currentStudents || studentSize} students without interruption
- Maintain your academy's operational efficiency
- Access priority support

Please log in to your UniqBrio account and navigate to Settings → Billing to renew your subscription.

If you have already renewed, please disregard this message. If you're experiencing any issues or need assistance, our support team is here to help.

Thank you for your prompt attention to this matter.

Best regards,
UniqBrio Team

---
This is an automated reminder. Please do not reply to this email.
© ${new Date().getFullYear()} UniqBrio. All rights reserved.
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}

/**
 * Test email connection
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error: any) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
}
