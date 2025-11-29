import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import Draft from '@/models/dashboard/Draft';
import mongoose from 'mongoose'
import { CourseIdManager } from '@/lib/dashboard/courseIdManager'
import { getUserSession } from '@/lib/tenant/api-helpers'
import { runWithTenantContext } from '@/lib/tenant/tenant-context'

const ensureDraftModel = async () => {
  await dbConnect("uniqbrio")
  if (!mongoose.models.Draft) {
    await import('@/models/dashboard/Draft')
  }
  return mongoose.models.Draft as typeof Draft
}

// GET /api/drafts - Fetch all drafts
export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return runWithTenantContext(
    { tenantId: session.tenantId },
    async () => {
  try {
    const DraftModel = await ensureDraftModel()
    
    const { searchParams } = new URL(request.url)
    const instructor = searchParams.get('instructor')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Build filter object with explicit tenantId
    const filter: any = { tenantId: session.tenantId }
    
    if (instructor) filter.instructor = instructor
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    }

    // Fetch drafts with pagination
    const drafts = await DraftModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await DraftModel.countDocuments(filter)

    console.log(' GET /api/drafts - Found drafts:', drafts.length);
    console.log(' Draft IDs:', drafts.map(d => d._id));

    // Transform drafts to match frontend expectations (similar to courses)
    const transformedDrafts = drafts.map((draft: any) => ({
      ...draft,
      id: draft._id.toString(),
      updatedAt: draft.updatedAt ? new Date(draft.updatedAt).getTime() : Date.now()
    }))

    return NextResponse.json({
      success: true,
      drafts: transformedDrafts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch drafts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
    }
  );
}

// POST /api/drafts - Create a new draft
export async function POST(request: NextRequest) {
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
    const {
      name,
      instructor,
      description,
      level,
      type,
      duration,
      priceINR,
      schedule,
      maxStudents,
      tags,
      category,
      subcategory,
      thumbnail,
      courseCategory,
      status
    } = body

    // For drafts, we only require minimal fields - just a name to identify the draft
    if (!name && !body.title) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: At least a name or title is required for drafts',
          required: ['name or title']
        },
        { status: 400 }
      )
    }

    // Create draft object with only provided data (no auto-population)
    const draftData: any = {}
    
    // Only add fields that have actual values
    if (name) draftData.name = name
    if (body.title) draftData.title = body.title
    if (instructor) draftData.instructor = instructor
    if (body.instructorId) draftData.instructorId = body.instructorId
    if (description) draftData.description = description
    if (level) draftData.level = level
    if (type) draftData.type = type
    if (duration) draftData.duration = duration
    if (priceINR) draftData.priceINR = priceINR
    if (body.price) draftData.price = body.price
    if (schedule) draftData.schedule = schedule
    if (maxStudents) draftData.maxStudents = maxStudents

    // Only add optional fields if they are provided and not empty
    if (tags && Array.isArray(tags) && tags.length > 0) {
      draftData.tags = tags
    }
    if (category && category.trim()) {
      draftData.category = category.trim()
    }
    if (subcategory && subcategory.trim()) {
      draftData.subcategory = subcategory.trim()
    }
    if (thumbnail && thumbnail.trim()) {
      draftData.thumbnail = thumbnail.trim()
    }
    if (courseCategory && courseCategory.trim()) {
      draftData.courseCategory = courseCategory.trim()
    }
    if (status && status.trim()) {
      draftData.status = status.trim()
    }

    // Initialize draft with preview courseId using CourseIdManager
    const previewCourseId = await CourseIdManager.initializeDraftWithPreview()
    draftData.courseId = previewCourseId
    
    const draft = await Draft.create({ ...draftData, tenantId: session.tenantId })

    // Transform the response to match frontend expectations
    const transformedDraft = {
      ...draft.toObject(),
      id: draft._id.toString(),
      updatedAt: draft.updatedAt ? new Date(draft.updatedAt).getTime() : Date.now()
    }

    return NextResponse.json({
      success: true,
      draft: transformedDraft,
      message: 'Draft saved successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating draft:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
    }
  );
}

// PUT /api/drafts - Update a draft
export async function PUT(request: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    
    const body = await request.json()
    const {
      id,
      name,
      instructor,
      description,
      level,
      type,
      duration,
      priceINR,
      schedule,
      maxStudents,
      tags,
      category,
      subcategory,
      thumbnail,
      courseCategory,
      status,
      shortDescription,
      prerequisites,
      learningOutcomes,
      materialRequirements
    } = body

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Draft ID is required for update'
        },
        { status: 400 }
      )
    }

    // For draft updates, we only validate that we have something to identify the draft
    // No other fields are required since drafts can be partially filled
    if (!name && !body.title) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: At least a name or title is required for draft updates',
          required: ['name or title']
        },
        { status: 400 }
      )
    }

    const DraftModel = await ensureDraftModel()

    // Check if draft exists
    const existingDraft = await DraftModel.findById(id)
    if (!existingDraft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Create update object with only provided data (no auto-population)
    const updateData: any = {}
    
    // Only add fields that have actual values
    if (name) updateData.name = name
    if (body.title) updateData.title = body.title
    if (instructor) updateData.instructor = instructor
    if (body.instructorId) updateData.instructorId = body.instructorId
    if (description) updateData.description = description
    if (level) updateData.level = level
    if (type) updateData.type = type
    if (duration) updateData.duration = duration
    if (priceINR) updateData.priceINR = priceINR
    if (body.price) updateData.price = body.price
    if (schedule) updateData.schedule = schedule
    if (maxStudents) updateData.maxStudents = maxStudents

    // Only add optional fields if they are provided and not empty
    if (tags && Array.isArray(tags) && tags.length > 0) {
      updateData.tags = tags
    }
    if (category && category.trim()) {
      updateData.category = category.trim()
    }
    if (subcategory && subcategory.trim()) {
      updateData.subcategory = subcategory.trim()
    }
    if (thumbnail && thumbnail.trim()) {
      updateData.thumbnail = thumbnail.trim()
    }
    if (courseCategory && courseCategory.trim()) {
      updateData.courseCategory = courseCategory.trim()
    }
    if (status && status.trim()) {
      updateData.status = status.trim()
    }
    if (shortDescription && shortDescription.trim()) {
      updateData.shortDescription = shortDescription.trim()
    }
    if (prerequisites && Array.isArray(prerequisites) && prerequisites.length > 0) {
      updateData.prerequisites = prerequisites
    }
    if (learningOutcomes && Array.isArray(learningOutcomes) && learningOutcomes.length > 0) {
      updateData.learningOutcomes = learningOutcomes
    }
    if (materialRequirements && Array.isArray(materialRequirements) && materialRequirements.length > 0) {
      updateData.materialRequirements = materialRequirements
    }

    const updatedDraft = await DraftModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!updatedDraft) {
      return NextResponse.json(
        { success: false, error: 'Failed to update draft' },
        { status: 500 }
      )
    }

    // Transform the response to match frontend expectations
    const transformedDraft = {
      ...updatedDraft.toObject(),
      id: updatedDraft._id.toString(),
      updatedAt: updatedDraft.updatedAt ? new Date(updatedDraft.updatedAt).getTime() : Date.now()
    }

    return NextResponse.json({
      success: true,
      draft: transformedDraft,
      message: 'Draft updated successfully'
    })

  } catch (error) {
    console.error('Error updating draft:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/drafts - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect("uniqbrio")
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    const DraftModel = await ensureDraftModel()

    const draft = await DraftModel.findById(id)
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }

    await Draft.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
