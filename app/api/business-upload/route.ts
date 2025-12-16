import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionCookie, verifyToken } from "@/lib/auth";

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;

console.log("[business-upload] R2 Configuration:", {
  endpoint: R2_ENDPOINT,
  bucket: R2_BUCKET,
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
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
  const maxBytes = 2 * 1024 * 1024; // 2MB as per form requirement
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only PNG, JPG, JPEG, and SVG are allowed.");
  }
  if (file.size > maxBytes) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File too large (${fileSizeMB}MB). Maximum size is 2MB. Please compress or resize your image.`);
  }
}

async function uploadToR2(file: File, prefix: string, imageType: string): Promise<string> {
  validateImage(file);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Create a safe filename with the image type
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const key = `${prefix}/${imageType}-${uuidv4()}.${fileExtension}`;
  
  console.log(`[business-upload] Uploading ${imageType}: ${file.name} (${file.size} bytes) to key: ${key}`);
  
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
  console.log(`[business-upload] ${imageType} uploaded successfully. Proxy URL: ${proxyUrl}`);
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
    console.log("[business-upload] Starting business image upload process...");
    
    const formData = await req.formData();
    console.log("[business-upload] Form data received, processing...");
    
    // Get images - could be Files or base64 strings
    const businessLogo = formData.get("businessLogo") as File | string | null;
    const businessNameUpload = formData.get("businessNameUpload") as File | string | null;
    const profilePicture = formData.get("profilePicture") as File | string | null;
    const businessName = (formData.get("businessName") as string) || "business";
    const userEmailFromForm = formData.get("userEmail") as string | null;
    
    let userEmail: string;
    
    // Try to get email from session first (for logged-in users)
    const sessionToken = await getSessionCookie();
    if (sessionToken) {
      console.log("[business-upload] Session token found, verifying...");
      const payload = await verifyToken(sessionToken);
      if (payload?.email && typeof payload.email === 'string') {
        userEmail = payload.email;
        console.log(`[business-upload] Authenticated user from session: ${userEmail}`);
      } else if (userEmailFromForm) {
        // Session exists but invalid, use form email
        userEmail = userEmailFromForm;
        console.log(`[business-upload] Using email from form (invalid session): ${userEmail}`);
      } else {
        console.log("[business-upload] Invalid session and no email in form");
        return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
      }
    } else if (userEmailFromForm) {
      // No session - this is a first-time user who verified email but hasn't logged in
      userEmail = userEmailFromForm;
      console.log(`[business-upload] No session, using email from form (first-time user): ${userEmail}`);
    } else {
      console.log("[business-upload] No session token and no email provided in form");
      return NextResponse.json({ success: false, error: "Email is required for image upload" }, { status: 400 });
    }

    console.log("[business-upload] Received data:", {
      hasBusinessLogo: !!businessLogo,
      hasBusinessNameUpload: !!businessNameUpload,
      hasProfilePicture: !!profilePicture,
      businessName,
      userEmail
    });

    // Convert base64 strings to Files if needed
    let logoFile: File | null = null;
    let nameUploadFile: File | null = null;
    let profileFile: File | null = null;

    if (businessLogo) {
      if (typeof businessLogo === 'string' && businessLogo.startsWith('data:')) {
        logoFile = base64ToFile(businessLogo, 'business-logo.jpg');
      } else if (businessLogo instanceof File) {
        logoFile = businessLogo;
      }
    }

    if (businessNameUpload) {
      if (typeof businessNameUpload === 'string' && businessNameUpload.startsWith('data:')) {
        nameUploadFile = base64ToFile(businessNameUpload, 'business-name.jpg');
      } else if (businessNameUpload instanceof File) {
        nameUploadFile = businessNameUpload;
      }
    }

    if (profilePicture) {
      if (typeof profilePicture === 'string' && profilePicture.startsWith('data:')) {
        profileFile = base64ToFile(profilePicture, 'profile-picture.jpg');
      } else if (profilePicture instanceof File) {
        profileFile = profilePicture;
      }
    }

    // Validate at least one image is provided
    if (!logoFile && !nameUploadFile && !profileFile) {
      return NextResponse.json(
        { success: false, error: "At least one image must be provided" },
        { status: 400 }
      );
    }

    // Create a safe prefix using business name and user email
    const safeBusinessName = businessName.replace(/[^a-zA-Z0-9-]/g, "_").substring(0, 50);
    const safeEmail = userEmail.split('@')[0].replace(/[^a-zA-Z0-9-]/g, "_");
    const prefix = `business-registration/${safeEmail}_${safeBusinessName}`;

    // Upload images to R2
    const uploadResults: {
      businessLogoUrl?: string;
      businessNameUploadUrl?: string;
      profilePictureUrl?: string;
    } = {};

    if (logoFile) {
      try {
        uploadResults.businessLogoUrl = await uploadToR2(logoFile, prefix, "logo");
        console.log("[business-upload] Business logo uploaded successfully");
      } catch (error: any) {
        console.error("[business-upload] Failed to upload business logo:", error);
        const errorMessage = error.message || "Failed to upload business logo";
        throw new Error(`Business Logo: ${errorMessage}`);
      }
    }

    if (nameUploadFile) {
      try {
        uploadResults.businessNameUploadUrl = await uploadToR2(nameUploadFile, prefix, "name");
        console.log("[business-upload] Business name upload uploaded successfully");
      } catch (error: any) {
        console.error("[business-upload] Failed to upload business name:", error);
        const errorMessage = error.message || "Failed to upload business name";
        throw new Error(`Business Name Upload: ${errorMessage}`);
      }
    }

    if (profileFile) {
      try {
        uploadResults.profilePictureUrl = await uploadToR2(profileFile, prefix, "profile");
        console.log("[business-upload] Profile picture uploaded successfully");
      } catch (error: any) {
        console.error("[business-upload] Failed to upload profile picture:", error);
        const errorMessage = error.message || "Failed to upload profile picture";
        throw new Error(`Profile Picture: ${errorMessage}`);
      }
    }

    console.log("[business-upload] All uploads completed successfully:", uploadResults);

    return NextResponse.json({
      success: true,
      ...uploadResults
    });

  } catch (error: any) {
    console.error("[business-upload] Error during upload:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload images"
      },
      { status: 500 }
    );
  }
}
