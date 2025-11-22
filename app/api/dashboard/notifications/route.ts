import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import {
  getStudentNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/dashboard/notification-service';

/**
 * GET /api/notifications?studentId=xxx
 * Get notifications for a student
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const type = searchParams.get('type') || undefined;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    if (unreadOnly) {
      const notifications = await getUnreadNotifications(studentId);
      return NextResponse.json({
        success: true,
        notifications,
        unreadCount: notifications.length,
      });
    }

    const result = await getStudentNotifications(studentId, {
      limit,
      skip,
      type,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await request.json();
    const { notificationId, studentId, markAllAsRead } = body;

    if (markAllAsRead && studentId) {
      await markAllNotificationsAsRead(studentId);
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId);
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    }

    return NextResponse.json(
      { error: 'Either notificationId or (studentId + markAllAsRead) is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification', details: error.message },
      { status: 500 }
    );
  }
}
