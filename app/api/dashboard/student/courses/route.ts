import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import { getUserSession } from '@/lib/tenant/api-helpers';
import { runWithTenantContext } from '@/lib/tenant/tenant-context';

// Define the Course schema
const courseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  courseId: String,
  description: String,
  courseCategory: String,
  type: String,
  duration: String,
  level: String,
  prerequisites: [String],
  outcomes: [String],
  status: String
}, {
  collection: 'courses',
  strict: false
});

// Define interface for Course document
interface CourseDocument extends mongoose.Document {
  name: string;
  courseId: string;
  description: string;
  courseCategory: string;
  type: string;
  duration: string;
  level: string;
  prerequisites: string[];
  outcomes: string[];
  status: string;
}

// Get or create the Course model with proper typing
const Course: mongoose.Model<CourseDocument> = mongoose.models.Course || 
  mongoose.model<CourseDocument>('Course', courseSchema);

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

        // Fetch courses
        console.log('Fetching courses...');
        const courses = await Course.find({ tenantId: session.tenantId }).lean();
    
    if (!courses || courses.length === 0) {
      console.log('No courses found in database');
      return NextResponse.json([]);
    }

    console.log(`Found ${courses.length} raw courses from database`);
    
    // Log first course to verify field names
    if (courses[0]) {
      console.log('Sample course data:', {
        _id: courses[0]._id,
        courseId: courses[0].courseId,
        name: courses[0].name,
        courseCategory: courses[0].courseCategory,
        type: courses[0].type,
        level: courses[0].level
      });
    }

    // Map to include a stable id property for the frontend (prefer courseId)
    const mapped: any[] = [];
    for (const c of courses) {
      try {
        const id = c.courseId || (c._id ? String(c._id) : undefined);
        if (!id) continue; // skip malformed docs
        mapped.push({
          id,
          name: c.name || '',
          description: c.description || '',
          category: c.courseCategory || '',
          type: c.type || '',
          duration: c.duration || '',
          level: c.level || '',
          prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
          outcomes: Array.isArray(c.outcomes) ? c.outcomes : [],
          status: c.status || 'Active',
          courseId: c.courseId || undefined,
        });
      } catch (e) {
        console.warn('Skipping malformed course document', e);
      }
    }

        console.log(`Successfully found ${mapped.length} courses`);
        return NextResponse.json(mapped);

      } catch (error: any) {
        console.error('Error in GET /api/courses:', error);
        return NextResponse.json({
          error: 'Failed to fetch courses',
          details: error.message
        }, { status: 500 });
      }
    }
  );
}