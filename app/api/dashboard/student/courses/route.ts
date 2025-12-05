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

        // Fetch only active courses with needed fields for performance
        const courses = await Course.find(
          { 
            tenantId: session.tenantId,
            status: 'Active'
          },
          { courseId: 1, name: 1, description: 1, courseCategory: 1, type: 1, duration: 1, level: 1, prerequisites: 1, outcomes: 1, status: 1 }
        ).lean();
    
    if (!courses || courses.length === 0) {
      return NextResponse.json([]);
    }

    // Map to include a stable id property for the frontend (prefer courseId)
    const mapped: any[] = [];
    for (const c of courses) {
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
    }

        return NextResponse.json(mapped);

      } catch (error: any) {
        console.error('Error fetching courses:', error.message);
        return NextResponse.json({
          error: 'Failed to fetch courses',
          details: error.message
        }, { status: 500 });
      }
    }
  );
}