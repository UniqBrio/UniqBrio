import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 Configuration
const r2Config = {
  region: 'auto', // R2 uses 'auto' as the region
  endpoint: process.env.R2_ENDPOINT, // Your R2 endpoint URL
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2 compatibility
};

// Create R2 client instance
export const r2Client = new S3Client(r2Config);

// Bucket configuration
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: Custom domain for public URLs

// File upload configuration
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

// Helper function to get file type category
export const getFileTypeCategory = (mimeType: string): string | null => {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return null;
};

// Helper function to validate file type
export const isValidFileType = (mimeType: string): boolean => {
  return getFileTypeCategory(mimeType) !== null;
};

// Helper function to generate file key/path
export const generateFileKey = (originalName: string, category: string, courseId?: string): string => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedName.split('.').pop();
  const nameWithoutExt = sanitizedName.replace(`.${extension}`, '');
  
  if (courseId) {
    return `courses/${courseId}/${category}/${timestamp}-${nameWithoutExt}.${extension}`;
  }
  
  return `uploads/${category}/${timestamp}-${nameWithoutExt}.${extension}`;
};

// Helper function to get public URL
export const getPublicUrl = (key: string): string => {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  // Fallback to R2 public URL format
  return `${process.env.R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
};