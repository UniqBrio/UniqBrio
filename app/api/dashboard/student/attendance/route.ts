import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import StudentAttendance from '@/models/dashboard/student/StudentAttendance';
import Student from '@/models/dashboard/student/Student';
import Course from '@/models/dashboard/Course';
import mongoose from 'mongoose';
import Cohort from '@/models/dashboard/Cohort';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import Registration from '@/models/Registration';
import { sendAttendanceMessage, normalizePhoneToE164 } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Helper function to send WhatsApp attendance notification
 * This is a non-blocking operation - errors are logged but don't affect the main flow
 */
async function sendAttendanceWhatsAppNotification(params: {
  tenantId: string;
  studentId: string;
  sessionId: string;
  cohortId?: string;
  cohortName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
}): Promise<void> {
  const { tenantId, studentId, sessionId, cohortId, cohortName, date, startTime, endTime } = params;

  try {
    // Get student details with guardian info
    const student = await Student.findOne({ tenantId, studentId }).lean() as any;
    if (!student) {
      console.log(`[WhatsApp Notification] Student not found: ${studentId}`);
      return;
    }

    // Get guardian phone number
    const guardianContact = student.guardian?.contact;
    const guardianCountryCode = student.guardianCountryCode;
    
    if (!guardianContact) {
      console.log(`[WhatsApp Notification] No guardian contact for student: ${studentId}`);
      return;
    }

    // Normalize phone to E.164 format
    const parentPhone = normalizePhoneToE164(guardianContact, guardianCountryCode);
    if (!parentPhone) {
      console.log(`[WhatsApp Notification] Invalid guardian phone for student: ${studentId}`);
      return;
    }

    // Get guardian name
    const guardianFirstName = student.guardianFirstName || '';
    const guardianMiddleName = student.guardianMiddleName || '';
    const guardianLastName = student.guardianLastName || '';
    const guardianFullName = student.guardian?.fullName;
    const parentName = guardianFullName || 
      [guardianFirstName, guardianMiddleName, guardianLastName].filter(Boolean).join(' ') || 
      'Parent';

    // Get batch/cohort name
    let batchName = cohortName || '';
    if (!batchName && cohortId) {
      const cohort = await Cohort.findOne({ tenantId, cohortId }).lean() as any;
      batchName = cohort?.name || cohortId;
    }
    batchName = batchName || 'Class';

    // Get academy name from Registration
    let academyName = 'Academy';
    try {
      const registration = await Registration.findOne({ academyId: tenantId }).lean() as any;
      if (registration?.businessInfo?.businessName) {
        academyName = registration.businessInfo.businessName;
      }
    } catch (regError) {
      console.log(`[WhatsApp Notification] Could not fetch academy name for tenant: ${tenantId}`);
    }

    // Format date and time
    const sessionDate = formatDateForDisplay(date);
    const sessionTime = formatTimeRange(startTime, endTime);

    // Send the WhatsApp message
    await sendAttendanceMessage(
      {
        parentPhone,
        parentName,
        studentName: student.name || studentId,
        batchName,
        sessionDate,
        sessionTime,
        academyName,
      },
      studentId,
      sessionId
    );

    console.log(`[WhatsApp Notification] Successfully queued notification for student: ${studentId}`);
  } catch (error) {
    console.error(`[WhatsApp Notification] Error sending notification for student ${studentId}:`, error);
    // Error is logged but not re-thrown - this is non-blocking
  }
}

/**
 * Format date string for display (e.g., "22 Dec 2025")
 */
function formatDateForDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time range for display (e.g., "09:00 - 10:30" or "09:00")
 */
function formatTimeRange(startTime?: string, endTime?: string): string {
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  return startTime || endTime || 'Scheduled time';
}

const formatDayRanges = (days?: number[]): string => {
  if (!Array.isArray(days) || days.length === 0) return '';
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

const deriveCohortTiming = (cohort: any): string | undefined => {
  if (!cohort) return undefined;
  const startTime = cohort?.timeSlot?.startTime || cohort?.startTime || '';
  const endTime = cohort?.timeSlot?.endTime || cohort?.endTime || '';
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : (startTime || endTime || '');
  const dayLabel = formatDayRanges(cohort?.daysOfWeek);
  const combined = [dayLabel, timeRange].filter(Boolean).join(' • ');
  return combined || cohort?.timing || undefined;
};

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const cohortId = searchParams.get('cohortId');
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build query filters - CRITICAL: Always filter by tenantId for multi-tenant isolation
    let query: any = { 
      tenantId: session.tenantId // Ensure only current tenant's attendance is returned
    };
    
    if (studentId) {
      query.studentId = studentId;
    }
    
    if (cohortId) {
      query.cohortId = cohortId;
    }
    
    if (date) {
      query.date = date;
    } else if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }
    
    if (status) {
      query.status = status;
    }

    // Build aggregation pipeline to join with student data for course details
    // CRITICAL: Double-check tenantId in the match stage
    let pipeline: any[] = [
      { $match: { 
        ...query, 
        tenantId: session.tenantId // Double-check tenantId filter
      } },
      // Left join with students collection to get course details
      {
        $lookup: {
          from: 'students',
          let: { sid: "$studentId", tenant: session.tenantId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tenantId", "$$tenant"] },
                    { $eq: ["$studentId", "$$sid"] }
                  ]
                }
              }
            }
          ],
          as: 'studentInfo'
        }
      },
      // Add course ID from student profile if not already present
      {
        $addFields: {
          // Pull possible course identifiers from the student's profile
          studentEnrolledCourseId: { $arrayElemAt: ["$studentInfo.enrolledCourseId", 0] },
          studentEnrolledCourseName: { $arrayElemAt: ["$studentInfo.enrolledCourseName", 0] },
          // Backward compatibility: extract ID from legacy enrolledCourse field (e.g., "COURSE0001 - Name")
          legacyExtractedCourseId: {
            $let: {
              vars: { enrolledCourse: { $arrayElemAt: ["$studentInfo.enrolledCourse", 0] } },
              in: {
                $cond: {
                  if: { $and: [{ $ne: ["$$enrolledCourse", null] }, { $ne: ["$$enrolledCourse", ""] }] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $indexOfCP: ["$$enrolledCourse", " - "] }, -1] },
                      then: { $trim: { input: { $substrCP: ["$$enrolledCourse", 0, { $indexOfCP: ["$$enrolledCourse", " - "] }] } } },
                      else: "$$enrolledCourse"
                    }
                  },
                  else: null
                }
              }
            }
          },
          // Primary candidate to look up by ID: priority order -> record.courseId -> student.enrolledCourseId -> legacyExtractedCourseId
          lookupCourseId: {
            $cond: {
              if: { $and: [{ $ne: ["$courseId", null] }, { $ne: ["$courseId", ""] }] },
              then: "$courseId",
              else: {
                $cond: {
                  if: { $and: [{ $ne: ["$studentEnrolledCourseId", null] }, { $ne: ["$studentEnrolledCourseId", ""] }] },
                  then: "$studentEnrolledCourseId",
                  else: "$legacyExtractedCourseId"
                }
              }
            }
          }
        }
      },
      // Left join with courses collection to get full course details
      {
        $lookup: {
          from: 'courses',
          let: { courseIdToLookup: "$lookupCourseId", tenant: session.tenantId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tenantId", "$$tenant"] },
                    {
                      $or: [
                        { $eq: ["$courseId", "$$courseIdToLookup"] },
                        { $eq: [{ $toString: "$_id" }, "$$courseIdToLookup"] }
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'courseInfo'
        }
      },
      // Secondary lookup by course name from student's profile (case-insensitive)
      {
        $lookup: {
          from: 'courses',
          let: { courseNameToLookup: "$studentEnrolledCourseName", tenant: session.tenantId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tenantId", "$$tenant"] },
                    { $ne: ["$$courseNameToLookup", null] },
                    { $ne: ["$$courseNameToLookup", ""] },
                    { $eq: [ { $toLower: "$name" }, { $toLower: "$$courseNameToLookup" } ] }
                  ]
                }
              }
            }
          ],
          as: 'courseInfoByName'
        }
      },
      // Add course details from lookup
      {
        $addFields: {
          courseId: {
            $cond: {
              if: { $gt: [{ $size: "$courseInfo" }, 0] },
              then: { $arrayElemAt: ["$courseInfo.courseId", 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: "$courseInfoByName" }, 0] },
                  then: { $arrayElemAt: ["$courseInfoByName.courseId", 0] },
                  else: "$lookupCourseId"
                }
              }
            }
          },
          courseName: {
            $cond: {
              if: { $and: [{ $ne: ["$courseName", null] }, { $ne: ["$courseName", ""] }] },
              then: "$courseName",
              else: {
                $cond: {
                  if: { $gt: [{ $size: "$courseInfo" }, 0] },
                  then: { $arrayElemAt: ["$courseInfo.name", 0] },
                  else: {
                    $cond: {
                      if: { $gt: [{ $size: "$courseInfoByName" }, 0] },
                      then: { $arrayElemAt: ["$courseInfoByName.name", 0] },
                      else: "$studentEnrolledCourseName"
                    }
                  }
                }
              }
            }
          },
          courseCategory: {
            $cond: {
              if: { $gt: [{ $size: "$courseInfo" }, 0] },
              then: { $arrayElemAt: ["$courseInfo.courseCategory", 0] },
              else: { $arrayElemAt: ["$studentInfo.category", 0] }
            }
          },
          courseType: {
            $cond: {
              if: { $gt: [{ $size: "$courseInfo" }, 0] },
              then: { $arrayElemAt: ["$courseInfo.type", 0] },
              else: { $arrayElemAt: ["$studentInfo.courseType", 0] }
            }
          },
          courseLevel: {
            $cond: {
              if: { $gt: [{ $size: "$courseInfo" }, 0] },
              then: { $arrayElemAt: ["$courseInfo.level", 0] },
              else: { $arrayElemAt: ["$studentInfo.courseLevel", 0] }
            }
          },
          courseDuration: { $arrayElemAt: ["$courseInfo.duration", 0] }
        }
      },
  // Remove temporary fields and lookup arrays
  { $unset: ["studentInfo", "courseInfo", "courseInfoByName", "lookupCourseId", "studentEnrolledCourseId", "studentEnrolledCourseName", "legacyExtractedCourseId"] }
    ];

    // Add sorting by date (newest first) and then by studentId
    pipeline.push({ $sort: { date: -1, studentId: 1 } });

    // Add pagination if specified
    if (offset) {
      pipeline.push({ $skip: parseInt(offset) });
    }
    if (limit) {
      pipeline.push({ $limit: parseInt(limit) });
    }

    const records = await StudentAttendance.aggregate(pipeline);

    const cohortIds = Array.from(
      new Set(
        records
          .map((record: any) => (record?.cohortId ? String(record.cohortId) : null))
          .filter((id): id is string => Boolean(id))
      )
    );
    let enrichedRecords = records;

    if (cohortIds.length) {
      const cohorts = await Cohort.find({
        tenantId: session.tenantId,
        $or: [
          { cohortId: { $in: cohortIds } },
          { id: { $in: cohortIds } }
        ]
      }).lean();

      const cohortMap = new Map<string, { name?: string; instructor?: string; timing?: string }>();
      cohorts.forEach((cohort: any) => {
        const cohortTiming = deriveCohortTiming(cohort);
        const cohortInstructor = cohort?.instructor || cohort?.instructorName;
        const keys = new Set<string>();
        if (cohort.cohortId) keys.add(String(cohort.cohortId).trim().toUpperCase());
        if (cohort.id) keys.add(String(cohort.id).trim().toUpperCase());
        if (cohort._id) keys.add(String(cohort._id).trim().toUpperCase());
        keys.forEach((key) => {
          cohortMap.set(key, {
            name: cohort?.name,
            instructor: cohortInstructor,
            timing: cohortTiming
          });
        });
      });

      enrichedRecords = records.map((record: any) => {
        if (!record.cohortId) return record;
        const cohortKey = String(record.cohortId).trim().toUpperCase();
        const cohortDetails = cohortMap.get(cohortKey);
        if (!cohortDetails) return record;
        const currentName = record.cohortName;
        const needsNameOverride = !currentName || currentName.trim() === '' || currentName.trim().toUpperCase() === cohortKey;
        return {
          ...record,
          cohortName: needsNameOverride ? (cohortDetails.name || currentName) : currentName,
          cohortInstructor: record.cohortInstructor || cohortDetails.instructor,
          cohortTiming: record.cohortTiming || cohortDetails.timing
        };
      });
    }

    // SECURITY CHECK: Verify all returned records belong to current tenant
    const invalidRecords = enrichedRecords.filter((record: any) => record.tenantId !== session.tenantId);
    if (invalidRecords.length > 0) {
      console.error(`[SECURITY] Found ${invalidRecords.length} attendance records with wrong tenantId!`, {
        currentTenant: session.tenantId,
        invalidRecords: invalidRecords.map((r: any) => ({ id: r._id, tenantId: r.tenantId, studentId: r.studentId }))
      });
      // Filter out invalid records as a safety measure
      enrichedRecords = enrichedRecords.filter((record: any) => record.tenantId === session.tenantId);
    }

    // Get total count for pagination (if filters are applied)
    // CRITICAL: Ensure count also filters by tenantId
    let totalCount = null;
    if (limit || offset) {
      const countResult = await StudentAttendance.countDocuments({ 
        ...query, 
        tenantId: session.tenantId // Ensure tenant isolation
      });
      totalCount = countResult;
    }

    const response: any = {
      success: true,
      data: enrichedRecords,
    };

    if (totalCount !== null) {
      response.pagination = {
        total: totalCount,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : 0,
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance records',
        message: error.message 
      },
      { status: 500 }
    );
  }
    }
  );
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      studentId,
      studentName,
      cohortId,
      cohortName,
      cohortInstructor,
      cohortTiming,
      courseId,
      courseName,
      date,
      startTime,
      endTime,
      status,
      notes
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this student on this date
    const existingRecord = await StudentAttendance.findOne({
      tenantId: session.tenantId,
      studentId,
      date
    });

    if (existingRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Attendance record already exists for student ${studentId} on ${date}. Please edit the existing record or choose a different date.`,
          existingRecord 
        },
        { status: 409 }
      );
    }

  // Always try to get the most up-to-date student information from Student collection
  let finalStudentName = studentName;
  let finalCourseId: string | undefined = courseId;
  let finalCourseName = courseName;
    
    if (studentId) {
      const student = await Student.findOne({ tenantId: session.tenantId, studentId });
      if (student) {
        // Always use the current name from the Student record if available
        if (student.name) {
          finalStudentName = student.name;
        }
        // Prefer enrolledCourse (ID) if present; it may be an ID alone or in
        // legacy format "COURSE0001 - Name". If not present, try resolving by
        // enrolledCourseName via the Courses collection.
        if (!finalCourseId) {
          const enrolledCourse: any = (student as any).enrolledCourse;
          if (enrolledCourse) {
            // If it contains " - ", take the part before it; else use as-is
            const sep = String(enrolledCourse).indexOf(" - ");
            finalCourseId = sep >= 0 ? String(enrolledCourse).slice(0, sep).trim() : String(enrolledCourse);
          }
        }

        // If we still don't have an ID, but have an enrolledCourseName, resolve by name
        if (!finalCourseId && (student as any).enrolledCourseName) {
          const byName = await Course.findOne({ tenantId: session.tenantId, name: (student as any).enrolledCourseName });
          if (byName?.courseId) {
            finalCourseId = byName.courseId as any;
          }
        }

        // If we still don't have a name, fetch it now from Courses (by ID) or fall back to student's name
        if (!finalCourseName) {
          if (finalCourseId) {
            const course = await Course.findOne({
              tenantId: session.tenantId,
              $or: [
                { courseId: finalCourseId },
                // Attempt ObjectId lookup only if it looks like one
                ...(mongoose.isValidObjectId(finalCourseId) ? [{ _id: new mongoose.Types.ObjectId(finalCourseId) }] : [])
              ]
            });
            if (course) {
              finalCourseName = course.name as any;
            }
          }
          if (!finalCourseName && (student as any).enrolledCourseName) {
            finalCourseName = (student as any).enrolledCourseName;
          }
        }
      }
    }

    // Normalize status to accepted enum values
    const normalizedStatus = (status || 'present').toLowerCase() === 'absent' ? 'absent' : 'present';

    // Create new attendance record
    const attendanceRecord = new StudentAttendance({
      tenantId: session.tenantId,
      studentId,
      studentName: finalStudentName || studentId,
      cohortId,
      cohortName,
      cohortInstructor,
      cohortTiming,
      courseId: finalCourseId,
      courseName: finalCourseName,
      date,
      startTime,
      endTime,
      status: normalizedStatus,
      notes
    });

    const savedRecord = await attendanceRecord.save();

    // Send WhatsApp notification for present students (non-blocking)
    if (normalizedStatus === 'present') {
      // Fire and forget - don't block the response
      sendAttendanceWhatsAppNotification({
        tenantId: session.tenantId,
        studentId,
        sessionId: String(savedRecord._id),
        cohortId,
        cohortName,
        date,
        startTime,
        endTime,
      }).catch((error) => {
        console.error('[Attendance] WhatsApp notification error (non-blocking):', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: savedRecord
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create attendance record',
        message: error.message 
      },
      { status: 500 }
    );
  }
    }
  );
}