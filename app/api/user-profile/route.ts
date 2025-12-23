import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const revalidate = 180;

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
    await dbConnect();
    const user = await UserModel.findOne({ 
      email: decoded.email as string
    }).select('userId academyId name email kycStatus registrationComplete createdAt updatedAt verified');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch registration data including adminInfo
    let registration = null;
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      registration = await RegistrationModel.findOne({
        $or: whereConditions
      }).select('adminInfo businessInfo preferences');
    }

    // If no registration found by userId/academyId, try searching by email in adminInfo
    if (!registration && decoded.email) {
      console.log('[user-profile] No registration found by IDs, searching by email in adminInfo...');
      try {
        registration = await RegistrationModel.findOne({
          'adminInfo.email': decoded.email
        }).select('adminInfo businessInfo preferences');
        
        if (registration) {
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
        phoneCountryCode: adminInfo.phoneCountryCode || '+1',
        mobile: adminInfo.mobile || '',
        country: businessInfo.country || '',
        stateProvince: businessInfo.state || '',
        address: businessInfo.address || '',
        position: adminInfo.position || '',
        linkedinUrl: adminInfo.socialProfile || '',
        bio: adminInfo.bio || '',
        avatar: adminInfo.avatar || businessInfo.profilePicture || businessInfo.profilePictureUrl || ''
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
    const user = await UserModel.findOne({ email: decoded.email as string })
      .select('_id userId academyId email')
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const updates = await request.json();
    
    // Update user name if changed
    if (updates.firstName || updates.lastName) {
      const fullName = `${updates.firstName || ''} ${updates.middleName || ''} ${updates.lastName || ''}`.trim();
      await UserModel.updateOne(
        { _id: (user as any)._id },
        { $set: { name: fullName }}
      );
    }

    // Update registration if exists
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const registration = await RegistrationModel.findOne({
        $or: whereConditions
      }).lean();

      if (registration) {
        const adminInfo = registration.adminInfo as any || {};
        const businessInfo = registration.businessInfo as any || {};
        
        // Update adminInfo
        const updatedAdminInfo = {
          ...adminInfo,
          fullName: `${updates.firstName || ''} ${updates.middleName || ''} ${updates.lastName || ''}`.trim(),
          phone: updates.phone || adminInfo.phone,
          phoneCountryCode: updates.phoneCountryCode || adminInfo.phoneCountryCode,
          mobile: updates.mobile || adminInfo.mobile,
          position: updates.position || adminInfo.position,
          socialProfile: updates.linkedinUrl || adminInfo.socialProfile,
          bio: updates.bio || adminInfo.bio,
          avatar: updates.avatar || adminInfo.avatar,
        };

        // Update businessInfo
        const updatedBusinessInfo = {
          ...businessInfo,
          country: updates.country || businessInfo.country,
          state: updates.stateProvince || businessInfo.state,
          address: updates.address || businessInfo.address,
          // Also update profile picture in businessInfo for header display
          profilePicture: updates.avatar || businessInfo.profilePicture || businessInfo.profilePictureUrl,
        };

        await RegistrationModel.updateOne(
          { _id: (registration as any)._id },
          { $set: {
            adminInfo: updatedAdminInfo,
            businessInfo: updatedBusinessInfo
          }}
        );
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