# Name Cascade Update Implementation

## Overview
This feature ensures that when an instructor's or student's name is edited, the change automatically propagates to all places where that person is referenced throughout the system.

## Problem Solved
Previously, the system stored names in multiple places (denormalized data):

### For Instructors:
- Instructor collection (source of truth)
- Enrollment records
- Attendance records
- Schedule/Calendar events
- Course assignments
- Cohort assignments
- Draft records

### For Students:
- Student collection (source of truth)
- Enrollment records
- Attendance records
- Payment records
- Subscription records
- Referral records (referring student name)

When a name was updated, it only changed in the primary collection, leaving outdated names in all other places.

## Solution
Implemented a **cascade update mechanism** that automatically updates names across all related collections whenever a person's name is changed.

## Files Modified

### 1. New/Updated File: `lib/dashboard/cascade-updates.ts`
**Purpose:** Central library for handling cascading updates across related collections.

**Key Functions:**

#### For Instructors:
```typescript
cascadeInstructorNameUpdate(
  instructorId: string,
  oldName: string, 
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult>
```

**Collections Updated:**
- ✅ InstructorAttendance - Updates `instructorName` field
- ✅ InstructorAttendanceDraft - Updates `instructorName` field  
- ✅ InstructorDraft - Updates `instructorName` field
- ✅ Enrollment - Updates `instructorName` field
- ✅ Schedule - Updates `instructorName` field
- ✅ Course - Updates `instructor` field (full name)
- ✅ Cohort - Updates `instructor` field (full name)

#### For Students:
```typescript
cascadeStudentNameUpdate(
  studentId: string,
  oldName: string, 
  newName: string,
  tenantId: string
): Promise<CascadeUpdateResult>
```

**Collections Updated:**
- ✅ StudentAttendance - Updates `studentName` field
- ✅ StudentAttendanceDraft - Updates `studentName` field
- ✅ Enrollment - Updates `studentName` field
- ✅ Payment - Updates `studentName` field
- ✅ PaymentRecord - Updates `studentName` field
- ✅ PaymentTransaction - Updates `studentName` field
- ✅ MonthlySubscription - Updates `studentName` field
- ✅ Student (Referrals) - Updates `referringStudentName` field

### 2. Updated: `app/api/dashboard/staff/instructor/instructors/[id]/route.ts`
**Changes:**
- Imports cascade update utility
- Detects name changes by comparing old and new instructor names
- Calls `cascadeInstructorNameUpdate()` when name changes are detected
- Logs results for debugging

### 3. Updated: `app/api/dashboard/services/user-management/instructors/route.ts`
**Changes:**
- Imports cascade update utility
- Captures old name before update
- Calculates new name after update
- Triggers cascade update if name changed

### 4. Updated: `app/api/dashboard/staff/instructor/instructors/by-external/[externalId]/route.ts`
**Changes:**
- Imports cascade update utility
- Handles both updates and upserts (new records)
- Only cascades updates for existing records (not new inserts)
- Logs cascade results

### 5. Updated: `app/api/dashboard/student/students/route.ts`
**Changes:**
- Imports cascade update utility for students
- Captures old student name before update
- Calculates new name after update (from firstName, middleName, lastName)
- Triggers cascade update if name changed
- Logs cascade results

## How It Works

### Step-by-Step Flow:

**For Instructors:**
1. **User edits instructor name** in the instructor management UI
2. **API receives update request** with new name fields (firstName, middleName, lastName)
3. **System fetches existing instructor** to get current name
4. **Old name is calculated** by combining firstName + middleName + lastName
5. **Instructor record is updated** with new name fields
6. **New name is calculated** from updated record
7. **Names are compared** - if different, cascade update is triggered
8. **Cascade function runs** and updates all related collections
9. **Results are logged** for debugging and monitoring

**For Students:**
1. **User edits student name** in the student management UI
2. **API receives update request** with new name fields (firstName, middleName, lastName)
3. **System fetches existing student** to get current name
4. **Old name is calculated** by combining firstName + middleName + lastName
5. **Student record is updated** with new name fields
6. **New name is calculated** from updated record
7. **Names are compared** - if different, cascade update is triggered
8. **Cascade function runs** and updates all related collections
9. **Results are logged** for debugging and monitoring

### Example:

**Instructor Update:**
```
Old Name: "John Michael Smith"
New Name: "Jonathan Michael Smith"

Cascade Update Results:
- InstructorAttendance: 15 records updated
- Enrollment: 8 records updated
- Schedule: 23 records updated
- Course: 2 records updated
- Cohort: 3 records updated
```

**Student Update:**
```
Old Name: "Emma Rose Johnson"
New Name: "Emma Marie Johnson"

Cascade Update Results:
- StudentAttendance: 42 records updated
- Enrollment: 3 records updated
- Payment: 12 records updated
- PaymentRecord: 24 records updated
- PaymentTransaction: 18 records updated
- MonthlySubscription: 6 records updated
```

## Multi-Tenant Safety
All updates respect tenant boundaries:
- Every query includes `tenantId` filter
- One tenant's data never affects another tenant
- Uses the existing tenant plugin for data isolation

## Error Handling
- Each collection update is wrapped in try-catch
- If one collection fails, others still update
- Errors are logged but don't stop the instructor update
- Returns detailed error information for debugging

## Performance Considerations
- Updates run asynchronously after main instructor update
- Uses MongoDB bulk update operations where possible
- Indexed fields (instructorId, tenantId) ensure fast queries
- Logs show how many records were affected

## Testing the Feature

### Manual Test for Instructors:
1. Go to Instructor Management page
2. Select an instructor
3. Click "Edit" 
4. Change the instructor's name (first, middle, or last name)
5. Save changes
6. Check other areas where the instructor appears:
   - Attendance records
   - Course assignments
   - Schedule/Calendar events
   - Enrollment records
7. Verify the name is updated everywhere

### Manual Test for Students:
1. Go to Student Management page
2. Select a student
3. Click "Edit"
4. Change the student's name (first, middle, or last name)
5. Save changes
6. Check other areas where the student appears:
   - Attendance records
   - Enrollment records
   - Payment records
   - Subscription records
   - If this student referred others, check their referral records
7. Verify the name is updated everywhere

### What to Verify:

**For Instructors:**
- ✅ Name updates in instructor list
- ✅ Name updates in attendance records
- ✅ Name updates in course instructor field
- ✅ Name updates in cohort instructor field
- ✅ Name updates in schedule events
- ✅ Name updates in enrollment records

**For Students:**
- ✅ Name updates in student list
- ✅ Name updates in attendance records
- ✅ Name updates in enrollment records
- ✅ Name updates in payment records
- ✅ Name updates in subscription records
- ✅ Name updates in other students' referral fields

## Benefits
1. **Data Consistency** - No more mismatched names across the system (for both instructors and students)
2. **User Experience** - Changes reflect everywhere instantly
3. **Maintenance** - Reduces manual cleanup and data correction
4. **Reporting** - Accurate reports with consistent names
5. **Search** - Users can find data by current names
6. **Financial Accuracy** - Payment records always show correct student names
7. **Referral Tracking** - Referral chains maintain accurate names

## Future Enhancements
Consider adding:
- Audit trail showing name change history
- Notification to users when instructor names change
- Bulk rename capability for multiple instructors
- Validation to prevent duplicate names
- Option to preserve historical names in archive records

## Related Collections
Other collections that may store instructor references but are not currently updated:
- AuditLog (intentionally preserves historical data)
- Notifications (historical, shouldn't be changed)
- Messages (historical context)
- Payment records (historical for compliance)

## Notes
- The cascade update is **non-blocking** - primary update succeeds even if cascade fails
- Cascade results are **logged to console** for monitoring
- Updates are **tenant-isolated** for multi-tenancy security
- System uses person's **ID** (not name) as the primary key for relationships
- **Name fields** (firstName, middleName, lastName) are the source of truth
- Cascade updates work for both **instructors** and **students**
