import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Instructor schema
const instructorSchema = new mongoose.Schema({
  instructorId: String,
  firstName: String,
  middleName: String,
  lastName: String,
  // Add other fields as needed
}, { collection: 'instructors', strict: false });

const Instructor = mongoose.models.Instructor || mongoose.model('Instructor', instructorSchema);

export async function GET() {
  try {
    await dbConnect("uniqbrio");

    const instructors = await Instructor.find({})
      .select('instructorId firstName middleName lastName')
      .lean()
      .sort({ firstName: 1 });

    // Format the names
    const formattedInstructors = instructors.map((instructor: any) => {
      const nameParts = [
        instructor.firstName,
        instructor.middleName,
        instructor.lastName
      ].filter(Boolean); // Remove null/undefined/empty values
      
      const fullName = nameParts.join(' ');
      
      return {
        _id: instructor._id,
        instructorId: instructor.instructorId,
        name: fullName,
        displayName: `${fullName} (${instructor.instructorId})`
      };
    });

    return NextResponse.json(formattedInstructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}
