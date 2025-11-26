import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// GET endpoint to check sync status without modifying data
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
        console.log('🔍 [Sync API] Checking cohort-student sync status...');
        
        await dbConnect("uniqbrio");
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection failed');
    }

    const syncStatus: any[] = [];

    // Get all active cohorts
    const cohorts = await db.collection('cohorts').find({
      isDeleted: { $ne: true }
    }, {
      projection: { cohortId: 1, name: 1, currentStudents: 1 }
    }).toArray();

    for (const cohort of cohorts) {
      // Find students enrolled in this cohort from students collection
      const enrolledStudents = await db.collection('students').find({
        $or: [
          { cohortId: cohort.cohortId },
          { cohorts: cohort.cohortId },
          { enrolledCohorts: cohort.cohortId }
        ],
        isDeleted: { $ne: true }
      }, {
        projection: { studentId: 1, name: 1, cohortId: 1 }
      }).toArray();

      const currentStudentsInCohort = Array.isArray(cohort.currentStudents) ? cohort.currentStudents : [];
      const studentsInStudentCollection = enrolledStudents.map(s => s.studentId).filter(Boolean);

      syncStatus.push({
        cohortId: cohort.cohortId,
        name: cohort.name,
        currentStudentsInCohort: currentStudentsInCohort.length,
        studentsInStudentCollection: studentsInStudentCollection.length,
        inSync: JSON.stringify(currentStudentsInCohort.sort()) === JSON.stringify(studentsInStudentCollection.sort()),
        currentStudents: currentStudentsInCohort,
        studentsFound: studentsInStudentCollection,
        studentDetails: enrolledStudents.map(s => ({
          studentId: s.studentId,
          name: s.name,
          cohortId: s.cohortId
        }))
      });
    }

        return NextResponse.json({
          success: true,
          totalCohorts: cohorts.length,
          syncStatus
        });

      } catch (error) {
        console.error('❌ [Sync API] Error:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
      }
    }
  );
}

export async function POST() {
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
        console.log('🔄 [Sync API] Starting cohort member sync from students collection...');
        
        await dbConnect("uniqbrio");
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection failed');
    }

    let totalUpdated = 0;
    const syncResults: any[] = [];

    // Get all active cohorts
    const cohorts = await db.collection('cohorts').find({
      isDeleted: { $ne: true }
    }, {
      projection: { cohortId: 1, name: 1, currentStudents: 1 }
    }).toArray();

    console.log(`📊 Found ${cohorts.length} active cohorts to sync`);

    for (const cohort of cohorts) {
      console.log(`  Syncing ${cohort.cohortId} (${cohort.name})...`);
      
      // Find students enrolled in this cohort from students collection
      const enrolledStudents = await db.collection('students').find({
        $or: [
          { cohortId: cohort.cohortId },
          { cohorts: cohort.cohortId },
          { enrolledCohorts: cohort.cohortId }
        ],
        isDeleted: { $ne: true }
      }, {
        projection: { studentId: 1, name: 1 }
      }).toArray();

      const studentIds = enrolledStudents.map(s => s.studentId).filter(Boolean);
      
      // Always update cohort's currentStudents array, even if empty (to clear out stale data)
      const updateResult = await db.collection('cohorts').updateOne(
        { cohortId: cohort.cohortId },
        { 
          $set: { 
            currentStudents: studentIds,
            updatedAt: new Date()
          }
        }
      );

      // Consider it updated if the array changed
      const currentArray = Array.isArray(cohort.currentStudents) ? cohort.currentStudents : [];
      const hasChanged = JSON.stringify(currentArray.sort()) !== JSON.stringify(studentIds.sort());
      
      if (hasChanged) {
        totalUpdated++;
      }

      syncResults.push({
        cohortId: cohort.cohortId,
        name: cohort.name,
        studentsFound: enrolledStudents.length,
        studentIds: studentIds,
        previousCount: currentArray.length,
        newCount: studentIds.length,
        updated: hasChanged
      });

      console.log(`    ✅ Students: ${enrolledStudents.length}, updated: ${hasChanged} (was: ${currentArray.length}, now: ${studentIds.length})`);
    }

        console.log(`🎉 Sync completed. Updated ${totalUpdated} cohorts`);

        return NextResponse.json({
          success: true,
          message: `Successfully synced ${totalUpdated} cohorts`,
          totalCohortsProcessed: cohorts.length,
          totalCohortsUpdated: totalUpdated,
          syncResults
        });

      } catch (error) {
        console.error('❌ [Sync API] Error:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
      }
    }
  );
}