import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Student from '@/models/dashboard/student/Student';
import Achievement from '@/models/dashboard/student/Achievement';
import Cohort from '@/models/dashboard/student/Cohort';
import { enrollStudentInCohort, removeStudentFromCohort } from '@/lib/dashboard/studentCohortSync';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { logEntityDelete, getClientIp, getUserAgent } from '@/lib/audit-logger';

// Helper: generate the next available (gap-filling) student ID like STU0003.
// Strategy:
// 1. Fetch all existing numeric parts (only pattern STUdddd) once (capped to needed fields).
// 2. Build a boolean presence map.
// 3. Return the lowest missing number >= 1; if no gaps, return max+1.
// 4. Race condition protection: re-check chosen ID before returning; if taken, loop a few times.
async function generateNextStudentId(tenantId: string): Promise<string> {
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
    const existing = await Student.find(
      { studentId: { $regex: /^STU\d{4}$/ }, tenantId },
      { studentId: 1, _id: 0 }
    ).lean();

    const numbers: number[] = [];
    for (const s of existing) {
      const n = parseInt(String(s.studentId).substring(3), 10);
      if (!Number.isNaN(n) && n > 0) numbers.push(n);
    }
    numbers.sort((a, b) => a - b);

    // Find first missing positive integer
    let candidateNum = 1;
    for (const n of numbers) {
      if (n === candidateNum) {
        candidateNum++;
      } else if (n > candidateNum) {
        // Gap found
        break;
      }
    }
    const candidateId = `STU${String(candidateNum).padStart(4, '0')}`;
    const collision = await Student.findOne({ studentId: candidateId, tenantId }).lean();
    if (!collision) {
      return candidateId;
    }
    attempts++;
      }
      // Fallback if persistent collisions (should be rare)
      return `STU${String(Date.now() % 10000).padStart(4, '0')}`;
}

// GET all students with achievements populated
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
      await dbConnect("uniqbrio");
      const url = new URL(req.url);
      const debug = url.searchParams.has('debug');
      const force = url.searchParams.has('reconcile');
      const includeDeleted = url.searchParams.has('includeDeleted'); // Add query param for deleted students
      
      try {
        // Filter out soft-deleted students by default
        // CRITICAL: Explicitly set tenantId to ensure tenant isolation
        const filter = includeDeleted 
          ? { tenantId: session.tenantId } 
          : { isDeleted: { $ne: true }, tenantId: session.tenantId };
        
        // Use lean() for better performance - returns plain JS objects
        const students = await Student.find(filter).lean();

            // Index students by both studentId and _id for flexible matching
            const studentByStudentId = new Map<string, any>();
            const studentByMongoId = new Map<string, any>();
            students.forEach(s => {
      studentByStudentId.set(s.studentId, s);
      if (s._id) studentByMongoId.set(String(s._id), s);
    });

              // Only fetch minimal cohort data needed for membership lookup
              const cohorts = await Cohort.find(
                { tenantId: session.tenantId }, 
                { id: 1, cohortId: 1, enrolledStudents: 1, members: 1, currentStudents: 1 }
              ).lean();
            const cohortMembershipMap = new Map<string, string>(); // studentId -> cohortId

            const normalizeEntry = (entry: any): string | null => {
      if (!entry) return null;
      if (typeof entry === 'string') return entry.trim();
      if (typeof entry === 'object') {
        return entry.studentId || entry.id || entry._id || null;
      }
      return null;
    };

            for (const c of cohorts) {
      const cid = (c as any).id || (c as any).cohortId;
      if (!cid) continue;
      const raw = Array.isArray((c as any).enrolledStudents)
        ? (c as any).enrolledStudents
        : Array.isArray((c as any).members)
          ? (c as any).members
          : Array.isArray((c as any).currentStudents)
            ? (c as any).currentStudents
            : [];
      for (const entry of raw) {
        const key = normalizeEntry(entry);
        if (!key) continue;
        // Resolve key to a studentId if possible
        let resolvedStudentId: string | null = null;
        if (studentByStudentId.has(key)) {
          resolvedStudentId = key;
        } else if (studentByMongoId.has(key)) {
          resolvedStudentId = studentByMongoId.get(key).studentId;
        } else {
          // Sometimes key might differ by case
          const lowerMatch = Array.from(studentByStudentId.keys()).find(k => k.toLowerCase() === key.toLowerCase());
          if (lowerMatch) resolvedStudentId = lowerMatch;
        }
        if (resolvedStudentId && !cohortMembershipMap.has(resolvedStudentId)) {
          cohortMembershipMap.set(resolvedStudentId, cid);
        }
      }
    }

            if (debug) {
      console.log('[GET /api/students] Cohort reconciliation snapshot:', {
        cohorts: cohorts.length,
        membershipsDiscovered: cohortMembershipMap.size,
        students: students.length
      });
    }

            const reconcilePromises: Promise<any>[] = [];
            const toIso = (d: any) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);

            // Using lean() returns plain JS objects, no need for toObject()
            const result = students.map((s: any) => {
      // Migration: Handle legacy field names (mutate in place since s is already a plain object)
      if (s.batch && !s.cohortId) {
        s.cohortId = s.batch;
      }
      if (s.cohort && !s.cohortId) {
        s.cohortId = s.cohort;
      }
      if (s.activity && !s.courseOfInterestId) {
        s.courseOfInterestId = s.activity;
      }
      if (s.memberSince && !s.registrationDate) {
        s.registrationDate = s.memberSince;
      }
      if (s.enrolledCourse && !s.enrolledCourseName) {
        s.enrolledCourseName = s.enrolledCourse;
      }
      if (s.program && !s.enrolledCourseName) {
        s.enrolledCourseName = s.program;
      }
      
      const existingCohort = s.cohortId;
      const inferred = cohortMembershipMap.get(s.studentId);
      if ((!existingCohort && inferred) || (force && inferred && existingCohort !== inferred)) {
        s.cohortId = inferred;
        reconcilePromises.push(
          Student.updateOne(
            { studentId: s.studentId },
            { $set: { cohortId: inferred }, $unset: { batch: '', cohort: '' } }
          ).catch(e =>
            console.warn('[GET /api/students] Persist cohort failed', s.studentId, e?.message)
          )
        );
        if (debug) console.log(`[GET /api/students] Reconciled ${s.studentId}: ${existingCohort || '(empty)'} -> ${inferred}`);
      }
      return {
        id: s.studentId,
        studentId: s.studentId,
        name: s.name,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        gender: s.gender,
        dob: toIso(s.dob),
        mobile: s.mobile,
        countryCode: s.countryCode,
        country: s.country,
        stateProvince: s.stateProvince,
        email: s.email,
        address: s.address,
        courseOfInterestId: s.courseOfInterestId,
        enrolledCourse: s.enrolledCourse, // Enrolled Course ID
        enrolledCourseName: s.enrolledCourseName,
        category: s.category,
        courseType: s.courseType,
        courseLevel: s.courseLevel,
        registrationDate: toIso(s.registrationDate),
        courseStartDate: toIso(s.courseStartDate),
        referredBy: s.referredBy,
        referringStudentName: s.referringStudentName,
        referringStudentId: s.referringStudentId,
        guardian: s.guardian,
        guardianFirstName: s.guardianFirstName,
        guardianMiddleName: s.guardianMiddleName,
        guardianLastName: s.guardianLastName,
        guardianCountryCode: s.guardianCountryCode,
        communicationPreferences: s.communicationPreferences,
        cohortId: s.cohortId,
      };
    });

            Promise.allSettled(reconcilePromises).then(r => {
      const failures = r.filter(x => x.status === 'rejected').length;
      if (failures) console.warn(`[GET /api/students] ${failures} reconciliation updates failed.`);
    });
            return NextResponse.json(result);
      } catch (error) {
    console.error('Error fetching students:', error);
            return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
      }
    }
      );
}

// POST a new student (optionally with achievements)
export async function POST(req: NextRequest) {
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
      await dbConnect("uniqbrio");
      try {
    const data = await req.json();

      // Normalize some known field name differences (legacy support)
      if (!data.mobile && data.phone) data.mobile = data.phone;
      if (!data.cohortId && data.cohort) data.cohortId = data.cohort;
      if (!data.cohortId && data.batch) data.cohortId = data.batch;
      if (!data.courseOfInterestId && data.activity) data.courseOfInterestId = data.activity;
      if (!data.registrationDate && data.memberSince) data.registrationDate = data.memberSince;
      if (!data.enrolledCourseName && data.enrolledCourse) data.enrolledCourseName = data.enrolledCourse;
      if (!data.enrolledCourseName && data.program) data.enrolledCourseName = data.program;

    // Generate sequential student ID if not provided or if it's a temp ID
    if (!data.studentId || !data.id || data.studentId.startsWith('TEMP_') || data.id.startsWith('TEMP_')) {
      // Generate new ID and check for conflicts
      let attempts = 0;
      let newStudentId = '';
      while (attempts < 3) {
        newStudentId = await generateNextStudentId(session.tenantId);
        const existingById = await Student.findOne({ studentId: newStudentId, tenantId: session.tenantId }).lean();
        if (!existingById) {
          break; // Found a unique ID
        }
        attempts++;
      }
      data.studentId = newStudentId;
    } else if (!data.studentId && data.id) {
      data.studentId = data.id;
    }

    // Coerce string dates to Date
    const toDate = (v: any) => (v ? new Date(v) : undefined);
    data.registrationDate = toDate(data.registrationDate);
    data.courseStartDate = toDate(data.courseStartDate);
    if (typeof data.dob === 'string') data.dob = toDate(data.dob);

    // Only allow fields from Add Student form
    const allowed = ((s: any) => ({
      studentId: s.studentId,
      name: s.name,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      gender: s.gender,
      dob: s.dob,
      mobile: s.mobile,
      countryCode: s.countryCode,
      country: s.country,
      stateProvince: s.stateProvince,
      email: s.email,
      address: s.address,
      courseOfInterestId: s.courseOfInterestId, // Course of Interest ID
      enrolledCourseName: s.enrolledCourseName, // Enrolled Course Name
      category: s.category,
      courseType: s.courseType,
      courseLevel: s.courseLevel,
      registrationDate: s.registrationDate,
      courseStartDate: s.courseStartDate,
      referredBy: s.referredBy,
      referringStudentName: s.referringStudentName,
      referringStudentId: s.referringStudentId,
      guardian: s.guardian,
      guardianFirstName: s.guardianFirstName,
      guardianMiddleName: s.guardianMiddleName,
      guardianLastName: s.guardianLastName,
      guardianCountryCode: s.guardianCountryCode,
      communicationPreferences: s.communicationPreferences,
      cohortId: s.cohortId,
    }))(data);

    // Normalize email: trim whitespace and convert to lowercase for consistent storage
    const normalizedEmail = data.email?.trim().toLowerCase();
    allowed.email = normalizedEmail; // Update the allowed object with normalized email
    
    const student = await Student.create({ ...allowed, tenantId: session.tenantId });
    console.log('POST /api/students - Created student with cohortId:', student.cohortId);

    // Bidirectional sync: If student was assigned to a cohort, update the cohort's currentStudents array
    if (student.cohortId) {
      console.log(`🔄 Syncing student ${student.studentId} with cohort ${student.cohortId}`);
      const syncResult = await enrollStudentInCohort(student.studentId, student.cohortId);
      if (!syncResult.success) {
        console.warn(`⚠️ Failed to sync student to cohort: ${syncResult.error}`);
      } else {
        console.log(`✅ Successfully synced student to cohort`);
      }
    } else {
      console.log(`ℹ️ No cohort assignment for student ${student.studentId}`);
    }

            const toIso = (d: any) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);
    const s = student.toObject();
    const pick = {
      id: s.studentId,
      studentId: s.studentId,
      name: s.name,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      gender: s.gender,
      dob: toIso(s.dob),
      mobile: s.mobile,
      countryCode: s.countryCode,
      country: s.country,
      stateProvince: s.stateProvince,
      email: s.email,
      address: s.address,
      courseOfInterestId: s.courseOfInterestId,
      enrolledCourseName: s.enrolledCourseName,
      category: s.category,
      courseType: s.courseType,
      courseLevel: s.courseLevel,
      registrationDate: toIso(s.registrationDate),
      courseStartDate: toIso(s.courseStartDate),
      referredBy: s.referredBy,
      referringStudentName: s.referringStudentName,
      referringStudentId: s.referringStudentId,
      guardian: s.guardian,
      guardianFirstName: s.guardianFirstName,
      guardianMiddleName: s.guardianMiddleName,
      guardianLastName: s.guardianLastName,
      guardianCountryCode: s.guardianCountryCode,
      communicationPreferences: s.communicationPreferences,
      cohortId: s.cohortId,
    } as any;
    
    // Create audit log for student creation
    try {
      const ipAddress = getClientIp(req.headers);
      const userAgent = getUserAgent(req.headers);
      const { logEntityCreate } = await import('@/lib/audit-logger');
      await logEntityCreate(
        'Students',
        String(student._id),
        `${student.name} (${student.studentId})`,
        String(session.userId),
        String(session.email),
        String(session.role),
        session.tenantId,
        ipAddress,
        userAgent,
        {
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          cohort: student.cohortId,
          registrationDate: student.registrationDate
        }
      );
    } catch (auditError) {
      console.error('Failed to create audit log for student creation:', auditError);
    }
    
    console.log('POST /api/students - Successfully created student:', pick.name);
            return NextResponse.json(pick, { status: 201 });
      } catch (error: any) {
    console.error('POST /api/students - Error creating student:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'email') {
        console.log('POST /api/students - MongoDB duplicate email error caught');
        return NextResponse.json({ error: 'A student with this email already exists' }, { status: 409 });
      } else if (field === 'studentId') {
        console.log('POST /api/students - MongoDB duplicate studentId error caught');
        return NextResponse.json({ error: 'A student with this student ID already exists' }, { status: 409 });
      } else {
        console.log('POST /api/students - MongoDB duplicate key error for field:', field);
        return NextResponse.json({ error: `A student with this ${field} already exists` }, { status: 409 });
      }
    }
    
            return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
      }
    }
      );
}

// PUT update an existing student by studentId
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
      await dbConnect("uniqbrio");
      try {
      const data = await req.json();
    console.log('PUT /api/students - Received data:', JSON.stringify(data, null, 2));
    
    // Normalize legacy field names
    if (!data.cohortId && data.cohort) data.cohortId = data.cohort;
    if (!data.cohortId && data.batch) data.cohortId = data.batch;
    if (!data.courseOfInterestId && data.activity) data.courseOfInterestId = data.activity;
    if (!data.registrationDate && data.memberSince) data.registrationDate = data.memberSince;
    if (!data.enrolledCourseName && data.enrolledCourse) data.enrolledCourseName = data.enrolledCourse;
    if (!data.enrolledCourseName && data.program) data.enrolledCourseName = data.program;
    
    const studentId = data.studentId || data.id;
    if (!studentId) {
      console.error('PUT /api/students - No student ID provided');
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    
    console.log('PUT /api/students - Updating student with ID:', studentId);

    // Coerce string dates to Date for update path as well
    const toDate = (v: any) => (v ? new Date(v) : undefined);
    if (typeof data.registrationDate === 'string') data.registrationDate = toDate(data.registrationDate);
    if (typeof data.courseStartDate === 'string') data.courseStartDate = toDate(data.courseStartDate);
    if (typeof data.dob === 'string') data.dob = toDate(data.dob);

    // Only allow fields from Add Student form on update
    const allowed = ((s: any) => ({
      name: s.name,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      gender: s.gender,
      dob: s.dob,
      mobile: s.mobile,
      countryCode: s.countryCode,
      country: s.country,
      stateProvince: s.stateProvince,
      email: s.email,
      address: s.address,
      courseOfInterestId: s.courseOfInterestId, // Course of Interest ID
      enrolledCourse: s.enrolledCourse, // Enrolled Course ID
      enrolledCourseName: s.enrolledCourseName, // Enrolled Course Name
      category: s.category,
      courseType: s.courseType,
      courseLevel: s.courseLevel,
      registrationDate: s.registrationDate,
      courseStartDate: s.courseStartDate,
      referredBy: s.referredBy,
      referringStudentName: s.referringStudentName,
      referringStudentId: s.referringStudentId,
      guardian: s.guardian,
      guardianFirstName: s.guardianFirstName,
      guardianMiddleName: s.guardianMiddleName,
      guardianLastName: s.guardianLastName,
      guardianCountryCode: s.guardianCountryCode,
      communicationPreferences: s.communicationPreferences,
      cohortId: s.cohortId,
    }))(data);

    console.log('PUT /api/students - Updating with allowed fields:', JSON.stringify(allowed, null, 2));
    
    // Get the old student record to check for cohort changes
    const oldStudent = await Student.findOne({ studentId, tenantId: session.tenantId });
    const oldCohortId = oldStudent?.cohortId;
    
    const updated = await Student.findOneAndUpdate(
      { studentId, tenantId: session.tenantId },
      { $set: { ...allowed, studentId }, $unset: { batch: '', cohort: '', activity: '', memberSince: '', program: '' } },
      { new: true }
    );
    
    console.log('PUT /api/students - Update result:', updated ? 'Found and updated' : 'Student not found');
    
    // Bidirectional sync: Handle cohort changes
    if (updated && oldCohortId !== data.cohortId) {
      // Remove from old cohort if it exists
      if (oldCohortId) {
        console.log(`🔄 Removing student ${studentId} from old cohort ${oldCohortId}`);
        const removeResult = await removeStudentFromCohort(oldCohortId, studentId);
        if (!removeResult.success) {
          console.warn(`⚠️ Failed to remove student from old cohort: ${removeResult.error}`);
        }
      }
      
      // Add to new cohort if it exists
      if (data.cohortId) {
        console.log(`🔄 Adding student ${studentId} to new cohort ${data.cohortId}`);
        const addResult = await enrollStudentInCohort(studentId, data.cohortId);
        if (!addResult.success) {
          console.warn(`⚠️ Failed to add student to new cohort: ${addResult.error}`);
        } else {
          console.log(`✅ Successfully synced student to new cohort`);
        }
      }
    }
    
    if (!updated) {
      console.error('PUT /api/students - Student not found with ID:', studentId);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Track field changes for audit log
    const fieldChanges = [];
    if (oldStudent) {
      const compareFields = [
        { field: 'name', old: oldStudent.name, new: updated.name },
        { field: 'email', old: oldStudent.email, new: updated.email },
        { field: 'mobile', old: oldStudent.mobile, new: updated.mobile },
        { field: 'cohortId', old: oldStudent.cohortId, new: updated.cohortId },
        { field: 'enrolledCourseName', old: oldStudent.enrolledCourseName, new: updated.enrolledCourseName },
      ];
      
      for (const { field, old: oldVal, new: newVal } of compareFields) {
        if (oldVal !== newVal) {
          fieldChanges.push({
            field,
            oldValue: String(oldVal || ''),
            newValue: String(newVal || '')
          });
        }
      }
    }
    
    // Create audit log for student update
    if (fieldChanges.length > 0) {
      try {
        const ipAddress = getClientIp(req.headers);
        const userAgent = getUserAgent(req.headers);
        const { logEntityUpdate } = await import('@/lib/audit-logger');
        await logEntityUpdate(
          'Students',
          String(updated._id),
          `${updated.name} (${updated.studentId})`,
          fieldChanges,
          String(session.userId),
          String(session.email),
          String(session.role),
          session.tenantId,
          ipAddress,
          userAgent
        );
      } catch (auditError) {
        console.error('Failed to create audit log for student update:', auditError);
      }
    }
    
            const toIso = (d: any) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);
    const s = updated.toObject();
    const pick = {
      id: s.studentId,
      studentId: s.studentId,
      name: s.name,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      gender: s.gender,
      dob: toIso(s.dob),
      mobile: s.mobile,
      countryCode: s.countryCode,
      country: s.country,
      stateProvince: s.stateProvince,
      email: s.email,
      address: s.address,
      courseOfInterestId: s.courseOfInterestId,
      enrolledCourse: s.enrolledCourse, // Enrolled Course ID
      enrolledCourseName: s.enrolledCourseName,
      category: s.category,
      courseType: s.courseType,
      courseLevel: s.courseLevel,
      registrationDate: toIso(s.registrationDate),
      courseStartDate: toIso(s.courseStartDate),
      referredBy: s.referredBy,
      referringStudentName: s.referringStudentName,
      referringStudentId: s.referringStudentId,
      guardian: s.guardian,
      guardianFirstName: s.guardianFirstName,
      guardianMiddleName: s.guardianMiddleName,
      guardianLastName: s.guardianLastName,
      guardianCountryCode: s.guardianCountryCode,
      communicationPreferences: s.communicationPreferences,
      cohortId: s.cohortId,
    } as any;
    console.log('PUT /api/students - Successfully updated student:', pick.name);
            return NextResponse.json(pick, { status: 200 });
      } catch (error) {
    console.error('PUT /api/students - Error updating student:', error);
            return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
      }
    }
      );
}

// DELETE a student by studentId
export async function DELETE(req: NextRequest) {
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
      await dbConnect("uniqbrio");
      try {
    const { id, studentId, hardDelete } = await req.json();
    const key = id || studentId;
    if (!key) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    
    // Support hard delete with explicit flag (use with caution)
    if (hardDelete === true) {
      const student = await Student.findOneAndDelete({ studentId: key, tenantId: session.tenantId });
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      
      // Remove student from any cohorts they're enrolled in
      if (student.cohortId) {
        console.log(`🔄 Removing student ${student.studentId} from cohort ${student.cohortId}`);
        const removeResult = await removeStudentFromCohort(student.cohortId, student.studentId);
        if (!removeResult.success) {
          console.warn(`⚠️ Failed to remove student from cohort: ${removeResult.error}`);
        } else {
          console.log(`✅ Successfully removed student from cohort`);
        }
      }
      
      // Also remove from any additional cohorts in the cohorts array
      if (student.cohorts && Array.isArray(student.cohorts) && student.cohorts.length > 0) {
        for (const cohortId of student.cohorts) {
          if (cohortId && cohortId !== student.cohortId) {
            console.log(`🔄 Removing student ${student.studentId} from additional cohort ${cohortId}`);
            await removeStudentFromCohort(cohortId, student.studentId);
          }
        }
      }
      
      // Create audit log for hard delete
      try {
        const ipAddress = getClientIp(req.headers);
        const userAgent = getUserAgent(req.headers);
        await logEntityDelete(
          'Students',
          String(student._id),
          `${student.name} (${student.studentId})`,
          String(session.userId),
          String(session.email),
          String(session.role),
          session.tenantId,
          ipAddress,
          userAgent,
          {
            studentId: student.studentId,
            name: student.name,
            email: student.email,
            cohort: student.cohort,
            deleteType: 'hard'
          }
        );
      } catch (auditError) {
        console.error('Failed to create audit log for hard delete:', auditError);
      }
      
      // Optionally, delete related achievements
      await Achievement.deleteMany({ 
        $or: [{ student: student._id }, { studentId: student.studentId }],
        tenantId: session.tenantId 
      });
      return NextResponse.json({ success: true, message: 'Student permanently deleted' });
    }
    
    // Default: Soft delete
    const student = await Student.findOne({ studentId: key, tenantId: session.tenantId });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Remove student from any cohorts they're enrolled in before soft delete
    if (student.cohortId) {
      console.log(`🔄 Removing student ${student.studentId} from cohort ${student.cohortId} (soft delete)`);
      const removeResult = await removeStudentFromCohort(student.cohortId, student.studentId);
      if (!removeResult.success) {
        console.warn(`⚠️ Failed to remove student from cohort: ${removeResult.error}`);
      } else {
        console.log(`✅ Successfully removed student from cohort`);
      }
    }
    
    // Also remove from any additional cohorts in the cohorts array
    if (student.cohorts && Array.isArray(student.cohorts) && student.cohorts.length > 0) {
      for (const cohortId of student.cohorts) {
        if (cohortId && cohortId !== student.cohortId) {
          console.log(`🔄 Removing student ${student.studentId} from additional cohort ${cohortId}`);
          await removeStudentFromCohort(cohortId, student.studentId);
        }
      }
    }
    
    // Mark as deleted instead of removing from database
    student.isDeleted = true;
    student.deletedAt = new Date();
    await student.save();
    
    // Create audit log for soft delete
    try {
      const ipAddress = getClientIp(req.headers);
      const userAgent = getUserAgent(req.headers);
      await logEntityDelete(
        'Students',
        String(student._id),
        `${student.name} (${student.studentId})`,
        String(session.userId),
        String(session.email),
        String(session.role),
        session.tenantId,
        ipAddress,
        userAgent,
        {
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          cohort: student.cohort,
          deleteType: 'soft'
        }
      );
    } catch (auditError) {
      console.error('Failed to create audit log for soft delete:', auditError);
    }
    
            return NextResponse.json({ 
      success: true, 
      message: 'Student marked as deleted',
      studentId: student.studentId 
    });
      } catch (error) {
    console.error('Delete student error:', error);
            return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
      }
    }
      );
}
