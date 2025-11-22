import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2, uploadMultipleFilesToR2, deleteFileFromR2, UploadOptions } from '@/lib/dashboard/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Handle both single file and multiple files
    const singleFile = formData.get('file') as File;
    const multipleFiles = formData.getAll('files') as File[];
    
    const courseId = formData.get('courseId') as string;
    const category = formData.get('category') as string;
    const makePublic = formData.get('makePublic') === 'true';

    // Determine which files to process
    const files = singleFile ? [singleFile] : multipleFiles;

    if (files.length === 0 || !files[0]) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      if (file.size === 0) {
        return NextResponse.json(
          { error: `File '${file.name}' is empty` },
          { status: 400 }
        );
      }
    }

    const options: UploadOptions = {
      courseId: courseId || undefined,
      category: category || 'general',
      makePublic: makePublic
    };

    if (files.length === 1) {
      // Single file upload
      const file = files[0];
      const result = await uploadFileToR2(
        file,
        file.name,
        file.type,
        options
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          key: result.key,
          url: result.url,
          size: result.size,
          type: result.type,
          originalName: file.name
        }
      });
    } else {
      // Multiple files upload
      const fileData = files.map(file => ({
        file,
        name: file.name,
        type: file.type
      }));

      const results = await uploadMultipleFilesToR2(fileData, options);
      
      const successfulUploads = results.filter((r: any) => r.success);
      const failedUploads = results.filter((r: any) => !r.success);

      return NextResponse.json({
        success: true,
        message: `${successfulUploads.length} files uploaded successfully${failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ''}`,
        data: {
          successful: successfulUploads.map((result: any, index: number) => ({
            key: result.key,
            url: result.url,
            size: result.size,
            type: result.type,
            originalName: files[index].name
          })),
          failed: failedUploads.map((result: any, index: number) => ({
            originalName: files[successfulUploads.length + index].name,
            error: result.error
          }))
        }
      });
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    const result = await deleteFileFromR2(key);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}