# Cascade Updates Implementation Summary

## Overview
This document summarizes all cascade update functions implemented to maintain data consistency across denormalized fields in the UniqBrio multi-tenant application.

## What Are Cascade Updates?
Cascade updates automatically propagate changes from a primary entity to all related collections where that data is denormalized (duplicated). This ensures data consistency across the database.

## Implementation Details

### Core Library
**Location:** `lib/dashboard/cascade-updates.ts`

**Features:**
- Multi-tenant safe (always includes tenantId filter)
- Non-blocking (main update succeeds even if cascade fails)
- Comprehensive error logging
- Returns detailed update statistics

### Implemented Cascade Functions

#### 1. Student Cascade Updates

##### a) `cascadeStudentNameUpdate()`
**Triggers:** When student's firstName, middleName, or lastName changes  
**Updates:**
- StudentAttendance.studentName
- StudentAttendanceDraft.studentName
- Enrollment.studentName
- Payment.studentName
- PaymentRecord.studentName
- PaymentTransaction.studentName
- MonthlySubscription.studentName
- Student.referringStudentName (for referrals)

**Total Collections:** 8

##### b) `cascadeStudentEmailUpdate()`
**Triggers:** When student's email changes  
**Updates:**
- Payment.studentEmail

**Total Collections:** 1

##### c) `cascadeStudentCategoryUpdate()`
**Triggers:** When student's category changes  
**Updates:**
- Payment.studentCategory

**Total Collections:** 1

##### d) `cascadeStudentCourseTypeUpdate()`
**Triggers:** When student's courseType changes  
**Updates:**
- Payment.courseType

**Total Collections:** 1

**API Endpoint:** `app/api/dashboard/student/students/route.ts` (PUT handler)

---

#### 2. Instructor Cascade Updates

##### `cascadeInstructorNameUpdate()`
**Triggers:** When instructor's firstName, middleName, or lastName changes  
**Updates:**
- InstructorAttendance.instructorName
- InstructorAttendanceDraft.instructorName
- InstructorDraft.instructorName
- Enrollment.instructorName
- Schedule.instructorName
- Course.instructor (full name field)
- Cohort.instructor (full name field)

**Total Collections:** 7

**API Endpoints:**
- `app/api/dashboard/staff/instructor/instructors/[id]/route.ts` (PUT handler)
- `app/api/dashboard/services/user-management/instructors/route.ts` (PUT handler)
- `app/api/dashboard/staff/instructor/instructors/by-external/[externalId]/route.ts` (PUT handler)

---

#### 3. Course Cascade Updates

##### `cascadeCourseNameUpdate()`
**Triggers:** When course name changes  
**Updates:**
- Enrollment.courseName
- StudentAttendance.courseName
- StudentAttendanceDraft.courseName
- PaymentRecord.courseName
- PaymentTransaction.courseName
- MonthlySubscription.courseName
- Student.enrolledCourseName
- Payment.enrolledCourseName

**Total Collections:** 8

**API Endpoint:** `app/api/dashboard/services/courses/route.ts` (PUT handler)

---

#### 4. Cohort Cascade Updates

##### `cascadeCohortNameUpdate()`
**Triggers:** When cohort name changes  
**Updates:**
- StudentAttendance.cohortName
- StudentAttendanceDraft.cohortName
- MonthlySubscription.cohortName
- Payment.cohortName
- Instructor.cohortName (comma-separated list)

**Total Collections:** 5

**API Endpoint:** `app/api/dashboard/services/cohorts/route.ts` (PUT handler)

---

#### 5. Non-Instructor Cascade Updates

##### `cascadeNonInstructorNameUpdate()`
**Triggers:** When non-instructor's firstName, middleName, or lastName changes  
**Updates:**
- NonInstructorAttendance.instructorName
- NonInstructorAttendanceDraft.instructorName
- NonInstructorDraft.instructorName

**Total Collections:** 3

**API Endpoint:** `app/api/dashboard/staff/non-instructor/non-instructors/[id]/route.ts` (PUT handler)

---

## Helper Functions

### Name Building Functions
- `buildInstructorFullName(firstName, middleName?, lastName?)` - Constructs full name for instructors
- `buildStudentFullName(firstName?, middleName?, lastName?)` - Constructs full name for students
- `buildNonInstructorFullName(firstName, middleName?, lastName?)` - Constructs full name for non-instructors

### Return Type
All cascade functions return `CascadeUpdateResult`:
```typescript
interface CascadeUpdateResult {
  success: boolean
  updatedCollections: {
    collection: string
    count: number
  }[]
  errors?: string[]
}
```

## Summary Statistics

| Entity Type | Cascade Functions | Total Collections Updated |
|-------------|-------------------|---------------------------|
| Student | 4 | 11 (with overlaps) |
| Instructor | 1 | 7 |
| Course | 1 | 8 |
| Cohort | 1 | 5 |
| Non-Instructor | 1 | 3 |
| **Total** | **8** | **31+ unique updates** |

## Usage Pattern

### In API Endpoints
```typescript
// 1. Get old record
const oldRecord = await Model.findOne({ id, tenantId });
const oldValue = oldRecord?.field;

// 2. Perform update
const updated = await Model.findOneAndUpdate({ id, tenantId }, { $set: { field: newValue } });

// 3. Check if field changed
if (oldValue && oldValue !== newValue) {
  try {
    const cascadeResult = await cascadeFieldUpdate(id, oldValue, newValue, tenantId);
    console.log('Cascade update:', cascadeResult);
  } catch (err) {
    console.error('Error cascading update:', err.message);
  }
}
```

## Benefits

1. **Data Consistency** - Ensures denormalized data stays in sync across all collections
2. **Multi-Tenant Safety** - All updates respect tenant boundaries
3. **Non-Blocking** - Main operations succeed even if cascade fails
4. **Comprehensive Logging** - Detailed statistics for monitoring
5. **Maintainable** - Centralized in one library file
6. **Scalable** - Easy to add new cascade functions

## Fields NOT Requiring Cascade Updates

The following fields are **foreign keys** (references) and don't need cascading:
- `studentId` - Immutable identifier
- `instructorId` - Immutable identifier  
- `courseId` - Immutable identifier
- `cohortId` - Immutable identifier
- `enrollmentId` - Immutable identifier

These IDs never change, so denormalized copies don't need updates.

## Testing

All cascade functions have been validated:
- ✅ TypeScript compilation successful
- ✅ No syntax errors
- ✅ Multi-tenant context properly applied
- ✅ Error handling implemented
- ✅ Logging added to all endpoints

## Future Enhancements

Potential additions if needed:
1. Batch cascade operations for bulk updates
2. Cascade history/audit trail
3. Rollback functionality for failed cascades
4. Performance metrics and monitoring
5. Cascade update queuing for high-volume operations

---

**Last Updated:** December 23, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
