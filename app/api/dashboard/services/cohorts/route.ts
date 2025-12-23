import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Cohort, Course } from "@/models/dashboard";
import type { ICohort, ICourse } from "@/models/dashboard";
import mongoose from "mongoose";
import { syncCohortStudents } from "@/lib/dashboard/studentCohortSync";
import { getUserSession } from "@/lib/tenant/api-helpers";
import { runWithTenantContext } from "@/lib/tenant/tenant-context";
import { logEntityCreate, logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from "@/lib/audit-logger";
import { AuditModule } from "@/models/AuditLog";
import { cascadeCohortNameUpdate } from "@/lib/dashboard/cascade-updates";

export const dynamic = 'force-dynamic';
export const revalidate = 120;

export async function GET(request: Request) {
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
        const courseId = searchParams.get('courseId');
    
    // Build query based on courseId parameter
    // CRITICAL: Explicitly set tenantId to ensure tenant isolation
    const query: any = { isDeleted: { $ne: true }, tenantId: session.tenantId };
    if (courseId) {
      query.courseId = courseId;
    }
    
    // Get cohorts using the new Cohort model with optional courseId filtering
    const cohorts = await Cohort.find(query).lean();
    
    // Fetch all students once to populate member names efficiently
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const allStudents = await db.collection('students').find(
      { isDeleted: { $ne: true }, tenantId: session.tenantId },
      { projection: { studentId: 1, name: 1, firstName: 1, lastName: 1 } }
    ).toArray();
    
    // Create a map for quick student lookup
    const studentMap = new Map();
    allStudents.forEach((student: any) => {
      const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentId;
      studentMap.set(student.studentId, studentName);
    });
    
    // Populate each cohort with course schedule information and actual student names
    const cohortsWithSchedule = await Promise.all(
      cohorts.map(async (cohort) => {
        const queryConditions: Array<{ courseId?: string; _id?: string; tenantId: string }> = [
          { courseId: cohort.courseId, tenantId: session.tenantId }
        ];
        
        // Only add _id query if cohort.courseId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(cohort.courseId)) {
          queryConditions.push({ _id: cohort.courseId, tenantId: session.tenantId });
        }
        
        const course = await Course.findOne({
          $or: queryConditions
        }).lean();
        
        // Map currentStudents to members with actual student names
        const members = cohort.currentStudents?.map((studentId: string) => ({
          id: studentId,
          name: studentMap.get(studentId) || studentId
        })) || [];
        
        if (course) {
          return {
            ...cohort,
            id: cohort.cohortId, // Map cohortId to id for frontend compatibility
            // Map timeSlot to direct properties expected by frontend
            startTime: cohort.timeSlot?.startTime || '',
            endTime: cohort.timeSlot?.endTime || '',
            // Include daysOfWeek for frontend
            daysOfWeek: cohort.daysOfWeek || [1, 2, 3, 4, 5],
            // Map database fields to frontend-expected field names
            instructorName: cohort.instructor || course.instructor || '',
            capacity: cohort.maxStudents || 0,
            members,
            // Inherit course schedule
            startDate: course.schedulePeriod?.startDate || '',
            endDate: course.schedulePeriod?.endDate || '',
            inheritedStartDate: course.schedulePeriod?.startDate,
            inheritedEndDate: course.schedulePeriod?.endDate,
            courseName: course.name,
            courseInstructor: course.instructor,
            sessionDuration: course.sessionDetails?.sessionDuration,
            totalSessions: course.schedulePeriod?.totalSessions,
            sessionType: course.sessionDetails?.sessionType,
          };
        }
        
        return {
          ...cohort,
          id: cohort.cohortId, // Map cohortId to id for frontend compatibility
          // Map timeSlot to direct properties expected by frontend
          startTime: cohort.timeSlot?.startTime || '',
          endTime: cohort.timeSlot?.endTime || '',
          // Include daysOfWeek for frontend
          daysOfWeek: cohort.daysOfWeek || [1, 2, 3, 4, 5],
          // Map database fields to frontend-expected field names
          instructorName: cohort.instructor || '',
          capacity: cohort.maxStudents || 0,
          members,
          // Default empty dates if no course found
          startDate: '',
          endDate: '',
        };
      })
    );
    
    console.log("Cohorts with schedule data:", cohortsWithSchedule.length);
    return NextResponse.json({
      success: true,
      cohorts: cohortsWithSchedule
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error fetching cohorts:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
    }
  );
}

export async function POST(request: Request) {
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
    
    // If cohortId exists, update existing cohort
    if (body.cohortId || body.id) {
      const cohortId = body.cohortId || body.id;
      const existingCohort = await Cohort.findOne({ cohortId, tenantId: session.tenantId });
      
      if (existingCohort) {
        // Update existing cohort - map frontend data to database structure
        existingCohort.name = body.name || existingCohort.name;
        existingCohort.courseId = body.courseId || existingCohort.courseId;
        // Map frontend time fields to timeSlot object
        if (body.startTime || body.endTime) {
          existingCohort.timeSlot = {
            startTime: body.startTime || existingCohort.timeSlot?.startTime || '09:00',
            endTime: body.endTime || existingCohort.timeSlot?.endTime || '10:00'
          };
        }
        existingCohort.daysOfWeek = body.daysOfWeek || existingCohort.daysOfWeek;
        // Map frontend fields to database fields
        existingCohort.instructor = body.instructorName || body.instructor || existingCohort.instructor;
        existingCohort.location = body.location || existingCohort.location;
        existingCohort.maxStudents = parseInt(body.capacity) || body.maxStudents || existingCohort.maxStudents;
        const newStudents = body.members?.map((m: any) => m.id) || existingCohort.currentStudents;
        existingCohort.currentStudents = newStudents;
        existingCohort.status = body.status || existingCohort.status;
        existingCohort.notes = body.notes || existingCohort.notes;
        await existingCohort.save();
        
        // Sync students bidirectionally when student list changes
        const syncResult = await syncCohortStudents(existingCohort.cohortId, newStudents, session.tenantId);
        if (!syncResult.success) {
          console.warn(`Failed to sync students for cohort ${existingCohort.cohortId}:`, syncResult.error);
        }
        
        const cohortObj = existingCohort.toObject();
        return NextResponse.json({ 
          success: true,
          cohort: {
            ...cohortObj,
            id: existingCohort.cohortId, // Map cohortId to id for frontend compatibility
            // Map timeSlot to direct properties expected by frontend
            startTime: cohortObj.timeSlot?.startTime || '',
            endTime: cohortObj.timeSlot?.endTime || '',
            // Include daysOfWeek for frontend
            daysOfWeek: cohortObj.daysOfWeek || [1, 2, 3, 4, 5],
            // Map database fields to frontend-expected field names
            instructorName: cohortObj.instructor || '',
            capacity: cohortObj.maxStudents || 0,
            members: cohortObj.currentStudents?.map((studentId: string) => ({ id: studentId, name: studentId })) || [],
            // Map schedule dates
            startDate: cohortObj.inheritedStartDate || '',
            endDate: cohortObj.inheritedEndDate || '',
          },
          updated: true 
        });
      }
    }
    
    // Create new cohort
    // Validate that the course exists
    const queryConditions: Array<{ courseId?: string; _id?: string; tenantId: string }> = [
      { courseId: body.courseId, tenantId: session.tenantId }
    ];
    
    // Only add _id query if body.courseId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(body.courseId)) {
      queryConditions.push({ _id: body.courseId, tenantId: session.tenantId });
    }
    
    const course = await Course.findOne({
      $or: queryConditions
    });
    
    if (!course) {
      return NextResponse.json({ 
        success: false, 
        error: 'Referenced course not found' 
      }, { status: 400 });
    }
    
    // Generate unique cohort ID based on course name
    let cohortId = body.cohortId || body.id;
    
    if (!cohortId) {
      // Use centralized tenant-scoped ID generator
      const { generateCohortId } = await import('@/lib/dashboard/id-generators')
      cohortId = await generateCohortId(session.tenantId, course.name || 'COURSE')
    } else {
      // Validate that the provided ID is unique within this tenant
      const existingCohort = await Cohort.findOne({ cohortId, tenantId: session.tenantId });
      if (existingCohort) {
        return NextResponse.json({ 
          success: false, 
          error: `Cohort ID '${cohortId}' already exists. Please choose a different ID.` 
        }, { status: 409 });
      }
    }
    
    // Create new cohort with course schedule inheritance
    // Map frontend data structure to database structure
    const newCohort = await Cohort.create({
      tenantId: session.tenantId,
      cohortId,
      name: body.name,
      courseId: body.courseId,
      // Map frontend time fields to timeSlot object
      timeSlot: {
        startTime: body.startTime || '09:00',
        endTime: body.endTime || '10:00'
      },
      daysOfWeek: body.daysOfWeek || [1, 2, 3, 4, 5], // Default Mon-Fri
      // Map frontend fields to database fields
      instructor: body.instructorName || body.instructor,
      location: body.location,
      maxStudents: parseInt(body.capacity) || body.maxStudents || 30,
      currentStudents: body.members?.map((m: any) => m.id) || [],
      waitlist: [],
      status: body.status || 'Active',
      registrationOpen: body.registrationOpen !== false,
      notes: body.notes || '',
      inheritedStartDate: course.schedulePeriod?.startDate,
      inheritedEndDate: course.schedulePeriod?.endDate,
    });
    
    // Sync students bidirectionally if there are any students
    if (newCohort.currentStudents && newCohort.currentStudents.length > 0) {
      const syncResult = await syncCohortStudents(newCohort.cohortId, newCohort.currentStudents);
      if (!syncResult.success) {
        console.warn(`Failed to sync students for cohort ${newCohort.cohortId}:`, syncResult.error);
      }
    }
    
    // Log cohort creation
    const headers = new Headers(request.headers);
    await logEntityCreate(
      AuditModule.COURSES,
      String(newCohort._id),
      newCohort.name || newCohort.cohortId || 'Unnamed Cohort',
      session.userId,
      session.email,
      'super_admin',
      session.tenantId,
      getClientIp(headers),
      getUserAgent(headers),
      {
        cohortId: newCohort.cohortId,
        name: newCohort.name,
        courseId: newCohort.courseId,
        instructor: newCohort.instructor
      }
    );
    
    const cohortObj = newCohort.toObject();
    return NextResponse.json({ 
      success: true,
      cohort: {
        ...cohortObj,
        id: newCohort.cohortId, // Map cohortId to id for frontend compatibility
        // Map timeSlot to direct properties expected by frontend
        startTime: cohortObj.timeSlot?.startTime || '',
        endTime: cohortObj.timeSlot?.endTime || '',
        // Include daysOfWeek for frontend
        daysOfWeek: cohortObj.daysOfWeek || [1, 2, 3, 4, 5],
        // Map database fields to frontend-expected field names
        instructorName: cohortObj.instructor || '',
        capacity: cohortObj.maxStudents || 0,
        members: cohortObj.currentStudents?.map((studentId: string) => ({ id: studentId, name: studentId })) || [],
        // Map schedule dates
        startDate: cohortObj.inheritedStartDate || '',
        endDate: cohortObj.inheritedEndDate || '',
      },
      created: true 
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error creating/updating cohort:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
    }
  );
}

export async function PUT(request: Request) {
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
    
    if (!body.id && !body.cohortId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cohort id required' 
      }, { status: 400 });
    }
    
    const cohortId = body.cohortId || body.id;
    
    // Map frontend data structure to database structure
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.courseId) updateData.courseId = body.courseId;
    if (body.startTime || body.endTime) {
      updateData.timeSlot = {
        startTime: body.startTime || '09:00',
        endTime: body.endTime || '10:00'
      };
    }
    if (body.daysOfWeek) updateData.daysOfWeek = body.daysOfWeek;
    if (body.instructorName || body.instructor) updateData.instructor = body.instructorName || body.instructor;
    if (body.location) updateData.location = body.location;
    if (body.capacity || body.maxStudents) updateData.maxStudents = parseInt(body.capacity) || body.maxStudents;
    const newStudents = body.members?.map((m: any) => m.id);
    if (newStudents) updateData.currentStudents = newStudents;
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.registrationOpen !== undefined) updateData.registrationOpen = body.registrationOpen;
    
    const updatedCohort = await Cohort.findOneAndUpdate(
      { cohortId, tenantId: session.tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedCohort) {
      return NextResponse.json({
        success: false,
        error: "Cohort not found"
      }, { status: 404 });
    }
    
    // If cohort name changed, cascade the update to all related collections
    if (existingCohort.name && updatedCohort.name && existingCohort.name !== updatedCohort.name) {
      try {
        const cascadeResult = await cascadeCohortNameUpdate(
          cohortId,
          existingCohort.name,
          updatedCohort.name,
          session.tenantId
        );
        console.log('Cohort name cascade update:', cascadeResult);
      } catch (err: any) {
        console.error('Error cascading cohort name update:', err.message);
      }
    }
    
    // Log cohort update
    const fieldChanges = Object.keys(updateData).map(key => ({
      field: key,
      oldValue: '',
      newValue: String(updateData[key] || '')
    }));
    
    if (fieldChanges.length > 0) {
      const headers = new Headers(request.headers);
      await logEntityUpdate(
        AuditModule.COURSES,
        String(updatedCohort._id),
        updatedCohort.name || updatedCohort.cohortId || 'Unnamed Cohort',
        fieldChanges,
        session.userId,
        session.email,
        'super_admin',
        session.tenantId,
        getClientIp(headers),
        getUserAgent(headers)
      );
    }
    
    // Sync students bidirectionally if student list was updated
    if (newStudents) {
      const syncResult = await syncCohortStudents(updatedCohort.cohortId, newStudents, session.tenantId);
      if (!syncResult.success) {
        console.warn(`Failed to sync students for cohort ${updatedCohort.cohortId}:`, syncResult.error);
      }
    }
    
    if (!updatedCohort) {
      return NextResponse.json({
        success: false,
        error: "Cohort not found"
      }, { status: 404 });
    }
    
    const cohortObj = updatedCohort.toObject();
    return NextResponse.json({ 
      success: true, 
      cohort: {
        ...cohortObj,
        id: updatedCohort.cohortId, // Map cohortId to id for frontend compatibility
        // Map timeSlot to direct properties expected by frontend
        startTime: cohortObj.timeSlot?.startTime || '',
        endTime: cohortObj.timeSlot?.endTime || '',
        // Include daysOfWeek for frontend
        daysOfWeek: cohortObj.daysOfWeek || [1, 2, 3, 4, 5],
        // Map database fields to frontend-expected field names
        instructorName: cohortObj.instructor || '',
        capacity: cohortObj.maxStudents || 0,
        members: cohortObj.currentStudents?.map((studentId: string) => ({ id: studentId, name: studentId })) || [],
        // Map schedule dates
        startDate: cohortObj.inheritedStartDate || '',
        endDate: cohortObj.inheritedEndDate || '',
      },
      updated: true 
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error updating cohort:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
    }
  );
}

export async function DELETE(request: Request) {
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
    
    if (!body.id && !body.cohortId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cohort id required' 
      }, { status: 400 });
    }
    
    const cohortId = body.cohortId || body.id;
    console.log("Attempting to soft delete cohort with ID:", cohortId);
    
    // Get cohort details before deletion for audit log
    const cohort = await Cohort.findOne({ cohortId, tenantId: session.tenantId });
    if (!cohort) {
      console.log("Cohort not found for deletion:", cohortId);
      return NextResponse.json({
        success: false,
        error: "Cohort not found"
      }, { status: 404 });
    }
    
    const result = await Cohort.updateOne(
      { cohortId, tenantId: session.tenantId }, 
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log("Cohort not found for deletion:", cohortId);
      return NextResponse.json({
        success: false,
        error: "Cohort not found"
      }, { status: 404 });
    }
    
    // Log cohort deletion
    const headers = new Headers(request.headers);
    await logEntityDelete(
      AuditModule.COURSES,
      String(cohort._id),
      cohort.name || cohort.cohortId || 'Unnamed Cohort',
      session.userId,
      session.email,
      'super_admin',
      session.tenantId,
      getClientIp(headers),
      getUserAgent(headers),
      {
        cohortId: cohort.cohortId,
        name: cohort.name,
        courseId: cohort.courseId
      }
    );
    
    console.log("Successfully soft deleted cohort:", cohortId);
    return NextResponse.json({
      success: true,
      deleted: true
    });
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.error("Error deleting cohort:", message);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
    }
  );
}
