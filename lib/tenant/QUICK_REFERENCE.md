# Quick Reference: Common Multi-Tenant Operations

This guide provides quick copy-paste examples for common multi-tenant operations.

## 1. API Route with Automatic Tenant Filtering

```typescript
import { withTenant } from '@/lib/tenant/tenant-middleware';
import { dbConnect } from '@/lib/mongodb';
import Student from '@/models/dashboard/student/Student';

export const GET = withTenant(async (request) => {
  await dbConnect('uniqbrio');
  
  // Automatically filtered by current tenant
  const students = await Student.find({ status: 'active' });
  
  return Response.json({ students, count: students.length });
});
```

## 2. Get Current Tenant ID

```typescript
import { requireTenantId, getTenantContext } from '@/lib/tenant/tenant-context';

// Option A: Require tenant (throws error if not found)
const tenantId = requireTenantId();

// Option B: Get tenant context (returns undefined if not found)
const context = getTenantContext();
if (context) {
  console.log('Tenant ID:', context.tenantId);
}
```

## 3. Create New Document (Auto-adds tenantId)

```typescript
import Course from '@/models/dashboard/Course';

// tenantId is automatically added from context
const course = await Course.create({
  name: 'Advanced JavaScript',
  status: 'Active',
  instructor: 'John Doe',
  // NO NEED to add tenantId manually!
});
```

## 4. Update Operations (Auto-filtered)

```typescript
// All updates are automatically filtered by tenantId
await Course.updateOne(
  { courseId: 'COURSE001' },
  { $set: { status: 'Inactive' } }
);

await Course.updateMany(
  { status: 'Draft' },
  { $set: { status: 'Active' } }
);
```

## 5. Delete Operations (Auto-filtered)

```typescript
// Only deletes documents belonging to current tenant
await Student.deleteOne({ studentId: 'STU001' });

await Payment.deleteMany({ status: 'cancelled' });
```

## 6. Aggregation Pipelines (Auto-filtered)

```typescript
const stats = await Instructor.aggregate([
  { $match: { status: 'Active' } }, // tenantId auto-added to this
  { $group: {
    _id: '$department',
    count: { $sum: 1 }
  }}
]);
```

## 7. Run Operation for Specific Tenant

```typescript
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

await runWithTenantContext({ tenantId: 'academy1' }, async () => {
  // All operations here use 'academy1' as tenant
  const courses = await Course.find({});
  return courses;
});
```

## 8. Cross-Tenant Admin Operations

```typescript
import mongoose from 'mongoose';

// Use native MongoDB for cross-tenant queries
const db = mongoose.connection.db;
const allTenants = await db.collection('users')
  .distinct('tenantId');

// Get stats for all tenants
for (const tenantId of allTenants) {
  await runWithTenantContext({ tenantId }, async () => {
    const count = await User.countDocuments({});
    console.log(`Tenant ${tenantId}: ${count} users`);
  });
}
```

## 9. Prisma with Tenant Filtering

```typescript
import { prisma, withTenantFilter } from '@/lib/db-tenant';
import { withTenant } from '@/lib/tenant/tenant-middleware';
import { requireTenantId } from '@/lib/tenant/tenant-context';

export const GET = withTenant(async (request) => {
  // Must manually add tenant filter for Prisma
  const users = await prisma.user.findMany({
    where: withTenantFilter({ role: 'student' })
  });
  
  return Response.json({ users });
});

// For create operations
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    tenantId: requireTenantId(), // Must add manually
  }
});
```

## 10. Server Component with Tenant

```typescript
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { dbConnect } from '@/lib/mongodb';
import Course from '@/models/dashboard/Course';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifyToken(token) : null;
  const tenantId = session?.tenantId || 'default';
  
  const courses = await runWithTenantContext({ tenantId }, async () => {
    await dbConnect('uniqbrio');
    return await Course.find({ status: 'Active' }).lean();
  });
  
  return <div>{/* Render courses */}</div>;
}
```

## 11. Find with Explicit Tenant (NOT Needed)

```typescript
// ❌ DON'T DO THIS - tenantId is auto-added:
const students = await Student.find({ tenantId: 'xxx' });

// ✅ JUST DO THIS:
const students = await Student.find({ status: 'active' });
```

## 12. Bulk Operations with Tenant

```typescript
import { bulkWriteWithTenant } from '@/lib/tenant/tenant-plugin';

await bulkWriteWithTenant(Student, [
  {
    insertOne: {
      document: { name: 'John', email: 'john@test.com' }
      // tenantId auto-added
    }
  },
  {
    updateOne: {
      filter: { email: 'jane@test.com' },
      update: { $set: { status: 'active' } }
      // tenantId auto-added to filter
    }
  }
]);
```

## 13. Check Tenant Stats

```typescript
import { getTenantStats } from '@/lib/tenant/tenant-utils';

const stats = await getTenantStats('uniqbrio', 'default');
console.log('Collections:', stats.collections);
console.log('Total documents:', stats.totalDocuments);
```

## 14. Verify Tenant Isolation

```typescript
import { verifyTenantIsolation } from '@/lib/tenant/tenant-utils';

const result = await verifyTenantIsolation('uniqbrio');
if (result.success) {
  console.log('✅ All checks passed');
} else {
  console.log('❌ Issues:', result.issues);
}
```

## 15. Manual Tenant Filter (When Needed)

```typescript
import { withTenantFilter } from '@/lib/tenant/tenant-plugin';

// For complex queries where you need explicit control
const filter = withTenantFilter({ 
  status: 'active',
  $or: [
    { grade: 'A' },
    { grade: 'B' }
  ]
});

const students = await Student.find(filter);
```

## 16. Initialize Tenant Models (App Startup)

```typescript
// In your app layout or _app file:
import { initializeTenantModels } from '@/lib/tenant/tenant-models-init';

// Call once during app initialization
initializeTenantModels();
```

## 17. Add Tenant to Session (Login)

```typescript
import { createToken, setSessionCookie } from '@/lib/auth';

export async function login(email: string, password: string) {
  // ... verify credentials ...
  
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId || 'default', // IMPORTANT: Include tenantId
  };
  
  const token = await createToken(tokenPayload);
  await setSessionCookie(token);
}
```

## 18. Extract Tenant from Subdomain

```typescript
import { extractTenantFromSubdomain } from '@/lib/tenant/tenant-context';

// In middleware or API route
const tenantId = extractTenantFromSubdomain(request);
// academy1.yourapp.com -> "academy1"
// yourapp.com -> "default"
// localhost:3000 -> "default"
```

## 19. Query Across Multiple Tenants (Admin)

```typescript
import mongoose from 'mongoose';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

async function getAllTenantsData() {
  const db = mongoose.connection.db;
  const tenantIds = await db.collection('users').distinct('tenantId');
  
  const results = [];
  for (const tenantId of tenantIds) {
    const data = await runWithTenantContext({ tenantId }, async () => {
      const users = await User.countDocuments({});
      const courses = await Course.countDocuments({});
      return { tenantId, users, courses };
    });
    results.push(data);
  }
  
  return results;
}
```

## 20. Migration - Add tenantId to Existing Data

```bash
# Run this ONCE to migrate existing data:
npm run migrate:tenant
```

Or programmatically:

```typescript
import { migrateDatabaseToMultiTenant } from '@/lib/tenant/tenant-utils';

await migrateDatabaseToMultiTenant('uniqbrio', 'default');
await migrateDatabaseToMultiTenant('uniqbrio-admin', 'default');
```

---

## Important Notes

### Mongoose (Automatic Filtering)
- ✅ All find/update/delete operations are automatically filtered by tenantId
- ✅ Created documents automatically get tenantId added
- ✅ Aggregation pipelines are automatically filtered

### Prisma (Manual Filtering Required)
- ⚠️ Must use `withTenantFilter()` for where clauses
- ⚠️ Must manually add `tenantId: requireTenantId()` when creating
- Prisma v6+ doesn't support middleware, so automation is limited

### Session Management
- Always include `tenantId` in your JWT token payload
- Extract tenant from session in server components/API routes
- Use `runWithTenantContext()` to set tenant context for operations
