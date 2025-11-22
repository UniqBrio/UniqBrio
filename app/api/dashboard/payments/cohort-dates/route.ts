import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Cohort schema
const cohortSchema = new mongoose.Schema({
  cohortId: String,
  name: String,
  inheritedStartDate: Date,
  inheritedEndDate: Date,
  // Add other fields as needed
}, { collection: 'cohorts', strict: false });

const Cohort = mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema);

export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const searchParams = request.nextUrl.searchParams;
    const cohortId = searchParams.get('cohortId');

    console.log('[cohort-dates] Request received for cohortId:', cohortId);

    if (!cohortId) {
      return NextResponse.json(
        { error: 'Cohort ID is required' },
        { status: 400 }
      );
    }

    const cohort = await Cohort.findOne({ cohortId })
      .select('cohortId name inheritedStartDate inheritedEndDate')
      .lean()
      .exec();

    console.log('[cohort-dates] Cohort query result:', cohort);

    if (!cohort) {
      return NextResponse.json(
        { 
          error: 'Cohort not found',
          details: `No cohort found with cohortId: ${cohortId}`
        },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
          }
        }
      );
    }

    // Calculate duration if both dates exist
    let duration = null;
    const startDate = (cohort as any).inheritedStartDate;
    const endDate = (cohort as any).inheritedEndDate;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      duration = `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
      console.log('[cohort-dates] Calculated duration:', duration);
    }
    
    const result = {
      cohortId: (cohort as any).cohortId,
      cohortName: (cohort as any).name,
      startDate: startDate || null,
      endDate: endDate || null,
      duration: duration
    };

    console.log('[cohort-dates] Returning result:', result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('[cohort-dates] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort dates', details: String(error) },
      { status: 500 }
    );
  }
}
