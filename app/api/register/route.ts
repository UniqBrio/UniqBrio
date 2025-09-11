
import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Users from "@/models/users";
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

    await connectToDatabase();
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

    // Generate sequential academyId from users collection
    const lastAcademy = await Users.findOne({}, {}, { sort: { academyId: -1 } });
    let nextAcademyNum = 1;
    if (lastAcademy && lastAcademy.academyId && /^AC\d+$/.test(lastAcademy.academyId)) {
      nextAcademyNum = parseInt(lastAcademy.academyId.replace("AC", "")) + 1;
    }
    const academyId = `AC${nextAcademyNum.toString().padStart(6, "0")}`;

    // Generate sequential userId from users collection
    const lastUser = await Users.findOne({}, {}, { sort: { userId: -1 } });
    let nextUserNum = 1;
    if (lastUser && lastUser.userId && /^AD\d+$/.test(lastUser.userId)) {
      nextUserNum = parseInt(lastUser.userId.replace("AD", "")) + 1;
    }
    const userId = `AD${nextUserNum.toString().padStart(6, "0")}`;

    // Update basic user info in Prisma User and persist IDs. Do NOT allow client to override role.
    await prisma.user.update({
      where: { email },
      data: {
        registrationComplete: true,
        name: body?.adminInfo?.fullName || existingUser.name,
        phone: body?.adminInfo?.phone || existingUser.phone,
        role: existingUser.role, // keep current role (server-controlled)
        userId,
        academyId,
      },
    });

    // Create Prisma Registration record for consistent querying elsewhere
    await prisma.registration.create({
      data: {
        academyId,
        userId,
        businessInfo: body?.businessInfo || {},
        adminInfo: body?.adminInfo || {},
        preferences: body?.preferences || {},
      },
    });

    // Create Academy record in Prisma
    await prisma.academy.create({
      data: {
        academyId,
        name: body?.businessInfo?.businessName || "",
        legalEntityName: body?.businessInfo?.legalEntityName || "",
        email: body?.businessInfo?.businessEmail || "",
        phone: body?.businessInfo?.phoneNumber || "",
        industryType: body?.businessInfo?.industryType || "",
        servicesOffered: body?.businessInfo?.servicesOffered || [],
        studentSize: body?.businessInfo?.studentSize || "",
        staffCount: body?.businessInfo?.staffCount || "",
        country: body?.businessInfo?.country || "",
        state: body?.businessInfo?.state || "",
        city: body?.businessInfo?.city || "",
        address: body?.businessInfo?.address || "",
        website: body?.businessInfo?.website || "",
        preferredLanguage: body?.businessInfo?.preferredLanguage || "",
      },
    });

    // Store registration details in users collection (Mongoose)
    await Users.create({
      userId,
      academyId,
      businessInfo: body?.businessInfo || {},
      adminInfo: body?.adminInfo || {},
      preferences: body?.preferences || {},
    });

    return NextResponse.json({ success: true, userId, academyId });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
