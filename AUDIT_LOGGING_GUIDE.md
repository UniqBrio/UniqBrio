# Audit Logging Integration Guide

This guide explains how to integrate audit logging throughout the UniqBrio application.

## Overview

The audit logging system tracks all important actions performed by super admins in the dashboard, including:
- Login/Logout events
- Entity creation (Add)
- Entity updates (Update)
- Entity deletion (Delete)
- Data exports
- Settings changes

## Architecture

### 1. AuditLog Model (`models/AuditLog.ts`)
- Stores all audit log entries in MongoDB
- Includes fields: module, action, timestamp, user details, IP address, device info, field changes
- Automatically indexed for efficient queries

### 2. Audit Logger Utilities (`lib/audit-logger.ts`)
- Helper functions to create audit logs
- Functions for auth events, entity CRUD operations
- IP address and user agent extraction utilities

### 3. API Endpoints
- **Login API** (`app/api/auth/login/route.ts`): Logs successful logins
- **Logout API** (`app/api/auth/logout/route.ts`): Logs logout events
- **Audit Logs API** (`app/api/audit-logs/route.ts`): Fetches audit logs (super admin only)

### 4. UI Component
- **Audit Logs Page** (`app/dashboard/audit-logs/page.tsx`): Displays audit logs with filtering, search, analytics

## Access Control

### Middleware Protection
The audit logs section is protected in `middleware.ts`:
- Only users with `super_admin` role can access `/dashboard/audit-logs`
- Other roles are redirected to their respective dashboards

### API Protection
The audit logs API endpoint verifies:
1. User is authenticated (has valid session)
2. User has `super_admin` role
3. Returns 403 Forbidden for non-super admins

## Usage Examples

### 1. Logging Authentication Events

Login and logout are automatically logged via the API routes.

### 2. Logging Entity Creation

```typescript
import { logEntityCreate, AuditModule } from '@/lib/audit-logger';
import { getSession } from '@/app/actions/auth-actions';

// In your API route or server action
export async function createStudent(data: any) {
  const session = await getSession();
  
  // Create the student
  const student = await StudentModel.create(data);
  
  // Log the creation
  await logEntityCreate(
    AuditModule.STUDENTS,
    student.id,
    student.name,
    session.id,
    session.name,
    session.role,
    session.tenantId,
    ipAddress, // Extract from request headers
    userAgent, // Extract from request headers
    { email: student.email, enrollmentDate: student.enrollmentDate }
  );
  
  return student;
}
```

### 3. Logging Entity Updates

```typescript
import { logEntityUpdate, AuditModule } from '@/lib/audit-logger';
import { getSession } from '@/app/actions/auth-actions';

// In your API route or server action
export async function updateCourse(courseId: string, updates: any) {
  const session = await getSession();
  
  // Get the original course
  const originalCourse = await CourseModel.findById(courseId);
  
  // Update the course
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    updates,
    { new: true }
  );
  
  // Track field changes
  const fieldChanges = [];
  if (originalCourse.name !== updatedCourse.name) {
    fieldChanges.push({
      field: 'name',
      oldValue: originalCourse.name,
      newValue: updatedCourse.name
    });
  }
  if (originalCourse.price !== updatedCourse.price) {
    fieldChanges.push({
      field: 'price',
      oldValue: String(originalCourse.price),
      newValue: String(updatedCourse.price)
    });
  }
  
  // Log the update
  await logEntityUpdate(
    AuditModule.COURSES,
    courseId,
    updatedCourse.name,
    fieldChanges,
    session.id,
    session.name,
    session.role,
    session.tenantId,
    ipAddress,
    userAgent
  );
  
  return updatedCourse;
}
```

### 4. Logging Entity Deletion

```typescript
import { logEntityDelete, AuditModule } from '@/lib/audit-logger';
import { getSession } from '@/app/actions/auth-actions';

// In your API route or server action
export async function deletePayment(paymentId: string) {
  const session = await getSession();
  
  // Get the payment before deletion
  const payment = await PaymentModel.findById(paymentId);
  
  // Delete the payment
  await PaymentModel.findByIdAndDelete(paymentId);
  
  // Log the deletion
  await logEntityDelete(
    AuditModule.PAYMENTS,
    paymentId,
    `Payment #${payment.invoiceNumber}`,
    session.id,
    session.name,
    session.role,
    session.tenantId,
    ipAddress,
    userAgent,
    { amount: payment.amount, status: payment.status }
  );
}
```

### 5. Logging Custom Actions

```typescript
import { createAuditLog, AuditModule } from '@/lib/audit-logger';
import { getSession } from '@/app/actions/auth-actions';

// For custom actions like exports
export async function exportStudentData() {
  const session = await getSession();
  
  // Perform export
  const data = await StudentModel.find({});
  
  // Log the export
  await createAuditLog({
    tenantId: session.tenantId,
    module: AuditModule.STUDENTS,
    action: 'Export',
    changedBy: session.name,
    changedById: session.id,
    role: session.role,
    ipAddress,
    userAgent,
    metadata: {
      recordCount: data.length,
      exportFormat: 'CSV'
    }
  });
  
  return data;
}
```

### 6. Extracting IP and User Agent in API Routes

```typescript
import { NextRequest } from 'next/server';
import { getClientIp, getUserAgent } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = getUserAgent(request.headers);
  
  // Use these values in your audit logging calls
}
```

## Available Modules

- `AUTHENTICATION` - Login/logout events
- `STUDENTS` - Student management
- `COURSES` - Course management
- `STAFF` - Staff management
- `PAYMENTS` - Payment transactions
- `SETTINGS` - System settings changes
- `EVENTS` - Event management
- `COMMUNITY` - Community features
- `FINANCIALS` - Financial operations
- `KYC` - KYC verifications
- `USERS` - User management

## Available Actions

- `LOGIN` - User login
- `LOGOUT` - User logout
- `ADD` - Entity creation
- `UPDATE` - Entity modification
- `DELETE` - Entity deletion
- `VIEW` - Data viewing (optional)
- `EXPORT` - Data export
- `IMPORT` - Data import

## Viewing Audit Logs

Super admins can view audit logs at `/dashboard/audit-logs` with:
- Advanced filtering by module, action, role, date range
- Search by user name, module, or action
- Analytics charts showing activity patterns
- Export functionality for compliance reporting
- Detailed view of field changes for updates

## Best Practices

1. **Always log sensitive operations**: Updates to user roles, financial transactions, data exports
2. **Include context**: Add metadata with relevant information about the operation
3. **Don't block on failures**: Audit logging uses try-catch to prevent application failures
4. **Be consistent**: Use the provided helper functions for uniform logging
5. **Protect user privacy**: Don't log sensitive data like passwords or payment card details
6. **Regular review**: Super admins should regularly review audit logs for security monitoring

## Security Considerations

1. Audit logs cannot be modified or deleted through the UI
2. Only super admins can access audit logs
3. All database operations are tenant-isolated
4. IP addresses and user agents are captured for security tracking
5. Failed login attempts should also be logged (future enhancement)

## Future Enhancements

- Real-time audit log streaming for security monitoring
- Automated alerts for suspicious activities
- Retention policies for old audit logs
- Integration with external SIEM systems
- Advanced analytics and anomaly detection
