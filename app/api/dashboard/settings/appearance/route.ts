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
    }).select('userId academyId email');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const updates = await request.json();
    
    // Update registration preferences
    if (user.userId || user.academyId) {
      const whereConditions = [];
      if (user.userId) whereConditions.push({ userId: user.userId });
      if (user.academyId) whereConditions.push({ academyId: user.academyId });
      
      const registration = await RegistrationModel.findOne({
        $or: whereConditions
      });

      if (registration) {
        const currentPreferences = (registration.preferences as any) || {};
        
        // Update preferences with new appearance settings
        const updatedPreferences = {
          ...currentPreferences,
          theme: updates.theme ?? currentPreferences.theme,
          language: updates.language ?? currentPreferences.language,
          dateFormat: updates.dateFormat ?? currentPreferences.dateFormat,
          timeFormat: updates.timeFormat ?? currentPreferences.timeFormat,
          currency: updates.currency ?? currentPreferences.currency,
          timeZone: updates.timeZone ?? currentPreferences.timeZone,
          customColors: updates.customColors ?? currentPreferences.customColors,
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
            theme: updates.theme ?? currentPreferences.theme,
            language: updates.language ?? currentPreferences.language,
            dateFormat: updates.dateFormat ?? currentPreferences.dateFormat,
            timeFormat: updates.timeFormat ?? currentPreferences.timeFormat,
            currency: updates.currency ?? currentPreferences.currency,
            timeZone: updates.timeZone ?? currentPreferences.timeZone,
            customColors: updates.customColors ?? currentPreferences.customColors,
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
      message: "Appearance settings updated successfully"
    });

  } catch (error) {
    console.error("[appearance-settings] Error:", error);
    return NextResponse.json(
      { error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
}
