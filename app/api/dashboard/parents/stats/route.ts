import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'
import mongoose from 'mongoose'

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const revalidate = 120;

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
        
        // Check if Parents collection exists
        const db = mongoose.connection.db;
        if (!db) {
          console.warn('Database connection not available');
          return NextResponse.json({
            total: 0,
            active: 0,
            verified: 0
          });
        }
        
        const collections = await db.listCollections({ name: 'parents' }).toArray();
        
        if (collections.length === 0) {
          console.log('Parents collection does not exist yet');
          return NextResponse.json({
            total: 0,
            active: 0,
            verified: 0
          });
        }
        
        // Get the parents collection
        const parentsCollection = db.collection('parents');
        
        // Get total parents for this tenant
        const totalParents = await parentsCollection.countDocuments({ 
          tenantId: session.tenantId,
          isDeleted: { $ne: true }
        });
        
        // Get active parents (those who have logged in within the last 90 days or have verified status)
        const activeParents = await parentsCollection.countDocuments({
          tenantId: session.tenantId,
          isDeleted: { $ne: true },
          $or: [
            { isActive: true },
            { status: 'active' },
            { verified: true }
          ]
        });
        
        // Get verified parents
        const verifiedParents = await parentsCollection.countDocuments({
          tenantId: session.tenantId,
          isDeleted: { $ne: true },
          $or: [
            { isVerified: true },
            { verified: true },
            { emailVerified: true }
          ]
        });
        
        console.log('Parents stats:', {
          total: totalParents,
          active: activeParents,
          verified: verifiedParents
        });
        
        return NextResponse.json({
          total: totalParents,
          active: activeParents,
          verified: verifiedParents
        });
        
      } catch (error: any) {
        console.error('Error fetching parent stats:', error);
        // Return zeros instead of error to prevent UI breaking
        return NextResponse.json({
          total: 0,
          active: 0,
          verified: 0
        });
      }
    }
  );
}
