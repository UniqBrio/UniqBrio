
// d:\UniqBrio\lib\auth-edge.ts
import * as jose from 'jose';
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "./cookies"; // Import cookie constants

// Ensure JWT_SECRET is defined and store it securely
const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
const JWT_SECRET_UINT8: Uint8Array = new TextEncoder().encode(JWT_SECRET || 'fallback-secret-for-encoding'); // Encode secret for jose
const JWT_ISSUER = 'urn:uniqbrio:issuer'; // Define an issuer for your tokens
const JWT_AUDIENCE = 'urn:uniqbrio:audience'; // Define an audience for your tokens

// Check if the original secret was actually set
if (!JWT_SECRET) {
  console.error("FATAL ERROR: Missing JWT_SECRET in environment variables (Edge)");
  // Throwing an error here will prevent the middleware from running without a secret
  throw new Error("Missing JWT_SECRET in environment variables. Application cannot securely function.");
}

// Verify a JWT token. Returns the payload if valid, otherwise null.
// Renamed slightly to avoid potential naming conflicts if imported alongside server funcs
export async function verifyTokenEdge(token: string): Promise<jose.JWTPayload | null> {
  // console.log("[AuthLibEdge] verifyToken: Verifying JWT with jose"); // Optional: logging in edge
  if (!token) {
    return null;
  }
  try {
    // Verify the token using the encoded secret and check issuer/audience
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload;
  } catch (error) {
    // Log less verbosely in the edge, or not at all unless debugging
    // console.error("Token verification failed (Edge):", error instanceof Error ? error.message : error);
    // Common errors are JWTExpired, JWSSignatureVerificationFailed, etc.
    return null; // Return null for any verification error
  }
}

// Get the session token value from the cookie using next/headers
// Renamed slightly for clarity
export async function getSessionCookieEdge(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION);
  return sessionCookie?.value || null;
}

// Note: Functions requiring Prisma (like incrementFailedAttempts) remain in lib/auth.ts

