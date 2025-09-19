
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

    let academyId = existingUser.academyId;
    let userId = existingUser.userId;

    // Use Prisma transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a registration inside transaction
      const existingRegistration = await tx.registration.findFirst({
        where: { 
          OR: [
            { userId: existingUser.userId || undefined },
            { academyId: existingUser.academyId || undefined }
          ]
        }
      });

      // Use existing IDs or generate new ones
      let finalAcademyId = academyId || existingUser.academyId;
      let finalUserId = userId || existingUser.userId;

      // Only generate new IDs if user doesn't have them and there's no existing registration
      if (!finalAcademyId && !existingRegistration) {
        // Generate sequential academyId using Prisma (check registrations with proper numeric format)
        const allRegistrations = await tx.registration.findMany({
          where: { academyId: { startsWith: 'AC' } },
          select: { academyId: true }
        });
        
        // Filter and sort only properly formatted academy IDs (AC followed by digits)
        const numericAcademyIds = allRegistrations
          .map(reg => reg.academyId)
          .filter(id => /^AC\d+$/.test(id))
          .sort((a, b) => {
            const numA = parseInt(a.replace('AC', ''));
            const numB = parseInt(b.replace('AC', ''));
            return numB - numA; // Descending order
          });

        let nextAcademyNum = 1;
        if (numericAcademyIds.length > 0) {
          const lastAcademyId = numericAcademyIds[0]; // First element is the highest
          nextAcademyNum = parseInt(lastAcademyId.replace("AC", "")) + 1;
        }
        finalAcademyId = `AC${nextAcademyNum.toString().padStart(6, "0")}`;
      } else if (existingRegistration && !finalAcademyId) {
        finalAcademyId = existingRegistration.academyId;
      }

      if (!finalUserId && !existingRegistration) {
        // Generate sequential userId using Prisma with proper filtering
        const allUsers = await tx.user.findMany({
          where: { userId: { startsWith: 'AD' } },
          select: { userId: true }
        });
        
        // Filter and sort only properly formatted user IDs (AD followed by digits)
        const numericUserIds = allUsers
          .map(user => user.userId)
          .filter(id => id && /^AD\d+$/.test(id)) // Filter out null and non-matching IDs
          .sort((a, b) => {
            const numA = parseInt(a!.replace('AD', '')); // Use non-null assertion after filter
            const numB = parseInt(b!.replace('AD', '')); // Use non-null assertion after filter
            return numB - numA; // Descending order
          });

        let nextUserNum = 1;
        if (numericUserIds.length > 0) {
          const lastUserId = numericUserIds[0]; // First element is the highest
          nextUserNum = parseInt(lastUserId!.replace("AD", "")) + 1; // Non-null assertion after array check
        }
        finalUserId = `AD${nextUserNum.toString().padStart(6, "0")}`;
      } else if (existingRegistration && !finalUserId) {
        finalUserId = existingRegistration.userId;
      }

      // Update basic user info and persist IDs
      const updatedUser = await tx.user.update({
        where: { email },
        data: {
          name: body.adminInfo.fullName,
          phone: body?.adminInfo?.phone || existingUser.phone,
          role: existingUser.role, // keep current role (server-controlled)
          userId: finalUserId,
          academyId: finalAcademyId,
        },
      });

      // Create or update Registration record using upsert
      const registration = await tx.registration.upsert({
        where: { 
          academyId: finalAcademyId || 'TEMP' // Use a temp value if still null, but this shouldn't happen
        },
        update: {
          userId: finalUserId!,
          businessInfo: body?.businessInfo || {},
          adminInfo: body?.adminInfo || {},
          preferences: body?.preferences || {},
        },
        create: {
          academyId: finalAcademyId!,
          userId: finalUserId!,
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

      return { updatedUser, registration, finalUser, academyId: finalAcademyId, userId: finalUserId };
    });

    return NextResponse.json({ success: true, userId: result.userId, academyId: result.academyId });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}