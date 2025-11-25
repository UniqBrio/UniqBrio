"use client"

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/dashboard/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onChange?: (file: File | null) => void;
  value?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onChange,
  value,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onChange?.(file);
    }
  }, [onChange]);

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400 dark:text-white" />
            <div className="text-sm text-gray-600 dark:text-white">
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <div>
                  <p>Drag & drop an image here, or click to select</p>
                  <p className="text-xs text-gray-400 dark:text-white mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-gray-500 dark:text-white" />
              <span className="text-sm text-gray-600 dark:text-white">Image selected</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}