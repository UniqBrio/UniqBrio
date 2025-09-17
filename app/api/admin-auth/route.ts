import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const ADMIN_EMAIL = "admin@uniqbrio.com";
const ADMIN_PASSWORD = "Integrity@2025";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create admin session token
    const token = await new SignJWT({
      email: ADMIN_EMAIL,
      role: "uniqbrio_admin",
      type: "admin",
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .setIssuer("urn:uniqbrio:admin:issuer")
      .setAudience("urn:uniqbrio:admin:audience")
      .sign(JWT_SECRET);

    // Set secure cookie
    const response = NextResponse.json({
      success: true,
      message: "Admin login successful"
    });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
      sameSite: "strict"
    });

    return response;

  } catch (error) {
    console.error("[admin-auth] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    
    if (!adminSession) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // In a real implementation, you'd verify the JWT token here
    return NextResponse.json({ 
      authenticated: true,
      role: "uniqbrio_admin"
    });

  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out" });
    response.cookies.delete("admin_session");
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
