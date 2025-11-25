# Multi-Tenant Data Isolation Guide

## Overview
The UniqBrio platform uses **academyId** as the `tenantId` to ensure each academy's data is completely isolated in the dashboard.

## How It Works

### 1. User Registration & Authentication
- When a user registers their academy, they get a unique `academyId` (e.g., `AC000001`, `AC000002`)
- This `academyId` is stored in the User document in the `uniqbrio-admin` database
- Upon login, the `academyId` is included in the JWT token and session

### 2. Tenant Context
The tenant context system automatically:
- Extracts `academyId` from the user's session
- Uses it as the `tenantId` for all dashboard operations
- Ensures queries only return data belonging to that academy

### 3. Data Isolation in Dashboard

#### Automatic Filtering
All Mongoose models in the dashboard use the tenant plugin which:
- Automatically adds `tenantId` to new documents
- Filters all queries by `tenantId`
- Prevents cross-tenant data access

#### Default Data
- Default/seed data uses `tenantId: 'default'`
- When a user logs in with their `academyId`, they only see their own data
- Default data is NOT visible to authenticated users

## Implementation

### For New Dashboard Routes

```typescript
import { getTenantIdFromSession, getUserContext } from '@/lib/tenant/dashboard-helpers';

// Example GET route
export async function GET(request: NextRequest) {
  // Get tenant ID from session
  const tenantId = await getTenantIdFromSession();
  
  // Query with automatic tenant isolation
  const students = await StudentModel.find({ tenantId });
  
  return NextResponse.json({ students });
}

// Example with user context
export async function POST(request: NextRequest) {
  const { tenantId, academyId, email } = await getUserContext();
  
  if (!academyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  
  // Create document - tenantId is auto-added by tenant plugin
  const student = await StudentModel.create({
    ...body,
    // tenantId is automatically set from context
  });
  
  return NextResponse.json({ student });
}
```

### Session Structure
```typescript
{
  user: {
    email: "user@example.com",
    academyId: "AC000001",  // <-- This becomes the tenantId
    userId: "AD000001",
    name: "John Doe",
    verified: true
  }
}
```

### Database Collections
- **uniqbrio-admin**: User authentication data (email, password, academyId)
- **uniqbrio**: Dashboard data (students, courses, payments, etc.) - all filtered by tenantId

## Data Flow

```
User Login
    ↓
JWT Token Created (includes academyId)
    ↓
Session Cookie Set
    ↓
User Accesses Dashboard
    ↓
getTenantIdFromSession() → Returns academyId
    ↓
Database Query → { tenantId: "AC000001", ...otherFilters }
    ↓
Only Academy's Data Returned
```

## Best Practices

### ✅ DO
- Use `getTenantIdFromSession()` in all dashboard routes
- Let the tenant plugin handle tenantId automatically
- Always verify academyId exists before operations
- Use `getUserContext()` when you need both user info and tenant isolation

### ❌ DON'T
- Hardcode `tenantId: 'default'` in dashboard routes
- Manually add tenantId to queries (let the plugin handle it)
- Mix authentication database queries with dashboard queries
- Allow operations without validating session

## Migration Notes

### Updating Existing Routes
If you have routes using `session?.tenantId || 'default'`, update them:

**Before:**
```typescript
const students = await StudentModel.find({
  tenantId: session?.tenantId || 'default'
});
```

**After:**
```typescript
import { getTenantIdFromSession } from '@/lib/tenant/dashboard-helpers';

const tenantId = await getTenantIdFromSession();
const students = await StudentModel.find({ tenantId });
```

### Verifying Isolation
To verify tenant isolation is working:
1. Log in as Academy A (academyId: AC000001)
2. Create some data (students, courses, etc.)
3. Log out and log in as Academy B (academyId: AC000002)
4. Verify you DON'T see Academy A's data
5. Create data as Academy B
6. Verify both academies only see their own data

## Troubleshooting

### Issue: Seeing 'default' data in dashboard
**Solution**: Ensure the session includes `academyId` and routes use `getTenantIdFromSession()`

### Issue: Cross-tenant data leakage
**Solution**: Check that all models use the tenant plugin and queries include tenantId filter

### Issue: Can't save data without tenantId
**Solution**: Ensure user is authenticated and session has academyId before saving

## Technical Details

### Tenant Plugin
Location: `lib/tenant/tenant-plugin.ts`
- Adds tenantId field to all schemas
- Auto-filters queries by tenantId
- Sets tenantId from context on save

### Tenant Context
Location: `lib/tenant/tenant-context.ts`
- Manages tenant context using AsyncLocalStorage
- Extracts tenantId from session (academyId)
- Provides helper functions for tenant operations

### Dashboard Helpers
Location: `lib/tenant/dashboard-helpers.ts`
- `getTenantIdFromSession()`: Get current user's academyId as tenantId
- `getUserContext()`: Get user info with tenant context
- `buildTenantQuery()`: Build queries with tenant isolation

## Summary

**Key Point**: Every academy has a unique `academyId` (like AC000001, AC000002) which serves as their `tenantId`. This ensures complete data isolation - Academy A cannot see Academy B's data, and vice versa. Default data (tenantId: 'default') is only visible when no specific academy is logged in.
