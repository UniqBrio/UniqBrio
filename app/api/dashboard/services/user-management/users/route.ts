import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { User } from "@/models/dashboard"
import type { IUser } from "@/models/dashboard"
import { getUserSession } from "@/lib/tenant/api-helpers"
import { runWithTenantContext } from "@/lib/tenant/tenant-context"

export async function POST(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await request.json()

    // Handle bulk creation
    if (Array.isArray(body)) {
      const users = await User.insertMany(body)
      return NextResponse.json({ 
        success: true, 
        insertedCount: users.length,
        users: users
      })
    }

    // Handle single user creation or update
    if (body._id || body.id) {
      const userId = body._id || body.id
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        body, 
        { new: true, upsert: true, runValidators: true }
      )
      return NextResponse.json({ 
        success: true, 
        updated: true, 
        user: updatedUser 
      })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: body.email })
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User with this email already exists" 
      }, { status: 409 })
    }

    // Create new user
    const user = new User(body)
    await user.save()
    
    return NextResponse.json({ 
      success: true, 
      user: user 
    }, { status: 201 })
    
  } catch (error) {
    console.error('User creation error:', error)
    let message = "Failed to create user"
    let status = 500
    
    if (error instanceof Error) {
      message = error.message
      if (error.name === 'ValidationError') {
        status = 400
      }
      if (error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
        message = "User with this email already exists"
        status = 409
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status })
  }
  });
}

export async function GET(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const { searchParams } = new URL(request.url)
    
    // Build query based on search parameters
    const query: any = {}
    
    // Filter by role
    if (searchParams.get('role')) {
      query.role = searchParams.get('role')
    }
    
    // Filter by active status
    if (searchParams.get('isActive')) {
      query.isActive = searchParams.get('isActive') === 'true'
    } else {
      // Default to active users only
      query.isActive = true
    }
    
    // Filter by email verification
    if (searchParams.get('emailVerified')) {
      query.emailVerified = searchParams.get('emailVerified') === 'true'
    }
    
    // Search functionality
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    
    // Filter by instructor expertise
    if (searchParams.get('expertise')) {
      query['instructorProfile.expertise'] = { 
        $in: [searchParams.get('expertise')] 
      }
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Sorting
    let sort: any = { createdAt: -1 }
    const sortBy = searchParams.get('sortBy')
    if (sortBy) {
      const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1
      sort = { [sortBy]: sortOrder }
    }
    
    // Fields to select (excluding sensitive data)
    const selectFields = '-password'
    
    // Execute query
    const users = await User.find(query)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('children', 'name email avatar')
      .populate('enrolledCourses', 'title thumbnail')
      .lean()
    
    // Get total count for pagination
    const total = await User.countDocuments(query)
    
        return NextResponse.json({
          success: true,
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
        
      } catch (error) {
        console.error('User fetch error:', error)
        let message = 'Failed to fetch users'
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        error: "User ID is required for update" 
      }, { status: 400 })
    }
    
    // Remove password from update data if it's empty
    if (updateData.password === '') {
      delete updateData.password
    }
    
    // Check if email is being changed and already exists
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: _id } 
      })
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: "Email already exists" 
        }, { status: 409 })
      }
    }
    
    const user = await User.findByIdAndUpdate(
      _id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: user 
    })
    
  } catch (error) {
    console.error('User update error:', error)
    let message = "Failed to update user"
    let status = 500
    
    if (error instanceof Error) {
      message = error.message
        if (error.name === 'ValidationError') {
          status = 400
        }
        if (error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
          message = "Email already exists"
          status = 409
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        error: message 
      }, { status })
    }
  });
}

export async function DELETE(request: Request) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
      try {
        await dbConnect("uniqbrio")
        const body = await request.json()
        const { _id, id } = body
        const userId = _id || id
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID is required for deletion" 
      }, { status: 400 })
    }
    
    // Instead of hard delete, mark as inactive
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }
    
        return NextResponse.json({ 
          success: true, 
          message: "User deactivated successfully",
          user: user
        })
        
      } catch (error) {
        console.error('User deletion error:', error)
        let message = "Failed to delete user"
        if (error instanceof Error) message = error.message
        
        return NextResponse.json({ 
          success: false, 
          error: message 
        }, { status: 500 })
      }
    }
  );
}
