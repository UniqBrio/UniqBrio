import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

// KYC reminder schedule (days after registration)
const REMINDER_DAYS = [1, 7, 10, 13, 14];

export async function POST(req: NextRequest) {
  try {
    console.log("[kyc-reminders] Starting KYC reminder check...");
    
    // Get current date
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let totalRemindersSent = 0;
    
    // Check each reminder day
    for (const dayNumber of REMINDER_DAYS) {
      // Calculate the target registration date (dayNumber days ago)
      const targetDate = new Date(todayStart);
      targetDate.setDate(targetDate.getDate() - dayNumber);
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setDate(targetDateEnd.getDate() + 1);
      
      console.log(`[kyc-reminders] Checking users registered on ${targetDate.toDateString()} (${dayNumber} days ago)`);
      
      // Find users who:
      // 1. Registered on the target date
      // 2. Are verified (completed email verification)
      // 3. Don't have a KYC submission
      const usersNeedingReminder = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: targetDate,
            lt: targetDateEnd
          },
          verified: true, // Only send to verified users
          // Don't send to users who already submitted KYC
          NOT: {
            email: {
              in: await getEmailsWithKYCSubmission()
            }
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });
      
      console.log(`[kyc-reminders] Found ${usersNeedingReminder.length} users needing ${dayNumber}-day reminder`);
      
      // Send reminder emails
      for (const user of usersNeedingReminder) {
        try {
          await sendKYCReminderEmail(user.email, user.name, dayNumber);
          totalRemindersSent++;
          console.log(`[kyc-reminders] Sent ${dayNumber}-day reminder to ${user.email}`);
        } catch (emailError) {
          console.error(`[kyc-reminders] Failed to send reminder to ${user.email}:`, emailError);
        }
      }
    }
    
    console.log(`[kyc-reminders] Completed. Total reminders sent: ${totalRemindersSent}`);
    
    return NextResponse.json({
      success: true,
      remindersSent: totalRemindersSent,
      message: `KYC reminder check completed. ${totalRemindersSent} reminders sent.`
    });
    
  } catch (error) {
    console.error("[kyc-reminders] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process KYC reminders" },
      { status: 500 }
    );
  }
}

// Helper function to get emails of users who have already submitted KYC
async function getEmailsWithKYCSubmission(): Promise<string[]> {
  try {
    // Get all KYC submissions
    const kycSubmissions = await prisma.kycSubmission.findMany({
      select: { userId: true }
    });
    
    const userIds = kycSubmissions.map(kyc => kyc.userId);
    
    if (userIds.length === 0) return [];
    
    // Get emails of users who have submitted KYC
    const users = await prisma.user.findMany({
      where: {
        userId: { in: userIds }
      },
      select: { email: true }
    });
    
    return users.map(user => user.email);
  } catch (error) {
    console.error("[kyc-reminders] Error getting KYC emails:", error);
    return [];
  }
}

// Function to send KYC reminder email
async function sendKYCReminderEmail(email: string, name: string, dayNumber: number) {
  const subject = `Reminder: Complete Your KYC Verification - UniqBrio (Day ${dayNumber})`;
  
  // Customize message based on day number
  let urgencyMessage = "";
  let daysLeft = 15 - dayNumber; // Assuming 15-day deadline
  
  if (dayNumber >= 13) {
    urgencyMessage = `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">🚨 URGENT: Only ${daysLeft} days left!</h3>
        <p style="color: #dc2626; margin: 0; font-weight: 600;">
          Your account will be restricted if KYC is not completed by the deadline.
        </p>
      </div>
    `;
  } else if (dayNumber >= 10) {
    urgencyMessage = `
      <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">⚠️ Important: ${daysLeft} days remaining</h3>
        <p style="color: #92400e; margin: 0; font-weight: 600;">
          Please complete your KYC verification soon to avoid any service interruption.
        </p>
      </div>
    `;
  } else {
    urgencyMessage = `
      <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0ea5e9; margin: 0 0 10px 0; font-size: 18px;">📋 Friendly Reminder</h3>
        <p style="color: #0369a1; margin: 0;">
          Complete your KYC verification to unlock all UniqBrio features. You have ${daysLeft} days remaining.
        </p>
      </div>
    `;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">UniqBrio</h1>
          <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #f97316, #7c3aed); margin: 10px auto;"></div>
        </div>
        
        <h2 style="color: #374151; text-align: center; margin-bottom: 20px;">KYC Verification Pending</h2>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Hello ${name || 'Valued User'},
        </p>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          This is a reminder that your KYC (Know Your Customer) verification is still pending. 
          It's been ${dayNumber} day${dayNumber > 1 ? 's' : ''} since your registration, and we haven't received your verification documents yet.
        </p>
        
        ${urgencyMessage}
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h3 style="color: #0ea5e9; margin: 0 0 10px 0; font-size: 18px;">📋 What you need to do:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Log into your UniqBrio dashboard</li>
            <li style="margin-bottom: 8px;">Click on the "Verification" button</li>
            <li style="margin-bottom: 8px;">Complete the KYC form with required documents</li>
            <li>Submit for review</li>
          </ul>
        </div>
        
        <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #16a34a; margin: 0 0 10px 0; font-size: 16px;">✅ Benefits of completing KYC:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; font-size: 14px;">
            <li>Full access to all UniqBrio features</li>
            <li>Enhanced account security</li>
            <li>Compliance with regulatory requirements</li>
            <li>Priority customer support</li>
          </ul>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          The verification process takes only a few minutes and helps us ensure the security and integrity of our platform.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
          If you have any questions or need assistance, please contact our support team at 
          <a href="mailto:support@uniqbrio.com" style="color: #7c3aed;">support@uniqbrio.com</a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
          © 2025 UniqBrio. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  await sendEmail({
    to: email,
    subject,
    html
  });
}

// GET endpoint for manual trigger (for testing)
export async function GET(req: NextRequest) {
  return POST(req);
}
