# Attendance Terminology Fix Summary

## Issue
The non-instructor attendance system was using `studentId`/`studentName` terminology (copied from student attendance) instead of proper `instructorId`/`instructorName` terminology.

## Changes Made

### Backend API Routes (✅ COMPLETED)
1. **attendance/route.ts** - Removed `studentId`/`studentName` mapping from `toUi` function
2. **attendance/[id]/route.ts** - Removed student field conversion  
3. **attendance-drafts/route.ts** - Removed `studentId`/`studentName` fallback
4. **attendance-drafts/[id]/route.ts** - Removed student field conversion

### Frontend Components (⚠️ NEEDS MANUAL UPDATE)

The following files need to be updated to use `instructorId`/`instructorName` instead of `studentId`/`studentName`:

#### Type Definitions
- `add-attendance-dialog.tsx` - ✅ Renamed `StudentAttendanceRecord` to `NonInstructorAttendanceRecord`

#### Components Needing Field Name Updates

1. **add-attendance-dialog.tsx**
   - Variable: `newStudentId` → `newInstructorId`
   - Variable: `setNewStudentId` → `setNewInstructorId`
   - Variable: `studentsList` → `instructorsList`
   - Variable: `setStudentsList` → `setInstructorsList`
   - Variable: `studentSearchOpen` → `instructorSearchOpen`
   - Variable: `setStudentSearchOpen` → `setInstructorSearchOpen`
   - Variable: `studentQuery` → `instructorQuery`
   - Variable: `setStudentQuery` → `setInstructorQuery`
   - Variable: `studentsLoading` → `instructorsLoading`
   - Variable: `setStudentsLoading` → `setInstructorsLoading`
   - All field references: `.studentId` → `.instructorId`, `.studentName` → `.instructorName`

2. **attendance-table.tsx**
   - Interface: `StudentAttendanceRecord` → `NonInstructorAttendanceRecord`
   - Fields: `studentId` → `instructorId`, `studentName` → `instructorName`

3. **attendance-grid.tsx**
   - Fields: `studentId` → `instructorId`, `studentName` → `instructorName`

4. **attendance-drafts.tsx**
   - Interface fields: `studentId` → `instructorId`, `studentName` → `instructorName`

5. **attendance-summary.tsx**
   - Interface fields: `studentId` → `instructorId`, `studentName` → `instructorName`

6. **attendance-filters.tsx**
   - Field references: `row.studentId` → `row.instructorId`, `row.studentName` → `row.instructorName`

7. **attendance-search-filters.tsx**
   - Interface fields and all references: `studentId` → `instructorId`, `studentName` → `instructorName`

## Manual Steps Required

Due to the large number of occurrences (100+ matches), use a code editor's find-and-replace with the following patterns:

### In all attendance/*.tsx files:

1. Find: `StudentAttendanceRecord` → Replace: `NonInstructorAttendanceRecord`
2. Find: `studentId:` → Replace: `instructorId:`
3. Find: `studentName:` → Replace: `instructorName:`
4. Find: `.studentId` → Replace: `.instructorId`
5. Find: `.studentName` → Replace: `.instructorName`
6. Find: `newStudentId` → Replace: `newInstructorId`
7. Find: `setNewStudentId` → Replace: `setNewInstructorId`
8. Find: `studentsList` → Replace: `instructorsList`
9. Find: `setStudentsList` → Replace: `setInstructorsList`
10. Find: `studentSearchOpen` → Replace: `instructorSearchOpen`
11. Find: `setStudentSearchOpen` → Replace: `setInstructorSearchOpen`
12. Find: `studentQuery` → Replace: `instructorQuery`
13. Find: `setStudentQuery` → Replace: `setInstructorQuery`
14. Find: `studentsLoading` → Replace: `instructorsLoading`
15. Find: `setStudentsLoading` → Replace: `setInstructorsLoading`

### Scope
Apply these replacements only to files in:
- `components/dashboard/non-instructor/attendance/`

### Verification
After replacing, verify that:
1. No TypeScript errors remain
2. The API continues to work with `instructorId`/`instructorName` fields
3. Attendance records display correctly after page refresh
4. Draft saving and loading works properly

## Technical Notes

- The backend MongoDB models use `instructorId`/`instructorName` (correct)
- The API `toUi` functions no longer convert between student/instructor terminology
- All data now flows consistently using instructor terminology
- Tenant isolation is maintained via `tenantId` filtering throughout
