import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;
const R2_STUDENT_BUCKET = process.env.CLOUDFLARE_R2_STUDENT_BUCKET || 'uniqbrio-students';

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Reconstruct the file path from URL segments
    const filePath = resolvedParams.path.join('/');
    console.log(`[r2-proxy] Requesting file: ${filePath}`);

    // Determine which bucket to use based on path prefix
    let bucket = R2_BUCKET;
    let allowedPrefixes = ['kyc/', 'business-registration/'];
    
    // Check if this is a student photo (tenant-scoped paths with uppercase/lowercase letters)
    if (filePath.match(/^[a-fA-F0-9-]+\/students\//)) {
      bucket = R2_STUDENT_BUCKET;
      allowedPrefixes = []; // Student photos are tenant-scoped, no additional prefix restriction
      console.log(`[r2-proxy] Using student bucket for: ${filePath}`);
    }

    // Validate the file path (security check) - only for non-student paths
    if (allowedPrefixes.length > 0 && !allowedPrefixes.some(prefix => filePath.startsWith(prefix))) {
      console.error(`[r2-proxy] Unauthorized path: ${filePath}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the object from R2
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    const response = await s3.send(command);
    
    if (!response.Body) {
      console.error(`[r2-proxy] No body in response for: ${filePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Convert the stream to bytes
    const bytes = await response.Body.transformToByteArray();
    
    console.log(`[r2-proxy] Successfully retrieved file: ${filePath} (${bytes.length} bytes)`);

    // Return the image with proper headers
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Length': response.ContentLength?.toString() || bytes.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': response.ETag || '',
      },
    });

  } catch (error) {
    console.error("[r2-proxy] Error:", error);
    
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}