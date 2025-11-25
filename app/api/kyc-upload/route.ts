import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import UserModel from "@/models/User";
import KycSubmissionModel from "@/models/KycSubmission";
import KycReviewModel from "@/models/KycReview";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { sendEmail, generateKYCSubmissionEmail } from "@/lib/email";
import mongoose from "mongoose";

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://pub-${R2_BUCKET}.r2.dev`;

console.log("[kyc-upload] R2 Configuration:", {
  endpoint: R2_ENDPOINT,
  bucket: R2_BUCKET,
  publicUrl: R2_PUBLIC_URL,
  hasAccessKey: !!R2_ACCESS_KEY_ID,
  hasSecretKey: !!R2_SECRET_ACCESS_KEY
});

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function validateImage(file: File | null) {
  if (!file) return;
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"]; 
  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG and PNG are allowed.");
  }
  if (file.size > maxBytes) {
    throw new Error("File too large. Max 10MB.");
  }
}

async function uploadToR2(file: File | null, prefix: string): Promise<string> {
  if (!file) return "";
  validateImage(file);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${prefix}/${uuidv4()}-${safeName}`;
  
  console.log(`[uploadToR2] Uploading file: ${file.name} (${file.size} bytes) to key: ${key}`);
  
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );
  
  // Return proxy URL for the uploaded image
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? "http://localhost:3000" 
    : (process.env.NEXTAUTH_URL || "https://uniqbrio.vercel.app");
  const proxyUrl = `${baseUrl}/api/r2-proxy/${key}`;
  console.log(`[uploadToR2] File uploaded successfully. Proxy URL: ${proxyUrl}`);
  return proxyUrl;
}

// Helper function to convert base64 to File
function base64ToFile(base64String: string, fileName: string): File {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

export async function POST(req: NextRequest) {
  try {
    console.log("[kyc-upload] Starting KYC upload process...");
    
    // Get the current user's session
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      console.log("[kyc-upload] No session token found");
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token and get user info
    const payload = await verifyToken(sessionToken);
    if (!payload?.email || typeof payload.email !== 'string') {
      console.log("[kyc-upload] Invalid session payload");
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const userEmail = payload.email;
    console.log(`[kyc-upload] Authenticated user: ${userEmail}`);

    const formData = await req.formData();
    console.log("[kyc-upload] Form data received, processing...");
    
    // Get images - could be Files or base64 strings
    const ownerImage = formData.get("ownerImage") as File | string | null;
    const bannerImage = formData.get("bannerImage") as File | string | null;
    const ownerWithBannerImage = formData.get("ownerWithBannerImage") as File | string | null;
    
    // Get metadata
    const location = (formData.get("location") as string) || "";
    const dateTime = (formData.get("dateTime") as string) || "";
    const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : 0;
    const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : 0;
    const address = (formData.get("address") as string) || "";
    const userId = (formData.get("userId") as string) || "";
    const academyId = (formData.get("academyId") as string) || "";

    console.log("[kyc-upload] Received data:", {
      hasOwnerImage: !!ownerImage,
      hasBannerImage: !!bannerImage,
      hasOwnerWithBannerImage: !!ownerWithBannerImage,
      userId,
      academyId,
      userEmail,
      location: location.substring(0, 50) + "..."
    });

    // Convert base64 strings to Files if needed
    let ownerFile: File | null = null;
    let bannerFile: File | null = null;
    let ownerWithBannerFile: File | null = null;

    if (ownerImage) {
      if (typeof ownerImage === 'string' && ownerImage.startsWith('data:')) {
        ownerFile = base64ToFile(ownerImage, 'owner.jpg');
      } else if (ownerImage instanceof File) {
        ownerFile = ownerImage;
      }
    }

    if (bannerImage) {
      if (typeof bannerImage === 'string' && bannerImage.startsWith('data:')) {
        bannerFile = base64ToFile(bannerImage, 'banner.jpg');
      } else if (bannerImage instanceof File) {
        bannerFile = bannerImage;
      }
    }

    if (ownerWithBannerImage) {
      if (typeof ownerWithBannerImage === 'string' && ownerWithBannerImage.startsWith('data:')) {
        ownerWithBannerFile = base64ToFile(ownerWithBannerImage, 'owner-with-banner.jpg');
      } else if (ownerWithBannerImage instanceof File) {
        ownerWithBannerFile = ownerWithBannerImage;
      }
    }

    // Validate that we have required data - get from form or fetch from user record
    let finalUserId = userId;
    let finalAcademyId = academyId;
    
    if (!finalUserId || !finalAcademyId) {
      console.log("[kyc-upload] Missing userId/academyId in form, fetching from user record...");
      
      // Get user from database to get their userId and academyId
      await dbConnect();
      const user = await UserModel.findOne({ email: userEmail });
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      
      finalUserId = user.userId || finalUserId;
      finalAcademyId = user.academyId || finalAcademyId;
      
      console.log("[kyc-upload] Retrieved from user record:", {
        finalUserId,
        finalAcademyId
      });
    }

    if (!finalUserId || !finalAcademyId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing userId or academyId. Please complete your registration first." 
      }, { status: 400 });
    }

    console.log("[kyc-upload] Starting file uploads to R2...");

    // Upload images to R2
    const ownerImageUrl = await uploadToR2(ownerFile, "kyc/owner");
    const bannerImageUrl = await uploadToR2(bannerFile, "kyc/banner");
    const ownerWithBannerImageUrl = await uploadToR2(ownerWithBannerFile, "kyc/owner-with-banner");

    console.log("[kyc-upload] File uploads completed:", {
      ownerImageUrl: !!ownerImageUrl,
      bannerImageUrl: !!bannerImageUrl,
      ownerWithBannerImageUrl: !!ownerWithBannerImageUrl
    });

    // Check if KYC submission already exists for this academy
    await dbConnect();
    const existingKYC = await KycSubmissionModel.findOne({
      userId: finalUserId,
      academyId: finalAcademyId
    });

    // Get current user KYC status to determine if resubmission is allowed
    const user = await UserModel.findOne(
      { email: userEmail },
    ).select('kycStatus name academyId');

    // Get academy name from registration data for personalized email
    let academyName: string | undefined;
    try {
      if (user?.academyId || academyId) {
        const registration = await RegistrationModel.findOne({ 
          $or: [
            { academyId: user?.academyId || academyId },
            { userId: userId }
          ]
        }).select('businessInfo');
        
        const businessInfo = registration?.businessInfo as any;
        academyName = businessInfo?.businessName;
      }
    } catch (error) {
      console.log("[kyc-upload] Could not fetch academy name:", error);
    }

    // Allow resubmission only if KYC status is rejected or expired, or if no previous submission exists
    if (existingKYC) {
      const currentKycStatus = user?.kycStatus;
      if (currentKycStatus === "rejected" || currentKycStatus === "expired") {
        console.log("[kyc-upload] Allowing resubmission for rejected/expired KYC:", { 
          userId: finalUserId, 
          academyId: finalAcademyId, 
          currentStatus: currentKycStatus 
        });
        
        // Use transaction to ensure atomic deletion of related records
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
          // Delete related KycReview records first to avoid constraint violation
          console.log("[kyc-upload] Deleting related KycReview records...");
          await KycReviewModel.deleteMany({
            kycId: existingKYC._id
          }).session(session);
          
          // Then delete the existing submission to allow resubmission
          console.log("[kyc-upload] Deleting existing KycSubmission...");
          await KycSubmissionModel.deleteOne({
            _id: existingKYC._id
          }).session(session);
        });
        session.endSession();
        
        console.log("[kyc-upload] Successfully deleted existing KYC submission and reviews");
      } else {
        console.log("[kyc-upload] KYC already exists and not in resubmittable state:", { 
          userId: finalUserId, 
          academyId: finalAcademyId,
          currentStatus: currentKycStatus
        });
        return NextResponse.json({
          error: "KYC submission already exists for this academy and is not in a state that allows resubmission"
        }, { status: 400 });
      }
    }

    // Store all data in MongoDB Atlas via Mongoose - Use transaction to update both KYC submission and user status
    const session = await mongoose.startSession();
    const result = await session.withTransaction(async () => {
      // Create KYC submission
      const kycSubmission = await KycSubmissionModel.create([{
        userId: finalUserId,
        academyId: finalAcademyId,
        ownerImageUrl,
        bannerImageUrl,
        ownerWithBannerImageUrl,
        location,
        latitude,
        longitude,
        address,
        dateTime,
      }], { session });

      // Update user record with KYC submission date and set status to pending
      const updatedUser = await UserModel.findOneAndUpdate(
        { email: userEmail },
        {
          $set: {
            kycStatus: "pending",
            kycSubmissionDate: new Date()
          }
        },
        { session, new: true }
      );

      console.log("[kyc-upload] Updated user KYC status to pending for:", userEmail);

      return { kycSubmission: kycSubmission[0], updatedUser };
    });
    session.endSession();

    const { kycSubmission } = result;
    console.log("[kyc-upload] KYC submission created successfully:", kycSubmission.id);

    // Send confirmation email to user
    try {
      console.log("[kyc-upload] Sending confirmation email to:", userEmail);
      
      const emailData = generateKYCSubmissionEmail(userEmail, user?.name, academyName);
      await sendEmail(emailData);
      
      console.log("[kyc-upload] Confirmation email sent successfully");
    } catch (emailError) {
      console.error("[kyc-upload] Failed to send confirmation email:", emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      kycSubmission,
      message: "KYC submitted successfully. Confirmation email sent."
    });
  } catch (err: any) {
    console.error("[kyc-upload] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
