import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import KycSubmissionModel from "@/models/KycSubmission";
import KycReviewModel from "@/models/KycReview";
import { dbConnect } from "@/lib/mongodb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production');

async function verifyAdminToken(request: NextRequest) {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) {
      console.log("[admin-data] No admin session cookie found");
      return false;
    }

    const verified = await jwtVerify(adminSession, JWT_SECRET, {
      issuer: "urn:uniqbrio:admin:issuer",
      audience: "urn:uniqbrio:admin:audience"
    });
    
    console.log("[admin-data] Admin token verified successfully");
    return true;
  } catch (error) {
    console.error("[admin-data] Token verification failed:", error);
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

    // PERFORMANCE: Batch all database queries instead of N+1 queries in map
    const userIds = latestSubmissions.map((s: any) => s.userId);
    const academyIds = latestSubmissions.map((s: any) => s.academyId);

    // Fetch all data in parallel
    const [allUsers, allRejections, allRegistrations] = await Promise.all([
      UserModel.find({ userId: { $in: userIds } })
        .select('userId email name kycStatus kycSubmissionDate')
        .lean(),
      KycReviewModel.find({
        userId: { $in: userIds },
        academyId: { $in: academyIds },
        status: 'rejected'
      }).select('userId academyId').lean(),
      RegistrationModel.find({
        $or: [
          { userId: { $in: userIds } },
          { academyId: { $in: academyIds } }
        ]
      }).select('userId academyId businessInfo').lean()
    ]);

    // Create lookup maps for O(1) access
    const userMap = new Map(allUsers.map((u: any) => [u.userId, u]));
    const rejectionMap = new Map(allRejections.map((r: any) => [`${r.userId}-${r.academyId}`, true]));
    const registrationMap = new Map(
      allRegistrations.map((r: any) => [r.userId || r.academyId, r])
    );

    // Get submission counts in bulk
    const submissionCounts = await KycSubmissionModel.aggregate([
      { $match: { userId: { $in: userIds }, academyId: { $in: academyIds } } },
      { $group: { _id: { userId: '$userId', academyId: '$academyId' }, count: { $sum: 1 } } }
    ]);
    const countMap = new Map(
      submissionCounts.map((s: any) => [`${s._id.userId}-${s._id.academyId}`, s.count])
    );

    // Enrich submissions using pre-fetched data (no database queries in loop)
    const enrichedSubmissions = latestSubmissions.map((submission: any) => {
      const user = userMap.get(submission.userId);
      const hasRejection = rejectionMap.has(`${submission.userId}-${submission.academyId}`);
      const totalSubmissions = countMap.get(`${submission.userId}-${submission.academyId}`) || 1;
      const registration = registrationMap.get(submission.userId) || registrationMap.get(submission.academyId);
      
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
        isResubmission: !!hasRejection,
        totalSubmissions: totalSubmissions
      };
    });

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
    const userIds = users.map((u: any) => u.userId).filter(Boolean);
    const academyIds = users.map((u: any) => u.academyId).filter(Boolean);

    // PERFORMANCE: Batch all database queries
    const [allKycSubmissions, allRegistrations] = await Promise.all([
      KycSubmissionModel.find({
        userId: { $in: userIds },
        academyId: { $in: academyIds }
      }).select('userId academyId').lean(),
      RegistrationModel.find({
        $or: [
          { userId: { $in: userIds } },
          { academyId: { $in: academyIds } }
        ]
      }).select('userId academyId businessInfo adminInfo preferences').lean()
    ]);

    // Create lookup maps
    const kycMap = new Map(
      allKycSubmissions.map((k: any) => [`${k.userId}-${k.academyId}`, k])
    );
    const regMap = new Map(
      allRegistrations.map((r: any) => [r.userId || r.academyId, r])
    );

    const academiesWithKYC = users.map((user: any) => {
      const kycSubmission = kycMap.get(`${user.userId}-${user.academyId}`);
      const registration = regMap.get(user.userId) || regMap.get(user.academyId);
      
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
        ownerName: user.name || 'Unknown',
        ownerEmail: user.email || 'Unknown',
        verified: user.verified,
        createdAt: user.createdAt,
        hasKYCSubmission: !!kycSubmission,
        kycStatus: kycSubmission ? 'submitted' : 'not_submitted',
        businessInfo: businessInfo,
        adminInfo: adminInfo,
        preferences: preferences
      };
    });

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
