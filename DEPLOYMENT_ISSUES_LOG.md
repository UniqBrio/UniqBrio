# Deployment Issues Log - UniqBrio Project

**Date:** November 22, 2025  
**Platform:** Vercel  
**Repository:** github.com/UniqBrio/UniqBrio  
**Branch:** main

## Overview
This document chronicles all deployment issues encountered during the UniqBrio project deployment to Vercel and their corresponding solutions.

---

## Issue #1: Nodemailer Version Conflict

### 📅 **Timestamp:** 10:47:16 - 10:51:40 UTC
### 🚨 **Error Type:** ERESOLVE Dependency Conflict
### 📝 **Error Details:**
```
npm error ERESOLVE could not resolve
npm error While resolving: @auth/core@0.34.2
npm error Found: nodemailer@7.0.10
npm error Could not resolve dependency:
npm error peerOptional nodemailer@"^6.8.0" from @auth/core@0.34.2
npm error Conflicting peer dependency: nodemailer@6.10.1
```

### 🔍 **Root Cause:**
- Project had `nodemailer@^7.0.10` installed
- `@auth/core@0.34.2` required `nodemailer@^6.8.0`
- Version mismatch preventing dependency resolution

### ✅ **Solution Applied:**
1. **Downgraded nodemailer:** `^7.0.10` → `^6.9.15`
2. **Updated TypeScript types:** `@types/nodemailer@^7.0.4` → `@types/nodemailer@^6.4.19`
3. **Added npm overrides:**
   ```json
   "overrides": {
     "nodemailer": "^6.9.15"
   }
   ```

### 📊 **Files Modified:**
- `package.json`

### 🔗 **Commit:** d8062c0 - "fix: resolve nodemailer dependency conflict for Vercel deployment"

---

## Issue #2: @auth/core Version Mismatch

### 📅 **Timestamp:** 10:51:40 - 10:53:40 UTC
### 🚨 **Error Type:** ERESOLVE Dependency Conflict
### 📝 **Error Details:**
```
npm error While resolving: next-auth@4.24.13
npm error Found: @auth/core@0.34.2
npm error Could not resolve dependency:
npm error peerOptional @auth/core@"0.34.3" from next-auth@4.24.13
npm error Conflicting peer dependency: @auth/core@0.34.3
```

### 🔍 **Root Cause:**
- Project had `@auth/core@0.34.2`
- `next-auth@4.24.13` required `@auth/core@0.34.3`
- Minor version mismatch causing peer dependency conflict

### ✅ **Solution Applied:**
1. **Updated @auth/core:** `0.34.2` → `0.34.3`
2. **Enhanced overrides:**
   ```json
   "overrides": {
     "nodemailer": "^6.9.15",
     "@auth/core": "0.34.3"
   }
   ```

### 📊 **Files Modified:**
- `package.json`

### 🔗 **Commit:** f896ff3 - "fix: update @auth/core to 0.34.3 to resolve next-auth compatibility"

---

## Issue #3: date-fns Version Incompatibility

### 📅 **Timestamp:** 10:53:40+ UTC
### 🚨 **Error Type:** ERESOLVE Dependency Conflict
### 📝 **Error Details:**
```
npm error While resolving: react-day-picker@8.10.1
npm error Found: date-fns@4.1.0
npm error Could not resolve dependency:
npm error peer date-fns@"^2.28.0 || ^3.0.0" from react-day-picker@8.10.1
npm error Conflicting peer dependency: date-fns@3.6.0
```

### 🔍 **Root Cause:**
- Project had `date-fns@"latest"` (resolved to v4.1.0)
- `react-day-picker@8.10.1` only supports `date-fns@^2.28.0 || ^3.0.0`
- Major version incompatibility (v4 vs v2-3)

### ✅ **Solution Applied:**
1. **Downgraded date-fns:** `"latest"` → `"^3.6.0"`
2. **Added to overrides:**
   ```json
   "overrides": {
     "nodemailer": "^6.9.15",
     "@auth/core": "0.34.3",
     "date-fns": "^3.6.0"
   }
   ```

### 📊 **Files Modified:**
- `package.json`

### 🔗 **Commit:** 99780d4 - "fix: downgrade date-fns to v3.6.0 for react-day-picker compatibility"

---

## Issue #4: TypeScript Configuration Error (Resolved)

### 📅 **Timestamp:** During development
### 🚨 **Error Type:** TypeScript Configuration
### 📝 **Error Details:**
```
Cannot find type definition file for 'dashboard'.
The file is in the program because:
Entry point for implicit type library 'dashboard'
```

### 🔍 **Root Cause:**
- TypeScript was attempting to auto-include a non-existent 'dashboard' type library
- Missing explicit `types` array in tsconfig.json

### ✅ **Solution Applied:**
1. **Added explicit types array to tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "types": []
     }
   }
   ```

### 📊 **Files Modified:**
- `tsconfig.json`

---

## Final Resolution Summary

### 🎯 **Final package.json State:**
```json
{
  "dependencies": {
    "@auth/core": "0.34.3",
    "date-fns": "^3.6.0",
    "nodemailer": "^6.9.15"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.19"
  },
  "overrides": {
    "nodemailer": "^6.9.15",
    "@auth/core": "0.34.3",
    "date-fns": "^3.6.0"
  }
}
```

### 📈 **Deployment Status:**
- ✅ All dependency conflicts resolved
- ✅ Build process completing successfully
- ✅ TypeScript compilation errors fixed
- ✅ Vercel deployment proceeding without ERESOLVE errors

---

## Lessons Learned

### 🔧 **Best Practices Identified:**

1. **Use Explicit Versioning:**
   - Avoid `"latest"` in production dependencies
   - Pin exact versions for critical auth libraries
   - Use semver ranges carefully (`^` vs `~`)

2. **Implement Dependency Management:**
   - Use `overrides` proactively for known conflicting packages
   - Regular dependency audits to catch conflicts early
   - Monitor peer dependency warnings

3. **Environment Configuration:**
   - Maintain separate `.env` configurations for development/production
   - Verify environment variables are properly set in Vercel dashboard
   - Use Vercel's environment variable validation

4. **Build Process Optimization:**
   - Test builds locally before pushing to main
   - Use `npm ci` for clean installations
   - Consider dependency caching strategies

### 🚀 **Prevention Strategies:**

1. **Pre-deployment Checks:**
   - Run `npm ls` to verify dependency tree
   - Test with `--legacy-peer-deps` flag if needed
   - Use `npm audit` regularly

2. **Continuous Integration:**
   - Implement dependency conflict detection in CI/CD
   - Automated testing of deployment builds
   - Version pinning for production-critical packages

3. **Documentation:**
   - Maintain this deployment issues log
   - Document environment variable requirements
   - Keep track of breaking changes in major dependencies

---

## Environment Variables Reference

### 🔐 **Required for Deployment:**
```env
# Core Configuration
PAYLOAD_SECRET=***
NEXTAUTH_SECRET=***
JWT_SECRET=***

# Database
MONGODB_URI=***
DATABASE_URL=***

# URLs
PAYLOAD_PUBLIC_SERVER_URL=https://uniqbrio.vercel.app
NEXT_PUBLIC_APP_URL=https://uniqbrio.vercel.app
NEXTAUTH_URL=https://uniqbrio.vercel.app

# OAuth
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# Email Service (Zepto Mail)
ZEPTO_HOST=smtp.zeptomail.in
ZEPTO_PORT=587
ZEPTO_USER=***
ZEPTO_PASS=***
ZEPTO_FROM_EMAIL=***

# Cloudflare R2 Storage
CLOUDFLARE_R2_ENDPOINT=***
CLOUDFLARE_R2_ACCESS_KEY_ID=***
CLOUDFLARE_R2_SECRET_ACCESS_KEY=***
CLOUDFLARE_R2_BUCKET=***
CLOUDFLARE_R2_API_TOKEN=***
```

---

## Contact & Support

**Development Team:** UniqBrio Technical Team  
**Repository:** [github.com/UniqBrio/UniqBrio](https://github.com/UniqBrio/UniqBrio)  
**Deployment Platform:** Vercel  

*This document should be updated whenever new deployment issues are encountered.*