import { compare, hash } from "bcryptjs";
import {  verify, JwtPayload } from "jsonwebtoken";
import { Secret, sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "./db";
import crypto from "crypto";

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment variables");
  throw new Error("Missing JWT_SECRET in environment variables");
}
const JWT_SECRET = process.env.JWT_SECRET;

// Generate a verification token
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

// Compare a password with a hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

// Create a JWT token with proper type enforcement
export function createToken(payload: Record<string, any>, expiresIn: string = "1d"): string {
  return sign(payload, JWT_SECRET, { expiresIn } as any);
}

import jwt from 'jsonwebtoken'

export function createSessionToken(user: { id: string, role: string }) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}


// Verify a JWT token and enforce return type
export function verifyToken(token: string): JwtPayload | null {
  try {
    return verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Set a session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });
}

// Get the session from the cookie
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value || null;
}

// Delete the session cookie
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Increment failed login attempts safely
export async function incrementFailedAttempts(email: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return 0;

  const failedAttempts = user.failedAttempts + 1;
  const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

  await prisma.user.update({
    where: { email },
    data: { failedAttempts, lockedUntil },
  });

  return failedAttempts;
}

// Reset failed login attempts
export async function resetFailedAttempts(email: string) {
  await prisma.user.update({
    where: { email },
    data: { failedAttempts: 0, lockedUntil: null },
  });
}
