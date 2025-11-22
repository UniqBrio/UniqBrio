import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define NonInstructor schema
const nonInstructorSchema = new mongoose.Schema({
  externalId: String,
  firstName: String,
  middleName: String,
  lastName: String,
  // Add other fields as needed
}, { collection: 'non_instructors', strict: false });

const NonInstructor = mongoose.models.NonInstructor || mongoose.model('NonInstructor', nonInstructorSchema);

export async function GET() {
  try {
    await dbConnect("uniqbrio");

    const nonInstructors = await NonInstructor.find({})
      .select('externalId firstName middleName lastName')
      .lean()
      .sort({ firstName: 1 });

    // Format the names
    const formattedNonInstructors = nonInstructors.map((person: any) => {
      const nameParts = [
        person.firstName,
        person.middleName,
        person.lastName
      ].filter(Boolean); // Remove null/undefined/empty values
      
      const fullName = nameParts.join(' ');
      
      return {
        _id: person._id,
        externalId: person.externalId,
        name: fullName,
        displayName: `${fullName} (${person.externalId})`
      };
    });

    return NextResponse.json(formattedNonInstructors);
  } catch (error) {
    console.error('Error fetching non-instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch non-instructors' },
      { status: 500 }
    );
  }
}
