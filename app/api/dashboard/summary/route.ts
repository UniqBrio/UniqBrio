import { NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { getSessionCookie, verifyToken } from "@/lib/auth";

// Helper to resolve the current user's context (userId, academyId) from the session
async function getUserContext() {
  const session = await getSessionCookie();
  if (!session) return { error: "Not authenticated", status: 401 } as const;

  const payload = await verifyToken(session);
  if (!payload?.email || typeof payload.email !== "string") {
    return { error: "Invalid session", status: 401 } as const;
  }

  await dbConnect();
  const user = await UserModel.findOne({ email: payload.email });
  if (!user) return { error: "User not found", status: 404 } as const;
  if (!user.verified) return { error: "Email not verified", status: 403 } as const;
  if (!user.registrationComplete) return { error: "Registration incomplete", status: 400 } as const;
  if (!user.userId || !user.academyId) return { error: "User profile IDs missing", status: 400 } as const;

  return { userId: user.userId, academyId: user.academyId } as const;
}

export async function GET() {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { userId, academyId } = context;

    // Example queries: replace with real models as your schema grows.
    // All queries MUST be filtered by academyId (and userId, when applicable).
    // const coursesCount = await prisma.course.count({ where: { academyId } });
    // const studentsCount = await prisma.student.count({ where: { academyId } });

    // Demo summary using available data
    const registrations = await RegistrationModel.find({ userId, academyId });

    return NextResponse.json({
      userId,
      academyId,
      registrationRecords: registrations.length,
      // coursesCount,
      // studentsCount,
    });
  } catch (e) {
    console.error("/api/dashboard/summary error", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}