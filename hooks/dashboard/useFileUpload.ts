import { useState, useCallback } from 'react';

export interface UploadOptions {
  courseId?: string;
  category?: string;
  makePublic?: boolean;
}

export interface UploadResult {
  success: boolean;
  data?: {
    key: string;
    url: string;
    size: number;
    type: string;
    originalName: string;
  } | {
    successful: {
      key: string;
      url: string;
      size: number;
      type: string;
      originalName: string;
    }[];
    failed: {
      originalName: string;
      error: string;
    }[];
  };
  error?: string;
}

export interface UseFileUploadReturn {
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult>;
  uploadMultiple: (files: File[], options?: UploadOptions) => Promise<UploadResult>;
  deleteFile: (key: string) => Promise<{ success: boolean; error?: string }>;
  isUploading: boolean;
  progress: number;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File, options?: UploadOptions): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options?.courseId) {
        formData.append('courseId', options.courseId);
      }
      if (options?.category) {
        formData.append('category', options.category);
      }
      if (options?.makePublic) {
        formData.append('makePublic', 'true');
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const endpoint = options?.courseId 
        ? `/api/dashboard/services/courses/${options.courseId}/upload`
        : '/api/dashboard/services/system/upload';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[], options?: UploadOptions): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (options?.courseId) {
        formData.append('courseId', options.courseId);
      }
      if (options?.category) {
        formData.append('category', options.category);
      }
      if (options?.makePublic) {
        formData.append('makePublic', 'true');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const endpoint = options?.courseId 
        ? `/api/dashboard/services/courses/${options.courseId}/upload`
        : '/api/dashboard/services/system/upload';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('Multiple upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  const deleteFile = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/dashboard/services/system/upload?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      return { success: true };

    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }, []);

  return {
    upload,
    uploadMultiple,
    deleteFile,
    isUploading,
    progress
  };
}
