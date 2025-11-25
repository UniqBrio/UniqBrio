
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await dbConnect();
    
    // Enforce authenticated, verified user and derive identity from session
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(sessionToken);
    if (!payload?.email || typeof payload.email !== "string") {
      await session.abortTransaction();
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const email = payload.email as string;

    // Find user by email (Mongoose)
    const existingUser = await UserModel.findOne({ email }).session(session);
    if (!existingUser) {
      await session.abortTransaction();
      return NextResponse.json({ error: "No user found for this session." }, { status: 404 });
    }

    if (!existingUser.verified) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Email not verified." }, { status: 403 });
    }

    if (existingUser.registrationComplete) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Registration already completed." }, { status: 400 });
    }

    // Validate required fields from request body
    if (!body?.adminInfo?.fullName) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    
    if (!body?.businessInfo?.businessName) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    let academyId = existingUser.academyId;
    let userId = existingUser.userId;

    // Check if user already has a registration
    const existingRegistration = await RegistrationModel.findOne({
      $or: [
        { userId: existingUser.userId || undefined },
        { academyId: existingUser.academyId || undefined }
      ]
    }).session(session);

    // Use existing IDs or generate new ones
    let finalAcademyId = academyId || existingUser.academyId;
    let finalUserId = userId || existingUser.userId;

    // Only generate new IDs if user doesn't have them and there's no existing registration
    if (!finalAcademyId && !existingRegistration) {
      // Generate sequential academyId using Mongoose
      const allRegistrations = await RegistrationModel.find({
        academyId: { $regex: /^AC/ }
      }).select('academyId').session(session);
      
      // Filter and sort only properly formatted academy IDs (AC followed by digits)
      const numericAcademyIds = allRegistrations
        .map((reg: any) => reg.academyId)
        .filter((id: string) => /^AC\d+$/.test(id))
        .sort((a: string, b: string) => {
          const numA = parseInt(a.replace('AC', ''));
          const numB = parseInt(b.replace('AC', ''));
          return numB - numA; // Descending order
        });

      let nextAcademyNum = 1;
      if (numericAcademyIds.length > 0) {
        const lastAcademyId = numericAcademyIds[0];
        nextAcademyNum = parseInt(lastAcademyId.replace("AC", "")) + 1;
      }
      finalAcademyId = `AC${nextAcademyNum.toString().padStart(6, "0")}`;
    } else if (existingRegistration && !finalAcademyId) {
      finalAcademyId = existingRegistration.academyId;
    }

    if (!finalUserId && !existingRegistration) {
      // Generate sequential userId using Mongoose
      const allUsers = await UserModel.find({
        userId: { $regex: /^AD/ }
      }).select('userId').session(session);
      
      // Filter and sort only properly formatted user IDs (AD followed by digits)
      const numericUserIds = allUsers
        .map((user: any) => user.userId)
        .filter((id: string | null) => id && /^AD\d+$/.test(id))
        .sort((a: string, b: string) => {
          const numA = parseInt(a.replace('AD', ''));
          const numB = parseInt(b.replace('AD', ''));
          return numB - numA; // Descending order
        });

      let nextUserNum = 1;
      if (numericUserIds.length > 0) {
        const lastUserId = numericUserIds[0];
        nextUserNum = parseInt(lastUserId.replace("AD", "")) + 1;
      }
      finalUserId = `AD${nextUserNum.toString().padStart(6, "0")}`;
    } else if (existingRegistration && !finalUserId) {
      finalUserId = existingRegistration.userId;
    }

    // Update basic user info and persist IDs
    await UserModel.updateOne(
      { email },
      {
        $set: {
          name: body.adminInfo.fullName,
          phone: body?.adminInfo?.phone || existingUser.phone,
          userId: finalUserId,
          academyId: finalAcademyId,
          tenantId: finalAcademyId, // Set tenantId = academyId for multi-tenant isolation
        }
      },
      { session }
    );

    // Create or update Registration record
    await RegistrationModel.findOneAndUpdate(
      { academyId: finalAcademyId },
      {
        $set: {
          userId: finalUserId!,
          tenantId: finalAcademyId!,
          businessInfo: body?.businessInfo || {},
          adminInfo: body?.adminInfo || {},
          preferences: body?.preferences || {},
        }
      },
      { 
        upsert: true, 
        session,
        new: true 
      }
    );

    // Mark registration as complete
    await UserModel.updateOne(
      { email },
      { $set: { registrationComplete: true } },
      { session }
    );

    await session.commitTransaction();
    
    return NextResponse.json({ 
      success: true, 
      userId: finalUserId, 
      academyId: finalAcademyId 
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  } finally {
    session.endSession();
  }
}