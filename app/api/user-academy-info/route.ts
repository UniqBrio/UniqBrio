import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionCookie, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token and get user info
    const payload = await verifyToken(sessionToken);
    if (!payload?.email || typeof payload.email !== 'string') {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userEmail = payload.email;

    // Get user details from User collection
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (!user) {
      console.log(`[user-academy-info] User not found for email: ${userEmail}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[user-academy-info] Found user: ${user.id}, email: ${user.email}, userId: ${user.userId}, academyId: ${user.academyId}`);

    // Get userName directly from User collection
    const userName = user.name || "";

    // Initialize variables
    let userId = user.userId || "";
    let academyId = user.academyId || "";
    let academyName = "";

    console.log(`[user-academy-info] Initial IDs - userId: ${userId}, academyId: ${academyId}`);

    // PRIMARY SEARCH: Look for registration by email in adminInfo using raw MongoDB
    console.log(`[user-academy-info] Searching registrations by email: ${userEmail}...`);
    
    const rawRegistrations = await prisma.$runCommandRaw({
      find: "registrations",
      filter: { "adminInfo.email": userEmail }
    }) as any;

    const matchingDocs = rawRegistrations.cursor.firstBatch;
    console.log(`[user-academy-info] Found ${matchingDocs.length} matching registrations`);
    
    let matchingRegistration = null;
    
    if (matchingDocs.length > 0) {
      const reg = matchingDocs[0]; // Take the first match
      matchingRegistration = reg;
      userId = reg.userId;
      academyId = reg.academyId;
      academyName = reg.businessInfo?.businessName || "";
      
      console.log(`[user-academy-info] Found matching registration by email!`, {
        userId,
        academyId,
        academyName,
        regId: reg._id
      });
    }

    // FALLBACK: If User record has IDs but no email match, use those IDs to find registration
    if (!matchingRegistration && (user.userId || user.academyId)) {
      console.log(`[user-academy-info] Trying fallback with User.userId: ${user.userId}, User.academyId: ${user.academyId}`);
      
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const reg = await prisma.registration.findFirst({ 
        where: { 
          OR: whereConditions
        } 
      });
      
      if (reg) {
        matchingRegistration = reg;
        userId = reg.userId;
        academyId = reg.academyId;
        const businessInfo = reg.businessInfo as any;
        academyName = businessInfo?.businessName || "";
        console.log(`[user-academy-info] Found registration via User IDs:`, { userId, academyId, academyName });
      }
    }

    // If we found a registration, also update the User record with the IDs for future efficiency
    if (matchingRegistration && (!user.userId || !user.academyId)) {
      console.log(`[user-academy-info] Updating User record with IDs for future use...`);
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            userId: userId,
            academyId: academyId
          }
        });
        console.log(`[user-academy-info] User record updated with userId: ${userId}, academyId: ${academyId}`);
      } catch (updateError) {
        console.error(`[user-academy-info] Failed to update User record:`, updateError);
      }
    }

    // If no academy name found yet, fetch from Academy collection as final fallback
    if (!academyName && academyId) {
      const academy = await prisma.academy.findUnique({ where: { academyId } });
      if (academy?.name) {
        academyName = academy.name;
      }
    }

    return NextResponse.json({
      userId,
      academyId,
      academyName,
      userName,
      userEmail: userEmail,
      // Debug info to verify data sources
      debug: {
        userSource: "User collection",
        academyNameSource: matchingRegistration?.businessInfo ? "Registration.businessInfo.businessName" : "Academy.name",
        userIdFromUser: user.userId,
        academyIdFromUser: user.academyId
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
