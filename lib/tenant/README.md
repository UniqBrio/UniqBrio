# Tenant System Documentation

This folder contains all tenant-related functionality for multi-tenancy support.

## 📁 Files Overview

### Core Components

1. **`tenant-context.ts`**
   - Manages tenant identification across the application
   - Uses AsyncLocalStorage for context propagation
   - Extracts tenant from subdomain, session, or headers
   - Functions: `getTenantContext()`, `requireTenantId()`, `runWithTenantContext()`

2. **`tenant-plugin.ts`**
   - Mongoose plugin for automatic tenant isolation
   - Adds `tenantId` field to all models
   - Automatically filters all queries by tenant
   - Handles create, read, update, delete, aggregate operations
   - Functions: `tenantPlugin()`, `withTenantFilter()`, `bulkWriteWithTenant()`

3. **`tenant-middleware.ts`**
   - Next.js middleware integration
   - Injects tenant context into requests
   - Works with both API routes and page routes
   - Functions: `withTenant()`, `tenantMiddleware()`

4. **`tenant-utils.ts`**
   - Utility functions for tenant operations
   - Database migration tools
   - Tenant statistics and verification
   - Functions: `migrateDatabaseToMultiTenant()`, `getTenantStats()`, `verifyTenantIsolation()`

5. **`tenant-models-init.ts`**
   - Auto-initialization of tenant support
   - Applies tenant plugin to all models
   - Import this in your app to enable tenant support
   - Functions: `initializeTenantModels()`, `initializeStaffSubModels()`

### Documentation

6. **`QUICK_REFERENCE.ts`**
   - Common tenant operation examples
   - Code snippets for typical use cases
   - Copy-paste ready examples

## 🚀 Quick Start

### 1. Run Migration (First Time Only)

```bash
npm run migrate:tenant
```

This adds `tenantId` to all existing documents.

### 2. Use in API Routes

```typescript
import { withTenant } from '@/lib/tenant/tenant-middleware';
import Student from '@/models/dashboard/student/Student';

export const GET = withTenant(async (request) => {
  // Automatically filtered by tenant
  const students = await Student.find({});
  return Response.json({ students });
});
```

### 3. Get Current Tenant

```typescript
import { requireTenantId } from '@/lib/tenant/tenant-context';

const tenantId = requireTenantId();
console.log('Current tenant:', tenantId);
```

### 4. Run with Specific Tenant

```typescript
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

await runWithTenantContext({ tenantId: 'academy1' }, async () => {
  // All queries here use academy1 tenant
  const data = await SomeModel.find({});
  return data;
});
```

## 📚 Function Reference

### Tenant Context

```typescript
// Get current tenant context (may be undefined)
const context = getTenantContext();

// Get tenant ID (throws if not found)
const tenantId = requireTenantId();

// Run function with tenant context
runWithTenantContext({ tenantId: 'xyz' }, async () => {
  // Your code here
});

// Extract tenant from request subdomain
const tenantId = extractTenantFromSubdomain(request);

// Extract tenant from session
const tenantId = extractTenantFromSession(session);
```

### Tenant Plugin

```typescript
// Apply to schema (usually done automatically)
schema.plugin(tenantPlugin);

// Create tenant-aware filter
const filter = withTenantFilter({ status: 'active' });

// Bulk operations with tenant
await bulkWriteWithTenant(Model, operations);
```

### Tenant Middleware

```typescript
// Wrap API route
export const GET = withTenant(async (request) => {
  // Your handler
});

// Use in middleware.ts
const response = await tenantMiddleware(request);
```

### Tenant Utils

```typescript
// Migrate database to multi-tenant
await migrateDatabaseToMultiTenant('dbName', 'defaultTenantId');

// Get tenant statistics
const stats = await getTenantStats('dbName', 'tenantId');

// Verify tenant isolation
const result = await verifyTenantIsolation('dbName');

// Get all collections
const collections = await getAllCollections('dbName');

// Add tenantId to collection
await addTenantIdToCollection('dbName', 'collectionName', 'tenantId');

// Create tenant indexes
await createTenantIndexes('dbName', 'collectionName', ['email', 'name']);
```

## 🔒 Security

### Automatic Isolation

All database queries are **automatically filtered** by tenant:

```typescript
// Before multi-tenant:
const students = await Student.find({ status: 'active' });

// After multi-tenant (NO CHANGE NEEDED):
const students = await Student.find({ status: 'active' });
// ✅ Automatically filtered by current tenant!
```

### Manual Filtering (When Needed)

```typescript
// Use withTenantFilter for complex queries
const filter = withTenantFilter({
  $or: [
    { grade: 'A' },
    { grade: 'B' }
  ]
});
```

### Cross-Tenant Operations (Admin Only)

```typescript
// Use native MongoDB for cross-tenant queries
const db = mongoose.connection.db;
const allData = await db.collection('students').find({}).toArray();
```

## 📊 Monitoring

### Check Tenant Stats

```typescript
const stats = await getTenantStats('uniqbrio', 'default');
console.log('Collections:', stats.collections);
console.log('Total docs:', stats.totalDocuments);
```

### Verify Isolation

```typescript
const result = await verifyTenantIsolation('uniqbrio');
if (!result.success) {
  console.error('Issues:', result.issues);
}
```

## 🐛 Debugging

### Enable Debug Logs

Look for these log prefixes:
- `[TenantPlugin]` - Model operations
- `[TenantMiddleware]` - Request handling
- `[TenantInit]` - Model initialization
- `[TenantMigration]` - Migration operations

### Common Issues

**"Tenant context required" error**
- Ensure session includes `tenantId`
- Use `withTenant()` wrapper for API routes
- Check middleware is running

**Empty query results**
- Verify `tenantId` in session matches data
- Check tenant context is set
- Run `getTenantStats()` to inspect

**Cross-tenant data visible**
- Run `verifyTenantIsolation()` immediately
- Check for raw MongoDB queries
- Ensure all models have tenant plugin

## 🧪 Testing

```bash
# Run test suite
npm run test:tenant

# Run migration
npm run migrate:tenant
```

## 📖 Additional Resources

- **Implementation Summary**: `/TENANT_IMPLEMENTATION_SUMMARY.md`
- **Complete Guide**: `/MULTI_TENANT_GUIDE.md`
- **Deployment Checklist**: `/DEPLOYMENT_CHECKLIST.md`
- **Quick Reference**: `./QUICK_REFERENCE.ts`

## 🎯 Best Practices

1. **Always use `withTenant()` wrapper** for API routes
2. **Never manually filter by tenantId** (it's automatic)
3. **Test tenant isolation** after any database changes
4. **Monitor logs** for tenant context warnings
5. **Run verification** regularly in development
6. **Use `runWithTenantContext()`** for background jobs

## 💡 Examples

See `QUICK_REFERENCE.ts` for 20+ practical examples covering:
- Basic queries
- Creating documents
- Updating/deleting
- Aggregations
- Bulk operations
- Cross-tenant admin operations
- And more!

---

**Questions? Check the documentation files in the root directory!**
