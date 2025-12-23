/**
 * Cascade Updates Library
 * 
 * Handles cascading updates across related collections when entities are modified.
 * For example, when an instructor's name changes, this ensures all references
 * to that instructor are updated across the system.
 */

import mongoose from "mongoose"
import InstructorModel from "@/models/dashboard/staff/Instructor"
import InstructorAttendanceModel from "@/models/dashboard/staff/InstructorAttendance"
import InstructorAttendanceDraftModel from "@/models/dashboard/staff/InstructorAttendanceDraft"
import InstructorDraftModel from "@/models/dashboard/staff/InstructorDraft"
import CourseModel from "@/models/dashboard/staff/Course"
import CohortModel from "@/models/dashboard/staff/Cohort"

// Import Student models
let StudentModel: any
let StudentAttendanceModel: any
let StudentAttendanceDraftModel: any

try {
  StudentModel = mongoose.models.Student || require("@/models/dashboard/student/Student").default
} catch {
  StudentModel = null
}

try {
  StudentAttendanceModel = mongoose.models.StudentAttendance || require("@/models/dashboard/student/StudentAttendance").default
} catch {
  StudentAttendanceModel = null
}

try {
  StudentAttendanceDraftModel = mongoose.models.StudentAttendanceDraft || require("@/models/dashboard/student/StudentAttendanceDraft").default
} catch {
  StudentAttendanceDraftModel = null
}

// Import NonInstructor models
let NonInstructorModel: any
let NonInstructorAttendanceModel: any
let NonInstructorAttendanceDraftModel: any
let NonInstructorDraftModel: any

try {
  NonInstructorModel = mongoose.models.NonInstructor || require("@/models/dashboard/staff/NonInstructor").default
} catch {
  NonInstructorModel = null
}

try {
  NonInstructorAttendanceModel = mongoose.models.NonInstructorAttendance || require("@/models/dashboard/staff/NonInstructorAttendance").default
} catch {
  NonInstructorAttendanceModel = null
}

try {
  NonInstructorAttendanceDraftModel = mongoose.models.NonInstructorAttendanceDraft || require("@/models/dashboard/staff/NonInstructorAttendanceDraft").default
} catch {
  NonInstructorAttendanceDraftModel = null
}

try {
  NonInstructorDraftModel = mongoose.models.NonInstructorDraft || require("@/models/dashboard/staff/NonInstructorDraft").default
} catch {
  NonInstructorDraftModel = null
}

// Import Schedule and Enrollment models
let ScheduleModel: any
let EnrollmentModel: any
let PaymentModel: any
let PaymentRecordModel: any
let PaymentTransactionModel: any
let MonthlySubscriptionModel: any

try {
  ScheduleModel = mongoose.models.Schedule || require("@/models/dashboard/Schedule").default
} catch {
  ScheduleModel = null
}

try {
  EnrollmentModel = mongoose.models.Enrollment || require("@/models/dashboard/Enrollment").default
} catch {
  EnrollmentModel = null
}

try {
  PaymentModel = mongoose.models.Payment || require("@/models/dashboard/payments/Payment").default
} catch {
  PaymentModel = null
}

try {
  PaymentRecordModel = mongoose.models.PaymentRecord || require("@/models/dashboard/payments/PaymentRecord").default
} catch {
  PaymentRecordModel = null
}

try {
  PaymentTransactionModel = mongoose.models.PaymentTransaction || require("@/models/dashboard/payments/PaymentTransaction").default
} catch {
  PaymentTransactionModel = null
}

try {
  MonthlySubscriptionModel = mongoose.models.MonthlySubscription || require("@/models/dashboard/payments/MonthlySubscription").default
} catch {
  MonthlySubscriptionModel = null
}

interface CascadeUpdateResult {
  success: boolean
  updatedCollections: {
    collection: string
    count: number
  }[]
  errors?: string[]
}

/**
 * Updates instructor name across all related collections
 * @param instructorId - The ID of the instructor being updated
 * @param oldName - The previous full name of the instructor
 * @param newName - The new full name of the instructor
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeInstructorNameUpdate(
  instructorId: string,
  oldName: string,
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // 1. Update InstructorAttendance records
    try {
      const attendanceResult = await InstructorAttendanceModel.updateMany(
        { instructorId, tenantId },
        { $set: { instructorName: newName } }
      )
      updatedCollections.push({
        collection: "InstructorAttendance",
        count: attendanceResult.modifiedCount || 0,
      })
    } catch (err: any) {
      errors.push(`InstructorAttendance: ${err.message}`)
    }

    // 2. Update InstructorAttendanceDraft records
    try {
      const draftAttendanceResult = await InstructorAttendanceDraftModel.updateMany(
        { instructorId, tenantId },
        { $set: { instructorName: newName } }
      )
      updatedCollections.push({
        collection: "InstructorAttendanceDraft",
        count: draftAttendanceResult.modifiedCount || 0,
      })
    } catch (err: any) {
      errors.push(`InstructorAttendanceDraft: ${err.message}`)
    }

    // 3. Update InstructorDraft records
    try {
      const instructorDraftResult = await InstructorDraftModel.updateMany(
        { tenantId, instructorName: oldName },
        { $set: { instructorName: newName } }
      )
      updatedCollections.push({
        collection: "InstructorDraft",
        count: instructorDraftResult.modifiedCount || 0,
      })
    } catch (err: any) {
      errors.push(`InstructorDraft: ${err.message}`)
    }

    // 4. Update Enrollment records
    if (EnrollmentModel) {
      try {
        const enrollmentResult = await EnrollmentModel.updateMany(
          { instructorId, tenantId },
          { $set: { instructorName: newName } }
        )
        updatedCollections.push({
          collection: "Enrollment",
          count: enrollmentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Enrollment: ${err.message}`)
      }
    }

    // 5. Update Schedule records
    if (ScheduleModel) {
      try {
        const scheduleResult = await ScheduleModel.updateMany(
          { instructor: instructorId, tenantId },
          { $set: { instructorName: newName } }
        )
        updatedCollections.push({
          collection: "Schedule",
          count: scheduleResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Schedule: ${err.message}`)
      }
    }

    // 6. Update Course records (instructor field contains full name)
    try {
      const courseResult = await CourseModel.updateMany(
        { instructor: oldName, tenantId },
        { $set: { instructor: newName } }
      )
      updatedCollections.push({
        collection: "Course",
        count: courseResult.modifiedCount || 0,
      })
    } catch (err: any) {
      errors.push(`Course: ${err.message}`)
    }

    // 7. Update Cohort records (instructor field contains full name)
    try {
      const cohortResult = await CohortModel.updateMany(
        { instructor: oldName, tenantId },
        { $set: { instructor: newName } }
      )
      updatedCollections.push({
        collection: "Cohort",
        count: cohortResult.modifiedCount || 0,
      })
    } catch (err: any) {
      errors.push(`Cohort: ${err.message}`)
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Builds the full name from instructor parts
 */
export function buildInstructorFullName(
  firstName: string,
  middleName?: string,
  lastName?: string
): string {
  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
}

/**
 * Updates student name across all related collections
 * @param studentId - The ID of the student being updated
 * @param oldName - The previous full name of the student
 * @param newName - The new full name of the student
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeStudentNameUpdate(
  studentId: string,
  oldName: string,
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // 1. Update StudentAttendance records
    if (StudentAttendanceModel) {
      try {
        const attendanceResult = await StudentAttendanceModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "StudentAttendance",
          count: attendanceResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`StudentAttendance: ${err.message}`)
      }
    }

    // 2. Update StudentAttendanceDraft records
    if (StudentAttendanceDraftModel) {
      try {
        const draftAttendanceResult = await StudentAttendanceDraftModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "StudentAttendanceDraft",
          count: draftAttendanceResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`StudentAttendanceDraft: ${err.message}`)
      }
    }

    // 3. Update Enrollment records
    if (EnrollmentModel) {
      try {
        const enrollmentResult = await EnrollmentModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "Enrollment",
          count: enrollmentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Enrollment: ${err.message}`)
      }
    }

    // 4. Update Payment records
    if (PaymentModel) {
      try {
        const paymentResult = await PaymentModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "Payment",
          count: paymentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Payment: ${err.message}`)
      }
    }

    // 5. Update PaymentRecord records
    if (PaymentRecordModel) {
      try {
        const paymentRecordResult = await PaymentRecordModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "PaymentRecord",
          count: paymentRecordResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`PaymentRecord: ${err.message}`)
      }
    }

    // 6. Update PaymentTransaction records
    if (PaymentTransactionModel) {
      try {
        const paymentTransactionResult = await PaymentTransactionModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "PaymentTransaction",
          count: paymentTransactionResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`PaymentTransaction: ${err.message}`)
      }
    }

    // 7. Update MonthlySubscription records
    if (MonthlySubscriptionModel) {
      try {
        const subscriptionResult = await MonthlySubscriptionModel.updateMany(
          { studentId, tenantId },
          { $set: { studentName: newName } }
        )
        updatedCollections.push({
          collection: "MonthlySubscription",
          count: subscriptionResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`MonthlySubscription: ${err.message}`)
      }
    }

    // 8. Update referringStudentName in other Student records
    if (StudentModel) {
      try {
        const referralResult = await StudentModel.updateMany(
          { referringStudentId: studentId, tenantId },
          { $set: { referringStudentName: newName } }
        )
        updatedCollections.push({
          collection: "Student (Referrals)",
          count: referralResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Student (Referrals): ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Builds the full name from student parts
 */
export function buildStudentFullName(
  firstName?: string,
  middleName?: string,
  lastName?: string
): string {
  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
}

/**
 * Updates student email across all related collections
 * @param studentId - The ID of the student being updated
 * @param oldEmail - The previous email of the student
 * @param newEmail - The new email of the student
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeStudentEmailUpdate(
  studentId: string,
  oldEmail: string,
  newEmail: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // Update Payment records with studentEmail
    if (PaymentModel) {
      try {
        const paymentResult = await PaymentModel.updateMany(
          { studentId, tenantId },
          { $set: { studentEmail: newEmail } }
        )
        updatedCollections.push({
          collection: "Payment",
          count: paymentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Payment: ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Updates student category across all related collections
 * @param studentId - The ID of the student being updated
 * @param oldCategory - The previous category of the student
 * @param newCategory - The new category of the student
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeStudentCategoryUpdate(
  studentId: string,
  oldCategory: string,
  newCategory: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // Update Payment records with studentCategory
    if (PaymentModel) {
      try {
        const paymentResult = await PaymentModel.updateMany(
          { studentId, tenantId },
          { $set: { studentCategory: newCategory } }
        )
        updatedCollections.push({
          collection: "Payment",
          count: paymentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Payment: ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Updates student course type across all related collections
 * @param studentId - The ID of the student being updated
 * @param oldCourseType - The previous course type of the student
 * @param newCourseType - The new course type of the student
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeStudentCourseTypeUpdate(
  studentId: string,
  oldCourseType: string,
  newCourseType: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // Update Payment records with courseType
    if (PaymentModel) {
      try {
        const paymentResult = await PaymentModel.updateMany(
          { studentId, tenantId },
          { $set: { courseType: newCourseType } }
        )
        updatedCollections.push({
          collection: "Payment",
          count: paymentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Payment: ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Updates non-instructor (staff) name across all related collections
 * @param nonInstructorId - The ID of the non-instructor being updated
 * @param oldName - The previous full name
 * @param newName - The new full name
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeNonInstructorNameUpdate(
  nonInstructorId: string,
  oldName: string,
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // 1. Update NonInstructorAttendance records
    if (NonInstructorAttendanceModel) {
      try {
        const attendanceResult = await NonInstructorAttendanceModel.updateMany(
          { instructorId: nonInstructorId, tenantId },
          { $set: { instructorName: newName } }
        )
        updatedCollections.push({
          collection: "NonInstructorAttendance",
          count: attendanceResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`NonInstructorAttendance: ${err.message}`)
      }
    }

    // 2. Update NonInstructorAttendanceDraft records
    if (NonInstructorAttendanceDraftModel) {
      try {
        const draftAttendanceResult = await NonInstructorAttendanceDraftModel.updateMany(
          { instructorId: nonInstructorId, tenantId },
          { $set: { instructorName: newName } }
        )
        updatedCollections.push({
          collection: "NonInstructorAttendanceDraft",
          count: draftAttendanceResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`NonInstructorAttendanceDraft: ${err.message}`)
      }
    }

    // 3. Update NonInstructorDraft records
    if (NonInstructorDraftModel) {
      try {
        const instructorDraftResult = await NonInstructorDraftModel.updateMany(
          { tenantId, instructorName: oldName },
          { $set: { instructorName: newName } }
        )
        updatedCollections.push({
          collection: "NonInstructorDraft",
          count: instructorDraftResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`NonInstructorDraft: ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Updates course name across all related collections
 * @param courseId - The ID of the course being updated
 * @param oldName - The previous course name
 * @param newName - The new course name
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeCourseNameUpdate(
  courseId: string,
  oldName: string,
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // 1. Update Enrollment records
    if (EnrollmentModel) {
      try {
        const enrollmentResult = await EnrollmentModel.updateMany(
          { courseId, tenantId },
          { $set: { courseName: newName } }
        )
        updatedCollections.push({
          collection: "Enrollment",
          count: enrollmentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Enrollment: ${err.message}`)
      }
    }

    // 2. Update StudentAttendance records
    if (StudentAttendanceModel) {
      try {
        const attendanceResult = await StudentAttendanceModel.updateMany(
          { courseId, tenantId },
          { $set: { courseName: newName } }
        )
        updatedCollections.push({
          collection: "StudentAttendance",
          count: attendanceResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`StudentAttendance: ${err.message}`)
      }
    }

    // 3. Update StudentAttendanceDraft records
    if (StudentAttendanceDraftModel) {
      try {
        const draftResult = await StudentAttendanceDraftModel.updateMany(
          { courseId, tenantId },
          { $set: { courseName: newName } }
        )
        updatedCollections.push({
          collection: "StudentAttendanceDraft",
          count: draftResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`StudentAttendanceDraft: ${err.message}`)
      }
    }

    // 4. Update PaymentRecord records
    if (PaymentRecordModel) {
      try {
        const paymentRecordResult = await PaymentRecordModel.updateMany(
          { courseId, tenantId },
          { $set: { courseName: newName } }
        )
        updatedCollections.push({
          collection: "PaymentRecord",
          count: paymentRecordResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`PaymentRecord: ${err.message}`)
      }
    }

    // 5. Update PaymentTransaction records
    if (PaymentTransactionModel) {
      try {
        const transactionResult = await PaymentTransactionModel.updateMany(
          { courseId, tenantId },
          { $set: { courseName: newName } }
        )
        updatedCollections.push({
          collection: "PaymentTransaction",
          count: transactionResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`PaymentTransaction: ${err.message}`)
      }
    }

    // 6. Update MonthlySubscription records
    if (MonthlySubscriptionModel) {
      try {
        const subscriptionResult = await MonthlySubscriptionModel.updateMany(
          { courseId, tenantId },
          { $set: { courseName: newName } }
        )
        updatedCollections.push({
          collection: "MonthlySubscription",
          count: subscriptionResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`MonthlySubscription: ${err.message}`)
      }
    }

    // 7. Update Student records (enrolledCourseName)
    if (StudentModel) {
      try {
        const studentResult = await StudentModel.updateMany(
          { enrolledCourse: courseId, tenantId },
          { $set: { enrolledCourseName: newName } }
        )
        updatedCollections.push({
          collection: "Student",
          count: studentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Student: ${err.message}`)
      }
    }

    // 8. Update Payment records (enrolledCourseName)
    if (PaymentModel) {
      try {
        const paymentResult = await PaymentModel.updateMany(
          { courseId, tenantId },
          { $set: { enrolledCourseName: newName } }
        )
        updatedCollections.push({
          collection: "Payment",
          count: paymentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Payment: ${err.message}`)
      }
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Updates cohort name across all related collections
 * @param cohortId - The ID of the cohort being updated
 * @param oldName - The previous cohort name
 * @param newName - The new cohort name
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @returns Result object with update statistics
 */
export async function cascadeCohortNameUpdate(
  cohortId: string,
  oldName: string,
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult> {
  const updatedCollections: { collection: string; count: number }[] = []
  const errors: string[] = []

  try {
    // 1. Update StudentAttendance records
    if (StudentAttendanceModel) {
      try {
        const attendanceResult = await StudentAttendanceModel.updateMany(
          { cohortId, tenantId },
          { $set: { cohortName: newName } }
        )
        updatedCollections.push({
          collection: "StudentAttendance",
          count: attendanceResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`StudentAttendance: ${err.message}`)
      }
    }

    // 2. Update StudentAttendanceDraft records
    if (StudentAttendanceDraftModel) {
      try {
        const draftResult = await StudentAttendanceDraftModel.updateMany(
          { cohortId, tenantId },
          { $set: { cohortName: newName } }
        )
        updatedCollections.push({
          collection: "StudentAttendanceDraft",
          count: draftResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`StudentAttendanceDraft: ${err.message}`)
      }
    }

    // 3. Update MonthlySubscription records
    if (MonthlySubscriptionModel) {
      try {
        const subscriptionResult = await MonthlySubscriptionModel.updateMany(
          { cohortId, tenantId },
          { $set: { cohortName: newName } }
        )
        updatedCollections.push({
          collection: "MonthlySubscription",
          count: subscriptionResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`MonthlySubscription: ${err.message}`)
      }
    }

    // 4. Update Payment records
    if (PaymentModel) {
      try {
        const paymentResult = await PaymentModel.updateMany(
          { cohortId, tenantId },
          { $set: { cohortName: newName } }
        )
        updatedCollections.push({
          collection: "Payment",
          count: paymentResult.modifiedCount || 0,
        })
      } catch (err: any) {
        errors.push(`Payment: ${err.message}`)
      }
    }

    // 5. Update Instructor records (denormalized cohortName field)
    // Note: This updates instructors who have this cohort in their cohortName comma-separated list
    try {
      // Find instructors with this cohort and update their cohortName field
      const instructors = await InstructorModel.find({
        tenantId,
        cohortIds: { $regex: cohortId }
      }).lean()

      for (const instructor of instructors) {
        const cohortNames = (instructor.cohortName || '').split(',').map((n: string) => n.trim())
        const cohortIds = (instructor.cohortIds || '').split(',').map((id: string) => id.trim())
        
        // Find the index of this cohort and update its name
        const index = cohortIds.indexOf(cohortId)
        if (index !== -1 && cohortNames[index] === oldName) {
          cohortNames[index] = newName
          await InstructorModel.updateOne(
            { _id: instructor._id },
            { $set: { cohortName: cohortNames.join(', ') } }
          )
        }
      }

      updatedCollections.push({
        collection: "Instructor (cohortName)",
        count: instructors.length,
      })
    } catch (err: any) {
      errors.push(`Instructor: ${err.message}`)
    }

    return {
      success: errors.length === 0,
      updatedCollections,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      updatedCollections,
      errors: [`Cascade update failed: ${error.message}`],
    }
  }
}

/**
 * Builds the full name from non-instructor parts
 */
export function buildNonInstructorFullName(
  firstName: string,
  middleName?: string,
  lastName?: string
): string {
  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
}
