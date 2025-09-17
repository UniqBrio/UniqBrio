import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    console.log("[kyc/auto-expire] Starting auto-expire process...");
    
    // Optional: Add API key verification for cron job security
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.CRON_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      console.log("[kyc/auto-expire] Invalid API key");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find users who registered more than 14 days ago but haven't submitted KYC
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    console.log("[kyc/auto-expire] Looking for users registered before:", fourteenDaysAgo);

    // Get users who need KYC expiry
    const usersToExpire = await prisma.user.findMany({
      where: {
        registrationComplete: true,
        kycStatus: 'pending', // Only expire users with pending status
        createdAt: {
          lte: fourteenDaysAgo
        },
        // Ensure they haven't submitted KYC
        userId: {
          not: null
        },
        academyId: {
          not: null
        }
      },
      select: {
        id: true,
        userId: true,
        academyId: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    console.log(`[kyc/auto-expire] Found ${usersToExpire.length} users to check for expiry`);

    let expiredCount = 0;
    let emailsSent = 0;

    for (const user of usersToExpire) {
      try {
        // Check if user has any KYC submissions
        const hasKycSubmission = await prisma.kycSubmission.findFirst({
          where: {
            userId: user.userId!,
            academyId: user.academyId!
          },
          select: { id: true }
        });

        // Only expire users who haven't submitted KYC
        if (!hasKycSubmission) {
          console.log(`[kyc/auto-expire] Expiring KYC for user: ${user.email} (${user.userId})`);
          
          // Update user's KYC status to expired
          await prisma.user.updateMany({
            where: { id: user.id },
            data: { 
              kycStatus: 'expired'
            }
          });

          expiredCount++;

          // Send expiry notification email
          if (user.email) {
            try {
              await sendEmail({
                to: user.email,
                subject: "⚠️ KYC Verification Expired - Immediate Action Required - UniqBrio",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">UniqBrio</h1>
                        <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #f97316, #7c3aed); margin: 10px auto;"></div>
                      </div>
                      
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: #fef3c7; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 40px;">⌛</span>
                        </div>
                        <h2 style="color: #d97706; margin: 0; font-size: 24px;">KYC Verification Window Expired</h2>
                      </div>
                      
                      <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0 0 15px 0; color: #92400e; font-weight: 600; font-size: 18px;">
                          Hi ${user.name || 'there'},
                        </p>
                        <p style="margin: 0; color: #92400e; line-height: 1.6; font-size: 16px;">
                          Your 14-day KYC verification window has expired. To continue using UniqBrio services, please submit your verification documents immediately.
                        </p>
                      </div>
                      
                      <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 25px; margin: 25px 0; border-radius: 8px;">
                        <h3 style="color: #7f1d1d; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                          <span style="margin-right: 10px;">🚨</span> Current Restrictions:
                        </h3>
                        <ul style="color: #7f1d1d; margin: 0; padding-left: 20px; line-height: 1.8;">
                          <li style="margin-bottom: 8px;">❌ <strong>Dashboard access suspended</strong></li>
                          <li style="margin-bottom: 8px;">❌ <strong>Premium features disabled</strong></li>
                          <li style="margin-bottom: 8px;">❌ <strong>Account services limited</strong></li>
                          <li>❌ <strong>Transaction capabilities blocked</strong></li>
                        </ul>
                      </div>
                      
                      <div style="background: #f0f9ff; border: 2px solid #0ea5e9; padding: 25px; margin: 25px 0; border-radius: 8px;">
                        <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                          <span style="margin-right: 10px;">🔄</span> Restore Your Account - Required Documents:
                        </h3>
                        <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; line-height: 1.8;">
                          <li style="margin-bottom: 8px;">📷 <strong>Owner Photo</strong> - Clear, well-lit headshot</li>
                          <li style="margin-bottom: 8px;">🏢 <strong>Academy Banner/Storefront</strong> - Professional image</li>
                          <li style="margin-bottom: 8px;">🤝 <strong>Combined Photo</strong> - You with your academy banner</li>
                          <li>📍 <strong>Location Verification</strong> - GPS coordinates and address</li>
                        </ul>
                      </div>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" 
                           style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
                          🚀 Submit KYC Now
                        </a>
                      </div>
                      
                      <div style="background: #f3f4f6; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #6b7280; text-align: center;">
                        <p style="color: #374151; margin: 0; font-weight: 600;">⚡ Fast-Track Approval Available</p>
                        <p style="color: #4b5563; margin: 10px 0 0 0; font-size: 14px;">Submit your documents now and get approved within 24 hours!</p>
                      </div>
                      
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                      
                      <div style="text-align: center; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0 0 10px 0;">⚠️ <strong>Important:</strong> Continued delay may result in account suspension.</p>
                        <p style="margin: 0 0 15px 0;">
                          Need assistance? Our support team is ready to help you complete the process.
                        </p>
                        <p style="margin: 0;">
                          📧 <a href="mailto:support@uniqbrio.com" style="color: #7c3aed; text-decoration: none;">support@uniqbrio.com</a> | 
                          📞 Emergency KYC Helpline | 
                          💬 Live Chat Support
                        </p>
                        <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                          © 2025 UniqBrio. All rights reserved. | This notification was sent due to your expired KYC verification.
                        </p>
                      </div>
                    </div>
                  </div>
                `,
              });
              
              emailsSent++;
              console.log(`[kyc/auto-expire] Sent expiry notification to: ${user.email}`);
            } catch (emailError) {
              console.error(`[kyc/auto-expire] Failed to send email to ${user.email}:`, emailError);
            }
          }
        } else {
          console.log(`[kyc/auto-expire] User ${user.email} has KYC submission, skipping expiry`);
        }
      } catch (userError) {
        console.error(`[kyc/auto-expire] Error processing user ${user.email}:`, userError);
      }
    }

    console.log(`[kyc/auto-expire] Completed: ${expiredCount} users expired, ${emailsSent} emails sent`);

    return NextResponse.json({
      success: true,
      message: `Auto-expire process completed`,
      statistics: {
        usersChecked: usersToExpire.length,
        usersExpired: expiredCount,
        emailsSent: emailsSent
      }
    });

  } catch (error) {
    console.error("[kyc/auto-expire] Error in auto-expire process:", error);
    return NextResponse.json(
      { error: "Auto-expire process failed", details: (error as any)?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET method for manual trigger (for testing)
export async function GET(request: NextRequest) {
  console.log("[kyc/auto-expire] Manual trigger via GET request");
  return POST(request);
}