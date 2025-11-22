import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import StudentAttendance from '@/models/dashboard/student/StudentAttendance';
import Student from '@/models/dashboard/student/Student';

// Define the Course schema for lookup
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  courseId: String,
  description: String,
  courseCategory: String,
  type: String,
  duration: String,
  level: String,
}, {
  collection: 'courses',
  strict: false
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect("uniqbrio");

    // Use aggregation to populate course details from student profile and courses collection
    const records = await StudentAttendance.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(params.id) } },
      // Left join with students collection to get course details
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: 'studentId',
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
          let: { courseIdToLookup: "$lookupCourseId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$courseId", "$$courseIdToLookup"] },
                    { $eq: [{ $toString: "$_id" }, "$$courseIdToLookup"] }
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
          let: { courseNameToLookup: "$studentEnrolledCourseName" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
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
    ]);
    
    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: records[0]
    });
  } catch (error: any) {
    console.error('Error fetching attendance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance record',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Find existing record
    const existingRecord = await StudentAttendance.findById(params.id);
    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // If changing student or date, check for conflicts
    if ((studentId && studentId !== existingRecord.studentId) || 
        (date && date !== existingRecord.date)) {
      const conflictRecord = await StudentAttendance.findOne({
        _id: { $ne: params.id },
        studentId: studentId || existingRecord.studentId,
        date: date || existingRecord.date
      });

      if (conflictRecord) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Attendance record already exists for this student on this date' 
          },
          { status: 409 }
        );
      }
    }

    // If studentName or course details are not provided, try to get them from Student collection
    let finalStudentName = studentName;
    let finalCourseId = courseId;
    let finalCourseName = courseName;
    
    if ((!finalStudentName || !finalCourseId || !finalCourseName) && studentId) {
      const student = await Student.findOne({ studentId });
      if (student) {
        if (!finalStudentName) {
          finalStudentName = student.name;
        }
        if (!finalCourseId && student.enrolledCourse) {
          // Normalize legacy enrolledCourse value which might be in the form "COURSE0003 - Course Name"
          const raw = student.enrolledCourse as string;
          const separatorIndex = raw.indexOf(' - ');
          finalCourseId = separatorIndex > -1 ? raw.substring(0, separatorIndex).trim() : raw.trim();
        }

        // If we have a candidate course identifier, attempt lookup.
        if (!finalCourseName && finalCourseId) {
          // Only include _id match if the value is a valid ObjectId to prevent CastError
          const isObjectId = mongoose.isValidObjectId(finalCourseId);
          const course = await Course.findOne(
            isObjectId
              ? { $or: [{ courseId: finalCourseId }, { _id: finalCourseId }] }
              : { courseId: finalCourseId }
          );
          if (course) {
            finalCourseName = course.name;
          } else if (student.enrolledCourseName) {
            // Fallback to student's stored course name if lookup fails
            finalCourseName = student.enrolledCourseName;
          }
        } else if (!finalCourseName && student.enrolledCourseName) {
          finalCourseName = student.enrolledCourseName;
        }
      }
    }

    // Update the record
    const updatedRecord = await StudentAttendance.findByIdAndUpdate(
      params.id,
      {
        ...(studentId && { studentId }),
        ...(finalStudentName && { studentName: finalStudentName }),
        ...(cohortId !== undefined && { cohortId }),
        ...(cohortName !== undefined && { cohortName }),
        ...(cohortInstructor !== undefined && { cohortInstructor }),
        ...(cohortTiming !== undefined && { cohortTiming }),
        ...(finalCourseId !== undefined && { courseId: finalCourseId }),
        ...(finalCourseName !== undefined && { courseName: finalCourseName }),
        ...(date && { date }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedRecord
    });

  } catch (error: any) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update attendance record',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect("uniqbrio");

    const deletedRecord = await StudentAttendance.findByIdAndDelete(params.id);
    
    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
      data: deletedRecord
    });
  } catch (error: any) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete attendance record',
        message: error.message 
      },
      { status: 500 }
    );
  }
}