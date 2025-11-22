import { dbConnect } from '@/lib/mongodb';
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
  studentId: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    // Update cohort - add student to currentStudents if not already present
    const cohortUpdate = await db.collection('cohorts').updateOne(
      { 
        cohortId: cohortId,
        currentStudents: { $nin: [studentId] }
      },
      { 
        $addToSet: { currentStudents: studentId }
      }
    );

    // Update student in the correct students collection - add cohort to their cohorts list
    const studentUpdate = await db.collection('students').updateOne(
      createStudentFilter(studentId),
      { 
        $addToSet: { 
          cohorts: cohortId,
          enrolledCohorts: cohortId 
        }
      },
      { upsert: false } // Don't create student if they don't exist
    );

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
  studentId: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    // Update cohort - remove student from currentStudents
    const cohortUpdate = await db.collection('cohorts').updateOne(
      { cohortId: cohortId },
      { 
        $pull: { 
          currentStudents: studentId,
          waitlist: studentId
        }
      } as any
    );

    // Update student - remove cohort from their cohorts list
    const studentUpdate = await db.collection('students').updateOne(
      createStudentFilter(studentId),
      { 
        $pull: { 
          cohorts: cohortId,
          enrolledCohorts: cohortId
        }
      } as any
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
  studentIds: string[]
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
      const addFilters = toAdd.map(id => createStudentFilter(id).$or).flat();
      const addResult = await db.collection('students').updateMany(
        { $or: addFilters as any },
        { 
          $addToSet: { 
            cohorts: cohortId,
            enrolledCohorts: cohortId 
          }
        }
      );
      totalUpdated += addResult.modifiedCount;
    }

    // Remove students from their records
    if (toRemove.length > 0) {
      const removeFilters = toRemove.map(id => createStudentFilter(id).$or).flat();
      const removeResult = await db.collection('students').updateMany(
        { $or: removeFilters as any },
        { 
          $pull: { 
            cohorts: cohortId as any,
            enrolledCohorts: cohortId as any
          }
        }
      );
      totalUpdated += removeResult.modifiedCount;
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
export async function getStudentWithCohorts(studentId: string): Promise<StudentRecord | null> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return null;
    }

    const student = await db.collection('students').findOne(
      createStudentFilter(studentId)
    );

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
export async function enrollStudentInCohort(
  studentId: string, 
  cohortId: string
): Promise<CohortUpdateResult> {
  try {
    const mongoose = await getMongooseConnection();
    const db = mongoose.connection.db;
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    console.log(`🎓 Enrolling student ${studentId} in cohort ${cohortId}...`);

    // 1. Update student record with cohort information
    const studentUpdate = await db.collection('students').updateOne(
      { studentId: studentId },
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

    // 2. Update cohort's currentStudents array
    const cohortUpdate = await db.collection('cohorts').updateOne(
      { cohortId: cohortId },
      { 
        $addToSet: { currentStudents: studentId },
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
      const cohortUpdateFallback = await db.collection('cohorts').updateOne(
        { id: cohortId },
        { 
          $addToSet: { currentStudents: studentId },
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
