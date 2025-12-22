import { NextRequest, NextResponse } from 'next/server';
import { sendBulkAttendanceNotifications } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceRecords, sessionId, sessionDate, sessionTime, batchName, academyName } = body;

    // Validate required fields
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json(
        { error: 'Invalid attendance records' },
        { status: 400 }
      );
    }

    // Send bulk notifications
    const result = await sendBulkAttendanceNotifications({
      attendanceRecords,
      sessionId,
      sessionDate,
      sessionTime,
      batchName,
      academyName,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error sending attendance notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
