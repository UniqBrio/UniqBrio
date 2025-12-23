import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie, verifyToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import RegistrationModel from "@/models/Registration";

export async function GET(_req: NextRequest) {
  try {
    const token = await getSessionCookie();
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    await dbConnect();

    // Prefer explicit academyId from session, fallback to tenantId, then email lookup
    const academyId = (payload as any).academyId || (payload as any).tenantId || "";
    let registration = null as any;

    if (academyId) {
      registration = await RegistrationModel.findOne({ academyId });
    }

    if (!registration && (payload as any).email) {
      registration = await RegistrationModel.findOne({ 'adminInfo.email': (payload as any).email });
    }

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const createdAt: Date = registration.createdAt instanceof Date
      ? registration.createdAt
      : new Date(registration.createdAt);

    const now = Date.now();
    const daysSince = Math.max(0, Math.floor((now - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      academyId: registration.academyId,
      createdAt: createdAt.toISOString(),
      daysSince,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
