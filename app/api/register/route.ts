
import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Enforce authenticated, verified user and derive identity from session
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(session);
    if (!payload?.email || typeof payload.email !== "string") {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();

    const email = payload.email as string;

    // Find user by email (Prisma)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return NextResponse.json({ error: "No user found for this session." }, { status: 404 });
    }

    if (!existingUser.verified) {
      return NextResponse.json({ error: "Email not verified." }, { status: 403 });
    }

    if (existingUser.registrationComplete) {
      return NextResponse.json({ error: "Registration already completed." }, { status: 400 });
    }

    // Validate required fields from request body
    if (!body?.adminInfo?.fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    
    if (!body?.businessInfo?.businessName) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    // Generate sequential academyId using Prisma (check registrations instead of academy)
    const lastRegistration = await prisma.registration.findFirst({
      where: { academyId: { startsWith: 'AC' } },
      orderBy: { academyId: 'desc' }
    });
    let nextAcademyNum = 1;
    if (lastRegistration && lastRegistration.academyId && /^AC\d+$/.test(lastRegistration.academyId)) {
      nextAcademyNum = parseInt(lastRegistration.academyId.replace("AC", "")) + 1;
    }
    const academyId = `AC${nextAcademyNum.toString().padStart(6, "0")}`;

    // Generate sequential userId using Prisma
    const lastUser = await prisma.user.findFirst({
      where: { userId: { startsWith: 'AD' } },
      orderBy: { userId: 'desc' }
    });
    let nextUserNum = 1;
    if (lastUser && lastUser.userId && /^AD\d+$/.test(lastUser.userId)) {
      nextUserNum = parseInt(lastUser.userId.replace("AD", "")) + 1;
    }
    const userId = `AD${nextUserNum.toString().padStart(6, "0")}`;

    // Use Prisma transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update basic user info and persist IDs
      const updatedUser = await tx.user.update({
        where: { email },
        data: {
          name: body.adminInfo.fullName,
          phone: body?.adminInfo?.phone || existingUser.phone,
          role: existingUser.role, // keep current role (server-controlled)
          userId,
          academyId,
        },
      });

      // Create Registration record with nested objects only (cleaner approach)
      const registration = await tx.registration.create({
        data: {
          academyId,
          userId,
          // Store all data in nested objects only - no duplication
          businessInfo: body?.businessInfo || {},
          adminInfo: body?.adminInfo || {},
          preferences: body?.preferences || {},
        },
      });

      // Only after all operations succeed, mark registration as complete
      const finalUser = await tx.user.update({
        where: { email },
        data: { registrationComplete: true },
      });

      return { updatedUser, registration, finalUser };
    });

    return NextResponse.json({ success: true, userId, academyId });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}