import { type NextRequest, NextResponse } from "next/server"
import UserModel from "@/models/User"
import { dbConnect } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ valid: false, message: "Token is required" }, { status: 400 })
    }

    // Check if token exists and is not expired
    await dbConnect();
    const user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpiry: {
        $gt: new Date(),
      },
    })

    return NextResponse.json({ valid: !!user })
  } catch (error) {
    console.error("Error checking token:", error)
    return NextResponse.json({ valid: false, message: "An error occurred" }, { status: 500 })
  }
}
