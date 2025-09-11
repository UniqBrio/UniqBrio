import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("[test-kyc-auth] Testing KYC authentication...");
    
    // Get the current user's session (same as KYC upload API)
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      console.log("[test-kyc-auth] No session token found");
      return NextResponse.json({ 
        authenticated: false, 
        error: "No session token found",
        message: "You need to log in first"
      });
    }

    // Verify the token and get user info
    const payload = await verifyToken(sessionToken);
    if (!payload?.email || typeof payload.email !== 'string') {
      console.log("[test-kyc-auth] Invalid session payload");
      return NextResponse.json({ 
        authenticated: false, 
        error: "Invalid session payload",
        message: "Session is invalid, please log in again"
      });
    }

    const userEmail = payload.email;
    console.log(`[test-kyc-auth] Authenticated user: ${userEmail}`);

    // Test creating mock form data
    const mockFormData = {
      ownerImage: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      bannerImage: null,
      ownerWithBannerImage: null,
      location: "Test Location",
      dateTime: new Date().toISOString(),
      latitude: "12.9716",
      longitude: "77.5946",
      address: "Test Address",
      userId: "AD000002",
      academyId: "AC000002"
    };

    return NextResponse.json({
      authenticated: true,
      userEmail,
      message: "Authentication successful - KYC upload should work",
      mockFormData,
      nextStep: "Try the KYC form again - it should now work with authentication"
    });

  } catch (error) {
    console.error("[test-kyc-auth] Error:", error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : String(error),
      message: "Authentication test failed"
    }, { status: 500 });
  }
}
