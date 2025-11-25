import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import KycSubmissionModel from "@/models/KycSubmission";
import KycReviewModel from "@/models/KycReview";
import { dbConnect } from "@/lib/mongodb";

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
    await dbConnect();

    // Get all KYC submissions, ordered by creation date
    const kycSubmissions = await KycSubmissionModel.find({})
      .sort({ createdAt: -1 })
      .lean();

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

    // Get user and academy data separately
    const enrichedSubmissions = await Promise.all(
      latestSubmissions.map(async (submission: any) => {
        const user = await UserModel.findOne({ userId: submission.userId })
          .select('email name kycStatus kycSubmissionDate')
          .lean();

        // Check if this is a resubmission by looking for previous rejections
        const hasRejection = await KycReviewModel.findOne({
          userId: submission.userId,
          academyId: submission.academyId,
          status: 'rejected'
        }).lean();

        // Count total submissions for this user/academy
        const totalSubmissions = await KycSubmissionModel.countDocuments({
          userId: submission.userId,
          academyId: submission.academyId
        });

        // Get academy name from registration data
        const registration = await RegistrationModel.findOne({
          $or: [
            { userId: submission.userId },
            { academyId: submission.academyId }
          ]
        })
          .select('businessInfo')
          .lean();
        
        let academyName = `Academy ${submission.academyId}`;
        if (registration?.businessInfo && typeof registration.businessInfo === 'object' && 'businessName' in registration.businessInfo) {
          academyName = (registration.businessInfo as { businessName?: string }).businessName || academyName;
        }

        return {
          id: submission._id,
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
          isResubmission: !!hasRejection || totalSubmissions > 1,
          totalSubmissions: totalSubmissions
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
    await dbConnect();

    // Get all users with completed registrations
    const users = await UserModel.find({
      registrationComplete: true,
      userId: { $ne: null },
      academyId: { $ne: null }
    })
      .select('email name userId academyId verified createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Check which academies have KYC submissions
    const academiesWithKYC = await Promise.all(
      users.map(async (user: any) => {
        const kycSubmission = await KycSubmissionModel.findOne({
          userId: user.userId,
          academyId: user.academyId
        }).lean();

        // Get comprehensive academy data from registration
        const registration = await RegistrationModel.findOne({
          $or: [
            { userId: user.userId },
            { academyId: user.academyId }
          ]
        })
          .select('businessInfo adminInfo preferences')
          .lean();
        
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
    await dbConnect();

    // Get total counts
    const totalAcademies = await UserModel.countDocuments({
      registrationComplete: true
    });

    const totalKYCSubmissions = await KycSubmissionModel.countDocuments();

    const verifiedUsers = await UserModel.countDocuments({
      registrationComplete: true,
      verified: true
    });

    // Calculate pending KYC (registered but no KYC submission)
    const usersWithKYC = await KycSubmissionModel.find({}).select('userId').lean();
    const userIdsWithKYC = usersWithKYC.map(k => k.userId);
    
    const pendingKYC = await UserModel.countDocuments({
      registrationComplete: true,
      userId: { $nin: userIdsWithKYC }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalAcademies,
        totalKYCSubmissions,
        verifiedAcademies: totalKYCSubmissions,
        pendingKYC,
        monthlyGrowth: 18
      }
    });

  } catch (error) {
    console.error("[admin-data] Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}

async function getAnalytics() {
  try {
    await dbConnect();

    const totalUsers = await UserModel.countDocuments();
    const completedRegistrations = await UserModel.countDocuments({
      registrationComplete: true
    });
    const kycSubmissions = await KycSubmissionModel.countDocuments();

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

      await dbConnect();

      // Find latest submission to infer user/academy
      const latest = await KycSubmissionModel.findById(kycId)
        .select('userId academyId')
        .lean();

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

      await UserModel.updateMany(
        { userId: latest.userId },
        { $set: updateData }
      );

      // Create KycReview record for audit trail
      const reviewData: any = {
        kycId: kycId,
        userId: latest.userId,
        academyId: latest.academyId,
        reviewerId: "admin",
        status: status,
        comments: notes || (status === 'approved' ? 'KYC approved by admin' : 'KYC rejected by admin'),
      };

      // Add detailed rejection data if available
      if (action === 'update-kyc-status-with-email' && rejectionReasons && Array.isArray(rejectionReasons)) {
        reviewData.rejectionReasons = rejectionReasons;
        reviewData.customMessage = customMessage;
      }

      await KycReviewModel.create(reviewData);

      // Notify user via email
      try {
        const userDoc = await UserModel.findOne({ userId: latest.userId })
          .select('email name academyId')
          .lean();
        
        // Get academy name for personalized email
        let academyName: string | undefined;
        if (userDoc?.academyId) {
          try {
            const registration = await RegistrationModel.findOne({
              $or: [
                { academyId: userDoc.academyId },
                { userId: latest.userId }
              ]
            })
              .select('businessInfo')
              .lean();
            
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
