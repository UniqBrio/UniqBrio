import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import DemoBooking from "@/models/DemoBooking";

export async function GET() {
  try {
    await dbConnect();
    
    const count = await DemoBooking.countDocuments({ status: { $ne: 'cancelled' } });
    
    return NextResponse.json({
      success: true,
      count: count,
      spotsRemaining: Math.max(0, 100 - count),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("❌ Error fetching demo bookings count:", error);
    return NextResponse.json(
      { 
        success: false,
        count: 0,
        spotsRemaining: 100,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}

// Disable static generation for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0
