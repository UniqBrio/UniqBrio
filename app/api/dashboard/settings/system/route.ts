import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";

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

    await dbConnect();

    // Find user by email from the token
    const user = await UserModel.findOne({ 
      email: decoded.email as string
    }).select('userId academyId email role');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has admin privileges
    // You may want to add more sophisticated role checking here
    const userRole = (user as any).role;
    if (userRole !== 'admin' && userRole !== 'owner') {
      return NextResponse.json({ 
        error: "Unauthorized - Admin access required" 
      }, { status: 403 });
    }

    // Parse the request body
    const updates = await request.json();
    
    // Update registration preferences or system settings
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const registration = await RegistrationModel.findOne({
        $or: whereConditions
      });

      if (registration) {
        const currentPreferences = (registration.preferences as any) || {};
        
        // Update preferences with new system settings
        const updatedPreferences = {
          ...currentPreferences,
          systemConfig: {
            ...(currentPreferences.systemConfig || {}),
            ...updates
          }
        };

        await RegistrationModel.updateOne(
          { _id: (registration as any)._id },
          { $set: { preferences: updatedPreferences } }
        );
      } else {
        // If no registration found, try to find by email in adminInfo
        const registrationByEmail = await RegistrationModel.findOne({
          'adminInfo.email': decoded.email
        });

        if (registrationByEmail) {
          const currentPreferences = (registrationByEmail.preferences as any) || {};
          
          const updatedPreferences = {
            ...currentPreferences,
            systemConfig: {
              ...(currentPreferences.systemConfig || {}),
              ...updates
            }
          };

          await RegistrationModel.updateOne(
            { _id: (registrationByEmail as any)._id },
            { $set: { preferences: updatedPreferences } }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "System settings updated successfully"
    });

  } catch (error) {
    console.error("[system-settings] Error:", error);
    return NextResponse.json(
      { error: "Failed to update system settings" },
      { status: 500 }
    );
  }
}
