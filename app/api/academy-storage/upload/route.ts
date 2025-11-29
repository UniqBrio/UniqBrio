import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { 
  uploadToAcademyStorage, 
  uploadMultipleToAcademyStorage,
  StorageCategory,
  AcademyUploadOptions 
} from '@/lib/dashboard/r2-academy-storage';

/**
 * Academy Storage Upload API
 * 
 * POST /api/academy-storage/upload
 * 
 * Handles file uploads to R2 with tenant isolation.
 * Files are stored in tenant-specific folders.
 * 
 * Form Data:
 * - files: File[] (required) - Files to upload
 * - category: string (required) - Storage category: invoices, receipts, help-attachments, course-materials, financial-documents, general
 * - subFolder: string (optional) - Sub-folder for organization (e.g., courseId, ticketId)
 * 
 * Response:
 * - success: boolean
 * - data: { key, url, size, type, originalName }[] for successful uploads
 * - errors: { originalName, error }[] for failed uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and get tenant context
    const session = await getUserSession();
    
    if (!session?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No tenant context' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Get files from form data
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string;
    const subFolder = formData.get('subFolder') as string | null;

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = Object.values(StorageCategory);
    if (!category || !validCategories.includes(category as StorageCategory)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const uploadOptions: AcademyUploadOptions = {
      tenantId: session.tenantId,
      category: category as StorageCategory,
      subFolder: subFolder || undefined,
      metadata: {
        'uploaded-by': session.userId || 'unknown',
        'uploaded-by-email': session.email || 'unknown'
      }
    };

    console.log(`[Academy Upload] Processing ${files.length} file(s) for tenant ${session.tenantId}, category: ${category}`);

    if (files.length === 1) {
      // Single file upload
      const file = files[0];
      const result = await uploadToAcademyStorage(
        file,
        file.name,
        file.type,
        uploadOptions
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
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
          originalName: file.name,
          tenantId: session.tenantId
        }
      });
    } else {
      // Multiple files upload
      const fileData = files.map(file => ({
        file,
        name: file.name,
        type: file.type
      }));

      const results = await uploadMultipleToAcademyStorage(fileData, uploadOptions);
      
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      return NextResponse.json({
        success: true,
        message: `${successfulUploads.length} file(s) uploaded successfully${failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ''}`,
        data: {
          successful: successfulUploads.map((result, index) => ({
            key: result.key,
            url: result.url,
            size: result.size,
            type: result.type,
            originalName: files[index].name,
            tenantId: session.tenantId
          })),
          failed: failedUploads.map((result, index) => ({
            originalName: files[successfulUploads.length + index]?.name || 'unknown',
            error: result.error
          }))
        }
      });
    }

  } catch (error) {
    console.error('[Academy Upload] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
