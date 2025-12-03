import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import mongoose from 'mongoose';

/**
 * ADMIN ENDPOINT: Check for staff records with wrong tenantId
 * GET /api/dashboard/admin/cleanup-staff
 */
export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId || !session?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    await dbConnect("uniqbrio");
    
    const NonInstructors = mongoose.models.NonInstructor || 
      mongoose.model('NonInstructor', new mongoose.Schema({}, { strict: false, collection: 'non_instructors' }));
    
    // Get all non-instructors
    const allStaff = await NonInstructors.find({}).lean();
    
    // Group by tenantId
    const byTenant: Record<string, any[]> = {};
    allStaff.forEach((staff: any) => {
      const tid = staff.tenantId || 'NO_TENANT';
      if (!byTenant[tid]) byTenant[tid] = [];
      byTenant[tid].push({
        id: staff._id,
        name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.name || 'Unnamed',
        email: staff.email,
        role: staff.role,
        createdAt: staff.createdAt
      });
    });
    
    return NextResponse.json({
      success: true,
      yourTenantId: session.tenantId,
      yourEmail: session.email,
      totalRecords: allStaff.length,
      byTenant,
      staffInYourTenant: byTenant[session.tenantId] || [],
      staffInOtherTenants: Object.keys(byTenant)
        .filter(tid => tid !== session.tenantId)
        .reduce((acc, tid) => {
          acc[tid] = byTenant[tid];
          return acc;
        }, {} as Record<string, any[]>)
    });
  } catch (error: any) {
    console.error('Error checking staff records:', error);
    return NextResponse.json(
      { error: 'Failed to check staff records', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove staff records that don't belong to current tenant
 * Only use this after confirming which records are wrong
 */
export async function DELETE(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    await dbConnect("uniqbrio");
    
    const body = await request.json();
    const { staffIds } = body; // Array of staff IDs to delete
    
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json(
        { error: 'staffIds array is required' },
        { status: 400 }
      );
    }
    
    const NonInstructors = mongoose.models.NonInstructor || 
      mongoose.model('NonInstructor', new mongoose.Schema({}, { strict: false, collection: 'non_instructors' }));
    
    // First, verify these records don't belong to current tenant
    const staffToDelete = await NonInstructors.find({
      _id: { $in: staffIds }
    }).lean();
    
    const belongsToCurrentTenant = staffToDelete.some((s: any) => s.tenantId === session.tenantId);
    
    if (belongsToCurrentTenant) {
      return NextResponse.json(
        { error: 'Cannot delete: Some records belong to your tenant' },
        { status: 400 }
      );
    }
    
    // Delete the records
    const result = await NonInstructors.deleteMany({
      _id: { $in: staffIds },
      tenantId: { $ne: session.tenantId } // Safety check
    });
    
    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
      message: `Deleted ${result.deletedCount} staff records`
    });
  } catch (error: any) {
    console.error('Error deleting staff records:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff records', details: error.message },
      { status: 500 }
    );
  }
}
