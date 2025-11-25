import { NextResponse } from "next/server";
import { google } from "googleapis";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
  });

  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ success: false, message: "Authorization code is required." }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Validate the data object
    const email = data.email;
    const name = data.name;
    const googleId = data.id;

    if (!email || !name || !googleId) {
      return NextResponse.json(
        { success: false, message: "Invalid user data received from Google." },
        { status: 400 }
      );
    }

    // Check if user exists in the database
    await dbConnect();
    let user = await UserModel.findOne({ email });

    if (!user) {
      // Create a new user if not found
      user = await UserModel.create({
        email,
        name,
        googleId,
        verified: true,
      });
    }

    // Generate session token and return success
    const sessionToken = "generated-session-token"; // Replace with actual token generation logic
    return NextResponse.json({ success: true, sessionToken });
  } catch (error) {
    console.error("Error during Google OAuth:", error);
    return NextResponse.json({ success: false, message: "Failed to authenticate with Google." }, { status: 500 });
  }
}