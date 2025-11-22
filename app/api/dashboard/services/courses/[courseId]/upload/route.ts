import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2, uploadMultipleFilesToR2, UploadOptions } from '@/lib/dashboard/r2-storage';

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
    const formData = await request.formData();
    
    // Handle multiple files
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string || 'course-materials';
    const makePublic = formData.get('makePublic') === 'true';

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const options: UploadOptions = {
      courseId,
      category,
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
      
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      return NextResponse.json({
        success: true,
        message: `${successfulUploads.length} files uploaded successfully${failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ''}`,
        data: {
          successful: successfulUploads.map((result, index) => ({
            key: result.key,
            url: result.url,
            size: result.size,
            type: result.type,
            originalName: files[index].name
          })),
          failed: failedUploads.map((result, index) => ({
            originalName: files[successfulUploads.length + index].name,
            error: result.error
          }))
        }
      });
    }

  } catch (error) {
    console.error('Course upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}