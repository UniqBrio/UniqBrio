// d:\UB\lib\email.ts
// Email service using Zoho Zeptomail SMTP
import nodemailer from "nodemailer"

// Create a transporter using Zoho Zeptomail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.ZEPTO_HOST || "smtp.zeptomail.in",
  port: Number(process.env.ZEPTO_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.ZEPTO_USER || "",
    pass: process.env.ZEPTO_PASS || "",
  },
  tls: {
    // Enforce certificate validation in production; allow relaxed in dev for local setups
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
})

// Fail fast in production if email credentials are not configured
if (process.env.NODE_ENV === "production" && (!process.env.ZEPTO_USER || !process.env.ZEPTO_PASS)) {
  throw new Error("ZEPTO_USER/ZEPTO_PASS not configured for email sending");
}

// Outlook-compatible email header with UniqBrio branding
function getEmailHeader(title: string = "Welcome to UniqBrio!", subtitle: string = "Your trusted education platform") {
  return `
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #C084FC 50%, #F97316 75%, #FB923C 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 200px; margin: 0 auto;">
        <tr>
          <td style="text-align: center;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/UniqBrio Logo Transparent.png" 
                 alt="UniqBrio" 
                 style="height: 60px; width: auto; max-width: 180px; display: block; margin: 0 auto;"
                 width="180" height="60" />
          </td>
        </tr>
      </table>
      <h1 style="color: white; margin: 20px 0 10px 0; font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        ${title}
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: 500;">
        ${subtitle}
      </p>
    </div>
  `;
}

// Outlook-compatible email footer
function getEmailFooter() {
  return `
    <div style="margin-top: 40px; padding: 30px 20px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb; border-radius: 0 0 12px 12px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
        If you have any questions, please contact our support team at 
        <a href="mailto:support@uniqbrio.com" style="color: #8B5CF6; text-decoration: none;">support@uniqbrio.com</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">
        © ${new Date().getFullYear()} UniqBrio. All rights reserved.
      </p>
    </div>
  `;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    // Send email using nodemailer with Zeptomail
    const info = await transporter.sendMail({
      from: `"UniqBrio" <${process.env.ZEPTO_FROM_EMAIL || "noreply@uniqbotz.com"}>`,
      to,
      subject,
      html,
      ...(subject.includes("Support Ticket") && { bcc: "support@uniqbrio.com" }),
    })

    console.log("Email sent successfully:", info.messageId)
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending email:", error.message)
      if (process.env.NODE_ENV !== "production") {
        console.log(`--- DEV MODE: Email Not Sent ---`)
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        // console.log(`Content:\n${html}`) // Uncomment to log HTML in dev
        console.log(`--- End DEV MODE ---`)
        return true // Simulate success in dev if sending fails
      }
      throw new Error(`Failed to send email: ${error.message}`)
    }

    // fallback if the error isn't an instance of Error
    console.error("Unknown error sending email:", error)
    throw new Error("Failed to send email due to unknown error")
  }
}

/// --- MODIFIED: generateVerificationEmail (OTP Removed) ---
// Now only sends a verification link.
export function generateVerificationEmail(email: string, token: string, userName?: string, academyName?: string) {
  // Use query parameter for token verification with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'https://app.uniqbrio.com';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  console.log('[Email] Verification URL:', verificationUrl); // Debug log
  
  // Create personalized greeting
  let greeting = "Hi there!";
  if (userName && academyName) {
    greeting = `Hi ${userName} from ${academyName}!`;
  } else if (userName) {
    greeting = `Hi ${userName}!`;
  } else if (academyName) {
    greeting = `Hi there, ${academyName}!`;
  }

  return {
    to: email,
    subject: "Verify your email address - UniqBrio",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td>
            ${getEmailHeader("Email Verification", "Please verify your email address")}
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #f0f9ff; border-radius: 50px; width: 80px; height: 80px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✉️</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">
                ${greeting}
              </h2>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              Thank you for registering with <span style="background-color: #FEF3C7; padding: 2px 6px; border-radius: 4px; font-weight: 600;">UniqBrio</span>! To complete your account setup, please verify your email address by clicking the button below.
            </p>

            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">Why verify your email?</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                <li style="margin-bottom: 8px;">🛡️ Secure your account and protect your data</li>
                <li style="margin-bottom: 8px;">📧 Receive important account notifications and updates</li>
                <li style="margin-bottom: 8px;">🔑 Enable password recovery for your account</li>
                <li>✅ Complete your account setup and unlock all features</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #8B5CF6, #F97316); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: Arial, sans-serif; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                Verify Email Address
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; font-family: Arial, sans-serif; line-height: 1.5; margin-top: 20px;">
              If the button above doesn't work, copy and paste this link into your browser:
              <br>
              <span style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 12px; display: inline-block; margin-top: 5px;">${verificationUrl}</span>
            </p>

            <p style="color: #6b7280; font-size: 14px; text-align: center; font-family: Arial, sans-serif; margin-top: 20px;">
              If you did not register for an account, please ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </div>
  `,
  }
}


export function generatePasswordResetEmail(email: string, token: string) {
  // Ensure this matches your frontend route structure (/reset-password/:token)
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`; // Correct structure

  return {
    to: email,
    subject: "Reset your password - UniqBrio",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td>
            ${getEmailHeader("Password Reset", "Reset your UniqBrio account password")}
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #fef2f2; border-radius: 50px; width: 80px; height: 80px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🔒</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">
                Password Reset Request
              </h2>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              You requested a password reset for your UniqBrio account. Click the button below to create a new password.
            </p>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #92400e; margin: 0; font-weight: 600; text-align: center; font-family: Arial, sans-serif;">
                ⏰ This link will expire in 1 hour for security purposes
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #8B5CF6, #F97316); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: Arial, sans-serif; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                Reset My Password
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; font-family: Arial, sans-serif; line-height: 1.5; margin-top: 20px;">
              If the button above doesn't work, copy and paste this link into your browser:
              <br>
              <span style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 12px; display: inline-block; margin-top: 5px;">${resetUrl}</span>
            </p>

            <p style="color: #6b7280; font-size: 14px; text-align: center; font-family: Arial, sans-serif; margin-top: 20px;">
              If you did not request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </div>
  `,
  }
}
// --- generateKYCRejectionEmail (New) ---
export function generateKYCRejectionEmail(email: string, name: string, rejectionReasons: string[], customMessage?: string, academyName?: string) {
  const reasonsList = rejectionReasons.map(reason => `<li style="margin-bottom: 8px; color: #7f1d1d; font-family: Arial, sans-serif;">${reason}</li>`).join('');
  
  // Create personalized greeting
  let greeting = `Hi there!`;
  if (name && academyName) {
    greeting = `Hi ${name} from ${academyName}!`;
  } else if (name) {
    greeting = `Hi ${name}!`;
  } else if (academyName) {
    greeting = `Hi there, ${academyName}!`;
  }
  
  return {
    to: email,
    subject: "KYC Application Update - Action Required - UniqBrio",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td>
            ${getEmailHeader("KYC Application Status", "Action required to complete verification")}
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #fef2f2; border-radius: 50px; width: 80px; height: 80px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">❗</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">
                ${greeting}
              </h2>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 16px;">
              Thank you for submitting your KYC (Know Your Customer) application to UniqBrio. After careful review by our verification team, we need you to address the following issues with your submission:
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">Issues Identified:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.6;">
                ${reasonsList}
              </ul>
            </div>
            
            ${customMessage ? `
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1d4ed8; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">Additional Information:</h3>
              <p style="color: #1e3a8a; margin: 0; font-family: Arial, sans-serif; line-height: 1.6;">${customMessage}</p>
            </div>
            ` : ''}

            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">Next Steps:</h3>
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 16px;">To complete your verification process, please:</p>
              <ol style="color: #374151; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                <li style="margin-bottom: 8px;">Address all the issues mentioned above</li>
                <li style="margin-bottom: 8px;">Prepare updated/corrected documents</li>
                <li style="margin-bottom: 8px;">Log into your UniqBrio account</li>
                <li style="margin-bottom: 8px;">Navigate to your KYC section</li>
                <li>Upload the corrected documentation</li>
              </ol>
            </div>
            
            <h3 style="color: #374151; margin: 30px 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">While you wait</h3>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 16px;">During this review period, you can continue using your UniqBrio account with basic features. Once verification is complete, all premium features will be unlocked.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #8B5CF6, #F97316); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: Arial, sans-serif; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                Update KYC Documents
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </div>
  `,
  }
}

// --- generateSupportTicketEmail (Enhanced) ---
export function generateSupportTicketEmail(email: string, ticketNumber: string, issueType: string) {
  return {
    to: email,
    subject: `Your Support Ticket: ${ticketNumber} - UniqBrio`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td>
            ${getEmailHeader("Support Ticket Confirmation", "We're here to help you succeed")}
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #f0f9ff; border-radius: 50px; width: 80px; height: 80px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎧</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">
                Support Ticket Received
              </h2>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              Thank you for contacting UniqBrio support. Your ticket has been received and will be addressed by our team.
            </p>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">Ticket Number:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #374151; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold;">${ticketNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">Issue Type:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #374151; font-family: Arial, sans-serif; font-size: 14px;">${issueType}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6b7280; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">Date Submitted:</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="color: #374151; font-family: Arial, sans-serif; font-size: 14px;">${new Date().toLocaleString()}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">What happens next?</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                <li style="margin-bottom: 8px;">🔍 Our support team will review your ticket</li>
                <li style="margin-bottom: 8px;">📧 We'll respond via email within 24 hours</li>
                <li style="margin-bottom: 8px;">💬 You can reply to this email for updates</li>
                <li>✅ We'll work together until your issue is resolved</li>
              </ul>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              We'll get back to you as soon as possible. You can reply to this email if you have additional information to provide.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </div>
  `,
  }
}

// --- generateKYCSubmissionEmail (New) ---
export function generateKYCSubmissionEmail(email: string, userName?: string, academyName?: string) {
  // Create personalized greeting
  let greeting = "Hi there!";
  if (userName && academyName) {
    greeting = `Hi ${userName} from ${academyName}!`;
  } else if (userName) {
    greeting = `Hi ${userName}!`;
  } else if (academyName) {
    greeting = `Hi there, ${academyName}!`;
  }

  return {
    to: email,
    subject: "KYC Verification Submitted Successfully - UniqBrio",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td>
            ${getEmailHeader("KYC Verification Submitted!", "Your documents are under review")}
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #f0f9ff; border-radius: 50px; width: 80px; height: 80px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✅</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">
                ${greeting}
              </h2>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              Thank you for completing your KYC (Know Your Customer) verification with UniqBrio. 
              We have successfully received your documents and they are now under review by our verification team.
            </p>

            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">What happens next?</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                <li style="margin-bottom: 8px;">� Your documents will be reviewed by our verification team</li>
                <li style="margin-bottom: 8px;">� We'll conduct a thorough background check</li>
                <li style="margin-bottom: 8px;">📧 You'll receive an email notification with the verification result</li>
                <li>✅ Once approved, your account will be fully activated</li>
              </ul>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #0ea5e9; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;"> Review Process:</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                <li style="margin-bottom: 8px;">Our team will review your submitted documents</li>
                <li style="margin-bottom: 8px;">Background verification will be conducted</li>
                <li style="margin-bottom: 8px;">You will receive email confirmation once approved</li>
                <li>Your account will be fully activated for all services</li>
              </ul>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <p style="color: #92400e; margin: 0; font-weight: 600; font-family: Arial, sans-serif; font-size: 16px;">
                ⏰ Expected Timeline: You will receive confirmation within 24 business hours
              </p>
            </div>

            <h3 style="color: #374151; margin: 30px 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">While you wait</h3>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 16px;">
              During this review period, you can continue using your UniqBrio account with basic features. 
              Once verification is complete, all premium features will be unlocked.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </div>
  `,
  }
}

// --- generateKYCApprovalEmail (New) ---
export function generateKYCApprovalEmail(email: string, name?: string, academyName?: string) {
  // Create personalized greeting
  let greeting = "Hi there!";
  if (name && academyName) {
    greeting = `Hi ${name} from ${academyName}!`;
  } else if (name) {
    greeting = `Hi ${name}!`;
  } else if (academyName) {
    greeting = `Hi there, ${academyName}!`;
  }

  return {
    to: email,
    subject: "KYC Approved - Welcome to UniqBrio!",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td>
            ${getEmailHeader("KYC Approved!", "Welcome to the UniqBrio family")}
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #f0fdf4; border-radius: 50px; width: 80px; height: 80px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎉</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">
                ${greeting}
              </h2>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              Congratulations! Your KYC verification has been approved. You now have full access to all UniqBrio features and services.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #16a34a; margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">What happens next?</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                <li style="margin-bottom: 8px;">🚀 Your account is now fully activated and ready to use</li>
                <li style="margin-bottom: 8px;">📊 Access your complete dashboard with all features unlocked</li>
                <li style="margin-bottom: 8px;">🎯 Start managing your academy with full system capabilities</li>
                <li>💬 Contact our support team if you need any assistance</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #8B5CF6, #F97316); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: Arial, sans-serif; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                Access Your Dashboard
              </a>
            </div>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 16px; text-align: center;">
              Welcome to the UniqBrio family! We're excited to help you grow your academy.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </div>
  `,
  }
}