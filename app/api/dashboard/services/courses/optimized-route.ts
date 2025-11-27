import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Course } from "@/models/dashboard"
import { cache } from "@/lib/dashboard/redis"
import { createRateLimit, DatabaseOptimizer, formatApiResponse } from "@/lib/dashboard/optimizations"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

// Create rate limiter for this endpoint
const checkRateLimit = createRateLimit(200, 60000); // 200 requests per minute

export async function GET(request: Request) {
  try {
    // Apply rate limiting
    if (!checkRateLimit(request as any)) {
      return NextResponse.json(
        formatApiResponse(false, null, "Rate limit exceeded"),
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Generate cache key from all parameters
    const cacheKey = `courses:optimized:${searchParams.toString()}`;
    
    // Try cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    await dbConnect("uniqbrio");
    
    // Build optimized query
    const query: any = {};
    
    // Add filters
    if (searchParams.get('category')) {
      query.category = searchParams.get('category');
    }
    if (searchParams.get('level')) {
      query.level = searchParams.get('level');
    }
    if (searchParams.get('instructor')) {
      query.instructor = searchParams.get('instructor');
    }
    if (searchParams.get('status')) {
      query.status = searchParams.get('status');
    } else {
      query.isPublished = true;
    }
    
    // Add search
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search');
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Use optimized database query
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100),
      sort: { [searchParams.get('sortBy') || 'createdAt']: searchParams.get('sortOrder') === 'asc' ? 1 : -1 },
      populate: [{ path: 'instructor', select: 'name email avatar' }],
      select: 'title description instructor category level price rating enrollmentCount status thumbnail',
      lean: true
    };

    const result = await DatabaseOptimizer.optimizeQuery(Course, query, options);
    
    const response = formatApiResponse(true, {
      courses: result.results,
      pagination: result.pagination
    });
    
    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Optimized course fetch error:', error);
    return NextResponse.json(
      formatApiResponse(false, null, "Failed to fetch courses"),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json(
      formatApiResponse(false, null, 'Unauthorized: No tenant context'),
      { status: 401 }
    );
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    // Apply stricter rate limiting for write operations
    const writeRateLimit = createRateLimit(50, 60000);
    if (!writeRateLimit(request as any)) {
      return NextResponse.json(
        formatApiResponse(false, null, "Rate limit exceeded"),
        { status: 429 }
      );
    }

    await dbConnect("uniqbrio");
    const body = await request.json();

    // Invalidate all course caches when creating/updating
    await cache.invalidateCourses();

    let result;
    
    if (body._id || body.id) {
      // Update existing course
      const courseId = body._id || body.id;
      result = await Course.findByIdAndUpdate(
        courseId, 
        body, 
        { new: true, upsert: true, runValidators: true }
      ).lean();
      
      // Cache individual course
      await cache.set(`course:${courseId}`, result, 3600);
      
      return NextResponse.json(formatApiResponse(true, { course: result, updated: true }));
    } else {
      // Create new course
      result = await Course.create({ ...body, tenantId: session.tenantId });
      
      // Cache new course
      await cache.set(`course:${result._id}`, result, 3600);
      
      return NextResponse.json(formatApiResponse(true, { course: result }), { status: 201 });
    }
    
  } catch (error) {
    console.error('Optimized course creation error:', error);
    let message = "Failed to create course";
    let status = 500;
    
    if (error instanceof Error) {
      message = error.message;
      if (error.name === 'ValidationError') {
        status = 400;
      }
    }
    
    return NextResponse.json(formatApiResponse(false, null, message), { status });
  }
    }
  );
}
