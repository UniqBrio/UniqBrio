import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { verifyPassword } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import UserModel from "@/models/User";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production');
const ADMIN_EMAIL = process.env.UBADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.UBADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("[admin-auth] UBADMIN_EMAIL or UBADMIN_PASSWORD not set in environment variables");
      return NextResponse.json(
        { error: "Admin authentication not properly configured" },
        { status: 500 }
      );
    }

    // Validate admin credentials against environment variables
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      // Also check against database for super_admin users as a fallback
      try {
        await dbConnect();
        const user = await UserModel.findOne({ 
          email: email.toLowerCase().trim(),
          role: 'super_admin'
        });

        if (!user || !user.password) {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }

        // Verify password using the existing auth library
        const isValidPassword = await verifyPassword(password, user.password);
        
        if (!isValidPassword) {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }

        // Valid super_admin user from database
        const token = await new SignJWT({
          email: user.email,
          role: "uniqbrio_admin",
          type: "admin",
          userId: user.id || user._id?.toString(),
          iat: Math.floor(Date.now() / 1000),
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("24h")
          .setIssuer("urn:uniqbrio:admin:issuer")
          .setAudience("urn:uniqbrio:admin:audience")
          .sign(JWT_SECRET);

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

      } catch (dbError) {
        console.error("[admin-auth] Database check failed:", dbError);
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // Valid credentials from environment variables
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

    // Verify the JWT token
    try {
      await jwtVerify(adminSession, JWT_SECRET, {
        issuer: "urn:uniqbrio:admin:issuer",
        audience: "urn:uniqbrio:admin:audience"
      });
      
      return NextResponse.json({ 
        authenticated: true,
        role: "uniqbrio_admin"
      });
    } catch (jwtError) {
      // Invalid token
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

  } catch (error) {
    console.error("[admin-auth] GET Error:", error);
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
