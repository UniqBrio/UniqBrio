import { NextRequest, NextResponse } from "next/server";
import { startPaymentWatcher, backfillIncomeFromPayments } from "@/lib/dashboard/payment-watcher";

let watcherInstance: any = null;

// POST /api/payment-watcher?action=start|stop|backfill
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "start") {
      if (watcherInstance) {
        return NextResponse.json({ 
          message: "Watcher is already running" 
        });
      }

      watcherInstance = await startPaymentWatcher();
      return NextResponse.json({ 
        message: "Payment watcher started successfully",
        status: "running"
      });
    }

    if (action === "stop") {
      if (watcherInstance) {
        if (typeof watcherInstance.stop === 'function') {
          watcherInstance.stop();
        } else if (typeof watcherInstance.close === 'function') {
          watcherInstance.close();
        }
        watcherInstance = null;
        return NextResponse.json({ 
          message: "Payment watcher stopped",
          status: "stopped"
        });
      }
      return NextResponse.json({ 
        message: "No watcher is currently running",
        status: "stopped"
      });
    }

    if (action === "backfill") {
      const result = await backfillIncomeFromPayments();
      return NextResponse.json({ 
        message: "Backfill completed",
        ...result
      });
    }

    return NextResponse.json({ 
      error: "Invalid action. Use ?action=start, ?action=stop, or ?action=backfill" 
    }, { status: 400 });

  } catch (error: any) {
    console.error("Payment watcher API error:", error);
    return NextResponse.json({ 
      error: "Failed to manage payment watcher",
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/payment-watcher - Check watcher status
export async function GET() {
  return NextResponse.json({
    status: watcherInstance ? "running" : "stopped",
    message: watcherInstance 
      ? "Payment watcher is actively monitoring for new payments" 
      : "Payment watcher is not running"
  });
}
