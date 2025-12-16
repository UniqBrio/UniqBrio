import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Course } from "@/models/dashboard"
import Draft from "@/models/dashboard/Draft"
import type { ICourse } from "@/models/dashboard"
import { CourseIdManager } from "@/lib/dashboard/courseIdManager"
import { getAllEnrollments, getCourseEnrollments } from "@/lib/dashboard/studentCohortSync"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"
import mongoose from "mongoose"
import { logEntityCreate, logEntityUpdate, logEntityDelete, getClientIp, getUserAgent } from "@/lib/audit-logger"
import { AuditModule } from "@/models/AuditLog"

export async function POST(request: Request) {
      const session = await getUserSession();
  
      if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
      }
  
      return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        console.log('🚀 POST /api/courses - Starting course creation/update')
        await dbConnect("uniqbrio")
        console.log('✅ MongoDB connected successfully')
    
    const body = await request.json()
          console.log('📝 Request body received:', { 
            type: Array.isArray(body) ? 'array' : 'object',
            hasId: body._id || body.id ? true : false,
            title: Array.isArray(body) ? 'bulk' : body.title 
          })

          // Handle dropdown-options requests
          if (body.action === 'add-dropdown-option') {
            const { type, value } = body
      
            const DROPDOWN_TYPES = {
            levels: {
          defaults: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Pro'],
          field: 'availableLevels'
            },
            types: {
          defaults: ['Online', 'Offline', 'Hybrid'],
          field: 'availableTypes'
            },
            categories: {
          defaults: ['Regular', 'Special', 'Ongoing Training'],
          field: 'availableCategories'
            },
            tags: {
          defaults: ['Art', 'Painting', 'Music', 'Dance', 'Sports', 'Technology', 'Science'],
          field: 'availableTags'
            },
            freeGifts: {
          defaults: ['Badge', 'Keychain', 'Certificate', 'T-Shirt', 'Stickers'],
          field: 'availableFreeGifts'
            }
            }
      
            if (!type || !value || typeof value !== 'string' || value.trim().length === 0) {
            return NextResponse.json(
          { success: false, error: 'Type and value are required' },
          { status: 400 }
            )
            }
      
            if (!DROPDOWN_TYPES[type as keyof typeof DROPDOWN_TYPES]) {
            return NextResponse.json(
          { success: false, error: 'Invalid dropdown type' },
          { status: 400 }
            )
            }
      
            const config = DROPDOWN_TYPES[type as keyof typeof DROPDOWN_TYPES]
            const trimmedValue = value.trim()
      
            // Get current options to check for duplicates
            const currentOptionsUrl = new URL(request.url)
            currentOptionsUrl.searchParams.set('dropdown-options', 'true')
            currentOptionsUrl.searchParams.set('type', type)
            const currentOptionsResponse = await GET(new Request(currentOptionsUrl.toString()))
            const currentOptionsData = await currentOptionsResponse.json()
      
            if (currentOptionsData.success && currentOptionsData.options.includes(trimmedValue)) {
            return NextResponse.json({ 
          success: true, 
          message: 'Option already exists',
          value: trimmedValue,
          type
            })
            }
      
            // Find any course to store the dropdown options, or create a system course for options
            let courseWithOptions = await Course.findOne({ [config.field]: { $exists: true }, tenantId: session.tenantId })
      
            if (!courseWithOptions) {
            // Find any course to add the options field to
            courseWithOptions = await Course.findOne({ isDeleted: { $ne: true }, tenantId: session.tenantId })
            }
      
            if (courseWithOptions) {
            // Add the new option to the existing options array
            const currentOptions = (courseWithOptions as any)[config.field] || [...config.defaults]
            const updatedOptions = Array.from(new Set([...currentOptions, trimmedValue])).sort()
        
            await Course.updateOne(
          { _id: courseWithOptions._id, tenantId: session.tenantId },
          { $set: { [config.field]: updatedOptions } }
            )
        
            // Update all other courses to have the same dropdown options
            await Course.updateMany(
          { _id: { $ne: courseWithOptions._id }, tenantId: session.tenantId },
          { $set: { [config.field]: updatedOptions } }
          )
          } else {
          // If no courses exist, create a system course just for storing dropdown options
          await Course.create({
            name: 'System Options Storage',
            status: 'Draft',
            instructor: 'System',
            maxStudents: 1,
            type: 'Online',
            courseCategory: 'Regular',
            priceINR: 0,
            isDeleted: true, // Mark as deleted so it doesn't appear in normal queries
            [config.field]: [...config.defaults, trimmedValue].sort(),
            tenantId: session.tenantId
          })
          }            return NextResponse.json({ 
            success: true, 
            message: 'Option added successfully',
            value: trimmedValue,
            type
            })
          }

          // Handle locations requests
          if (body.action === 'add-location') {
            const { name } = body
      
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
          { success: false, error: 'Location name is required' },
          { status: 400 }
            )
            }
      
            const locationName = name.trim()
      
            // Get current locations to check for duplicates
            const currentLocationsUrl = new URL(request.url)
            currentLocationsUrl.searchParams.set('locations', 'true')
            const currentLocationsResponse = await GET(new Request(currentLocationsUrl.toString()))
            const currentLocationsData = await currentLocationsResponse.json()
      
            if (currentLocationsData.success) {
            const existingLocation = currentLocationsData.locations.find(
          (loc: string) => loc.toLowerCase() === locationName.toLowerCase()
            )
        
            if (existingLocation) {
          return NextResponse.json({ 
            success: true, 
            location: existingLocation,
            message: 'Location already exists'
          })
            }
            }
      
            const DEFAULT_LOCATIONS = [
            'Studio A',
            'Pool Area', 
            'Music Room',
            'Classroom 101',
            'Basketball Court',
            'Dance Studio',
            'Virtual - Zoom',
            'Virtual - Microsoft Teams',
            'Virtual - Google Meet',
            'Virtual - WebEx',
            'Virtual - Other'
            ]
      
            // Find any course to store the locations, or create a system course
            let courseWithLocations = await Course.findOne({ availableLocations: { $exists: true }, tenantId: session.tenantId })
      
            if (!courseWithLocations) {
            // Find any course to add the locations field to
            courseWithLocations = await Course.findOne({ isDeleted: { $ne: true }, tenantId: session.tenantId })
            }
      
            if (courseWithLocations) {
            // Add the new location to the existing locations array
            const currentLocations = (courseWithLocations as any).availableLocations || [...DEFAULT_LOCATIONS]
            const updatedLocations = Array.from(new Set([...currentLocations, locationName])).sort()
        
            await Course.updateOne(
          { _id: courseWithLocations._id, tenantId: session.tenantId },
          { $set: { availableLocations: updatedLocations } }
            )
        
            // Update all other courses to have the same location options
            await Course.updateMany(
          { _id: { $ne: courseWithLocations._id }, tenantId: session.tenantId },
          { $set: { availableLocations: updatedLocations } }
          )
          } else {
          // If no courses exist, create a system course just for storing locations
          await Course.create({
            name: 'System Options Storage - Locations',
            status: 'Draft',
            instructor: 'System',
            maxStudents: 1,
            type: 'Online',
            courseCategory: 'Regular',
            priceINR: 0,
            isDeleted: true, // Mark as deleted so it doesn't appear in normal queries
            availableLocations: [...DEFAULT_LOCATIONS, locationName].sort(),
            tenantId: session.tenantId
          })
          }            return NextResponse.json({ 
            success: true, 
            location: locationName,
            message: 'Location added successfully'
            })
          }

          // Handle bulk creation
          if (Array.isArray(body)) {
            console.log(`📊 Bulk creation requested for ${body.length} courses`)
      
            // Generate sequential courseIds for ALL courses in bulk
            const bulkBody = await Promise.all(body.map(async (course: any, idx: number) => {
            try {
          // Always generate a new sequential courseId for consistency
          course.courseId = await CourseIdManager.assignCourseIdToPublishedCourse();
          console.log(`🆔 Generated sequential courseId: ${course.courseId} for course: ${course.name || `Course ${idx + 1}`}`);
            } catch (error) {
          console.error(`❌ Error generating courseId for course ${idx}:`, error);
          // Even in fallback, try to maintain sequence
          try {
            course.courseId = await CourseIdManager.getNextAvailableCourseId();
          } catch (fallbackError) {
            console.error(`❌ Fallback also failed:`, fallbackError);
            // Last resort: timestamp with sequence
            course.courseId = `COURSE${String(Date.now() + idx).slice(-4)}`;
          }
            }
            return course;
            }));
      
            const courses = await Course.insertMany(bulkBody);
            console.log(`✅ Bulk creation successful: ${courses.length} courses created`)
      
            // Update draft previews after creating new courses
            await CourseIdManager.updateDraftPreviews();
      
            // Transform the response to match frontend expectations
            const transformedCourses = courses.map((course: any) => {
            const courseObj = course.toObject()
            return {
          ...courseObj,
          id: courseObj.courseId || courseObj._id?.toString?.() || String(courseObj._id),
          name: courseObj.name,
          instructor: courseObj.instructor || 'Unknown Instructor',
          priceINR: courseObj.priceINR,
          type: courseObj.type,
          status: courseObj.status || 'Active'
            }
            })
      
            return NextResponse.json({ 
            success: true, 
            insertedCount: courses.length,
            courses: transformedCourses
            })
          }

          // Handle instructor field - support both name and ID
          const processInstructor = async (instructorData: any) => {
            if (!instructorData) return 'Unknown Instructor';
      
            // If instructorId is provided, fetch the instructor name
            if (body.instructorId) {
            try {
          const { User } = await import('@/models/dashboard')
          const instructor = await User.findOne({ _id: body.instructorId, tenantId: session?.tenantId }).select('name')
          if (instructor) {
            return instructor.name
          }
            } catch (error) {
          console.error('Error fetching instructor:', error)
            }
            }
      
            // Fallback to instructor string processing
            if (typeof instructorData === 'string') return instructorData;
            if (typeof instructorData === 'object') {
            if (instructorData.name) return instructorData.name;
            if (instructorData.email) return instructorData.email;
            if (instructorData.id) return instructorData.id;
            }
            return String(instructorData);
          };

          if (body.instructor || body.instructorId) {
            body.instructor = await processInstructor(body.instructor);
          }

          if (body._id || body.id) {
            const courseId = body._id || body.id
            // For updates, do NOT change the courseId - preserve existing courseId
            // Remove courseId from update data to prevent overwriting
            const { courseId: _, ...updateData } = body;
      
            const updatedCourse = await Course.findOneAndUpdate(
            { _id: courseId, tenantId: session.tenantId },
            updateData, 
            { new: true, upsert: true, runValidators: true }
            )
            const transformedCourse = updatedCourse ? {
            ...updatedCourse.toObject(),
            id: updatedCourse.courseId || updatedCourse._id?.toString?.() || String(updatedCourse._id),
            name: updatedCourse.name,
            instructor: updatedCourse.instructor || 'Unknown Instructor',
            priceINR: updatedCourse.priceINR,
            type: updatedCourse.type,
            status: updatedCourse.status || 'Active'
            } : null
            return NextResponse.json({ 
            success: true, 
            updated: true, 
            course: transformedCourse 
            })
          }

          // For single course creation, always generate sequential courseId
          if (!body.courseId) {
            try {
            body.courseId = await CourseIdManager.assignCourseIdToPublishedCourse();
            console.log(`🆔 Generated sequential courseId: ${body.courseId} for single course: ${body.name}`);
            } catch (error) {
            console.error('❌ Error generating courseId with CourseIdManager:', error);
            // Fallback: try non-atomic method
            try {
          body.courseId = await CourseIdManager.getNextAvailableCourseId();
            } catch (fallbackError) {
          console.error('❌ Fallback failed:', fallbackError);
          // Last resort
          body.courseId = `COURSE${String(Date.now()).slice(-4)}`;
            }
            }
          }

          // Note: No additional safety check needed - assignCourseIdToPublishedCourse() already handles collisions atomically
  
        const course = await Course.create({ 
          _id: new mongoose.Types.ObjectId(),
          ...body, 
          tenantId: session.tenantId 
        })
  
        // Update draft previews after creating new course (within tenant context)
        await runWithTenantContext(
          { tenantId: session.tenantId },
          async () => {
            await CourseIdManager.updateDraftPreviews();
          }
        );

        // If this course was created from a draft, clean up the draft record
        let draftDeleted = false;
        if (body.draftId) {
          try {
            const deleteResult = await Draft.deleteOne({
              _id: body.draftId,
              tenantId: session.tenantId,
            });

            draftDeleted = (deleteResult as any).deletedCount > 0;

            if (!draftDeleted) {
              console.warn(`⚠️ Draft ${body.draftId} not found for cleanup after course creation`);
            }
          } catch (draftCleanupError) {
            console.error('❌ Failed to delete draft after course creation:', draftCleanupError);
          }
        }
        
        // Log course creation
        const headers = new Headers(request.headers);
        await logEntityCreate(
          AuditModule.COURSES,
          course._id.toString(),
          course.name || course.courseId || 'Unnamed Course',
          session.userId,
          session.email,
          'super_admin',
          session.tenantId,
          getClientIp(headers),
          getUserAgent(headers),
          {
            courseId: course.courseId,
            name: course.name,
            type: course.type,
            status: course.status
          }
        );
        
        const transformedCourse = {
            ...course.toObject(),
            id: course.courseId || course._id?.toString?.() || String(course._id),
            name: course.name,
            instructor: course.instructor || 'Unknown Instructor',
            priceINR: course.priceINR,
            type: course.type,
            status: course.status || 'Active'
          }
          return NextResponse.json({ 
            success: true, 
            course: transformedCourse,
            draftDeleted,
          }, { status: 201 })
    
        } catch (error) {
          console.error('❌ Course creation error:', error)
    let message = "Failed to create course"
    let status = 500
    
    if (error instanceof Error) {
      message = error.message
      // Handle validation errors
      if (error.name === 'ValidationError') {
        status = 400
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status })
      }
    }
      );
}

export async function GET(request: Request) {
      const session = await getUserSession();
  
      console.log('[Courses GET] Session data:', {
    email: session?.email,
    userId: session?.userId,
    academyId: session?.academyId,
    tenantId: session?.tenantId
      });
  
      if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
      }
  
      return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        console.log('🔍 GET /api/courses - Fetching courses')
        await dbConnect("uniqbrio")
        console.log('✅ MongoDB connected successfully')
    
    const { searchParams } = new URL(request.url)
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()))

    // Handle enrollment data requests  
    if (searchParams.get('enrollments') === 'true') {
      const courseId = searchParams.get('courseId')
      
      if (courseId) {
        // Get enrollment data for specific course
        const enrollmentData = await getCourseEnrollments(courseId)
        return NextResponse.json({
          success: true,
          enrollments: enrollmentData
        })
      } else {
        // Get enrollment data for all courses
        const allEnrollments = await getAllEnrollments()
        return NextResponse.json({
          success: true,
          enrollments: allEnrollments
        })
      }
    }

    // Handle dropdown-options requests
    if (searchParams.get('dropdown-options') === 'true') {
      const type = searchParams.get('type') // levels, types, categories, tags, freeGifts
      
      const DROPDOWN_TYPES = {
        levels: {
          defaults: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Pro'],
          field: 'availableLevels'
        },
        types: {
          defaults: ['Online', 'Offline', 'Hybrid'],
          field: 'availableTypes'
        },
        categories: {
          defaults: ['Regular', 'Special', 'Ongoing Training'],
          field: 'availableCategories'
        },
        tags: {
          defaults: ['Art', 'Painting', 'Music', 'Dance', 'Sports', 'Technology', 'Science'],
          field: 'availableTags'
        },
        freeGifts: {
          defaults: ['Badge', 'Keychain', 'Certificate', 'T-Shirt', 'Stickers'],
          field: 'availableFreeGifts'
        }
      }
      
      if (!type || !DROPDOWN_TYPES[type as keyof typeof DROPDOWN_TYPES]) {
        return NextResponse.json(
          { success: false, error: 'Invalid dropdown type. Valid types: levels, types, categories, tags, freeGifts' },
          { status: 400 }
        )
      }
      
      const config = DROPDOWN_TYPES[type as keyof typeof DROPDOWN_TYPES]
      let options: string[] = [...config.defaults]
      
      try {
        // First, try to get stored dropdown options from any course
        const courseWithOptions = await Course.findOne(
          { [config.field]: { $exists: true, $not: { $size: 0 } }, tenantId: session.tenantId },
          { [config.field]: 1 }
        ).lean()
        
        let storedOptions: string[] = []
        if (courseWithOptions) {
          const fieldValue = (courseWithOptions as any)[config.field]
          if (Array.isArray(fieldValue)) {
            // Filter out any values starting with "Select"
            storedOptions = fieldValue.filter((item: string) => 
              item && typeof item === 'string' && !item.toLowerCase().startsWith('select')
            )
          }
        }
        
        // If no stored options, get unique values from existing course data as fallback
        let courseDataOptions: string[] = []
        if (storedOptions.length === 0) {
          const fieldMap = {
            levels: 'level',
            types: 'type', 
            categories: 'courseCategory',
            tags: 'tags',
            freeGifts: 'freeGifts'
          }
          
          const dataField = fieldMap[type as keyof typeof fieldMap]
          if (dataField) {
            const courses = await Course.find(
              { 
                isDeleted: { $ne: true },
                [dataField]: { $exists: true, $ne: null },
                tenantId: session.tenantId
              }, 
              { [dataField]: 1 }
            ).lean()
            
            const courseValues = new Set<string>()
            
            courses.forEach((course: any) => {
              const value = course[dataField]
              if (Array.isArray(value)) {
                value.forEach((item: string) => {
                  if (item && typeof item === 'string' && item.trim() && !item.toLowerCase().startsWith('select')) {
                    courseValues.add(item.trim())
                  }
                })
              } else if (value && typeof value === 'string' && value.trim() && !value.toLowerCase().startsWith('select')) {
                courseValues.add(value.trim())
              }
            })
            
            courseDataOptions = Array.from(courseValues)
          }
        }
        
        // Combine defaults, stored options, and course data options, removing duplicates
        const allOptions = new Set([...config.defaults, ...storedOptions, ...courseDataOptions])
        options = Array.from(allOptions).sort()
        
      } catch (error) {
        console.error('Error fetching dropdown options from courses:', { type: type }, error)
        // Return defaults if database query fails
      }
      
      return NextResponse.json({ 
        success: true, 
        options,
        type
      })
    }

    // Handle locations requests
    if (searchParams.get('locations') === 'true') {
      const DEFAULT_LOCATIONS = [
        'Studio A',
        'Pool Area', 
        'Music Room',
        'Classroom 101',
        'Basketball Court',
        'Dance Studio',
        'Virtual - Zoom',
        'Virtual - Microsoft Teams',
        'Virtual - Google Meet',
        'Virtual - WebEx',
        'Virtual - Other'
      ]

      try {
        // Try to get stored locations from any course
        const courseWithLocations = await Course.findOne(
          { availableLocations: { $exists: true, $not: { $size: 0 } }, tenantId: session.tenantId },
          { availableLocations: 1 }
        ).lean()
        
        let locations: string[] = [...DEFAULT_LOCATIONS]
        
        if (courseWithLocations && courseWithLocations.availableLocations) {
          // Get stored locations - filter out any starting with "Select"
          const storedLocations = courseWithLocations.availableLocations.filter(
            (loc: string) => loc && !loc.toLowerCase().startsWith('select')
          )
          
          // Also get unique locations from existing course data
          const coursesWithLocations = await Course.find(
            { 
              isDeleted: { $ne: true },
              location: { $exists: true, $ne: null },
              tenantId: session.tenantId
            }, 
            { location: 1 }
          ).lean()
          
          const courseLocations = new Set<string>()
          coursesWithLocations.forEach((course: any) => {
            if (course.location && typeof course.location === 'string' && course.location.trim() && !course.location.toLowerCase().startsWith('select')) {
              courseLocations.add(course.location.trim())
            }
          })
          
          // Combine defaults, stored locations, and course locations
          const allLocations = new Set([...DEFAULT_LOCATIONS, ...storedLocations, ...Array.from(courseLocations)])
          locations = Array.from(allLocations).sort()
        }
        
        return NextResponse.json({ 
          success: true, 
          locations
        })
      } catch (error) {
        console.error('Error fetching locations:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch locations' },
          { status: 500 }
        )
      }
    }

    // If stats parameter is present, return course statistics
    if (searchParams.get('stats') === 'true') {
      const stats = await Course.aggregate([
        {
          $match: {
            tenantId: session.tenantId,
            isDeleted: { $ne: true } // Exclude deleted courses from stats
          }
        },
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            activeCourses: { 
              $sum: { 
                $cond: [{ $eq: ["$status", "Active"] }, 1, 0] 
              }
            },
            totalStudents: { $sum: { $ifNull: ["$enrolledStudents", 0] } },
            totalRevenue: { 
              $sum: { 
                $multiply: [
                  { $ifNull: ["$price", 0] }, 
                  { $ifNull: ["$enrolledStudents", 0] }
                ] 
              }
            },
            averageRating: { $avg: { $ifNull: ["$rating", 0] } },
            completionRate: { $avg: { $ifNull: ["$completionRate", 0] } }
          }
        }
      ])

      const courseStats = stats.length > 0 ? stats[0] : {
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
        completionRate: 0
      }

      // Remove _id from the response
      delete courseStats._id

      return NextResponse.json({
        success: true,
        stats: courseStats
      })
    }
    
    // Build query based on search parameters
    const query: any = {
      // CRITICAL: Explicitly set tenantId to ensure tenant isolation
      tenantId: session.tenantId,
      // Always exclude soft-deleted courses unless explicitly requested
      isDeleted: { $ne: true }
    }
    
    // If explicitly requesting deleted courses
    if (searchParams.get('includeDeleted') === 'true') {
      delete query.isDeleted; // Remove the filter to include deleted courses
    }
    
    // Filter by instructor
    if (searchParams.get('instructor')) {
      query.instructor = searchParams.get('instructor')
    }
    
    // Filter by category
    if (searchParams.get('category')) {
      query.category = searchParams.get('category')
    }
    
    // Filter by level
    if (searchParams.get('level')) {
      query.level = searchParams.get('level')
    }
    
    // Filter by status
    if (searchParams.get('status')) {
      query.status = searchParams.get('status')
    }
    
    // Search functionality
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
        { skills: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Sorting
    let sort: any = { courseId: 1 } // Default sort by courseId ascending for proper sequential order
    const sortBy = searchParams.get('sortBy')
    if (sortBy) {
      const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1
      sort = { [sortBy]: sortOrder }
    } else {
      // If no specific sort requested, sort by courseId for sequential display
      // This ensures COURSE0001, COURSE0002, COURSE0003 order
      sort = { courseId: 1 }
    }
    
    // Execute query
    console.log('📊 Executing query:', JSON.stringify(query))
    console.log('📄 Pagination:', { page, limit, skip })
    console.log('🔄 Sort:', JSON.stringify(sort))
    
    const courses = await Course.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    console.log(`✅ Found ${courses.length} courses`)
    
    // Transform courses to match frontend expectations
    const transformedCourses = courses.map((course: any) => {
      // Handle instructor field - it's stored as a string
      const instructorName = course.instructor || 'Unknown Instructor';
      return {
        ...course,
        id: course.courseId || course.customId || course._id?.toString?.() || String(course._id),
        name: course.name,
        instructor: instructorName,
        priceINR: course.priceINR,
        type: course.type,
        status: course.status || 'Active'
      }
    })
    
    // Get total count for pagination
    const total = await Course.countDocuments(query)
    console.log(`📈 Total courses in database: ${total}`)

    return NextResponse.json({
      success: true,
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
      } catch (error) {
    console.error('Course fetch error:', error)
    let message = "Failed to fetch courses"
    if (error instanceof Error) message = error.message
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 })
      }
    }
      );
}

export async function PUT(request: Request) {
      const session = await getUserSession();
  
      if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
      }
  
      return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
    await dbConnect("uniqbrio")
    const body = await request.json()
    const { _id, ...updateData } = body
    
    if (!_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Course ID is required for update" 
      }, { status: 400 })
    }
    
    // Get the current course to check if status is changing
    const currentCourse = await Course.findOne({ _id, tenantId: session.tenantId })
    if (!currentCourse) {
      return NextResponse.json({ 
        success: false, 
        error: "Course not found" 
      }, { status: 404 })
    }
    
    const course = await Course.findOneAndUpdate(
      { _id, tenantId: session.tenantId },
      updateData, 
      { new: true, runValidators: true }
    )
    
    if (!course) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to update course" 
      }, { status: 500 })
    }
    
    // Log course update with field changes
    const fieldChanges = Object.keys(updateData)
      .filter(key => (currentCourse as any)[key] !== updateData[key])
      .map(key => ({
        field: key,
        oldValue: String((currentCourse as any)[key] || ''),
        newValue: String(updateData[key] || '')
      }));
    
    if (fieldChanges.length > 0) {
      const headers = new Headers(request.headers);
      await logEntityUpdate(
        AuditModule.COURSES,
        course._id.toString(),
        course.name || course.courseId || 'Unnamed Course',
        fieldChanges,
        session.userId,
        session.email,
        'super_admin',
        session.tenantId,
        getClientIp(headers),
        getUserAgent(headers)
      );
    }
    
    // If course status changed to inactive/cancelled, update associated cohorts
    if (updateData.status && updateData.status !== currentCourse.status) {
      const inactiveStatuses = ['Inactive', 'Cancelled', 'Suspended', 'Archived']
      
      if (inactiveStatuses.includes(updateData.status)) {
        try {
          const { Cohort } = await import('@/models/dashboard')
          
          // Update all cohorts for this course to inactive status
          const cohortUpdateResult = await Cohort.updateMany(
            { courseId: course.courseId || course._id, tenantId: session.tenantId },
            { status: 'Inactive', updatedAt: new Date() }
          )
          
          console.log(`📝 Course status changed to ${updateData.status}. Updated ${cohortUpdateResult.modifiedCount} associated cohorts to Inactive.`)
        } catch (cohortError) {
          console.error('Error updating associated cohorts:', cohortError)
          // Don't fail the course update if cohort update fails
        }
      }
    }
    
    // Transform the response to match frontend expectations
    const transformedCourse = {
      ...course.toObject(),
      id: course.courseId || course.customId || course._id?.toString?.() || String(course._id),
      name: course.name,
      instructor: course.instructor || 'Unknown Instructor',
      priceINR: course.priceINR,
      type: course.type,
      status: course.status || 'Active'
    }
    
    return NextResponse.json({ 
      success: true, 
      course: transformedCourse 
    })
    
      } catch (error) {
    console.error('Course update error:', error)
    let message = "Failed to update course"
    let status = 500
    
    if (error instanceof Error) {
      message = error.message
      if (error.name === 'ValidationError') {
        status = 400
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status })
      }
    }
      );
}

export async function DELETE(request: Request) {
      const session = await getUserSession();
  
      if (!session?.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: No tenant context' },
      { status: 401 }
    );
      }
  
      return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
    await dbConnect("uniqbrio")
    const body = await request.json()
    const { _id, id, hardDelete = false } = body
    const courseId = _id || id
    
    console.log('🗑️ DELETE /api/courses - Course deletion requested:', { 
      courseId, 
      type: typeof courseId, 
      hardDelete 
    })
    
    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        error: "Course ID is required for deletion" 
      }, { status: 400 })
    }
    
    // Find the course to get its details
    let course = await Course.findOne({ courseId: courseId, tenantId: session.tenantId })
    if (!course && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findOne({ _id: courseId, tenantId: session.tenantId })
    }
    
    if (!course) {
      console.log('❌ Course not found for deletion:', courseId)
      return NextResponse.json({ 
        success: false, 
        error: "Course not found" 
      }, { status: 404 })
    }

    // Use soft deletion by default to preserve course ID sequence
    if (!hardDelete) {
      if (!course.courseId) {
        return NextResponse.json({ 
          success: false, 
          error: "Course does not have a courseId" 
        }, { status: 400 })
      }
      
      const success = await CourseIdManager.softDeleteCourse(course.courseId);
      
      if (success) {
        // Log course deletion
        const headers = new Headers(request.headers);
        await logEntityDelete(
          AuditModule.COURSES,
          course._id.toString(),
          course.name || course.courseId || 'Unnamed Course',
          session.userId,
          session.email,
          'super_admin',
          session.tenantId,
          getClientIp(headers),
          getUserAgent(headers),
          {
            courseId: course.courseId,
            name: course.name,
            type: course.type,
            deletionType: 'soft'
          }
        );
        
        console.log(`✅ Successfully soft deleted course: ${course.courseId}`)
        return NextResponse.json({ 
          success: true, 
          message: `Course ${course.courseId} soft deleted successfully`,
          deletedCourse: {
            courseId: course.courseId,
            name: course.name,
            isDeleted: true
          }
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: "Failed to soft delete course" 
        }, { status: 500 })
      }
    }

    // Hard deletion (only if explicitly requested)
    console.log('⚠️ Hard deletion requested - this will permanently remove the course')
    
    // For hard deletion, we keep the existing cascade logic
    const { cascadeDelete = false } = body
    let deletedCohortsCount = 0;
    
    // If cascade delete is requested, delete all associated cohorts first
    if (cascadeDelete) {
      try {
        console.log('🔗 Cascade deletion enabled - checking for associated cohorts')
        const mongoose = await dbConnect("uniqbrio")
        const db = mongoose.connection.db
        
        // Find cohorts associated with this course
        const associatedCohorts = await db?.collection("cohorts").find({
          $or: [
            { courseId: course.courseId },
            { courseId: course._id?.toString() },
            { courseId: courseId }
          ]
        }).toArray()
        
        deletedCohortsCount = associatedCohorts?.length || 0
        console.log(`🎯 Found ${deletedCohortsCount} associated cohorts to delete`)
        
        if (deletedCohortsCount > 0) {
          // Soft delete all associated cohorts
          const deleteResult = await db?.collection("cohorts").updateMany({
            $or: [
              { courseId: course.courseId },
              { courseId: course._id?.toString() },
              { courseId: courseId }
            ]
          }, {
            $set: { 
              isDeleted: true, 
              deletedAt: new Date() 
            }
          })
          console.log(`✅ Soft deleted ${deleteResult?.modifiedCount} cohorts successfully`)
        }
      } catch (cohortError) {
        console.error('⚠️ Error deleting associated cohorts:', cohortError)
        // Continue with course deletion even if cohort deletion fails
      }
    }
    
    // Now soft delete the course (set isDeleted: true instead of actual deletion)
    let deletedCourse = await Course.findOneAndUpdate(
      { courseId: courseId, tenantId: session.tenantId }, 
      { 
        isDeleted: true, 
        deletedAt: new Date() // Track when it was deleted
      }, 
      { new: true }
    )
    
    // If not found by courseId, try by MongoDB _id (for ObjectId)
    if (!deletedCourse && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('🔍 Trying soft deletion by MongoDB _id:', courseId)
      deletedCourse = await Course.findOneAndUpdate(
        { _id: courseId, tenantId: session.tenantId },
        { 
          isDeleted: true, 
          deletedAt: new Date()
        },
        { new: true }
      )
    }
    
    if (!deletedCourse) {
      console.log('❌ Course deletion failed:', courseId)
      return NextResponse.json({ 
        success: false, 
        error: "Failed to delete course" 
      }, { status: 500 })
    }
    
    const successMessage = deletedCohortsCount > 0 
      ? `Course and ${deletedCohortsCount} associated cohort${deletedCohortsCount > 1 ? 's' : ''} deleted successfully`
      : "Course deleted successfully"
    
    console.log('✅ Course deleted successfully:', { 
      courseId: deletedCourse.courseId, 
      name: deletedCourse.name,
      deletedCohortsCount 
    })
    
    return NextResponse.json({ 
      success: true, 
      message: successMessage,
      deletedCourse: {
        id: deletedCourse.courseId || deletedCourse._id,
        name: deletedCourse.name,
        courseId: deletedCourse.courseId
      },
      deletedCohortsCount
    })
    
      } catch (error) {
    console.error('Course deletion error:', error)
    let message = "Failed to delete course"
    if (error instanceof Error) message = error.message
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 })
      }
    }
      );
}
