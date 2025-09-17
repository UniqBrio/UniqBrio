import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { jwtVerify } from "jose";
import { sendEmail } from "@/lib/email";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

async function verifyAdmin(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_session")?.value;
    if (!token) return false;
    await jwtVerify(token, JWT_SECRET, {
      issuer: "urn:uniqbrio:admin:issuer",
      audience: "urn:uniqbrio:admin:audience",
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId, decision, notes } = await request.json();
    if (!submissionId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "submissionId and decision (approved|rejected) are required" }, { status: 400 });
    }

    const kyc = await prisma.kycSubmission.findFirst({
      where: { id: submissionId },
      select: { userId: true, academyId: true }
    });
    if (!kyc?.userId) return NextResponse.json({ error: "KYC submission not found" }, { status: 404 });

    const updated = await prisma.user.updateMany({
      where: { userId: kyc.userId },
      data: {
        kycStatus: decision as any,
        ...(decision === 'approved' ? { kycSubmissionDate: new Date() } : {}),
      },
    });

    const userDoc = await prisma.user.findFirst({ where: { userId: kyc.userId }, select: { email: true, name: true } });
    if (userDoc?.email) {
      if (decision === 'approved') {
        await sendEmail({
          to: userDoc.email,
          subject: "KYC Approved - UniqBrio",
          html: `<p>Hi ${userDoc.name || 'there'},</p><p>Your KYC has been approved. You now have full access to UniqBrio.</p>`,
        });
      } else {
        await sendEmail({
          to: userDoc.email,
          subject: "KYC Rejected - UniqBrio",
          html: `<p>Hi ${userDoc.name || 'there'},</p><p>Your KYC submission was rejected.${notes ? ` Reason: ${notes}` : ''}</p><p>Please re-upload your documents.</p>`,
        });
      }
    }

    return NextResponse.json({ success: true, message: `KYC ${decision}` });
  } catch (e) {
    console.error("[admin/kyc] error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}