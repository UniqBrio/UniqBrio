import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;

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
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path from URL segments
    const filePath = params.path.join('/');
    console.log(`[r2-proxy] Requesting file: ${filePath}`);

    // Validate the file path (security check)
    if (!filePath.startsWith('kyc/')) {
      console.error(`[r2-proxy] Unauthorized path: ${filePath}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the object from R2
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
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