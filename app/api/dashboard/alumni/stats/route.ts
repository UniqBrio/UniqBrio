import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'
import mongoose from 'mongoose'

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        
        // Check if Alumni collection exists
        const db = mongoose.connection.db;
        if (!db) {
          console.warn('Database connection not available');
          return NextResponse.json({
            total: 0,
            active: 0,
            engaged: 0
          });
        }
        
        const collections = await db.listCollections({ name: 'alumni' }).toArray();
        
        if (collections.length === 0) {
          console.log('Alumni collection does not exist yet');
          return NextResponse.json({
            total: 0,
            active: 0,
            engaged: 0
          });
        }
        
        // Get the alumni collection
        const alumniCollection = db.collection('alumni');
        
        // Get total alumni for this tenant
        const totalAlumni = await alumniCollection.countDocuments({ 
          tenantId: session.tenantId,
          isDeleted: { $ne: true }
        });
        
        // Get active alumni (those who have recent activity or active status)
        const activeAlumni = await alumniCollection.countDocuments({
          tenantId: session.tenantId,
          isDeleted: { $ne: true },
          $or: [
            { isActive: true },
            { status: 'active' }
          ]
        });
        
        // Get engaged alumni (those who participated in events or activities)
        const engagedAlumni = await alumniCollection.countDocuments({
          tenantId: session.tenantId,
          isDeleted: { $ne: true },
          $or: [
            { engaged: true },
            { eventParticipation: { $gt: 0 } },
            { lastEngagement: { $exists: true, $ne: null } }
          ]
        });
        
        console.log('Alumni stats:', {
          total: totalAlumni,
          active: activeAlumni,
          engaged: engagedAlumni
        });
        
        return NextResponse.json({
          total: totalAlumni,
          active: activeAlumni,
          engaged: engagedAlumni
        });
        
      } catch (error: any) {
        console.error('Error fetching alumni stats:', error);
        // Return zeros instead of error to prevent UI breaking
        return NextResponse.json({
          total: 0,
          active: 0,
          engaged: 0
        });
      }
    }
  );
}
