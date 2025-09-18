import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

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
      const user = await prisma.user.findFirst({ where: { email: userEmail } });
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
    const existingKYC = await prisma.kycSubmission.findFirst({
      where: {
        userId: finalUserId,
        academyId: finalAcademyId
      }
    });

    // Get current user KYC status to determine if resubmission is allowed
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      select: { kycStatus: true }
    });

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
        await prisma.$transaction(async (tx) => {
          // Delete related KycReview records first to avoid constraint violation
          console.log("[kyc-upload] Deleting related KycReview records...");
          await tx.kycReview.deleteMany({
            where: { kycId: existingKYC.id }
          });
          
          // Then delete the existing submission to allow resubmission
          console.log("[kyc-upload] Deleting existing KycSubmission...");
          await tx.kycSubmission.delete({
            where: { id: existingKYC.id }
          });
        });
        
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

    // Store all data in MongoDB Atlas via Prisma - Use transaction to update both KYC submission and user status
    const result = await prisma.$transaction(async (tx) => {
      // Create KYC submission
      const kycSubmission = await tx.kycSubmission.create({
        data: {
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
        },
      });

      // Update user record with KYC submission date and set status to pending
      const updatedUser = await tx.user.update({
        where: { email: userEmail },
        data: {
          kycStatus: "pending",
          kycSubmissionDate: new Date()
        }
      });

      console.log("[kyc-upload] Updated user KYC status to pending for:", userEmail);

      return { kycSubmission, updatedUser };
    });

    const { kycSubmission } = result;
    console.log("[kyc-upload] KYC submission created successfully:", kycSubmission.id);

    // Send confirmation email to user
    try {
      console.log("[kyc-upload] Sending confirmation email to:", userEmail);
      
      await sendEmail({
        to: userEmail,
        subject: "KYC Verification Submitted Successfully - UniqBrio",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">UniqBrio</h1>
                <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #f97316, #7c3aed); margin: 10px auto;"></div>
              </div>
              
              <h2 style="color: #16a34a; text-align: center; margin-bottom: 20px;">✅ KYC Verification Submitted Successfully!</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Dear Valued User,
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Thank you for completing your KYC (Know Your Customer) verification with UniqBrio. 
                We have successfully received your documents and they are now under review by our verification team.
              </p>
              
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #0ea5e9; margin: 0 0 10px 0; font-size: 18px;">📋 What happens next?</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Our team will review your submitted documents</li>
                  <li style="margin-bottom: 8px;">Background verification will be conducted</li>
                  <li style="margin-bottom: 8px;">You will receive email confirmation once approved</li>
                  <li>Your account will be fully activated for all services</li>
                </ul>
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-weight: 600; text-align: center;">
                  ⏰ Expected Timeline: You will receive confirmation within 24 business hours
                </p>
              </div>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                During this review period, you can continue using your UniqBrio account with basic features. 
                Once verification is complete, all premium features will be unlocked.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                If you have any questions, please contact our support team at 
                <a href="mailto:support@uniqbrio.com" style="color: #7c3aed;">support@uniqbrio.com</a>
              </p>
              
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
                © 2025 UniqBrio. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
      
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
