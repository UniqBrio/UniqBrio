import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session token
    const decoded = await verifyToken(sessionToken);
    
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Find user by email from the token
    const user = await prisma.user.findFirst({
      where: { 
        email: decoded.email as string
      },
      select: {
        userId: true,
        academyId: true,
        name: true,
        email: true,
        kycStatus: true,
        registrationComplete: true,
        createdAt: true,
        updatedAt: true,
        verified: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch registration data including adminInfo
    let registration = null;
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      registration = await prisma.registration.findFirst({
        where: {
          OR: whereConditions
        },
        select: {
          adminInfo: true,
          businessInfo: true,
          preferences: true
        }
      });
    }

    // If no registration found by userId/academyId, try searching by email in adminInfo using raw MongoDB query
    if (!registration && decoded.email) {
      console.log('[user-profile] No registration found by IDs, searching by email in adminInfo...');
      try {
        const rawRegistrations = await prisma.$runCommandRaw({
          find: "registrations",
          filter: { "adminInfo.email": decoded.email }
        }) as any;

        const matchingDocs = rawRegistrations.cursor.firstBatch;
        if (matchingDocs.length > 0) {
          const reg = matchingDocs[0];
          registration = {
            adminInfo: reg.adminInfo,
            businessInfo: reg.businessInfo,
            preferences: reg.preferences
          };
          console.log('[user-profile] Found registration by email in adminInfo');
        }
      } catch (mongoError) {
        console.error('[user-profile] MongoDB search error:', mongoError);
      }
    }

    // Extract adminInfo
    const adminInfo = registration?.adminInfo as any || {};
    const businessInfo = registration?.businessInfo as any || {};

    console.log('[user-profile] Data extracted:', {
      hasRegistration: !!registration,
      adminInfoKeys: Object.keys(adminInfo),
      businessInfoKeys: Object.keys(businessInfo),
      fullName: adminInfo.fullName,
      phone: adminInfo.phone
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        firstName: adminInfo.fullName?.split(' ')[0] || '',
        middleName: '',
        lastName: adminInfo.fullName?.split(' ').slice(1).join(' ') || '',
        phone: adminInfo.phone || '',
        phoneCountryCode: '+1',
        country: businessInfo.country || '',
        stateProvince: businessInfo.state || '',
        address: businessInfo.address || '',
        position: '',
        linkedinUrl: adminInfo.socialProfile || '',
        avatar: ''
      }
    });

  } catch (error) {
    console.error("[user-profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session token
    const decoded = await verifyToken(sessionToken);
    
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Find user by email from the token
    const user = await prisma.user.findFirst({
      where: { 
        email: decoded.email as string
      },
      select: {
        id: true,
        userId: true,
        academyId: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const updates = await request.json();
    
    // Update user name if changed
    if (updates.firstName || updates.lastName) {
      const fullName = `${updates.firstName || ''} ${updates.middleName || ''} ${updates.lastName || ''}`.trim();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: fullName
        }
      });
    }

    // Update registration if exists
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const registration = await prisma.registration.findFirst({
        where: {
          OR: whereConditions
        }
      });

      if (registration) {
        const adminInfo = registration.adminInfo as any || {};
        const businessInfo = registration.businessInfo as any || {};
        
        // Update adminInfo
        const updatedAdminInfo = {
          ...adminInfo,
          fullName: `${updates.firstName || ''} ${updates.middleName || ''} ${updates.lastName || ''}`.trim(),
          phone: updates.phone || adminInfo.phone,
          socialProfile: updates.linkedinUrl || adminInfo.socialProfile
        };

        // Update businessInfo
        const updatedBusinessInfo = {
          ...businessInfo,
          country: updates.country || businessInfo.country,
          state: updates.stateProvince || businessInfo.state,
          address: updates.address || businessInfo.address
        };

        await prisma.registration.update({
          where: { id: registration.id },
          data: {
            adminInfo: updatedAdminInfo,
            businessInfo: updatedBusinessInfo
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully"
    });

  } catch (error) {
    console.error("[user-profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}