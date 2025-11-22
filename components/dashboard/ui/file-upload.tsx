import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/dashboard/ui/button';
import { Progress } from '@/components/dashboard/ui/progress';
import { useFileUpload, UploadOptions } from '@/hooks/dashboard/useFileUpload';
import { Upload, X, File, Image, Video, FileText, Music } from 'lucide-react';
import { toast } from '@/hooks/dashboard/use-toast';

interface FileUploadComponentProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
  uploadOptions?: UploadOptions;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

interface UploadedFile {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export default function FileUploadComponent({
  onUploadSuccess,
  onUploadError,
  uploadOptions = {},
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'video/*': ['.mp4', '.webm', '.ogg'],
    'audio/*': ['.mp3', '.wav', '.ogg']
  },
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = false,
  disabled = false,
  className = '',
  showPreview = true
}: FileUploadComponentProps) {
  const { upload, uploadMultiple, deleteFile, isUploading, progress } = useFileUpload();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      let result;
      
      if (multiple && acceptedFiles.length > 1) {
        result = await uploadMultiple(acceptedFiles, uploadOptions);
      } else {
        result = await upload(acceptedFiles[0], uploadOptions);
      }

      if (result.success && result.data) {
        // Type guard to check if it's a multiple upload response
        if ('successful' in result.data && Array.isArray(result.data.successful)) {
          // Multiple files
          const newFiles = result.data.successful.map((file: any) => ({
            key: file.key,
            url: file.url,
            name: file.originalName,
            size: file.size,
            type: file.type
          }));
          setUploadedFiles(prev => [...prev, ...newFiles]);
          onUploadSuccess?.(result.data);
          
          toast({
            title: "Upload Successful",
            description: `${newFiles.length} file(s) uploaded successfully`
          });
        } else {
          // Single file - type guard ensures we have the single file structure
          if ('key' in result.data && 'url' in result.data) {
            const newFile = {
              key: result.data.key,
              url: result.data.url,
              name: result.data.originalName,
              size: result.data.size,
              type: result.data.type
            };
            setUploadedFiles(prev => [...prev, newFile]);
            onUploadSuccess?.(result.data);
            
            toast({
              title: "Upload Successful",
              description: `${newFile.name} uploaded successfully`
            });
          }
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [upload, uploadMultiple, uploadOptions, multiple, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: disabled || isUploading
  });

  const handleRemoveFile = async (fileKey: string) => {
    try {
      const result = await deleteFile(fileKey);
      if (result.success) {
        setUploadedFiles(prev => prev.filter(file => file.key !== fileKey));
        toast({
          title: "File Deleted",
          description: "File removed successfully"
        });
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Delete failed',
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${(disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Max size: {formatFileSize(maxSize)} | {multiple ? 'Multiple files allowed' : 'Single file only'}
            </p>
          </div>
        )}
        
        {isUploading && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 mt-2">Uploading... {progress}%</p>
          </div>
        )}
      </div>

      {/* File Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          <div className="grid gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFile(file.key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}