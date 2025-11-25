import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";
import KycSubmissionModel from "@/models/KycSubmission";
import { dbConnect } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log("[kyc/status/userId] Checking KYC status for userId:", params.userId);
    
    // Verify authentication (optional - depends on whether this should be public or protected)
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      console.log("[kyc/status/userId] No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionCookie);
    if (!payload?.email) {
      console.log("[kyc/status/userId] Invalid token payload");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by userId
    await dbConnect();
    const user = await UserModel.findOne({ userId: params.userId }).select(
      'userId academyId email name registrationComplete kycStatus kycSubmissionDate createdAt'
    );

    if (!user) {
      console.log("[kyc/status/userId] User not found for userId:", params.userId);
      return NextResponse.json({ 
        error: "User not found",
        status: "not_found"
      }, { status: 404 });
    }

    if (!user.registrationComplete || !user.userId || !user.academyId) {
      console.log("[kyc/status/userId] User registration not complete");
      return NextResponse.json({ 
        status: "pending",
        hasSubmitted: false,
        message: "Registration not complete",
        userDetails: {
          name: user.name,
          email: user.email
        }
      });
    }

    // Get the latest KYC submission with rejection details
    const kycSubmission = await KycSubmissionModel.findOne({
      userId: user.userId,
      academyId: user.academyId
    }).select('_id createdAt rejectionReason').sort({ createdAt: -1 });

    // Auto-expire logic: if no submission and more than 14 days since account creation
    if (!kycSubmission && user.registrationComplete && user.createdAt) {
      const registeredAt = new Date(user.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 14 && user.kycStatus !== 'expired') {
        await UserModel.updateMany({ 
          userId: params.userId 
        }, {
          $set: { kycStatus: 'expired' }
        });
        
        return NextResponse.json({
          status: "expired",
          hasSubmitted: false,
          submissionDate: null,
          message: "KYC verification window expired - please resubmit",
          userDetails: {
            name: user.name,
            email: user.email
          }
        });
      }
    }

    // Return status based on user's KYC status
    switch (user.kycStatus) {
      case 'approved':
        return NextResponse.json({
          status: "approved",
          hasSubmitted: true,
          submissionDate: user.kycSubmissionDate ?? kycSubmission?.createdAt ?? null,
          message: "KYC approved and verified",
          userDetails: {
            name: user.name,
            email: user.email
          }
        });

      case 'rejected':
        return NextResponse.json({
          status: "rejected",
          hasSubmitted: !!kycSubmission,
          submissionDate: kycSubmission?.createdAt ?? null,
          rejectionReason: (kycSubmission as any)?.rejectionReason || "KYC documents require resubmission",
          message: "KYC rejected - please resubmit with corrected documents",
          userDetails: {
            name: user.name,
            email: user.email
          }
        });

      case 'expired':
        return NextResponse.json({
          status: "expired",
          hasSubmitted: false,
          submissionDate: null,
          message: "KYC verification expired - please submit documents",
          userDetails: {
            name: user.name,
            email: user.email
          }
        });

      case 'pending':
      default:
        if (kycSubmission) {
          return NextResponse.json({
            status: "submitted",
            hasSubmitted: true,
            submissionDate: kycSubmission.createdAt,
            message: "KYC submitted and under review",
            userDetails: {
              name: user.name,
              email: user.email
            }
          });
        } else {
          return NextResponse.json({
            status: "pending", 
            hasSubmitted: false,
            message: "KYC submission required",
            userDetails: {
              name: user.name,
              email: user.email
            }
          });
        }
    }

  } catch (error) {
    console.error("[kyc/status/userId] Error checking KYC status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}