import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getUserSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Tenant ID not found' },
        { status: 400 }
      );
    }

    return await runWithTenantContext({ tenantId }, async () => {
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('photo') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
          { status: 400 }
        );
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, message: 'File size exceeds 5MB limit' },
          { status: 400 }
        );
      }

      // Generate unique filename with tenant isolation
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${tenantId}/students/${timestamp}-${randomStr}.${fileExt}`;

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudflare R2
      const bucketName = process.env.CLOUDFLARE_R2_STUDENT_BUCKET || 'uniqbrio-students';
      
      await r2Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            tenantId: tenantId,
            uploadedBy: session.userId,
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      // Construct public URL
      // Note: You'll need to configure R2 bucket for public access or use a custom domain
      const photoUrl = `https://pub-${process.env.CLOUDFLARE_R2_ENDPOINT?.split('//')[1]?.split('.')[0]}/${bucketName}/${fileName}`;

      return NextResponse.json({
        success: true,
        photoUrl,
        message: 'Photo uploaded successfully',
      });
    });
  } catch (error: any) {
    console.error('Error uploading student photo:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to upload photo',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
