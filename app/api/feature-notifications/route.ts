import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import FeatureNotificationModel from "@/models/FeatureNotification";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

// Valid feature names
const VALID_FEATURES = [
  "crm",
  "sell-products",
  "promotions",
  "parent-management",
  "alumni-management",
];

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

// GET - Fetch notification counts (admin only) OR check subscription status for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature");
    const checkStatus = searchParams.get("checkStatus");
    
    await dbConnect();

    // If checking subscription status for a specific feature (for regular users)
    if (feature && checkStatus === "true") {
      if (!VALID_FEATURES.includes(feature)) {
        return NextResponse.json(
          { error: "Invalid feature" },
          { status: 400 }
        );
      }

      // Get user identifier from cookies
      const userId = request.cookies.get("userId")?.value;
      const academyId = request.cookies.get("academyId")?.value;
      
      // Generate subscriber ID the same way as POST
      let subscriberId: string;
      if (userId && academyId) {
        subscriberId = `user_${userId}_${academyId}`;
      } else if (userId) {
        subscriberId = `user_${userId}`;
      } else {
        // No user ID available - they're not subscribed
        return NextResponse.json({
          success: true,
          isSubscribed: false,
        });
      }

      // Check if this subscriber exists for this feature
      const existingSubscription = await FeatureNotificationModel.findOne({
        feature,
        "subscribers.sessionId": subscriberId,
      });

      return NextResponse.json({
        success: true,
        isSubscribed: !!existingSubscription,
      });
    }

    // Admin-only: Fetch all notification counts
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await FeatureNotificationModel.find({}).lean();

    // Create a map with all features, defaulting to 0
    const featureCounts: Record<string, number> = {};
    VALID_FEATURES.forEach((feature) => {
      featureCounts[feature] = 0;
    });

    // Update with actual counts
    notifications.forEach((notification: any) => {
      featureCounts[notification.feature] = notification.count;
    });

    const totalSubscribers = notifications.reduce(
      (sum: number, n: any) => sum + (n.count || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        featureCounts,
        totalSubscribers,
        features: notifications.map((n: any) => ({
          feature: n.feature,
          count: n.count,
          lastUpdated: n.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("[feature-notifications] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Subscribe to a feature notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature } = body;

    if (!feature || !VALID_FEATURES.includes(feature)) {
      return NextResponse.json(
        { error: "Invalid feature name" },
        { status: 400 }
      );
    }

    // Get user identifier from session cookie or generate one
    const sessionToken = request.cookies.get("next-auth.session-token")?.value 
      || request.cookies.get("__Secure-next-auth.session-token")?.value;
    const userIdCookie = request.cookies.get("userId")?.value;
    
    // Create a unique identifier for the user
    const subscriberId = sessionToken || userIdCookie || request.headers.get("x-forwarded-for") || "anonymous";
    const subscriberHash = Buffer.from(subscriberId).toString("base64").slice(0, 32);

    await dbConnect();

    // Check if this user has already subscribed to this feature
    const existingSubscription = await FeatureNotificationModel.findOne({
      feature,
      "subscribers.sessionId": subscriberHash,
    });

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "You've already subscribed to this feature",
        data: {
          feature,
          totalCount: existingSubscription.count,
        },
      });
    }

    // Use upsert to create or update the notification document
    const result = await FeatureNotificationModel.findOneAndUpdate(
      { feature },
      {
        $inc: { count: 1 },
        $push: {
          subscribers: {
            sessionId: subscriberHash,
            subscribedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      message: "Successfully subscribed to notifications",
      data: {
        feature,
        totalCount: result.count,
      },
    });
  } catch (error) {
    console.error("[feature-notifications] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
