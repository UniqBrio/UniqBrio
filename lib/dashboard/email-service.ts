import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.zeptomail.in',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'info@uniqbotz.com',
    pass: process.env.SMTP_PASS || '',
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'info@uniqbotz.com';
const FROM_NAME = process.env.FROM_NAME || 'UniqBrio Payments';

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

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error: any) {
    console.error('Error sending email:', {
      error: error.message,
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
  }
): Promise<boolean> {
  const { amount, paymentDate, paymentMode, courseName, invoiceNumber, paymentOption, paymentSubType, invoiceUrl, nextPaymentDate, monthlyInstallment, isLastPayment, dueAmount } = paymentDetails;

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
            <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
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
              <p><strong>Remaining Due Amount:</strong> ₹${dueAmount.toLocaleString('en-IN')}</p>
            ` : ''}
            <p><strong>${isOneTimePayment ? 'Due Date' : 'Due Date'}:</strong> ${new Date(nextPaymentDate).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
            ${monthlyInstallment ? `<p><strong>Amount:</strong> ₹${monthlyInstallment.toLocaleString('en-IN')}</p>` : ''}
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
- Amount: ₹${amount.toLocaleString('en-IN')}
- Payment Date: ${new Date(paymentDate).toLocaleDateString('en-IN')}
- Payment Mode: ${paymentMode}
- Course: ${courseName}
- Invoice Number: ${invoiceNumber}

${isLastPayment 
  ? '\n🎉 Congratulations! All your dues have been cleared. Thank you for your timely payments throughout the course!\n' 
  : nextPaymentDate 
  ? `\n${paymentOption === 'One Time' || paymentOption === 'ONE_TIME_PAYMENT' ? 'Partial Payment - Next Payment Due' : 'Next Payment Due'}:\n- Due Date: ${new Date(nextPaymentDate).toLocaleDateString('en-IN')}\n${dueAmount && dueAmount > 0 ? `- Remaining Due Amount: ₹${dueAmount.toLocaleString('en-IN')}\n` : ''}${monthlyInstallment ? `- Amount: ₹${monthlyInstallment.toLocaleString('en-IN')}\n` : ''}${paymentOption === 'One Time' || paymentOption === 'ONE_TIME_PAYMENT' ? '\n- Reminder Frequency: Daily at 10:00 AM\n- Duration: Unlimited reminders until fully paid\n- We will send you daily reminders starting tomorrow until the balance is paid in full.\n' : '\n'}\n` 
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
  }
): Promise<boolean> {
  const { courseName, dueDate, amount, outstandingBalance } = reminderDetails;

  const subject = '⏰ Payment Reminder - UniqBrio';

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
            <p><strong>Amount Due:</strong> ₹${amount.toLocaleString('en-IN')}</p>
            <p><strong>Outstanding Balance:</strong> ₹${outstandingBalance.toLocaleString('en-IN')}</p>
          </div>
          
          <p>Please make your payment before the due date to avoid any inconvenience.</p>
          
          <p>If you have already made the payment, please ignore this reminder.</p>
          
          <p>Thank you for your cooperation!</p>
          
          <p>Best regards,<br>
          <strong>UniqBrio Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
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
