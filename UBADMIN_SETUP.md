# UBAdmin Portal Setup Guide

## Overview
The UBAdmin Portal is a secure administrative interface for managing all academies, users, and KYC submissions on the UniqBrio platform.

## Security Features

### 1. Environment-Based Authentication
- Credentials are no longer hardcoded in the source code
- Admin email and password are stored in environment variables
- Supports both environment variable auth and database-based super_admin auth

### 2. Authentication Methods

#### Method 1: Environment Variables (Primary)
Set these in your `.env.local` file:
```env
UBADMIN_EMAIL=your_admin_email@uniqbrio.com
UBADMIN_PASSWORD=your_secure_password
```

#### Method 2: Database Super Admin (Fallback)
Create a super_admin user in the database with a hashed password. The system will automatically check database users with `role: 'super_admin'` if environment variable authentication fails.

### 3. Session Management
- Sessions use JWT tokens stored in secure HTTP-only cookies
- 24-hour session expiration
- Secure flag enabled in production
- SameSite strict policy

## Setup Instructions

### Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set your admin credentials:
   ```env
   UBADMIN_EMAIL=admin@uniqbrio.com
   UBADMIN_PASSWORD=YourSecurePassword123!
   ```

   **Important Security Notes:**
   - Use a strong password (minimum 12 characters)
   - Include uppercase, lowercase, numbers, and special characters
   - Never commit `.env.local` to version control (already in .gitignore)
   - Change the default password immediately in production

3. Ensure JWT_SECRET is set:
   ```env
   JWT_SECRET=your_random_32_character_secret_key_here
   ```

### Step 2: Restart the Application

After updating environment variables, restart your development server:
```bash
npm run dev
```

### Step 3: Access the Admin Portal

Navigate to: `http://localhost:3000/UBAdmin`

Log in with the credentials you set in step 1.

## Creating Additional Super Admin Users

To add more admin users through the database:

1. Create a user with role `super_admin` using the registration flow
2. The user must have a properly hashed password
3. They can then log in to the UBAdmin portal using their email and password

## Security Best Practices

### For Development
- Use different credentials than production
- Don't share your `.env.local` file
- Keep test credentials documented separately

### For Production
- Use strong, unique passwords
- Rotate credentials regularly (every 90 days recommended)
- Enable HTTPS (secure flag automatically enabled)
- Monitor admin access logs
- Consider implementing 2FA (future enhancement)
- Use environment variable management tools (AWS Secrets Manager, Azure Key Vault, etc.)

## Troubleshooting

### "Admin authentication not properly configured"
- Ensure `UBADMIN_EMAIL` and `UBADMIN_PASSWORD` are set in `.env.local`
- Restart the development server after changing environment variables

### "Invalid credentials"
- Verify the email and password in your `.env.local` file
- Check for extra spaces or special characters
- Ensure the password meets any complexity requirements

### Session Expired
- Sessions expire after 24 hours
- Simply log in again with your credentials

## API Endpoints

- `POST /api/admin-auth` - Login
- `GET /api/admin-auth` - Check authentication status
- `DELETE /api/admin-auth` - Logout

## Migration from Hardcoded Credentials

If you're upgrading from the previous version with hardcoded credentials:

1. Set the environment variables as described above
2. The old hardcoded credentials will no longer work
3. Update any documentation or scripts that reference the old credentials

## Future Enhancements

Planned security improvements:
- [ ] Two-factor authentication (2FA)
- [ ] Role-based access control (RBAC) for different admin levels
- [ ] Audit logging for all admin actions
- [ ] Password reset flow for admin users
- [ ] IP whitelisting option
- [ ] Session timeout warnings
- [ ] Failed login attempt tracking and lockout

## Support

For security concerns or questions, contact the development team.

**Never share credentials in public channels or commit them to version control.**
