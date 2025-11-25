# Multi-Tenant Implementation Guide

## Overview

Your application now supports **shared database multi-tenancy** where multiple tenants share the same database infrastructure, but their data is isolated using a `tenantId` field. This implementation works with both your existing Mongoose models and Prisma models.

## Architecture

### Key Components

1. **Tenant Context** (`lib/tenant/tenant-context.ts`)
   - Manages tenant identification across the application
   - Extracts tenant ID from subdomain, session, or headers
   - Uses AsyncLocalStorage for context propagation

2. **Tenant Plugin** (`lib/tenant/tenant-plugin.ts`)
   - Mongoose plugin that adds `tenantId` to all documents
   - Automatically filters all queries by tenant
   - Applies to ALL Mongoose models

3. **Tenant Middleware** (`lib/tenant/tenant-middleware.ts`)
   - Next.js middleware integration
   - Injects tenant context into requests
   - Works with both API routes and pages

4. **Database Connections** (Updated `lib/mongodb.ts`, `lib/db-tenant.ts`)
   - Enhanced to support tenant context
   - Prisma middleware for automatic tenant filtering
   - Caching for performance

5. **Migration Tools** (`lib/tenant/tenant-utils.ts`, `scripts/migrate-to-multi-tenant.ts`)
   - Add `tenantId` to existing data
   - Create indexes for tenant isolation
   - Verify tenant isolation integrity

## What's Been Done

✅ **All Mongoose Models Updated:**
- User, Course, Cohort, Enrollment, Schedule
- Instructor, NonInstructor, Student
- Attendance models (all types)
- Payment models (Payment, PaymentRecord, PaymentTransaction, etc.)
- Draft models, Task models, Notification models
- Help models (Chat, Ticket)
- Event models
- Achievement models

✅ **Automatic Tenant Filtering:**
- All `.find()`, `.findOne()`, `.update()`, `.delete()` operations
- Aggregation pipelines
- Bulk operations
- Create operations (tenantId auto-added)

✅ **Middleware Integration:**
- Tenant context injected in main middleware.ts
- Available to all API routes and pages

✅ **Prisma Support:**
- Middleware for tenant filtering
- Auto-adds tenantId to all operations

## How to Use

### 1. Run the Migration (IMPORTANT - Do This First!)

```bash
# Backup your databases first!
mongodump --uri="your-mongodb-uri"

# Run the migration script
npx tsx scripts/migrate-to-multi-tenant.ts

# Or with npm/pnpm
npm run migrate:tenant
pnpm run migrate:tenant
```

This will:
- Add `tenantId: "default"` to all existing documents
- Create indexes for tenant isolation
- Verify data integrity

### 2. Add Tenant ID to User Sessions

Update your login action to include tenant ID in the session:

```typescript
// In app/actions/auth-actions.ts or wherever you create sessions
import { requireTenantId } from '@/lib/tenant/tenant-context';

export async function login(formData: FormData) {
  // ... existing login logic ...
  
  const tenant Id = process.env.DEFAULT_TENANT_ID || 'default';
  
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: tenantId, // ADD THIS
  };
  
  const token = await createToken(tokenPayload);
  // ... rest of login logic ...
}
```

### 3. Using Tenant Context in API Routes

#### Option A: Using the withTenant wrapper

```typescript
// app/api/dashboard/students/route.ts
import { withTenant } from '@/lib/tenant/tenant-middleware';
import { dbConnect } from '@/lib/mongodb';
import Student from '@/models/dashboard/student/Student';

export const GET = withTenant(async (request) => {
  await dbConnect('uniqbrio');
  
  // This query is automatically filtered by tenantId!
  const students = await Student.find({ status: 'active' });
  
  return Response.json({ students });
});
```

#### Option B: Manual tenant context

```typescript
// app/api/dashboard/courses/route.ts
import { requireTenantId } from '@/lib/tenant/tenant-context';
import { dbConnect } from '@/lib/mongodb';
import Course from '@/models/dashboard/Course';

export async function GET(request: Request) {
  await dbConnect('uniqbrio');
  
  // Get tenant ID (throws error if not in context)
  const tenantId = requireTenantId();
  
  // Queries are auto-filtered, but you can also filter manually
  const courses = await Course.find({ status: 'Active' });
  
  return Response.json({ courses });
}
```

### 4. Using with Prisma

```typescript
// app/api/users/route.ts
import { prisma } from '@/lib/db-tenant'; // Use tenant-aware prisma client
import { withTenant } from '@/lib/tenant/tenant-middleware';

export const GET = withTenant(async (request) => {
  // Automatically filtered by tenantId
  const users = await prisma.user.findMany({
    where: { role: 'student' }
  });
  
  return Response.json({ users });
});
```

### 5. Querying Without Tenant Context (Admin/System Operations)

For system-level operations that need to bypass tenant filtering:

```typescript
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export async function systemOperation() {
  await dbConnect('uniqbrio');
  
  // Use native MongoDB for cross-tenant operations
  const db = mongoose.connection.db;
  const allCourses = await db.collection('courses').find({}).toArray();
  
  return allCourses;
}
```

### 6. Creating New Tenants

```typescript
// app/api/admin/tenants/route.ts
import { runWithTenantContext } from '@/lib/tenant/tenant-context';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/dashboard/User';

export async function POST(request: Request) {
  const { tenantId, adminEmail, adminPassword } = await request.json();
  
  await dbConnect('uniqbrio-admin');
  
  // Create data for new tenant
  await runWithTenantContext({ tenantId }, async () => {
    // This admin user will be created with the specified tenantId
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      // tenantId is automatically added!
    });
    
    return admin;
  });
}
```

## Testing Tenant Isolation

```typescript
// scripts/test-tenant-isolation.ts
import { getTenantStats, verifyTenantIsolation } from '@/lib/tenant/tenant-utils';

async function testIsolation() {
  // Check tenant data
  const stats = await getTenantStats('uniqbrio', 'default');
  console.log(stats);
  
  // Verify isolation
  const verification = await verifyTenantIsolation('uniqbrio');
  console.log(verification);
}
```

## Environment Variables

Add to your `.env.local`:

```env
# Default tenant ID for single-tenant mode
DEFAULT_TENANT_ID=default

# For multi-tenant subdomain support
# NEXT_PUBLIC_APP_DOMAIN=uniqbrio.com
```

## Subdomain-Based Tenant Detection

The system automatically detects tenants from subdomains:

- `academy1.uniqbrio.com` → tenantId: `academy1`
- `school2.uniqbrio.com` → tenantId: `school2`
- `localhost:3000` → tenantId: `default`
- `uniqbrio.com` → tenantId: `default`

## Collections Covered

All collections in both databases are now tenant-isolated:

**Auth Database (uniqbrio-admin):**
- users
- sessions
- kyc
- verificationTokens
- registrations

**Dashboard Database (uniqbrio):**
- users, courses, cohorts, enrollments
- instructors, non_instructors
- students, student_attendance, student_drafts
- instructor_attendance, non_instructor_attendance
- payments, payment_records, payment_transactions
- monthly_subscriptions
- events, notifications
- tasks, drafts
- help_chats, help_tickets
- achievements, schedules

## Important Notes

1. **Always run the migration script before using the app** - it adds tenant IDs to existing data
2. **The default tenant ID is "default"** - all existing data gets this tenant ID
3. **All queries are automatically filtered** - you don't need to add tenantId to queries
4. **Tenant context is required** - operations without tenant context will log warnings
5. **Prisma models** need `tenantId String @db.String` field added to schema.prisma

## Troubleshooting

### "Tenant context is required" error
- Ensure middleware is running
- Check that session includes tenantId
- Use `withTenant` wrapper for API routes

### Queries return empty results
- Verify tenantId is in session/context
- Check migration completed successfully
- Verify indexes were created

### Cross-tenant data leakage
- Run `verifyTenantIsolation()` to check
- Ensure all models have tenant plugin applied
- Check for raw MongoDB queries bypassing Mongoose

## Next Steps

1. ✅ Run migration script
2. ✅ Update login to include tenantId
3. ✅ Test API routes
4. ✅ Add tenant selection UI (if needed)
5. ✅ Monitor logs for tenant context warnings
6. ✅ Update Prisma schema (if using Prisma for dashboard models)

## Support

For issues or questions about the multi-tenant implementation, check:
- Logs for `[TenantPlugin]`, `[TenantMiddleware]`, `[TenantInit]` prefixes
- Run verification script: `npx tsx scripts/migrate-to-multi-tenant.ts`
- Check tenant stats: use `getTenantStats()` utility
