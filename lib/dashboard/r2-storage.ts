import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand 
} from '@aws-sdk/client-s3';
import { 
  r2Client, 
  R2_BUCKET_NAME, 
  generateFileKey, 
  getPublicUrl, 
  isValidFileType,
  MAX_FILE_SIZE 
} from './r2-config';

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
  size?: number;
  type?: string;
}

export interface UploadOptions {
  courseId?: string;
  category?: string;
  makePublic?: boolean;
  customKey?: string;
}

/**
 * Upload a file to Cloudflare R2 storage
 */
export async function uploadFileToR2(
  file: File | Buffer, 
  originalName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!isValidFileType(mimeType)) {
      return {
        success: false,
        error: `File type ${mimeType} is not allowed`
      };
    }

    // Convert File to Buffer if needed
    let fileBuffer: Buffer;
    let fileSize: number;

    if (file instanceof File) {
      fileSize = file.size;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      fileBuffer = file;
      fileSize = file.length;
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size ${fileSize} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`
      };
    }

    // Generate file key
    const category = options.category || 'general';
    const key = options.customKey || generateFileKey(originalName, category, options.courseId);

    // Create upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentLength: fileSize,
      // Make file publicly accessible if requested
      ...(options.makePublic && {
        ACL: 'public-read'
      }),
      // Add metadata
      Metadata: {
        'original-name': originalName,
        'upload-date': new Date().toISOString(),
        ...(options.courseId && { 'course-id': options.courseId })
      }
    });

    // Upload to R2
    await r2Client.send(uploadCommand);

    // Generate public URL
    const url = getPublicUrl(key);

    return {
      success: true,
      key,
      url,
      size: fileSize,
      type: mimeType
    };

  } catch (error) {
    console.error('Error uploading file to R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a file from Cloudflare R2 storage
 */
export async function deleteFileFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    });

    await r2Client.send(deleteCommand);

    return { success: true };
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if a file exists in R2 storage
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    });

    await r2Client.send(headCommand);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from R2 storage
 */
export async function getFileMetadata(key: string): Promise<{
  success: boolean;
  metadata?: any;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  error?: string;
}> {
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    });

    const response = await r2Client.send(headCommand);

    return {
      success: true,
      metadata: response.Metadata,
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType
    };
  } catch (error) {
    console.error('Error getting file metadata from R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Upload multiple files to R2 storage
 */
export async function uploadMultipleFilesToR2(
  files: Array<{ file: File | Buffer; name: string; type: string }>,
  options: UploadOptions = {}
): Promise<Array<UploadResult>> {
  const results: Array<UploadResult> = [];

  for (const fileData of files) {
    const result = await uploadFileToR2(
      fileData.file,
      fileData.name,
      fileData.type,
      options
    );
    results.push(result);
  }

  return results;
}

/**
 * Generate a signed URL for temporary access (if needed in the future)
 * Note: R2 doesn't support pre-signed URLs in the same way as S3, 
 * but this function can be extended when R2 adds this feature
 */
export function generateSignedUrl(key: string, expiresIn: number = 3600): string {
  // For now, return the public URL
  // This can be enhanced when R2 supports pre-signed URLs
  return getPublicUrl(key);
}