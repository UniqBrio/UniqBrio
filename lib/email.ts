// d:\UB\lib\email.ts
// Email service using Gmail SMTP
import nodemailer from "nodemailer"

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_APP_PASSWORD || "",
  },
  tls: {
    // Enforce certificate validation in production; allow relaxed in dev for local setups
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
})

// Log transporter configuration (without sensitive data)
console.log("[EMAIL] Transporter configured with:", {
  service: "gmail",
  user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + "..." : "NOT_SET",
  passwordSet: !!process.env.EMAIL_APP_PASSWORD,
  environment: process.env.NODE_ENV
});

// Test transporter connection on startup
if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  transporter.verify((error: any, success: any) => {
    if (error) {
      console.error("[EMAIL] Transporter verification failed:", error);
    } else {
      console.log("[EMAIL] SMTP server is ready to take our messages");
    }
  });
} else {
  console.warn("[EMAIL] Email credentials not found in environment variables");
}
if (process.env.NODE_ENV === "production" && (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD)) {
  throw new Error("EMAIL_USER/EMAIL_APP_PASSWORD not configured for email sending");
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
  console.log("[EMAIL] Starting sendEmail function...");
  console.log("[EMAIL] Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_USER_SET: !!process.env.EMAIL_USER,
    EMAIL_APP_PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD,
    EMAIL_USER: process.env.EMAIL_USER?.substring(0, 5) + "...", // Log partial for security
  });

  try {
    console.log("[EMAIL] Attempting to send email to:", to);
    console.log("[EMAIL] Subject:", subject);
    
    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: `"UniqBrio" <${process.env.EMAIL_USER || "your-email@gmail.com"}>`,
      to,
      subject,
      html,
      ...(subject.includes("Support Ticket") && { bcc: "support@uniqbrio.com" }),
    })

    console.log("[EMAIL] Email sent successfully:", info.messageId)
    console.log("[EMAIL] Email info:", {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    return true
  } catch (error) {
    console.error("[EMAIL] Error caught in sendEmail:", error);
    if (error instanceof Error) {
      console.error("[EMAIL] Error message:", error.message)
      console.error("[EMAIL] Error stack:", error.stack)
      if (process.env.NODE_ENV !== "production") {
        console.log(`[EMAIL] --- DEV MODE: Email Not Sent ---`)
        console.log(`[EMAIL] To: ${to}`)
        console.log(`[EMAIL] Subject: ${subject}`)
        console.log(`[EMAIL] HTML length: ${html.length} characters`)
        console.log(`[EMAIL] --- End DEV MODE ---`)
        return true // Simulate success in dev if sending fails
      }
      throw new Error(`Failed to send email: ${error.message}`)
    }

    // fallback if the error isn't an instance of Error
    console.error("[EMAIL] Unknown error sending email:", error)
    throw new Error("Failed to send email due to unknown error")
  }
}

/// --- MODIFIED: generateVerificationEmail (OTP Removed) ---
// Now only sends a verification link.
export function generateVerificationEmail(email: string, token: string) {
  // Use query parameter for token verification
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  return {
    to: email,
    subject: "Verify your email address - UniqBrio",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #fd9c2d; text-align: center;">Email Verification</h1>
      <p>Thank you for registering with UniqBrio. Please click the link below to verify your email address:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #fd9c2d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
      </div>

      <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${verificationUrl}</p>

      <p>If you did not register for an account, please ignore this email.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
      </div>
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #fd9c2d; text-align: center;">Password Reset</h1>
      <p>You requested a password reset for your UniqBrio account. Please click the link below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #fd9c2d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
      <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
      </div>
    </div>
  `,
  }
}
// --- generateSupportTicketEmail (Unchanged) ---
export function generateSupportTicketEmail(email: string, ticketNumber: string, issueType: string) {
  return {
    to: email,
    subject: `Your Support Ticket: ${ticketNumber} - UniqBrio`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #39006f; text-align: center;">Support Ticket Confirmation</h1>
      <p>Thank you for contacting UniqBrio support. Your ticket has been received and will be addressed by our team.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
        <p><strong>Issue Type:</strong> ${issueType}</p>
        <p><strong>Date Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>We'll get back to you as soon as possible. You can reply to this email if you have additional information to provide.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} UniqBrio. All rights reserved.</p>
      </div>
    </div>
  `,
  }
}
