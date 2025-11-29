import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { 
  getFromAcademyStorage, 
  deleteFromAcademyStorage,
  getAcademyFileMetadata 
} from '@/lib/dashboard/r2-academy-storage';

/**
 * Academy Storage File Access API
 * 
 * GET /api/academy-storage/[...path]
 * Retrieves a file from R2 storage with tenant verification
 * 
 * DELETE /api/academy-storage/[...path]
 * Deletes a file from R2 storage with tenant verification
 * 
 * HEAD /api/academy-storage/[...path]
 * Gets file metadata with tenant verification
 * 
 * SECURITY: All operations enforce tenant isolation:
 * 1. User must be authenticated with valid session
 * 2. File path must start with user's tenantId
 * 3. Path traversal attacks are blocked (.. sequences removed)
 * 4. Cross-tenant access is logged and denied
 */

/**
 * Sanitize file path to prevent path traversal attacks
 * Removes .. sequences and normalizes slashes
 */
function sanitizePath(pathSegments: string[]): string {
  // Filter out any segments that could be used for path traversal
  const safeSegments = pathSegments
    .filter(segment => segment !== '..' && segment !== '.' && segment.trim() !== '')
    .map(segment => segment.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '_'));
  
  return safeSegments.join('/');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get tenant context
    const session = await getUserSession();
    
    if (!session?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No tenant context' },
        { status: 401 }
      );
    }

    // Sanitize and reconstruct the file key from path segments
    const key = sanitizePath(params.path);
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Get file from storage (includes tenant verification)
    const result = await getFromAcademyStorage(key, session.tenantId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('Access denied') ? 403 : 404 }
      );
    }

    // Return the file with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const responseBody = result.data ? new Uint8Array(result.data) : null;
    
    return new NextResponse(responseBody, {
      headers: {
        'Content-Type': result.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        'X-Tenant-Id': session.tenantId
      }
    });

  } catch (error) {
    console.error('[Academy Storage GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get tenant context
    const session = await getUserSession();
    
    if (!session?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No tenant context' },
        { status: 401 }
      );
    }

    // Sanitize and reconstruct the file key from path segments
    const key = sanitizePath(params.path);
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Delete file from storage (includes tenant verification)
    const result = await deleteFromAcademyStorage(key, session.tenantId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('Access denied') ? 403 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('[Academy Storage DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get tenant context
    const session = await getUserSession();
    
    if (!session?.tenantId) {
      return new NextResponse(null, { status: 401 });
    }

    // Sanitize and reconstruct the file key from path segments
    const key = sanitizePath(params.path);
    
    if (!key) {
      return new NextResponse(null, { status: 400 });
    }

    // Get file metadata (includes tenant verification)
    const result = await getAcademyFileMetadata(key, session.tenantId);

    if (!result.success) {
      return new NextResponse(null, { 
        status: result.error?.includes('Access denied') ? 403 : 404 
      });
    }

    return new NextResponse(null, {
      headers: {
        'Content-Type': result.contentType || 'application/octet-stream',
        'Content-Length': String(result.size || 0),
        'Last-Modified': result.lastModified?.toUTCString() || '',
        'X-Tenant-Id': session.tenantId
      }
    });

  } catch (error) {
    console.error('[Academy Storage HEAD] Error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
