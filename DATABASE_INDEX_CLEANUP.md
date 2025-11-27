# Multi-Tenant Database Index Cleanup Guide

## Overview
This document provides instructions for cleaning up old global unique indexes from MongoDB after migrating to tenant-scoped compound indexes for proper multi-tenant isolation.

## Background
The application was updated to use tenant-scoped unique constraints instead of global unique constraints. This allows different tenants (academies) to independently use the same IDs (e.g., STU0001, COURSE0001) without conflicts.

**Before:** Global unique index on `studentId` prevented any two students across all tenants from having the same ID.

**After:** Compound unique index on `{ tenantId: 1, studentId: 1 }` allows each tenant to have their own STU0001, STU0002, etc.

## Models Updated
The following models were updated with tenant-scoped unique indexes:

1. **Student** (`students` collection)
2. **Course** (`courses` collection)
3. **Cohort** (`cohorts` collection)
4. **Instructor** (`instructors` collection)
5. **NonInstructor** (`non_instructors` collection)
6. **Schedule** (`schedules` collection)
7. **Event** (`events` collection)
8. **PaymentTransaction** (`paymenttransactions` collection)
9. **PaymentRecord** (`paymentrecords` collection)
10. **Enrollment** (`enrollments` collection)
11. **Draft** (`drafts` collection)
12. **HelpTicket** (`helptickets` collection)

## Database Cleanup Steps

### Prerequisites
1. Backup your MongoDB database before making any changes
2. Connect to your MongoDB instance using `mongosh` or MongoDB Compass
3. Select your database: `use your_database_name`

### Step 1: Verify Current Indexes
Check existing indexes for each collection to see which old indexes need to be dropped:

```javascript
// List all indexes for a collection
db.students.getIndexes()
db.courses.getIndexes()
db.cohorts.getIndexes()
db.instructors.getIndexes()
db.non_instructors.getIndexes()
db.schedules.getIndexes()
db.events.getIndexes()
db.paymenttransactions.getIndexes()
db.paymentrecords.getIndexes()
db.enrollments.getIndexes()
db.drafts.getIndexes()
db.helptickets.getIndexes()
```

### Step 2: Drop Old Global Unique Indexes

#### Student Collection
```javascript
db.students.dropIndex("studentId_1")
db.students.dropIndex("email_1")
```

#### Course Collection
```javascript
db.courses.dropIndex("courseId_1")
```

#### Cohort Collection
```javascript
db.cohorts.dropIndex("cohortId_1")
```

#### Instructor Collection
```javascript
db.instructors.dropIndex("externalId_1")
db.instructors.dropIndex("instructorId_1")
db.instructors.dropIndex("email_1")
```

#### NonInstructor Collection
```javascript
db.non_instructors.dropIndex("externalId_1")
db.non_instructors.dropIndex("email_1")
```

#### Schedule Collection
```javascript
db.schedules.dropIndex("sessionId_1")
```

#### Event Collection
```javascript
db.events.dropIndex("eventId_1")
```

#### PaymentTransaction Collection
```javascript
db.paymenttransactions.dropIndex("invoiceNumber_1")
db.paymenttransactions.dropIndex("receiptNumber_1")
```

#### PaymentRecord Collection
```javascript
db.paymentrecords.dropIndex("invoiceNumber_1")
db.paymentrecords.dropIndex("receiptNumber_1")
```

#### Enrollment Collection
```javascript
db.enrollments.dropIndex("studentId_1_courseId_1")
```

#### Draft Collection
```javascript
db.drafts.dropIndex("courseId_1")
```

#### HelpTicket Collection
```javascript
db.helptickets.dropIndex("ticketId_1")
```

### Step 3: Verify New Indexes Are Created
After dropping old indexes, restart your Next.js application. The new tenant-scoped compound indexes will be automatically created by Mongoose based on the updated schemas.

Verify the new indexes exist:

```javascript
// Check for tenant-scoped indexes
db.students.getIndexes().filter(idx => idx.key.tenantId)
db.courses.getIndexes().filter(idx => idx.key.tenantId)
// ... repeat for other collections
```

You should see indexes like:
```javascript
{
  "key": { "tenantId": 1, "studentId": 1 },
  "unique": true,
  "name": "tenantId_1_studentId_1"
}
```

### Step 4: Handle Index Drop Errors
If you encounter "index not found" errors, it means that index doesn't exist (which is fine). Continue with the next index.

If you encounter "index currently being built" errors, wait a few moments and try again.

## Verification Script
Run this script to check all collections have proper tenant-scoped indexes:

```javascript
const collections = [
  'students', 'courses', 'cohorts', 'instructors', 'non_instructors',
  'schedules', 'events', 'paymenttransactions', 'paymentrecords',
  'enrollments', 'drafts', 'helptickets'
];

collections.forEach(collectionName => {
  const indexes = db.getCollection(collectionName).getIndexes();
  const tenantIndexes = indexes.filter(idx => idx.key.tenantId);
  
  print(`\n${collectionName}:`);
  print(`  Total indexes: ${indexes.length}`);
  print(`  Tenant-scoped indexes: ${tenantIndexes.length}`);
  
  tenantIndexes.forEach(idx => {
    print(`    - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
  });
});
```

## Testing Multi-Tenant ID Isolation

### Test Case 1: Create Students with Same ID in Different Tenants
```javascript
// This should succeed - different tenants can have same studentId
db.students.insertOne({
  tenantId: "tenant_academy_a",
  studentId: "STU0001",
  email: "john@academya.com",
  firstName: "John",
  lastName: "Doe"
})

db.students.insertOne({
  tenantId: "tenant_academy_b",
  studentId: "STU0001",
  email: "jane@academyb.com",
  firstName: "Jane",
  lastName: "Smith"
})
```

### Test Case 2: Prevent Duplicate IDs Within Same Tenant
```javascript
// This should fail with duplicate key error
db.students.insertOne({
  tenantId: "tenant_academy_a",
  studentId: "STU0001", // Already exists in tenant_academy_a
  email: "another@academya.com",
  firstName: "Another",
  lastName: "Student"
})
```

### Test Case 3: Verify Course IDs Are Tenant-Scoped
```javascript
// Both should succeed
db.courses.insertOne({
  tenantId: "tenant_academy_a",
  courseId: "COURSE0001",
  name: "Math 101"
})

db.courses.insertOne({
  tenantId: "tenant_academy_b",
  courseId: "COURSE0001",
  name: "Physics 101"
})
```

## Rollback Plan
If you need to rollback to global unique indexes (not recommended for multi-tenant apps):

```javascript
// Example: Restore global unique index for studentId
db.students.createIndex({ studentId: 1 }, { unique: true, sparse: true })

// Then drop tenant-scoped index
db.students.dropIndex("tenantId_1_studentId_1")
```

## Important Notes

1. **Backup First:** Always backup your database before performing index operations
2. **Downtime Considerations:** Dropping/creating indexes on large collections may cause temporary performance degradation
3. **Application Restart:** After cleaning up indexes, restart your Next.js application to ensure schema synchronization
4. **Data Migration:** Ensure all existing documents have a `tenantId` field before creating tenant-scoped indexes
5. **Monitoring:** Monitor application logs for any "duplicate key" errors after cleanup

## Troubleshooting

### Issue: "Index not found" error
**Solution:** The index may already be dropped or never existed. Continue with next index.

### Issue: "Index currently being built"
**Solution:** Wait for the current index build to complete, then retry.

### Issue: Duplicate key errors after cleanup
**Solution:** This indicates data conflicts within a tenant. Query and fix conflicting documents:
```javascript
// Find duplicates within tenant
db.students.aggregate([
  { $match: { tenantId: "your_tenant_id" } },
  { $group: { _id: "$studentId", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

### Issue: Application crashes after cleanup
**Solution:** 
1. Check application logs for specific errors
2. Verify all models have tenantPlugin applied
3. Ensure all queries include tenantId filter
4. Restart the application to reinitialize Mongoose models

## Contact
For issues or questions regarding this migration, contact the development team.

---

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Status:** Production-ready
