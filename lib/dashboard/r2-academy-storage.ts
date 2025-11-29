import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * R2 Academy Storage Configuration
 * 
 * This module handles tenant-isolated file storage for academy media files including:
 * - Payment invoices and receipts
 * - Help desk attachments (images, screenshots)
 * - Course materials (PDFs, documents)
 * - Financial receipts
 * 
 * Folder Structure (tenant-isolated):
 * /{tenantId}/
 *   ├── invoices/          - Payment invoices PDFs
 *   ├── receipts/          - Financial receipts
 *   ├── help-attachments/  - Help desk ticket attachments
 *   ├── course-materials/  - Course PDFs and documents
 *   └── general/           - Other files
 */

// Cloudflare R2 Configuration for Academy Bucket
const r2AcademyConfig = {
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
};

// Create R2 client instance for academy bucket
export const r2AcademyClient = new S3Client(r2AcademyConfig);

// Bucket name from environment
export const R2_ACADEMY_BUCKET = process.env.R2_ACADEMY_BUCKET || 'uniqbrio-media';

// Public URL for accessing files (if configured)
export const R2_ACADEMY_PUBLIC_URL = process.env.R2_ACADEMY_PUBLIC_URL;

// File upload configuration
export const ACADEMY_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size

export const ACADEMY_ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  archives: ['application/zip', 'application/x-rar-compressed'],
};

// Storage categories for organizing files
export enum StorageCategory {
  INVOICES = 'invoices',
  RECEIPTS = 'receipts',
  HELP_ATTACHMENTS = 'help-attachments',
  COURSE_MATERIALS = 'course-materials',
  FINANCIAL_DOCUMENTS = 'financial-documents',
  GENERAL = 'general'
}

export interface AcademyUploadOptions {
  tenantId: string;
  category: StorageCategory;
  subFolder?: string; // Optional sub-folder (e.g., courseId, ticketId)
  makePublic?: boolean;
  customKey?: string;
  metadata?: Record<string, string>;
}

export interface AcademyUploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
  size?: number;
  type?: string;
  tenantId?: string;
}

/**
 * Get file type category
 */
export const getAcademyFileTypeCategory = (mimeType: string): string | null => {
  for (const [category, types] of Object.entries(ACADEMY_ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return null;
};

/**
 * Validate file type
 */
export const isValidAcademyFileType = (mimeType: string): boolean => {
  return getAcademyFileTypeCategory(mimeType) !== null;
};

/**
 * Generate tenant-isolated file key/path
 * Format: {tenantId}/{category}/{subFolder?}/{timestamp}-{sanitizedFileName}
 */
export const generateAcademyFileKey = (
  originalName: string,
  tenantId: string,
  category: StorageCategory,
  subFolder?: string
): string => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedName.split('.').pop() || '';
  const nameWithoutExt = sanitizedName.replace(`.${extension}`, '');
  const uniqueId = Math.random().toString(36).substring(2, 8);
  
  const basePath = subFolder 
    ? `${tenantId}/${category}/${subFolder}`
    : `${tenantId}/${category}`;
  
  return `${basePath}/${timestamp}-${uniqueId}-${nameWithoutExt}.${extension}`;
};

/**
 * Get public URL for a file
 */
export const getAcademyPublicUrl = (key: string): string => {
  if (R2_ACADEMY_PUBLIC_URL) {
    return `${R2_ACADEMY_PUBLIC_URL}/${key}`;
  }
  // Use the proxy endpoint for accessing files
  return `/api/academy-storage/${key}`;
};

/**
 * Upload a file to R2 Academy storage with tenant isolation
 */
export async function uploadToAcademyStorage(
  file: File | Buffer,
  originalName: string,
  mimeType: string,
  options: AcademyUploadOptions
): Promise<AcademyUploadResult> {
  try {
    // Validate tenant ID
    if (!options.tenantId) {
      return {
        success: false,
        error: 'Tenant ID is required for file upload'
      };
    }

    // Validate file type
    if (!isValidAcademyFileType(mimeType)) {
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
    if (fileSize > ACADEMY_MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size ${fileSize} exceeds maximum allowed size of ${ACADEMY_MAX_FILE_SIZE} bytes (50MB)`
      };
    }

    // Generate tenant-isolated file key
    const key = options.customKey || generateAcademyFileKey(
      originalName,
      options.tenantId,
      options.category,
      options.subFolder
    );

    // Create upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_ACADEMY_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentLength: fileSize,
      Metadata: {
        'original-name': originalName,
        'upload-date': new Date().toISOString(),
        'tenant-id': options.tenantId,
        'category': options.category,
        ...(options.subFolder && { 'sub-folder': options.subFolder }),
        ...options.metadata
      }
    });

    // Upload to R2
    await r2AcademyClient.send(uploadCommand);

    // Generate public URL
    const url = getAcademyPublicUrl(key);

    console.log(`[R2 Academy] File uploaded: ${key} for tenant ${options.tenantId}`);

    return {
      success: true,
      key,
      url,
      size: fileSize,
      type: mimeType,
      tenantId: options.tenantId
    };

  } catch (error) {
    console.error('[R2 Academy] Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Upload multiple files to R2 Academy storage
 */
export async function uploadMultipleToAcademyStorage(
  files: Array<{ file: File | Buffer; name: string; type: string }>,
  options: AcademyUploadOptions
): Promise<Array<AcademyUploadResult>> {
  const results: Array<AcademyUploadResult> = [];

  for (const fileData of files) {
    const result = await uploadToAcademyStorage(
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
 * Delete a file from R2 Academy storage (with tenant verification)
 */
export async function deleteFromAcademyStorage(
  key: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Sanitize and validate the key to prevent path traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Verify the file belongs to the tenant (must start with tenantId/)
    if (!sanitizedKey.startsWith(`${tenantId}/`)) {
      console.warn(`[R2 Academy] Access denied: Tenant ${tenantId} attempted to delete ${sanitizedKey}`);
      return {
        success: false,
        error: 'Access denied: File does not belong to this tenant'
      };
    }

    // Additional check: Ensure tenantId in key matches exactly (not a prefix of another tenantId)
    const keyParts = sanitizedKey.split('/');
    if (keyParts[0] !== tenantId) {
      console.warn(`[R2 Academy] Access denied: TenantId mismatch - expected ${tenantId}, got ${keyParts[0]}`);
      return {
        success: false,
        error: 'Access denied: File does not belong to this tenant'
      };
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_ACADEMY_BUCKET,
      Key: sanitizedKey
    });

    await r2AcademyClient.send(deleteCommand);

    console.log(`[R2 Academy] File deleted: ${sanitizedKey} for tenant ${tenantId}`);

    return { success: true };
  } catch (error) {
    console.error('[R2 Academy] Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if a file exists in R2 Academy storage (with tenant verification)
 */
export async function fileExistsInAcademyStorage(
  key: string,
  tenantId: string
): Promise<boolean> {
  try {
    // Sanitize and validate the key to prevent path traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Verify the file belongs to the tenant
    if (!sanitizedKey.startsWith(`${tenantId}/`)) {
      return false;
    }

    // Additional check: Ensure tenantId in key matches exactly
    const keyParts = sanitizedKey.split('/');
    if (keyParts[0] !== tenantId) {
      return false;
    }

    const headCommand = new HeadObjectCommand({
      Bucket: R2_ACADEMY_BUCKET,
      Key: sanitizedKey
    });

    await r2AcademyClient.send(headCommand);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file from R2 Academy storage (with tenant verification)
 */
export async function getFromAcademyStorage(
  key: string,
  tenantId: string
): Promise<{ success: boolean; data?: Buffer; contentType?: string; error?: string }> {
  try {
    // Sanitize and validate the key to prevent path traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Verify the file belongs to the tenant (must start with tenantId/)
    if (!sanitizedKey.startsWith(`${tenantId}/`)) {
      console.warn(`[R2 Academy] Access denied: Tenant ${tenantId} attempted to access ${sanitizedKey}`);
      return {
        success: false,
        error: 'Access denied: File does not belong to this tenant'
      };
    }

    // Additional check: Ensure tenantId in key matches exactly (not a prefix of another tenantId)
    const keyParts = sanitizedKey.split('/');
    if (keyParts[0] !== tenantId) {
      console.warn(`[R2 Academy] Access denied: TenantId mismatch - expected ${tenantId}, got ${keyParts[0]}`);
      return {
        success: false,
        error: 'Access denied: File does not belong to this tenant'
      };
    }

    const getCommand = new GetObjectCommand({
      Bucket: R2_ACADEMY_BUCKET,
      Key: sanitizedKey
    });

    const response = await r2AcademyClient.send(getCommand);
    
    if (!response.Body) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);

    return {
      success: true,
      data,
      contentType: response.ContentType
    };
  } catch (error) {
    console.error('[R2 Academy] Error getting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * List files in a tenant's storage category
 */
export async function listAcademyFiles(
  tenantId: string,
  category: StorageCategory,
  subFolder?: string,
  maxKeys: number = 100
): Promise<{ success: boolean; files?: Array<{ key: string; size: number; lastModified: Date }>; error?: string }> {
  try {
    const prefix = subFolder 
      ? `${tenantId}/${category}/${subFolder}/`
      : `${tenantId}/${category}/`;

    const listCommand = new ListObjectsV2Command({
      Bucket: R2_ACADEMY_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys
    });

    const response = await r2AcademyClient.send(listCommand);

    const files = (response.Contents || []).map(obj => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date()
    }));

    return {
      success: true,
      files
    };
  } catch (error) {
    console.error('[R2 Academy] Error listing files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get file metadata from R2 Academy storage
 */
export async function getAcademyFileMetadata(
  key: string,
  tenantId: string
): Promise<{
  success: boolean;
  metadata?: Record<string, string>;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  error?: string;
}> {
  try {
    // Sanitize and validate the key to prevent path traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Verify the file belongs to the tenant (must start with tenantId/)
    if (!sanitizedKey.startsWith(`${tenantId}/`)) {
      console.warn(`[R2 Academy] Access denied: Tenant ${tenantId} attempted to get metadata for ${sanitizedKey}`);
      return {
        success: false,
        error: 'Access denied: File does not belong to this tenant'
      };
    }

    // Additional check: Ensure tenantId in key matches exactly
    const keyParts = sanitizedKey.split('/');
    if (keyParts[0] !== tenantId) {
      console.warn(`[R2 Academy] Access denied: TenantId mismatch - expected ${tenantId}, got ${keyParts[0]}`);
      return {
        success: false,
        error: 'Access denied: File does not belong to this tenant'
      };
    }

    const headCommand = new HeadObjectCommand({
      Bucket: R2_ACADEMY_BUCKET,
      Key: sanitizedKey
    });

    const response = await r2AcademyClient.send(headCommand);

    return {
      success: true,
      metadata: response.Metadata,
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType
    };
  } catch (error) {
    console.error('[R2 Academy] Error getting file metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
