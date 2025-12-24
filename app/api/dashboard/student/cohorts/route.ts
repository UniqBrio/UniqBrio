import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Student from '@/models/dashboard/student/Student';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDayRanges = (days: number[]): string => {
  if (!days?.length) return '';
  const sorted = Array.from(new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b);
  if (!sorted.length) return '';

  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  const pushRange = (start: number, end: number) => {
    if (start === undefined || end === undefined) return;
    if (start === end) {
      ranges.push(DAY_LABELS[start] ?? String(start));
    } else {
      ranges.push(`${DAY_LABELS[start] ?? start}–${DAY_LABELS[end] ?? end}`);
    }
  };

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    pushRange(rangeStart, prev);
    rangeStart = current;
    prev = current;
  }

  return ranges.join(', ');
};

const toIsoDateString = (value?: unknown): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

// NOTE: The underlying Mongo collection documents (as per Compass screenshot) contain:
// id, courseId, name, instructorName, startTime, endTime, capacity, members, status ...
// The legacy frontend expected fields: id, name, instructor, timing, activity, capacity, enrolledStudents.
// This route now normalises both shapes and supports filtering by either courseId or the legacy 'activity' param.

const cohortSchema = new mongoose.Schema({
  id: String,
  courseId: String,
  name: String,
  instructor: String,          // optional legacy
  instructorName: String,      // new field in DB
  startTime: String,
  endTime: String,
  startDate: String,           // cohort start date
  timing: String,              // legacy combined field
  activity: String,            // legacy course reference
  capacity: Number,
  members: [String],           // DB may use 'members'
  enrolledStudents: [String],  // legacy naming
  status: String,
}, { collection: 'cohorts', strict: false });

const Cohort = mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema);

export async function GET(req: NextRequest) {
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
        await dbConnect("uniqbrio");
    const { searchParams } = new URL(req.url);
    // Accept both ?courseId= and legacy ?activity= for backwards compatibility
    const courseId = searchParams.get('courseId');
    const activity = searchParams.get('activity');
    const query: Record<string, any> = {
      // Mirror services endpoint behaviour so soft-deleted cohorts never leak into student views
      isDeleted: { $ne: true },
      tenantId: session.tenantId
    };
    if (courseId) {
      // Primary new filter
      query.courseId = courseId;
    } else if (activity) {
      // Fallback legacy filter (some older docs may store reference as 'activity')
      query.$or = [{ activity }, { courseId: activity }];
    }

  const cohorts = await Cohort.find(query).lean();
    const mapped: any[] = [];
    for (const c of cohorts) {
      try {
        const id = c.id || c.cohortId || (c._id ? String(c._id) : undefined);
        if (!id) continue;
        // Derive instructor & timing consistently
        const instructor = c.instructor || c.instructorName || '';
        const startTime = c.startTime || c?.timeSlot?.startTime || '';
        const endTime = c.endTime || c?.timeSlot?.endTime || '';
        const daysOfWeekRaw = Array.isArray(c?.daysOfWeek) ? c.daysOfWeek : [];
        const daysLabel = formatDayRanges(daysOfWeekRaw);
        const timeRange = [startTime, endTime].filter(Boolean).join(' - ');
        const timing = [daysLabel, timeRange].filter(Boolean).join(' • ') || c.timing || '';
        const enrolledStudents = Array.isArray(c.enrolledStudents)
          ? c.enrolledStudents
          : Array.isArray(c.members)
            ? c.members
            : Array.isArray((c as any).currentStudents)
              ? (c as any).currentStudents
              : [];
        const capacity = typeof c.capacity === 'number'
          ? c.capacity
          : typeof c.maxStudents === 'number'
            ? c.maxStudents
            : 0;
        const startDate = toIsoDateString(c.startDate || (c as any).inheritedStartDate);
        const endDate = toIsoDateString((c as any).endDate || (c as any).inheritedEndDate);
        mapped.push({
          id,
            // Display name (e.g. Batch I)
          name: c.name || '',
          instructor,
          timing,
          // Normalised course reference used by the frontend when selecting a course
          activity: c.activity || c.courseId || '',
          capacity,
          enrolledStudents,
          startDate,
          startTime,
          endTime,
          daysOfWeek: daysOfWeekRaw,
          location: c.location || '',
          status: c.status || '',
          endDate,
        });
      } catch (e) {
        console.warn('[api/cohorts] Skipping malformed cohort document', e);
      }
    }
        return NextResponse.json(mapped);
      } catch (error: any) {
        console.error('Error fetching cohorts:', error?.message || error);
        return NextResponse.json({ error: 'Failed to fetch cohorts' }, { status: 500 });
      }
    }
  );
}

// PUT - Update cohort enrollment (add/remove students)
// Supports bidirectional sync: updates both cohort.enrolledStudents AND student.batch
export async function PUT(req: NextRequest) {
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
    await dbConnect("uniqbrio");
    const data = await req.json();
    
    const { cohortId, action, studentIds } = data;
    
    if (!cohortId) {
      return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    }
    
    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "add" or "remove"' }, { status: 400 });
    }
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs array required' }, { status: 400 });
    }
    
    // Find the cohort
    const cohortResult = await Cohort.findOne({ id: cohortId, tenantId: session.tenantId }).lean();
    if (!cohortResult) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }
    const cohort = cohortResult as any;
    
    // Get current enrolled students (support both 'members' and 'enrolledStudents' fields)
    let currentEnrolled = Array.isArray(cohort.enrolledStudents) 
      ? cohort.enrolledStudents 
      : Array.isArray(cohort.members) 
        ? cohort.members 
        : Array.isArray((cohort as any).currentStudents)
          ? (cohort as any).currentStudents
          : [];
    
    if (action === 'add') {
      // Add students to cohort
      const newStudents = studentIds.filter(sid => !currentEnrolled.includes(sid));
      
      if (newStudents.length === 0) {
        return NextResponse.json({ message: 'All students already enrolled', cohort }, { status: 200 });
      }
      
      // Check capacity
      const capacity = cohort.capacity || 0;
      if (capacity > 0 && (currentEnrolled.length + newStudents.length) > capacity) {
        return NextResponse.json({ 
          error: `Cohort capacity exceeded. Capacity: ${capacity}, Current: ${currentEnrolled.length}, Trying to add: ${newStudents.length}` 
        }, { status: 400 });
      }
      
      currentEnrolled = [...currentEnrolled, ...newStudents];
      
      // Update cohort
      await Cohort.updateOne(
        { id: cohortId, tenantId: session.tenantId },
        { 
          $set: { 
            enrolledStudents: currentEnrolled,
            members: currentEnrolled, // Update both fields for compatibility
            currentStudents: currentEnrolled,
            currentStudentsCount: currentEnrolled.length
          } 
        }
      );
      
      console.log(`✅ Added ${newStudents.length} students to cohort ${cohortId}`);
      
      // BIDIRECTIONAL SYNC: Update each student's cohortId field
      for (const studentId of newStudents) {
        try {
          const updateResult = await Student.findOneAndUpdate(
            { studentId: studentId, tenantId: session.tenantId },
            { 
              $set: { 
                cohortId: cohortId,
                batch: cohortId // Keep batch for backward compatibility
              },
              $addToSet: {
                cohorts: cohortId,
                enrolledCohorts: cohortId
              }
            },
            { new: true }
          );
          
          if (updateResult) {
            console.log(`✅ Updated student ${studentId} cohortId field to ${cohortId}`);
          } else {
            console.warn(`⚠️ Student ${studentId} not found in students collection`);
          }
        } catch (err) {
          console.error(`❌ Failed to update student ${studentId}:`, err);
        }
      }
      
      return NextResponse.json({ 
        message: `Successfully added ${newStudents.length} student(s) to cohort`,
        cohortId,
        addedStudents: newStudents,
        totalEnrolled: currentEnrolled.length
      }, { status: 200 });
      
    } else if (action === 'remove') {
      // Remove students from cohort
      const studentsToRemove = studentIds.filter(sid => currentEnrolled.includes(sid));
      
      if (studentsToRemove.length === 0) {
        return NextResponse.json({ message: 'No students to remove', cohort }, { status: 200 });
      }
      
      currentEnrolled = currentEnrolled.filter((sid: string) => !studentIds.includes(sid));
      
      // Update cohort
      await Cohort.updateOne(
        { id: cohortId, tenantId: session.tenantId },
        { 
          $set: { 
            enrolledStudents: currentEnrolled,
            members: currentEnrolled, // Update both fields for compatibility
            currentStudents: currentEnrolled,
            currentStudentsCount: currentEnrolled.length
          } 
        }
      );
      
      console.log(`✅ Removed ${studentsToRemove.length} students from cohort ${cohortId}`);
      
      // BIDIRECTIONAL SYNC: Handle cohortId field clearing for removed students
      for (const studentId of studentsToRemove) {
        try {
          // First, get the student to check their other cohorts
          const student = await Student.findOne({ 
            studentId: studentId, 
            tenantId: session.tenantId 
          }).select('cohorts enrolledCohorts cohortId');
          
          if (student) {
            const remainingCohorts = (student.cohorts || []).filter((id: string) => id !== cohortId);
            const updateData: any = {
              $set: { batch: '' }, // Clear batch for backward compatibility
              $pull: {
                cohorts: cohortId,
                enrolledCohorts: cohortId
              }
            };
            
            // Handle cohortId field
            if (student.cohortId === cohortId) {
              if (remainingCohorts.length > 0) {
                updateData.$set.cohortId = remainingCohorts[0]; // Set to first remaining cohort
              } else {
                updateData.$unset = { cohortId: '' }; // Clear if no other cohorts
              }
            }
            
            const updateResult = await Student.findOneAndUpdate(
              { studentId: studentId, tenantId: session.tenantId },
              updateData,
              { new: true }
            );
            
            if (updateResult) {
              console.log(`✅ Updated student ${studentId} cohort membership`);
            }
          } else {
            console.warn(`⚠️ Student ${studentId} not found in students collection`);
          }
        } catch (err) {
          console.error(`❌ Failed to update student ${studentId}:`, err);
        }
      }
      
      return NextResponse.json({ 
        message: `Successfully removed ${studentsToRemove.length} student(s) from cohort`,
        cohortId,
        removedStudents: studentsToRemove,
        totalEnrolled: currentEnrolled.length
      }, { status: 200 });
    }
    
      } catch (error: any) {
        console.error('PUT /api/cohorts - Error:', error);
        return NextResponse.json({ error: 'Failed to update cohort enrollment' }, { status: 500 });
      }
    }
  );
}

// PATCH - Sync existing cohort enrollments to student records
// This is a utility endpoint to fix existing data where students are in cohorts
// but their batch field wasn't updated
export async function PATCH(req: NextRequest) {
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
    await dbConnect("uniqbrio");
    
    console.log('PATCH /api/cohorts - Starting bidirectional sync...');
    
    // Get all cohorts for this tenant
    const cohorts = await Cohort.find({ tenantId: session.tenantId }).lean();
    
    let syncCount = 0;
    let errorCount = 0;
    
    for (const cohort of cohorts) {
      const cohortId = cohort.id || cohort.cohortId || String(cohort._id);
      const enrolledStudents = Array.isArray(cohort.enrolledStudents) 
        ? cohort.enrolledStudents 
        : Array.isArray(cohort.members) 
          ? cohort.members 
          : Array.isArray((cohort as any).currentStudents)
            ? (cohort as any).currentStudents
            : [];
      
      if (enrolledStudents.length === 0) continue;
      
      console.log(`🔄 Syncing cohort ${cohortId} with ${enrolledStudents.length} students...`);
      
      for (const studentId of enrolledStudents) {
        try {
          const student = await Student.findOne({ studentId: studentId, tenantId: session.tenantId });
          
          if (!student) {
            console.warn(`⚠️ Student ${studentId} not found (enrolled in cohort ${cohortId})`);
            errorCount++;
            continue;
          }
          
          // Only update if batch is different
          if (student.batch !== cohortId) {
            await Student.updateOne(
              { studentId: studentId, tenantId: session.tenantId },
              { $set: { batch: cohortId } }
            );
            console.log(`✅ Updated student ${studentId} batch: "${student.batch}" → "${cohortId}"`);
            syncCount++;
          }
        } catch (err) {
          console.error(`❌ Failed to sync student ${studentId}:`, err);
          errorCount++;
        }
      }
    }
    
    console.log(`✅ Sync complete: ${syncCount} students updated, ${errorCount} errors`);
    
    return NextResponse.json({ 
      message: 'Bidirectional sync complete',
      studentsUpdated: syncCount,
      errors: errorCount
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('PATCH /api/cohorts - Error:', error);
    return NextResponse.json({ error: 'Failed to sync cohort enrollments' }, { status: 500 });
  }
    }
  );
}