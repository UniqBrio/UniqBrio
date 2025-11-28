import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AnnouncementModel from "@/models/Announcement";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

// Helper to verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) return false;

    await jwtVerify(adminSession, JWT_SECRET, {
      issuer: "urn:uniqbrio:admin:issuer",
      audience: "urn:uniqbrio:admin:audience",
    });
    return true;
  } catch {
    return false;
  }
}

// GET - Fetch active announcements (public) or all announcements (admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get("admin") === "true";

    if (isAdminRequest) {
      const isAdmin = await verifyAdminToken(request);
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Return all announcements for admin
      const announcements = await AnnouncementModel.find({})
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: announcements,
      });
    }

    // Public request - return only active, non-expired announcements
    const now = new Date();
    const announcements = await AnnouncementModel.find({
      isActive: true,
      publishedAt: { $lte: now },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    })
      .sort({ priority: -1, publishedAt: -1 })
      .limit(10)
      .lean();

    // Transform for frontend
    const transformedAnnouncements = announcements.map((ann: any) => ({
      id: ann._id.toString(),
      type: ann.type,
      title: ann.title,
      message: ann.message,
      timestamp: ann.publishedAt,
      isRead: false,
      link: ann.link,
      priority: ann.priority,
    }));

    return NextResponse.json({
      success: true,
      data: transformedAnnouncements,
    });
  } catch (error) {
    console.error("[announcements] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new announcement (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, link, priority, isActive, publishedAt, expiresAt } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const announcement = await AnnouncementModel.create({
      type: type || "info",
      title,
      message,
      link,
      priority: priority || "medium",
      isActive: isActive !== false,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: "admin",
    });

    return NextResponse.json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("[announcements] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an announcement (admin only)
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Process dates if provided
    if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
    }
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const announcement = await AnnouncementModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("[announcements] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an announcement (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const announcement = await AnnouncementModel.findByIdAndDelete(id);

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("[announcements] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
