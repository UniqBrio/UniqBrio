// d:\UB\lib\auth.ts
import { compare, hash } from "bcryptjs";
import * as jose from 'jose'; // Import jose
import { cookies } from "next/headers";
import UserModel from "@/models/User";
import { dbConnect } from "./mongodb";
import crypto from "crypto";
import { COOKIE_NAMES, COOKIE_EXPIRY } from "./cookies"; // Import cookie constants
import { 
  generateJwtId, 
  createSessionRecord, 
  validateSession, 
  extractSessionFromJWT, 
  type SessionCreationData 
} from "./session-store";

// Ensure JWT_SECRET is defined and store it securely
const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
const JWT_SECRET_UINT8: Uint8Array = new TextEncoder().encode(JWT_SECRET || 'fallback-secret-for-encoding'); // Encode secret for jose
const JWT_ISSUER = process.env.JWT_ISSUER || 'urn:uniqbrio:issuer'; // Define an issuer for your tokens
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'urn:uniqbrio:audience'; // Define an audience for your tokens

// Check if the original secret was actually set
if (!JWT_SECRET) {
  console.error("FATAL ERROR: Missing JWT_SECRET in environment variables");
  // In a real app, you might want to prevent startup or handle this more gracefully
  throw new Error("Missing JWT_SECRET in environment variables. Application cannot securely function.");
}

// Generate a secure random token (e.g., for email verification, password reset)
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  // Salt rounds recommendation: 10-12. 12 is a good balance.
  return await hash(password, 12);
}

// Compare a plaintext password with a stored hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Handle cases where hashedPassword might be null/undefined from DB
  if (!hashedPassword) {
    return false;
  }
  return await compare(password, hashedPassword);
}

// --- Enhanced JWT Creation Function with Session Store ---
// Creates a JWT token with the provided payload, expiration, and session persistence.
// Default 30 days expiry for persistent login (like Gmail)
export async function createToken(
  payload: jose.JWTPayload, 
  expiresIn: string | number = '30d',
  sessionData?: {
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<string> {
  console.log("[AuthLib] createToken: Signing JWT with jose");
  
  // Generate unique JWT ID for session tracking
  const jwtId = generateJwtId();
  
  // Add jti claim to payload
  const enhancedPayload = {
    ...payload,
    jti: jwtId,
  };
  
  // Create JWT
  const token = await new jose.SignJWT(enhancedPayload)
    .setProtectedHeader({ alg: 'HS256' }) // Set algorithm
    .setIssuedAt() // Set issued at timestamp
    .setIssuer(JWT_ISSUER) // Set issuer
    .setAudience(JWT_AUDIENCE) // Set audience
    .setExpirationTime(expiresIn) // Set expiration time
    .sign(JWT_SECRET_UINT8); // Sign with the encoded secret
  
  // Create session record in MongoDB if we have required data
  // For users still in registration (no tenantId yet), skip session record creation
  if (payload.userId && payload.tenantId) {
    try {
      const sessionCreationData: SessionCreationData = {
        userId: payload.userId as string,
        tenantId: payload.tenantId as string,
        userAgent: sessionData?.userAgent,
        ipAddress: sessionData?.ipAddress,
        expiresIn,
      };
      
      await createSessionRecord(jwtId, sessionCreationData);
      console.log("[AuthLib] createToken: Session record created for jwtId:", jwtId);
    } catch (error) {
      console.error("[AuthLib] createToken: Failed to create session record:", error);
      // Continue with JWT creation even if session record fails
    }
  } else if (payload.registrationComplete === false) {
    console.log("[AuthLib] createToken: User in registration, skipping session record creation");
  } else {
    console.warn("[AuthLib] createToken: Missing userId or tenantId, session record not created");
  }
  
  return token;
}

// --- REMOVED createSessionToken function ---
// It was redundant. Use createToken(payload, '7d') if a 7-day expiry is needed.

// Verify a JWT token with session store validation. Returns the payload if valid, otherwise null.
export async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  console.log("[AuthLib] verifyToken: Verifying JWT with jose");
  if (!token) {
    return null; // Handle cases where token might be undefined/empty
  }
  
  try {
    // First verify JWT signature, expiry, issuer, audience
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    // If JWT is valid, check session store for revocation
    // Skip session validation for users still completing registration
    if (payload.registrationComplete === false && !payload.tenantId) {
      console.log("[AuthLib] verifyToken: User in registration flow, skipping session store validation");
      return payload;
    }
    
    if (payload.jti || (payload.userId && payload.tenantId)) {
      const sessionValidation = await validateSession(payload);
      if (!sessionValidation.isValid) {
        console.log("[AuthLib] verifyToken: Session validation failed:", sessionValidation.error);
        return null;
      }
      console.log("[AuthLib] verifyToken: Session validated and activity updated");
    }
    
    return payload;
  } catch (error) {
    // Handle specific errors if needed (e.g., TokenExpiredError, JsonWebTokenError)
    console.error("[AuthLib] verifyToken: Token verification failed:", error);
    return null; // Return null for any verification error (invalid signature, expired, etc.)
  }
}

// Verify a JWT token signature only (without session store validation)
// Used in edge cases where session store access is not available
export async function verifyTokenSignatureOnly(token: string): Promise<jose.JWTPayload | null> {
  if (!token) {
    return null;
  }
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload;
  } catch (error) {
    return null;
  }
}

// Set the session cookie using next/headers
export async function setSessionCookie(token: string, maxAgeDays: number = COOKIE_EXPIRY.SESSION) {
  const cookieStore = await cookies(); // Use next/headers cookies
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  cookieStore.set(COOKIE_NAMES.SESSION, token, {
    httpOnly: true, // Prevent client-side JS access
    secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
    maxAge: maxAgeSeconds, // Set cookie expiry (matches default token expiry)
    path: "/", // Make cookie available site-wide
    sameSite: "lax", // Good default for security vs usability
  });
}

// Get the session token value from the cookie using next/headers
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies(); // Use next/headers cookies
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION);
  return sessionCookie?.value || null;
}

// Delete the session cookie using next/headers
export async function deleteSessionCookie() {
  const cookieStore = await cookies(); // Use next/headers cookies
  // Deleting requires setting expiry in the past or maxAge=0, but .delete() is simpler
  cookieStore.delete(COOKIE_NAMES.SESSION);
}

// Increment failed login attempts and lock account if threshold reached
export async function incrementFailedAttempts(email: string): Promise<number> {
  try {
    await dbConnect();
    const user = await UserModel.findOne({ email });

    // If user doesn't exist, return 0 but maybe log this attempt?
    if (!user) return 0;

    const failedAttempts = user.failedAttempts + 1;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    const lockedUntil = failedAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

    await UserModel.updateOne(
      { email },
      { $set: { failedAttempts, lockedUntil } }
    );

    return failedAttempts;
  } catch (error) {
    console.error("Error incrementing failed attempts for", email, error);
    return 0;
  }
}

// Reset failed login attempts (typically on successful login or password reset)
export async function resetFailedAttempts(email: string): Promise<void> {
  try {
     await dbConnect();
     await UserModel.updateOne(
       { email },
       { $set: { failedAttempts: 0, lockedUntil: null } }
     );
   } catch (error) {
     console.error("Error resetting failed attempts for", email, error);
   }
}
