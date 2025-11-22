import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Event from '@/models/dashboard/events/Event';

/**
 * GET /api/events/stats/overview
 * Get event statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const query = { isDeleted: { $ne: true } };

    // Fetch various statistics
    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      totalParticipants,
      totalRevenue,
      sportDistribution,
    ] = await Promise.all([
      Event.countDocuments(query),
      Event.countDocuments({ ...query, isPublished: true }),
      Event.countDocuments({ ...query, isPublished: false }),
      Event.countDocuments({
        ...query,
        startDate: { $gt: new Date() },
      }),
      Event.countDocuments({
        ...query,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }),
      Event.countDocuments({
        ...query,
        endDate: { $lt: new Date() },
      }),
      Event.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: '$participants' },
          },
        },
      ]),
      Event.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: '$revenue' },
          },
        },
      ]),
      Event.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$sport',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalEvents,
          publishedEvents,
          draftEvents,
          upcomingEvents,
          ongoingEvents,
          completedEvents,
          totalParticipants: totalParticipants[0]?.total || 0,
          totalRevenue: totalRevenue[0]?.total || 0,
          sportDistribution: sportDistribution.reduce(
            (acc: any, item: any) => {
              acc[item._id] = item.count;
              return acc;
            },
            {}
          ),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching event statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
