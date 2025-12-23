import { NextResponse } from "next/server";
import UserModel from "@/models/User";
import RegistrationModel from "@/models/Registration";
import { dbConnect } from "@/lib/mongodb";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { getUserSession } from "@/lib/tenant/api-helpers";
import { runWithTenantContext } from "@/lib/tenant/tenant-context";

// Cache for 5 minutes (dashboard summary changes infrequently)
export const dynamic = 'force-dynamic';
export const revalidate = 300;

// Helper to resolve the current user's context (userId, academyId, tenantId) from the session
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

  return { userId: user.userId, academyId: user.academyId, tenantId: user.academyId } as const;
}

export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        const context = await getUserContext();
        if ("error" in context) {
          return NextResponse.json({ error: context.error }, { status: context.status });
        }

        const { userId, academyId } = context;

        // All queries filtered by tenant context automatically
        const registrations = await RegistrationModel.find({ userId, academyId }).lean();

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
  );
}