import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 });
  }

  const tokenExists = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
  });

  if (!tokenExists) {
    return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}