# JWT + MongoDB Session Store Implementation

This document outlines the server-side session store implementation that works alongside JWT authentication in the UniqBrio SaaS application.

## Overview

The system combines the benefits of JWT tokens with server-side session management using MongoDB. This approach enables:
- Instant session revocation (logout, admin actions)
- Session activity tracking 
- Multi-tenant session isolation
- Security audit trails
- Cross-device session management

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Client    │◄──►│  Next.js App │◄──►│  MongoDB Atlas  │
│  (Browser)  │    │  + JWT Auth  │    │ Session Store   │
└─────────────┘    └──────────────┘    └─────────────────┘
     │                     │                     │
     │                     │                     │
  HttpOnly              Enhanced              Session
  Secure                  JWT +               Records
  Cookies              Session               + Tenant
                      Validation            Isolation
```

## Key Components

### 1. MongoDB Session Model (`/models/Session.ts`)

```typescript
interface ISession {
  _id: string;
  tenantId: string;          // REQUIRED - tenant isolation
  userId: string;            // User identifier from JWT
  jwtId: string;             // Unique identifier for the JWT
  issuedAt: Date;           // Session creation time
  expiresAt: Date;          // Session expiration time
  lastActiveAt: Date;       // Last activity timestamp
  isRevoked: boolean;       // Revocation status
  revokedAt?: Date;         // Revocation timestamp
  revokedBy?: string;       // Who revoked (for admin actions)
  revokedReason?: string;   // Revocation reason
  userAgent?: string;       // Client information
  ipAddress?: string;       // IP address
}
```

**Key Features:**
- Automatic tenant isolation via tenant plugin
- TTL index for automatic cleanup of expired sessions
- Compound indexes for efficient queries
- Built-in methods for revocation and activity updates

### 2. Session Store Service (`/lib/session-store.ts`)

**Core Functions:**
- `createSessionRecord()` - Persist new sessions on JWT creation
- `validateSession()` - Check session validity and update activity
- `revokeSession()` - Revoke individual sessions
- `revokeAllUserSessions()` - Revoke all user sessions within tenant
- `adminRevokeSession()` - Admin session revocation with audit

### 3. Enhanced JWT Creation (`/lib/auth.ts`)

```typescript
// Enhanced token creation with session persistence
const token = await createToken(sessionData, '1d', {
  userAgent: request.headers.get('user-agent'),
  ipAddress: extractIP(request.headers),
});
```

**Changes Made:**
- Added `jti` (JWT ID) claim to all tokens
- Automatic session record creation on token generation
- Session metadata capture (IP, user agent)
- Fallback JWT verification for migration compatibility

### 4. Session Validation Flow

```
Request → Middleware → JWT Verify → Session Store Check → Continue/Reject
                                        ↓
                                  Update lastActiveAt
```

1. **JWT Signature Verification** - Standard JWT validation
2. **Session Store Lookup** - Check MongoDB for session record
3. **Revocation Check** - Ensure session hasn't been revoked
4. **Activity Update** - Update `lastActiveAt` timestamp
5. **Context Injection** - Add session info to request headers

### 5. API Endpoints

#### Authentication Endpoints
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/logout-all` - Logout all user sessions
- `GET /api/auth/sessions/status` - Check current session status

#### Admin Endpoints (Tenant-Isolated)
- `GET /api/auth/admin/sessions?userId=X` - Get user's active sessions
- `DELETE /api/auth/admin/sessions` - Revoke sessions (admin only)

#### Request/Response Examples

**Logout All Sessions:**
```json
POST /api/auth/logout-all
Response: {
  "success": true,
  "message": "Logged out from 3 sessions",
  "revokedSessions": 3
}
```

**Admin Session Revocation:**
```json
DELETE /api/auth/admin/sessions
Body: {
  "action": "revoke-all-user",
  "userId": "AD000123"
}
Response: {
  "success": true,
  "revokedCount": 2
}
```

### 6. Middleware Integration (`/middleware.ts`)

Enhanced middleware now performs:
1. JWT signature validation
2. Session store validation
3. Activity timestamp updates
4. Session context injection into headers

**Headers Injected:**
```
x-session-user-id: AD000123
x-session-tenant-id: AC000001
x-session-role: admin
x-session-jwt-id: abc123...
x-session-id: 507f1f77bcf86cd799439011
```

### 7. Session Context Utilities (`/lib/session-context.ts`)

Helper functions for accessing session data in server components and API routes:

```typescript
// In server components
const session = await getSessionFromHeaders();

// In API routes  
const session = getSessionFromRequest(request);

// Protected routes
const session = await requireSessionFromHeaders();
requireAdmin(session); // Throws if not admin
```

## Security Implementation

### Tenant Isolation
- **CRITICAL**: All session operations include `tenantId` filtering
- MongoDB tenant plugin ensures automatic tenant scoping
- Admin users can only manage sessions within their own tenant
- Cross-tenant access is impossible

### Session Security
- HttpOnly, Secure cookies prevent client-side access
- SameSite='lax' prevents CSRF attacks
- IP address and User Agent tracking for audit
- Automatic session expiry via MongoDB TTL indexes

### Audit Logging
- All session operations logged with tenant context
- Admin actions logged with reason and actor
- Login/logout events tracked with IP/User Agent
- Integration with existing audit system

## Multi-Tenant Architecture

```
Tenant AC000001          Tenant AC000002
├─ Users                 ├─ Users  
├─ Sessions              ├─ Sessions
├─ Data                  ├─ Data
└─ Admin Actions         └─ Admin Actions
    ↕                       ↕
NO CROSS-TENANT ACCESS   NO CROSS-TENANT ACCESS
```

### Key Security Principles:
1. **tenantId ALWAYS comes from validated JWT**
2. **All database queries include tenantId filter**
3. **Admin operations limited to same tenant**
4. **Session validation includes tenant verification**

## Database Indexes

Optimized for performance and security:

```javascript
// Primary session lookup
{ tenantId: 1, jwtId: 1, isRevoked: 1 }

// User session management  
{ tenantId: 1, userId: 1, isRevoked: 1 }

// Activity tracking
{ tenantId: 1, userId: 1, lastActiveAt: -1 }

// Automatic cleanup
{ expiresAt: 1 } // TTL index
```

## Migration Strategy

The implementation is backward compatible:
1. **Phase 1**: Enhanced JWT creation with session records
2. **Phase 2**: Session validation alongside JWT verification
3. **Phase 3**: Full session store enforcement
4. **Phase 4**: Legacy JWT cleanup

**Fallback Behavior:**
- If session store fails, falls back to JWT-only validation
- Existing JWTs without `jti` claim are handled gracefully
- Gradual migration as users login with new tokens

## Monitoring & Maintenance

### Regular Cleanup
```typescript
// Automated cleanup of expired sessions
await cleanupExpiredSessions();
// Returns: number of deleted sessions
```

### Health Checks
- Monitor session creation/validation performance
- Track session revocation patterns
- Alert on failed session store operations

### Metrics to Track
- Active sessions per tenant
- Session creation rate
- Revocation reasons distribution
- Failed session validations

## Best Practices for Developers

### 1. Always Use Session Context
```typescript
// ✅ Good
const session = await requireSessionFromHeaders();
const data = await Model.find({ tenantId: session.tenantId });

// ❌ Bad - bypasses tenant isolation
const data = await Model.find({});
```

### 2. Handle Session Failures Gracefully
```typescript
try {
  const session = await getSessionFromHeaders();
  if (!session) {
    return redirect('/login');
  }
  // Continue with authenticated logic
} catch (error) {
  console.error('Session error:', error);
  return redirect('/login?error=session');
}
```

### 3. Use Appropriate Session Validation
```typescript
// For API routes requiring authentication
const session = requireSessionFromRequest(request);

// For optional authentication
const session = getSessionFromRequest(request);
if (session) {
  // Authenticated logic
} else {
  // Guest logic
}
```

### 4. Admin Operations
```typescript
const session = await requireSessionFromHeaders();
requireAdmin(session); // Throws if not admin

// Admin can only access within their tenant
const userSessions = await getUserActiveSessions(targetUserId, session.tenantId);
```

## Error Scenarios & Handling

### Session Not Found
- **Cause**: Session revoked or expired
- **Response**: Redirect to login
- **Logging**: Session validation failure

### Invalid JWT
- **Cause**: Tampered token or wrong secret
- **Response**: Clear cookies, redirect to login
- **Logging**: JWT verification failure

### Database Connection Issues
- **Cause**: MongoDB unavailable
- **Response**: Fallback to JWT-only validation
- **Logging**: Database connection error

### Tenant Mismatch
- **Cause**: Attempt to access cross-tenant data
- **Response**: Access denied
- **Logging**: Security violation

## Performance Considerations

### Database Performance
- Compound indexes optimized for common queries
- TTL indexes for automatic cleanup
- Connection pooling for session operations

### Middleware Efficiency  
- Session validation cached per request
- Graceful degradation on session store failures
- Minimal latency added to request processing

### Scale Planning
- Session collection sharding by tenantId
- Read replicas for session validation
- Cleanup job scaling based on session volume

## Security Checklist

- [x] JWT secret properly configured and secured
- [x] HttpOnly, Secure cookies implemented
- [x] Tenant isolation enforced at database level
- [x] Session revocation working correctly
- [x] Admin actions logged and restricted
- [x] IP address and User Agent captured
- [x] Automatic session expiry configured
- [x] Cross-tenant access prevented
- [x] Audit logging integrated
- [x] Error handling implemented

## Troubleshooting

### Common Issues

**1. Sessions not persisting**
- Check JWT_SECRET configuration
- Verify database connection
- Ensure tenantId in JWT payload

**2. Cross-tenant access**
- Verify tenant plugin is applied
- Check tenantId extraction logic
- Review database query filters

**3. Performance issues**
- Monitor database indexes
- Check session validation performance
- Review cleanup job frequency

**4. Migration problems**
- Verify fallback JWT validation
- Check for missing jti claims
- Monitor session creation logs

For additional support, refer to the audit logs and session validation errors in the application logs.