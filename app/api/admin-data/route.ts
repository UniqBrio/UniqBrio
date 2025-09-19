import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function verifyAdminToken(request: NextRequest) {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) return false;

    await jwtVerify(adminSession, JWT_SECRET, {
      issuer: "urn:uniqbrio:admin:issuer",
      audience: "urn:uniqbrio:admin:audience"
    });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'kyc-queue':
        return getKYCQueue();
      case 'academies':
        return getAcademies();
      case 'dashboard-stats':
        return getDashboardStats();
      case 'analytics':
        return getAnalytics();
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

  } catch (error) {
    console.error("[admin-data] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getKYCQueue() {
  try {
    // Get all KYC submissions, but group by userId and academyId to avoid duplicates
    const kycSubmissions = await prisma.kycSubmission.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Remove duplicates by keeping only the latest submission per academy
    const uniqueSubmissions = new Map();
    kycSubmissions.forEach(submission => {
      const key = `${submission.userId}_${submission.academyId}`;
      if (!uniqueSubmissions.has(key) || 
          uniqueSubmissions.get(key).createdAt < submission.createdAt) {
        uniqueSubmissions.set(key, submission);
      }
    });

    // Convert back to array
    const latestSubmissions = Array.from(uniqueSubmissions.values());

    // Get user and academy data separately since we need to join through userId/academyId
    const enrichedSubmissions = await Promise.all(
      latestSubmissions.map(async (submission) => {
        const user = await prisma.user.findFirst({
          where: { userId: submission.userId },
          select: { email: true, name: true, kycStatus: true, kycSubmissionDate: true }
        });

        // Check if this is a resubmission by looking for previous rejections
        const hasRejection = await prisma.kycReview.findFirst({
          where: {
            kyc: {
              userId: submission.userId,
              academyId: submission.academyId
            },
            status: 'rejected'
          }
        });

        // Count total submissions for this user/academy to detect resubmissions
        const totalSubmissions = await prisma.kycSubmission.count({
          where: {
            userId: submission.userId,
            academyId: submission.academyId
          }
        });

        // Get academy name from registration data
        const registration = await prisma.registration.findFirst({
          where: { 
            OR: [
              { userId: submission.userId },
              { academyId: submission.academyId }
            ]
          },
          select: { businessInfo: true }
        });
        
        let academyName = `Academy ${submission.academyId}`;
        if (registration?.businessInfo && typeof registration.businessInfo === 'object' && 'businessName' in registration.businessInfo) {
          academyName = (registration.businessInfo as { businessName?: string }).businessName || academyName;
        }

        // For now, we'll extract academy name from the location or use academy ID
        return {
          id: submission.id,
          academyId: submission.academyId,
          userId: submission.userId,
          academyName: academyName,
          ownerName: user?.name || 'Unknown',
          ownerEmail: user?.email || 'Unknown',
          location: submission.location,
          address: submission.address,
          dateTime: submission.dateTime,
          latitude: submission.latitude,
          longitude: submission.longitude,
          submittedAt: submission.createdAt,
          status: user?.kycStatus || 'pending',
          ownerImageUrl: submission.ownerImageUrl,
          bannerImageUrl: submission.bannerImageUrl,
          ownerWithBannerImageUrl: submission.ownerWithBannerImageUrl,
          isResubmission: !!hasRejection || totalSubmissions > 1, // Flag for resubmissions
          totalSubmissions: totalSubmissions // Count of submissions
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: enrichedSubmissions 
    });

  } catch (error) {
    console.error("[admin-data] KYC queue error:", error);
    return NextResponse.json({ error: "Failed to fetch KYC queue" }, { status: 500 });
  }
}

async function getAcademies() {
  try {
    // Get all users with completed registrations
    const users = await prisma.user.findMany({
      where: {
        registrationComplete: true,
        userId: { not: null },
        academyId: { not: null }
      },
      select: {
        email: true,
        name: true,
        userId: true,
        academyId: true,
        verified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check which academies have KYC submissions
    const academiesWithKYC = await Promise.all(
      users.map(async (user) => {
        const kycSubmission = await prisma.kycSubmission.findFirst({
          where: {
            userId: user.userId!,
            academyId: user.academyId!
          }
        });

        // Get comprehensive academy data from registration
        const registration = await prisma.registration.findFirst({
          where: { 
            OR: [
              { userId: user.userId! },
              { academyId: user.academyId! }
            ]
          },
          select: { businessInfo: true, adminInfo: true, preferences: true }
        });
        
        let academyName = `Academy ${user.academyId}`;
        let businessInfo: any = {};
        let adminInfo: any = {};
        let preferences: any = {};
        
        if (registration) {
          businessInfo = registration.businessInfo as any || {};
          adminInfo = registration.adminInfo as any || {};
          preferences = registration.preferences as any || {};
          academyName = businessInfo.businessName || academyName;
        }

        return {
          academyId: user.academyId,
          userId: user.userId,
          academyName: academyName,
          ownerName: user.name,
          ownerEmail: user.email,
          verified: user.verified,
          hasKYC: !!kycSubmission,
          registeredAt: user.createdAt,
          status: kycSubmission ? 'kyc_submitted' : 'registered',
          // Enhanced business data
          businessInfo: {
            legalEntityName: businessInfo.legalEntityName || '',
            businessEmail: businessInfo.businessEmail || user.email,
            phoneNumber: businessInfo.phoneNumber || '',
            industryType: businessInfo.industryType || '',
            servicesOffered: businessInfo.servicesOffered || [],
            studentSize: businessInfo.studentSize || '',
            staffCount: businessInfo.staffCount || '',
            address: businessInfo.address || '',
            city: businessInfo.city || '',
            state: businessInfo.state || '',
            country: businessInfo.country || '',
            pincode: businessInfo.pincode || '',
            website: businessInfo.website || '',
            preferredLanguage: businessInfo.preferredLanguage || '',
            taxId: businessInfo.taxId || ''
          },
          // Admin contact info
          adminInfo: {
            fullName: adminInfo.fullName || user.name,
            email: adminInfo.email || user.email,
            phone: adminInfo.phone || '',
            socialProfile: adminInfo.socialProfile || ''
          },
          // Additional preferences
          preferences: {
            referralSource: preferences.referralSource || '',
            featuresOfInterest: preferences.featuresOfInterest || []
          }
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: academiesWithKYC 
    });

  } catch (error) {
    console.error("[admin-data] Academies error:", error);
    return NextResponse.json({ error: "Failed to fetch academies" }, { status: 500 });
  }
}

async function getDashboardStats() {
  try {
    // Get total counts
    const totalAcademies = await prisma.user.count({
      where: { registrationComplete: true }
    });

    const totalKYCSubmissions = await prisma.kycSubmission.count();

    const verifiedUsers = await prisma.user.count({
      where: { 
        registrationComplete: true,
        verified: true 
      }
    });

    // Calculate pending KYC (registered but no KYC submission)
    const usersWithKYC = await prisma.kycSubmission.findMany({
      select: { userId: true }
    });
    const userIdsWithKYC = usersWithKYC.map(k => k.userId);
    
    const pendingKYC = await prisma.user.count({
      where: {
        registrationComplete: true,
        userId: { notIn: userIdsWithKYC }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalAcademies,
        totalKYCSubmissions,
        verifiedAcademies: totalKYCSubmissions, // Assuming submitted KYC means verified for now
        pendingKYC,
        monthlyGrowth: 18 // Calculate this based on dates later
      }
    });

  } catch (error) {
    console.error("[admin-data] Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}

async function getAnalytics() {
  try {
    const totalUsers = await prisma.user.count();
    const completedRegistrations = await prisma.user.count({
      where: { registrationComplete: true }
    });
    const kycSubmissions = await prisma.kycSubmission.count();

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        completedRegistrations,
        kycSubmissions,
        conversionRate: totalUsers > 0 ? Math.round((completedRegistrations / totalUsers) * 100) : 0,
        kycCompletionRate: completedRegistrations > 0 ? Math.round((kycSubmissions / completedRegistrations) * 100) : 0
      }
    });

  } catch (error) {
    console.error("[admin-data] Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, kycId, status, notes, rejectionReasons, customMessage } = await request.json();

    if (action === 'update-kyc-status' || action === 'update-kyc-status-with-email') {
      if (!kycId || !status) {
        return NextResponse.json({ error: "kycId and status are required" }, { status: 400 });
      }

      // Find latest submission to infer user/academy
      const latest = await prisma.kycSubmission.findFirst({
        where: { id: kycId },
        select: { userId: true, academyId: true }
      });

      if (!latest?.userId) {
        return NextResponse.json({ error: "KYC submission not found" }, { status: 404 });
      }

      // Persist on User
      const updateData: any = {
        kycStatus: status,
      };
      if (status === 'approved') {
        updateData.kycSubmissionDate = new Date();
      }

      await prisma.user.updateMany({
        where: { userId: latest.userId },
        data: updateData,
      });

      // Create KycReview record for audit trail
      const reviewData: any = {
        kycId: kycId,
        reviewerId: "admin", // In a real app, this would be the actual admin's ID
        status: status,
        comments: notes || (status === 'approved' ? 'KYC approved by admin' : 'KYC rejected by admin'),
      };

      // Add detailed rejection data if available
      if (action === 'update-kyc-status-with-email' && rejectionReasons && Array.isArray(rejectionReasons)) {
        reviewData.rejectionReasons = rejectionReasons;
        reviewData.customMessage = customMessage;
      }

      await prisma.kycReview.create({
        data: reviewData
      });

      // Notify user via email
      try {
        const userDoc = await prisma.user.findFirst({ 
          where: { userId: latest.userId }, 
          select: { email: true, name: true, academyId: true } 
        });
        
        // Get academy name for personalized email
        let academyName: string | undefined;
        if (userDoc?.academyId) {
          try {
            const registration = await prisma.registration.findFirst({
              where: { 
                OR: [
                  { academyId: userDoc.academyId },
                  { userId: latest.userId }
                ]
              },
              select: { businessInfo: true }
            });
            
            const businessInfo = registration?.businessInfo as any;
            academyName = businessInfo?.businessName;
          } catch (error) {
            console.log("[admin-data] Could not fetch academy name:", error);
          }
        }
        
        if (userDoc?.email) {
          const { sendEmail, generateKYCRejectionEmail, generateKYCApprovalEmail } = await import("@/lib/email");
          
          if (status === 'approved') {
            const emailContent = generateKYCApprovalEmail(userDoc.email, userDoc.name, academyName);
            await sendEmail(emailContent);
          } else if (status === 'rejected') {
            // Check if this is the new detailed rejection with email template
            if (action === 'update-kyc-status-with-email' && rejectionReasons && Array.isArray(rejectionReasons)) {
              // Use the new professional email template
              const emailContent = generateKYCRejectionEmail(
                userDoc.email,
                userDoc.name || 'Valued User',
                rejectionReasons,
                customMessage,
                academyName
              );
              await sendEmail(emailContent);
            } else {
              // Fallback to old simple rejection email
              await sendEmail({
                to: userDoc.email,
                subject: "KYC Rejected - UniqBrio",
                html: `<p>Hi ${userDoc.name || 'there'},</p><p>Your KYC submission was rejected.${notes ? ` Reason: ${notes}` : ''}</p><p>Please resubmit your documents.</p>`
              });
            }
          }
        }
      } catch (e) {
        console.warn("[admin-data] Failed to send KYC status email:", e);
      }

      return NextResponse.json({
        success: true,
        message: `KYC ${status} successfully`
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("[admin-data] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
