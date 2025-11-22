import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import NonInstructor from '@/models/dashboard/staff/NonInstructor';

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { searchParams } = new URL(request.url);
    const checkRole = searchParams.get('check');

    if (checkRole) {
      const count = await NonInstructor.countDocuments({ role: checkRole });
      return NextResponse.json({ isUsed: count > 0, count });
    }

    const roles = await NonInstructor.distinct('role');
    const validRoles = (roles as string[]).filter((role) => role && role.trim() !== '');
    return NextResponse.json({ roles: validRoles });
  } catch (error) {
    console.error('Error in NI roles API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const { customRoles } = await request.json();
    if (!Array.isArray(customRoles)) {
      return NextResponse.json({ error: 'customRoles must be an array' }, { status: 400 });
    }
    // No separate storage; values persist when NI profiles use them
    return NextResponse.json({ success: true, message: 'Roles updated successfully' });
  } catch (error) {
    console.error('Error updating NI roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
