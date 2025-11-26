import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Define Cohort schema
const cohortSchema = new mongoose.Schema({
  cohortId: String,
  name: String,
  inheritedStartDate: Date,
  inheritedEndDate: Date,
  // Add other fields as needed
}, { collection: 'cohorts', strict: false });

const Cohort = mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema);

export async function GET() {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio");

        const cohorts = await Cohort.find({})
          .select('cohortId name inheritedStartDate inheritedEndDate')
          .lean();

        // Create a map of cohortId to dates for easy lookup
        const cohortDatesMap = cohorts.reduce((acc: any, cohort: any) => {
          acc[cohort.cohortId] = {
            cohortId: cohort.cohortId,
            cohortName: cohort.name,
            startDate: cohort.inheritedStartDate || null,
            endDate: cohort.inheritedEndDate || null
          };
          return acc;
        }, {});

        return NextResponse.json(cohortDatesMap);
      } catch (error) {
        console.error('Error fetching all cohort dates:', error);
        return NextResponse.json(
          { error: 'Failed to fetch cohort dates' },
          { status: 500 }
        );
      }
    }
  );
}
