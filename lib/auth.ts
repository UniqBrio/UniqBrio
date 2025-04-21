// d:\UB\lib\auth.ts
import { compare, hash } from "bcryptjs";
// Import SignOptions and Secret from jsonwebtoken
import { verify, JwtPayload, sign, Secret, SignOptions } from "jsonwebtoken";
// Import StringValue from ms if needed for stricter type checking, but SignOptions['expiresIn'] is safer
// import type { StringValue } from "ms";
import { cookies } from "next/headers";
import prisma from "./db";
import crypto from "crypto";
import { COOKIE_NAMES, COOKIE_EXPIRY } from "./cookies"; // Import cookie constants

// Ensure JWT_SECRET is defined and store it securely
const JWT_SECRET: Secret = process.env.JWT_SECRET as Secret; // Cast to Secret type
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

// --- Consolidated JWT Creation Function ---
// Creates a JWT token with the provided payload and expiration.
// Use the type directly from SignOptions for better type safety
export function createToken(payload: Record<string, any>, expiresIn: SignOptions['expiresIn'] = "1d"): string {
  // The type error on line 40 is resolved by using SignOptions['expiresIn'] for the parameter type
  const options: SignOptions = { expiresIn };
  return sign(payload, JWT_SECRET, options);
}

// --- REMOVED createSessionToken function ---
// It was redundant. Use createToken(payload, '7d') if a 7-day expiry is needed.

// Verify a JWT token. Returns the payload if valid, otherwise null.
export function verifyToken(token: string): JwtPayload | null {
  if (!token) {
    return null; // Handle cases where token might be undefined/empty
  }
  try {
    // Verify the token using the secret
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    // Handle specific errors if needed (e.g., TokenExpiredError, JsonWebTokenError)
    // console.error("Token verification failed:", error.name); // Optional: Log specific error type
    return null; // Return null for any verification error (invalid signature, expired, etc.)
  }
}

// Set the session cookie using next/headers
export async function setSessionCookie(token: string, maxAgeDays: number = COOKIE_EXPIRY.SESSION) {
  // FIX: Added 'await' here (resolves error on line 67)
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
  // FIX: Added 'await' here (resolves error on line 79)
  const cookieStore = await cookies(); // Use next/headers cookies
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION);
  return sessionCookie?.value || null;
}

// Delete the session cookie using next/headers
export async function deleteSessionCookie() {
  // FIX: Added 'await' here (resolves error on line 87)
  const cookieStore = await cookies(); // Use next/headers cookies
  // Deleting requires setting expiry in the past or maxAge=0, but .delete() is simpler
  cookieStore.delete(COOKIE_NAMES.SESSION);
}

// Increment failed login attempts and lock account if threshold reached
export async function incrementFailedAttempts(email: string): Promise<number> {
  // Use Prisma transaction for atomicity (optional but safer)
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // If user doesn't exist, return 0 but maybe log this attempt?
    if (!user) return 0;

    // Prevent incrementing if already locked? Depends on desired logic.
    // if (user.lockedUntil && user.lockedUntil > new Date()) {
    //   return user.failedAttempts;
    // }

    const failedAttempts = user.failedAttempts + 1;
    const MAX_ATTEMPTS = 5; // Make this a constant?
    const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    const lockedUntil = failedAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

    await prisma.user.update({
      where: { email },
      data: { failedAttempts, lockedUntil },
    });

    return failedAttempts;
  } catch (error) {
    console.error("Error incrementing failed attempts for", email, error);
    return 0; // Return 0 or throw? Depends on how you handle errors upstream.
  }
}

// Reset failed login attempts (typically on successful login or password reset)
export async function resetFailedAttempts(email: string): Promise<void> {
   try {
     // Check if user exists first? Optional.
     await prisma.user.update({
       where: { email },
       data: { failedAttempts: 0, lockedUntil: null },
     });
   } catch (error) {
     // Log error if user not found or other DB issue
     console.error("Error resetting failed attempts for", email, error);
     // Decide if you need to throw or handle this error.
   }
}
