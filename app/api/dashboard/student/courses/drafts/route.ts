import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Course Draft Schema - specifically for draft courses
const CourseDraftSchema = new mongoose.Schema({
  draftId: { type: String, unique: true }, // Auto-generated draft ID
  name: { type: String, required: true },
  level: { type: String, required: true },
  type: { type: String, default: 'Online' },
  priceINR: { type: String, default: '0' },
  tags: [String],
  courseCategory: { type: String, default: 'Regular' },
  status: { type: String, default: 'Draft' },
  prerequisites: [String],
  learningOutcomes: [String],
  materialRequirements: [String],
  isDraft: { type: Boolean, default: true }, // Clearly mark as draft
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'drafts', // Store in dedicated drafts collection
  strict: false // Allow additional fields
});

// Get or create the model
const CourseDraft = mongoose.models.CourseDraft || mongoose.model('CourseDraft', CourseDraftSchema);

// Helper function to generate next draft ID
async function generateNextDraftId(): Promise<string> {
  try {
    // Find all existing draftIds that match the pattern DRAFT-nnnn
    const existingDrafts = await CourseDraft.find(
      { draftId: { $regex: /^DRAFT-\d{4}$/ } },
      { draftId: 1 }
    ).lean();

    // Extract numeric parts and find the highest
    const existingNumbers = existingDrafts
      .map(draft => {
        const match = draft.draftId?.match(/^DRAFT-(\d{4})$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    // Find the next available number
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;

    // Format with leading zeros
    return `DRAFT-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating draft ID:', error);
    // Fallback to timestamp-based ID
    return `DRAFT-${Date.now().toString().slice(-4)}`;
  }
}

// POST - Create a new course draft
export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const body = await req.json();
    console.log('Creating course draft with data:', body);

    // Validate required fields
    if (!body.name || !body.level) {
      return NextResponse.json(
        { error: 'Missing required fields: name and level are required' },
        { status: 400 }
      );
    }

    // Generate unique draft ID
    const draftId = await generateNextDraftId();

    // Create the course draft document
    const courseDraftData = {
      draftId,
      name: body.name.trim(),
      level: body.level,
      type: body.type || 'Online',
      priceINR: body.priceINR || '0',
      tags: Array.isArray(body.tags) ? body.tags : [body.level],
      courseCategory: body.courseCategory || 'Regular',
      status: 'Draft',
      isDraft: true,
      prerequisites: Array.isArray(body.prerequisites) ? body.prerequisites : [],
      learningOutcomes: Array.isArray(body.learningOutcomes) ? body.learningOutcomes : [],
      materialRequirements: Array.isArray(body.materialRequirements) ? body.materialRequirements : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Saving course draft:', courseDraftData);

    const courseDraft = new CourseDraft(courseDraftData);
    await courseDraft.save();

    console.log('Course draft created successfully:', courseDraft);

    return NextResponse.json({
      message: 'Course draft created successfully',
      courseDraft: {
        id: courseDraft._id,
        draftId: courseDraft.draftId,
        name: courseDraft.name,
        level: courseDraft.level,
        status: courseDraft.status,
        isDraft: courseDraft.isDraft,
        createdAt: courseDraft.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating course draft:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: 'Course draft with this ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create course draft',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET - Fetch all course drafts
export async function GET(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");

    const drafts = await CourseDraft.find({ isDraft: true, status: 'Draft' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      message: 'Course drafts fetched successfully',
      drafts,
      count: drafts.length
    });
  } catch (error: any) {
    console.error('Error fetching course drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course drafts' },
      { status: 500 }
    );
  }
}