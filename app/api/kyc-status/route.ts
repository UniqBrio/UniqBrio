import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("[kyc-status] Checking KYC status...");
    
    // Verify authentication
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      console.log("[kyc-status] No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionCookie);
    if (!payload?.email) {
      console.log("[kyc-status] Invalid token payload");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[kyc-status] Checking for user:", payload.email);

    // Get user's userId and academyId and KYC fields
    const user = await prisma.user.findFirst({
      where: { email: payload.email },
      select: { 
        userId: true, 
        academyId: true,
        registrationComplete: true,
        kycStatus: true,
        kycSubmissionDate: true,
        createdAt: true,
      }
    });

    if (!user || !user.registrationComplete || !user.userId || !user.academyId) {
      console.log("[kyc-status] User registration not complete");
      return NextResponse.json({ 
        status: "pending",
        hasSubmitted: false,
        daysSinceRegistration: 0,
        daysLeft: 14,
        registrationDate: user?.createdAt || null,
        message: "Registration not complete"
      });
    }

    // Check if KYC submission exists
    const kycSubmission = await prisma.kycSubmission.findFirst({
      where: {
        userId: user.userId,
        academyId: user.academyId
      },
      select: {
        id: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Auto-expire logic: if no submission and more than 14 days since account creation and registration complete
    if (!kycSubmission && user.registrationComplete && user.createdAt) {
      const registeredAt = new Date(user.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(14 - diffDays, 0);
      
      if (diffDays >= 14 && user.kycStatus !== 'expired') {
        console.log("[kyc-status] Auto-expiring KYC for user:", payload.email, "Days since registration:", diffDays);
        await prisma.user.updateMany({ 
          where: { email: payload.email }, 
          data: { kycStatus: 'expired' } 
        });
        
        return NextResponse.json({
          status: "expired",
          hasSubmitted: false,
          submissionDate: null,
          daysSinceRegistration: diffDays,
          daysLeft: 0,
          registrationDate: user.createdAt,
          message: "KYC verification period has expired"
        });
      }
    }

    // If user already approved, short-circuit
    if (user.kycStatus === 'approved') {
      return NextResponse.json({
        status: "verified",
        hasSubmitted: true,
        submissionDate: user.kycSubmissionDate ?? null,
        message: "KYC approved"
      });
    }

    if (user.kycStatus === 'rejected') {
      return NextResponse.json({
        status: "rejected",
        hasSubmitted: !!kycSubmission,
        submissionDate: kycSubmission?.createdAt ?? null,
        message: "KYC rejected"
      });
    }

    if (user.kycStatus === 'expired') {
      return NextResponse.json({
        status: "expired",
        hasSubmitted: false,
        submissionDate: null,
        message: "KYC expired"
      });
    }

    if (kycSubmission) {
      console.log("[kyc-status] KYC submission found:", kycSubmission.id);
      
      // Calculate days since registration for consistency
      let daysSinceRegistration = 0;
      let daysLeft = 14;
      if (user.createdAt) {
        const registeredAt = new Date(user.createdAt);
        const now = new Date();
        daysSinceRegistration = Math.floor((now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24));
        daysLeft = Math.max(14 - daysSinceRegistration, 0);
      }
      
      return NextResponse.json({
        status: "submitted",
        hasSubmitted: true,
        submissionDate: kycSubmission.createdAt,
        daysSinceRegistration,
        daysLeft,
        registrationDate: user.createdAt,
        message: "KYC submitted successfully"
      });
    } else {
      console.log("[kyc-status] No KYC submission found");
      
      // Calculate days since registration
      let daysSinceRegistration = 0;
      let daysLeft = 14;
      if (user.createdAt) {
        const registeredAt = new Date(user.createdAt);
        const now = new Date();
        daysSinceRegistration = Math.floor((now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24));
        daysLeft = Math.max(14 - daysSinceRegistration, 0);
      }
      
      return NextResponse.json({
        status: "pending", 
        hasSubmitted: false,
        daysSinceRegistration,
        daysLeft,
        registrationDate: user.createdAt,
        message: "KYC submission pending"
      });
    }

  } catch (error) {
    console.error("[kyc-status] Error checking KYC status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
