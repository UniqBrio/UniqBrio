import { useState, useCallback } from 'react';

/**
 * Storage categories matching the backend
 */
export enum StorageCategory {
  INVOICES = 'invoices',
  RECEIPTS = 'receipts',
  HELP_ATTACHMENTS = 'help-attachments',
  COURSE_MATERIALS = 'course-materials',
  FINANCIAL_DOCUMENTS = 'financial-documents',
  GENERAL = 'general'
}

export interface AcademyUploadOptions {
  category: StorageCategory;
  subFolder?: string;
  onProgress?: (progress: number) => void;
}

export interface AcademyUploadResult {
  success: boolean;
  key?: string;
  url?: string;
  size?: number;
  type?: string;
  originalName?: string;
  error?: string;
}

export interface UseAcademyUploadReturn {
  upload: (file: File, options: AcademyUploadOptions) => Promise<AcademyUploadResult>;
  uploadMultiple: (files: File[], options: AcademyUploadOptions) => Promise<{
    successful: AcademyUploadResult[];
    failed: AcademyUploadResult[];
  }>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for uploading files to Academy Storage with tenant isolation
 * 
 * Usage:
 * ```tsx
 * const { upload, uploadMultiple, isUploading, error } = useAcademyUpload();
 * 
 * // Single file upload
 * const result = await upload(file, { 
 *   category: StorageCategory.INVOICES,
 *   subFolder: paymentId 
 * });
 * 
 * // Multiple files upload
 * const results = await uploadMultiple(files, {
 *   category: StorageCategory.HELP_ATTACHMENTS,
 *   subFolder: ticketId
 * });
 * ```
 */
export function useAcademyUpload(): UseAcademyUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(async (
    file: File,
    options: AcademyUploadOptions
  ): Promise<AcademyUploadResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('category', options.category);
      if (options.subFolder) {
        formData.append('subFolder', options.subFolder);
      }

      // Simulate progress for small files
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/academy-storage/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Upload failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return {
        success: true,
        key: result.data.key,
        url: result.data.url,
        size: result.data.size,
        type: result.data.type,
        originalName: result.data.originalName
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    options: AcademyUploadOptions
  ): Promise<{ successful: AcademyUploadResult[]; failed: AcademyUploadResult[] }> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('category', options.category);
      if (options.subFolder) {
        formData.append('subFolder', options.subFolder);
      }

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const response = await fetch('/api/academy-storage/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Upload failed';
        setError(errorMessage);
        return {
          successful: [],
          failed: files.map(f => ({ success: false, originalName: f.name, error: errorMessage }))
        };
      }

      return {
        successful: result.data.successful || [],
        failed: result.data.failed || []
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return {
        successful: [],
        failed: files.map(f => ({ success: false, originalName: f.name, error: errorMessage }))
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
    reset
  };
}

/**
 * Delete a file from Academy Storage
 */
export async function deleteAcademyFile(fileKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/academy-storage/${fileKey}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Delete failed' };
    }

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Delete failed' 
    };
  }
}
