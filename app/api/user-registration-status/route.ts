import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";

// Route segment config for optimal performance
export const dynamic = 'force-dynamic'; // Always check fresh data for auth status
export const runtime = 'nodejs'; // Use Node.js runtime for DB access
export const fetchCache = 'force-no-store'; // Don't cache responses

// Simple in-memory cache with TTL (cache user status for 30 seconds to reduce DB load)
const statusCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Verify authentication
    const sessionCookie = request.cookies.get("session")?.value || 
                          request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!sessionCookie) {
      console.log("[user-registration-status] No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenStartTime = Date.now();
    const payload = await verifyToken(sessionCookie);
    const tokenTime = Date.now() - tokenStartTime;
    if (tokenTime > 100) {
      console.log(`[user-registration-status] Token verification took ${tokenTime}ms`);
    }
    
    if (!payload?.email) {
      console.log("[user-registration-status] Invalid token payload");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check cache first
    const cached = statusCache.get(payload.email);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Get user registration status with performance monitoring
    const dbStartTime = Date.now();
    await dbConnect("uniqbrio");
    const dbTime = Date.now() - dbStartTime;
    if (dbTime > 50) {
      console.log(`[user-registration-status] DB connection took ${dbTime}ms`);
    }
    
    const queryStartTime = Date.now();
    const user = await UserModel.findOne({ email: payload.email })
      .select('registrationComplete verified kycStatus createdAt')
      .lean()
      .maxTimeMS(2000); // Set MongoDB query timeout to 2 seconds
    
    const queryTime = Date.now() - queryStartTime;
    if (queryTime > 200) {
      console.log(`[user-registration-status] Query took ${queryTime}ms`);
    }

    if (!user) {
      console.log("[user-registration-status] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalTime = Date.now() - startTime;
    if (totalTime > 500) {
      console.log(`[user-registration-status] Total request took ${totalTime}ms`);
    }
    
    const responseData = {
      registrationComplete: user.registrationComplete,
      verified: user.verified,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt
    };

    // Cache the result
    statusCache.set(payload.email, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean up old cache entries (simple cleanup every 100 requests)
    if (statusCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of statusCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          statusCache.delete(key);
        }
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`[user-registration-status] Error after ${Date.now() - startTime}ms:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}