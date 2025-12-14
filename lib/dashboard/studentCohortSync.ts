import { dbConnect, connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to get mongoose connection
async function getMongooseConnection() {
  await connectDB();
  const mongoose = (await import('mongoose')).default;
  return mongoose;
}

/**
 * Helper functions for maintaining bidirectional sync between students and cohorts
 */

interface StudentRecord {
  id?: string;
  studentId?: string;
  name?: string;
  cohorts?: string[];
  enrolledCohorts?: string[];
  _id?: ObjectId;
}

interface CohortUpdateResult {
  success: boolean;
  error?: string;
  updatedCount?: number;
}

/**
 * Helper to create student query filter
 */
function createStudentFilter(studentId: string) {
  const filters: any[] = [
    { id: studentId },
    { studentId: studentId }
  ];
  
  // Only add ObjectId filter if the string is a valid ObjectId
  if (ObjectId.isValid(studentId)) {
    filters.push({ _id: new ObjectId(studentId) });
  }
  
  return { $or: filters };
}

/**
 * Add student to cohort's currentStudents array and update student's cohorts list
 */
export async function addStudentToCohort(
  cohortId: string, 
  studentId: string,
  tenantId?: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log(`🔄 Adding student ${studentId} to cohort ${cohortId} (tenant: ${tenantId || 'auto'})`);

    // Get student details
    const studentFilter = createStudentFilter(studentId);
    if (tenantId) {
      studentFilter.$and = [{ tenantId: tenantId }];
    }
    const student = await db.collection('students').findOne(
      studentFilter,
      { projection: { studentId: 1, name: 1, firstName: 1, lastName: 1, tenantId: 1 } }
    );
    
    if (!student) {
      return { success: false, error: `Student ${studentId} not found` };
    }

    const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || studentId;
    const effectiveTenantId = tenantId || student.tenantId;

    // Update cohort with tenant filtering
    const cohortFilter: any = { cohortId: cohortId };
    if (effectiveTenantId) {
      cohortFilter.tenantId = effectiveTenantId;
    }

    // Add student to cohort's arrays
    const cohortUpdate = await db.collection('cohorts').updateOne(
      cohortFilter,
      { 
        $addToSet: { 
          currentStudents: studentId,
          members: { id: studentId, name: studentName }
        },
        $set: { updatedAt: new Date() }
      }
    );

    // Update student record
    const studentUpdateFilter: any = createStudentFilter(studentId);
    if (effectiveTenantId) {
      studentUpdateFilter.$and = [{ tenantId: effectiveTenantId }];
    }
    const studentUpdate = await db.collection('students').updateOne(
      studentUpdateFilter,
      { 
        $set: {
          cohortId: cohortId,
          updatedAt: new Date()
        },
        $addToSet: { 
          cohorts: cohortId,
          enrolledCohorts: cohortId 
        }
      }
    );
    
    console.log(`✅ Cohort updated: ${cohortUpdate.modifiedCount}, Student updated: ${studentUpdate.modifiedCount}`);

    return {
      success: true,
      updatedCount: cohortUpdate.modifiedCount + studentUpdate.modifiedCount
    };

  } catch (error) {
    console.error('Error in addStudentToCohort:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove student from cohort's currentStudents array and update student's cohorts list
 */
export async function removeStudentFromCohort(
  cohortId: string, 
  studentId: string,
  tenantId?: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log(`🔄 Removing student ${studentId} from cohort ${cohortId} (tenant: ${tenantId || 'auto'})`);

    // Get student details
    const studentFilter = createStudentFilter(studentId);
    if (tenantId) {
      studentFilter.$and = [{ tenantId: tenantId }];
    }
    const student = await db.collection('students').findOne(
      studentFilter,
      { projection: { cohorts: 1, enrolledCohorts: 1, cohortId: 1, tenantId: 1 } }
    );
    
    if (!student) {
      return { success: false, error: `Student ${studentId} not found` };
    }
    
    const effectiveTenantId = tenantId || student.tenantId;

    // Update cohort
    const cohortFilter: any = { cohortId: cohortId };
    if (effectiveTenantId) {
      cohortFilter.tenantId = effectiveTenantId;
    }
    const cohortUpdate = await db.collection('cohorts').updateOne(
      cohortFilter,
      { 
        $pull: { 
          currentStudents: studentId,
          members: { id: studentId },
          waitlist: studentId
        }
      } as any
    );

    // Update student - remove cohort from their cohorts list and handle cohortId field
    
    const updateData: any = {
      $pull: { 
        cohorts: cohortId,
        enrolledCohorts: cohortId
      }
    };
    
    // If this was their primary cohort, update cohortId accordingly
    if (student.cohortId === cohortId) {
      const remainingCohorts = (student.cohorts || []).filter((id: string) => id !== cohortId);
      if (remainingCohorts.length > 0) {
        updateData.$set = { cohortId: remainingCohorts[0] }; // Set to first remaining cohort
      } else {
        updateData.$unset = { cohortId: '' }; // Clear if no other cohorts
      }
    }
    
    const studentUpdateFilter = createStudentFilter(studentId);
    if (effectiveTenantId) {
      studentUpdateFilter.$and = [{ tenantId: effectiveTenantId }];
    }
    const studentUpdate = await db.collection('students').updateOne(
      studentUpdateFilter,
      updateData
    );

    return {
      success: true,
      updatedCount: cohortUpdate.modifiedCount + studentUpdate.modifiedCount
    };

  } catch (error) {
    console.error('Error in removeStudentFromCohort:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync all students in a cohort's currentStudents array with their individual records
 */
export async function syncCohortStudents(
  cohortId: string, 
  studentIds: string[],
  tenantId?: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    // Get current students that have this cohort in their records
    const currentlyEnrolled = await db.collection('students').find({
      $or: [
        { cohorts: cohortId },
        { enrolledCohorts: cohortId }
      ]
    }, { 
      projection: { id: 1, studentId: 1, _id: 1 } 
    }).toArray();

    const currentlyEnrolledIds = currentlyEnrolled.map((s: any) => 
      s.id || s.studentId || s._id?.toString()
    ).filter(Boolean);

    // Students to add (in cohort but not in their records)
    const toAdd = studentIds.filter(id => !currentlyEnrolledIds.includes(id));
    
    // Students to remove (in their records but not in cohort)
    const toRemove = currentlyEnrolledIds.filter(id => !studentIds.includes(id));

    let totalUpdated = 0;

    // Add students to their records
    if (toAdd.length > 0) {
      console.log(`📝 Adding ${toAdd.length} students to cohort ${cohortId}:`, toAdd);
      const addFilters = toAdd.map(id => createStudentFilter(id).$or).flat();
      const addQuery: any = { $or: addFilters as any };
      if (tenantId) {
        addQuery.tenantId = tenantId;
      }
      const addResult = await db.collection('students').updateMany(
        addQuery,
        { 
          $set: {
            cohortId: cohortId // Set primary cohort ID
          },
          $addToSet: { 
            cohorts: cohortId,
            enrolledCohorts: cohortId 
          }
        }
      );
      console.log(`✅ Added ${toAdd.length} students to cohort, updated ${addResult.modifiedCount} student records`);
      totalUpdated += addResult.modifiedCount;
    }

    // Remove students from their records
    if (toRemove.length > 0) {
      console.log(`📝 Removing ${toRemove.length} students from cohort ${cohortId}:`, toRemove);
      const removeFilters = toRemove.map(id => createStudentFilter(id).$or).flat();
      
      // First, check if these students have other cohorts and update cohortId accordingly
      const removeQuery: any = { $or: removeFilters as any };
      if (tenantId) {
        removeQuery.tenantId = tenantId;
      }
      const studentsToRemove = await db.collection('students').find(
        removeQuery,
        { projection: { studentId: 1, cohorts: 1, enrolledCohorts: 1, cohortId: 1 } }
      ).toArray();
      
      for (const student of studentsToRemove) {
        const remainingCohorts = (student.cohorts || []).filter((id: string) => id !== cohortId);
        const updateData: any = {
          $pull: { 
            cohorts: cohortId as any,
            enrolledCohorts: cohortId as any
          }
        };
        
        // If this was their primary cohort, update cohortId to another cohort or clear it
        if (student.cohortId === cohortId) {
          if (remainingCohorts.length > 0) {
            updateData.$set = { cohortId: remainingCohorts[0] }; // Set to first remaining cohort
          } else {
            updateData.$unset = { cohortId: '' }; // Clear if no other cohorts
          }
        }
        
        await db.collection('students').updateOne(
          { _id: student._id },
          updateData
        );
      }
      
      console.log(`✅ Removed ${toRemove.length} students from cohort, updated ${studentsToRemove.length} student records`);
      totalUpdated += studentsToRemove.length;
    }

    return {
      success: true,
      updatedCount: totalUpdated
    };

  } catch (error) {
    console.error('Error in syncCohortStudents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get student record with cohort information
 */
export async function getStudentWithCohorts(studentId: string, tenantId?: string): Promise<StudentRecord | null> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return null;
    }

    const filter = createStudentFilter(studentId);
    if (tenantId) {
      filter.$and = [{ tenantId: tenantId }];
    }
    const student = await db.collection('students').findOne(filter);

    return student as StudentRecord;

  } catch (error) {
    console.error('Error in getStudentWithCohorts:', error);
    return null;
  }
}

/**
 * Calculate enrollment data from cohort information (replaces Enrollment model)
 */
export interface EnrollmentSummary {
  courseId: string;
  courseName: string;
  totalEnrolled: number;
  totalCapacity: number;
  enrollmentRate: number;
  activeCohorts: number;
  cohorts: Array<{
    cohortId: string;
    enrolled: number;
    capacity: number;
    instructor: string;
    status: string;
  }>;
}

export async function getCourseEnrollments(courseId: string): Promise<EnrollmentSummary | null> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return null;
    }

    // Get course details
    const courseFilter: any[] = [{ courseId }];
    if (ObjectId.isValid(courseId)) {
      courseFilter.push({ _id: new ObjectId(courseId) });
    }
    const course = await db.collection('courses').findOne({ 
      $or: courseFilter
    });

    if (!course) {
      return null;
    }

    // Get all cohorts for this course
    const cohorts = await db.collection('cohorts').find({
      courseId: courseId,
      isDeleted: { $ne: true }
    }).toArray();

    let totalEnrolled = 0;
    let totalCapacity = 0;
    const cohortDetails = [];

    for (const cohort of cohorts) {
      const enrolled = cohort.currentStudents ? cohort.currentStudents.length : 0;
      const capacity = cohort.maxStudents || 0;
      
      totalEnrolled += enrolled;
      totalCapacity += capacity;

      cohortDetails.push({
        cohortId: cohort.cohortId,
        enrolled,
        capacity,
        instructor: cohort.instructor || '',
        status: cohort.status || 'Active'
      });
    }

    return {
      courseId,
      courseName: course.title || course.name || '',
      totalEnrolled,
      totalCapacity,
      enrollmentRate: totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0,
      activeCohorts: cohorts.filter(c => c.status === 'Active').length,
      cohorts: cohortDetails
    };

  } catch (error) {
    console.error('Error in getCourseEnrollments:', error);
    return null;
  }
}

/**
 * Get all enrollments across all courses (replaces complex Enrollment queries)
 */
export async function getAllEnrollments(): Promise<EnrollmentSummary[]> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return [];
    }

    // Get unique course IDs from cohorts
    const courseIds = await db.collection('cohorts').distinct('courseId', {
      isDeleted: { $ne: true }
    });

    const enrollments: EnrollmentSummary[] = [];
    
    for (const courseId of courseIds) {
      const enrollment = await getCourseEnrollments(courseId);
      if (enrollment) {
        enrollments.push(enrollment);
      }
    }

    return enrollments;

  } catch (error) {
    console.error('Error in getAllEnrollments:', error);
    return [];
  }
}

/**
 * Auto-enrollment function: When a student selects a course and cohort,
 * this ensures bidirectional sync between student and cohort records
 */
/**
 * Sync payment record when student data is updated
 */
export async function syncStudentPaymentRecord(
  studentId: string,
  studentData: any,
  tenantId?: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log(`💳 Syncing payment record for student ${studentId} (tenant: ${tenantId || 'auto'})`);

    // Find existing payment record
    const paymentFilter: any = { studentId: studentId };
    if (tenantId) {
      paymentFilter.tenantId = tenantId;
    }
    
    const payment = await db.collection('payments').findOne(paymentFilter);
    
    if (payment) {
      // Update payment record with new student data
      const updateData: any = {};
      
      // Update student name if changed
      if (studentData.name && studentData.name !== payment.studentName) {
        updateData.studentName = studentData.name;
      }
      
      // Update enrolled course if changed
      if (studentData.enrolledCourse && studentData.enrolledCourse !== payment.enrolledCourse) {
        updateData.enrolledCourse = studentData.enrolledCourse;
      }
      
      // Update enrolled course name if changed
      if (studentData.enrolledCourseName && studentData.enrolledCourseName !== payment.enrolledCourseName) {
        updateData.enrolledCourseName = studentData.enrolledCourseName;
      }
      
      // Update cohort if changed
      if (studentData.cohortId && studentData.cohortId !== payment.cohortId) {
        updateData.cohortId = studentData.cohortId;
        
        // Try to get cohort name
        const cohort = await db.collection('cohorts').findOne(
          { cohortId: studentData.cohortId, ...(tenantId && { tenantId }) }
        );
        if (cohort) {
          updateData.cohortName = cohort.name || cohort.cohortId;
        }
      }
      
      // Update student category if changed
      if (studentData.category && studentData.category !== payment.studentCategory) {
        updateData.studentCategory = studentData.category;
      }
      
      // Update course type if changed
      if (studentData.courseType && studentData.courseType !== payment.courseType) {
        updateData.courseType = studentData.courseType;
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        
        const result = await db.collection('payments').updateOne(
          paymentFilter,
          { $set: updateData }
        );
        
        console.log(`✅ Payment record updated for student ${studentId}:`, Object.keys(updateData));
        
        return {
          success: true,
          updatedCount: result.modifiedCount
        };
      } else {
        console.log(`ℹ️ No payment updates needed for student ${studentId}`);
        return { success: true, updatedCount: 0 };
      }
    } else {
      console.log(`ℹ️ No payment record found for student ${studentId}`);
      return { success: true, updatedCount: 0 };
    }

  } catch (error) {
    console.error('Error in syncStudentPaymentRecord:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function enrollStudentInCohort(
  studentId: string, 
  cohortId: string,
  tenantId?: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log(`🎓 Enrolling student ${studentId} in cohort ${cohortId}...`);

    // 1. Get student details for the member object
    const student = await db.collection('students').findOne(
      { studentId: studentId },
      { projection: { studentId: 1, name: 1, firstName: 1, lastName: 1 } }
    );

    const studentName = student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || studentId;

    // 2. Update student record with cohort information
    const effectiveTenantId = tenantId || student?.tenantId;
    const studentUpdateFilter = createStudentFilter(studentId);
    if (effectiveTenantId) {
      studentUpdateFilter.$and = [{ tenantId: effectiveTenantId }];
    }
    const studentUpdate = await db.collection('students').updateOne(
      studentUpdateFilter,
      {
        $set: { 
          cohortId: cohortId,
          updatedAt: new Date()
        },
        $addToSet: { 
          cohorts: cohortId,
          enrolledCohorts: cohortId 
        }
      }
    );

    console.log(`  Student update result: matchedCount=${studentUpdate.matchedCount}, modifiedCount=${studentUpdate.modifiedCount}`);

    // 3. Update cohort's currentStudents array and members array
    const cohortFilter = effectiveTenantId 
      ? { cohortId: cohortId, tenantId: effectiveTenantId }
      : { cohortId: cohortId };
    
    // First, remove any existing member with this studentId to avoid duplicates
    await db.collection('cohorts').updateOne(
      cohortFilter,
      { 
        $pull: { members: { id: studentId } }
      }
    );

    // Then add the student with updated information
    const cohortUpdate = await db.collection('cohorts').updateOne(
      cohortFilter,
      { 
        $addToSet: { 
          currentStudents: studentId
        },
        $push: {
          members: { id: studentId, name: studentName }
        },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`  Cohort update result: matchedCount=${cohortUpdate.matchedCount}, modifiedCount=${cohortUpdate.modifiedCount}`);

    if (studentUpdate.matchedCount === 0) {
      return { success: false, error: `Student ${studentId} not found` };
    }

    if (cohortUpdate.matchedCount === 0) {
      // Try fallback query with 'id' field in case cohortId field is not set
      console.log(`  Cohort not found by cohortId, trying fallback with id field...`);
      
      const fallbackCohortFilter = effectiveTenantId 
        ? { id: cohortId, tenantId: effectiveTenantId }
        : { id: cohortId };
      
      // Remove existing member first
      await db.collection('cohorts').updateOne(
        fallbackCohortFilter,
        { 
          $pull: { members: { id: studentId } }
        }
      );
      
      // Then add with updated information
      const cohortUpdateFallback = await db.collection('cohorts').updateOne(
        fallbackCohortFilter,
        { 
          $addToSet: { 
            currentStudents: studentId
          },
          $push: {
            members: { id: studentId, name: studentName }
          },
          $set: { updatedAt: new Date() }
        }
      );
      console.log(`  Fallback cohort update result: matchedCount=${cohortUpdateFallback.matchedCount}, modifiedCount=${cohortUpdateFallback.modifiedCount}`);
      
      if (cohortUpdateFallback.matchedCount === 0) {
        return { success: false, error: `Cohort ${cohortId} not found (tried both cohortId and id fields)` };
      }
      
      return {
        success: true,
        updatedCount: studentUpdate.modifiedCount + cohortUpdateFallback.modifiedCount
      };
    }

    return {
      success: true,
      updatedCount: studentUpdate.modifiedCount + cohortUpdate.modifiedCount
    };

  } catch (error) {
    console.error('Error in enrollStudentInCohort:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync cohort members from students collection to cohort's currentStudents array
 * This fetches all students who have enrolled in a cohort and updates the cohort's member list
 */
export async function syncCohortMembersFromStudents(cohortId: string): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log(`🔄 Syncing members for cohort ${cohortId} from students collection...`);

    // Find all students who have this cohort in their enrollment data
    const enrolledStudents = await db.collection('students').find({
      $or: [
        { cohortId: cohortId },           // Students with direct cohortId field
        { cohorts: cohortId },            // Students with cohorts array
        { enrolledCohorts: cohortId }     // Students with enrolledCohorts array
      ],
      isDeleted: { $ne: true }           // Only active students
    }, {
      projection: { studentId: 1, name: 1, cohortId: 1, cohorts: 1, enrolledCohorts: 1 }
    }).toArray();

    console.log(`👥 Found ${enrolledStudents.length} students enrolled in cohort ${cohortId}`);

    // Extract student IDs
    const studentIds = enrolledStudents.map(s => s.studentId).filter(Boolean);
    
    if (studentIds.length === 0) {
      console.log(`ℹ️ No students found for cohort ${cohortId}`);
      return { success: true, updatedCount: 0 };
    }

    console.log(`📝 Student IDs to sync: ${studentIds.join(', ')}`);

    // Update the cohort's currentStudents array
    const cohortUpdate = await db.collection('cohorts').updateOne(
      { cohortId: cohortId },
      { 
        $set: { 
          currentStudents: studentIds,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated cohort ${cohortId} with ${studentIds.length} students`);

    return {
      success: true,
      updatedCount: cohortUpdate.modifiedCount
    };

  } catch (error) {
    console.error('Error in syncCohortMembersFromStudents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync all cohorts by fetching enrolled students from the students collection
 */
export async function syncAllCohortMembers(): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log('🔄 Starting sync for all cohorts...');

    // Get all active cohorts
    const cohorts = await db.collection('cohorts').find({
      isDeleted: { $ne: true }
    }, {
      projection: { cohortId: 1 }
    }).toArray();

    console.log(`📊 Found ${cohorts.length} active cohorts to sync`);

    let totalUpdated = 0;

    for (const cohort of cohorts) {
      const result = await syncCohortMembersFromStudents(cohort.cohortId);
      if (result.success && result.updatedCount) {
        totalUpdated += result.updatedCount;
      }
    }

    console.log(`🎉 Sync completed. Updated ${totalUpdated} cohorts`);

    return {
      success: true,
      updatedCount: totalUpdated
    };

  } catch (error) {
    console.error('Error in syncAllCohortMembers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get student enrollments (replaces student enrollment queries)
 */
export async function getStudentEnrollments(studentId: string) {
  try {
    const student = await getStudentWithCohorts(studentId);
    if (!student || !student.cohorts) {
      return [];
    }

    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return [];
    }

    // Get cohort details for student's enrolled cohorts
    const cohorts = await db.collection('cohorts').find({
      cohortId: { $in: student.cohorts },
      isDeleted: { $ne: true }
    }).toArray();

    const enrollments = [];
    
    for (const cohort of cohorts) {
      // Get course details
      const courseFilter: any[] = [{ courseId: cohort.courseId }];
      if (ObjectId.isValid(cohort.courseId)) {
        courseFilter.push({ _id: new ObjectId(cohort.courseId) });
      }
      const course = await db.collection('courses').findOne({ 
        $or: courseFilter
      });

      enrollments.push({
        cohortId: cohort.cohortId,
        courseId: cohort.courseId,
        courseName: course?.title || course?.name || 'Unknown Course',
        instructor: cohort.instructor || '',
        status: cohort.status || 'Active',
        enrolledAt: cohort.createdAt || new Date()
      });
    }

    return enrollments;

  } catch (error) {
    console.error('Error in getStudentEnrollments:', error);
    return [];
  }
}
