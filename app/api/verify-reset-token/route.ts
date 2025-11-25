import { NextResponse } from "next/server";
import UserModel from "@/models/User";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 });
  }

  await dbConnect();
  const tokenExists = await UserModel.findOne({
    resetToken: token,
    resetTokenExpiry: { $gte: new Date() },
  });

  if (!tokenExists) {
    return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}