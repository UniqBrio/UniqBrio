// Course ID Management System
// Handles course ID generation following the official sequence rules
// Ensures sequential IDs: COURSE0001, COURSE0002, etc.
// Handles soft deletes and draft-to-course conversion properly
// TENANT-SCOPED: Each academy has independent sequential IDs

import { Course } from "@/models/dashboard";
import mongoose from "mongoose";
import { getTenantContext } from "@/lib/tenant/tenant-context";

export class CourseIdManager {
  
  /**
   * Get the next available course ID based on all courses (including soft-deleted)
   * This ensures we never reuse IDs and maintain strict sequence
   * Used for preview in drafts
   * TENANT-SCOPED: Only considers courses within the current tenant
   */
  static async getNextAvailableCourseId(): Promise<string> {
    try {
      // Get current tenant context
      const tenantContext = getTenantContext();
      if (!tenantContext?.tenantId) {
        throw new Error('Tenant context required for course ID generation');
      }

      // Find the highest course ID from ALL courses (including soft-deleted) FOR THIS TENANT
      // This ensures we never reuse course IDs even if courses are deleted
      const allCourses = await Course.find({ 
        courseId: { $regex: /^COURSE\d{4}$/ },
        tenantId: tenantContext.tenantId
        // Note: No status filter - we check ALL courses including drafts and deleted
      })
        .select('courseId')
        .sort({ courseId: -1 })
        .limit(1)
        .lean();

      let maxCourseNumber = 0;
      
      if (allCourses.length > 0) {
        const lastCourseId = allCourses[0].courseId;
        if (lastCourseId && lastCourseId.startsWith('COURSE')) {
          const numberPart = lastCourseId.replace('COURSE', '');
          const courseNumber = parseInt(numberPart, 10);
          if (!isNaN(courseNumber)) {
            maxCourseNumber = courseNumber;
          }
        }
      }

      const nextCourseNumber = maxCourseNumber + 1;
      const nextCourseId = `COURSE${String(nextCourseNumber).padStart(4, '0')}`;
      
      console.log(`📋 Next available course ID: ${nextCourseId} for tenant ${tenantContext.tenantId} (based on highest existing ID across all courses)`);
      return nextCourseId;
    } catch (error) {
      console.error('❌ Error getting next available course ID:', error);
      // Fallback to timestamp-based ID
      return `COURSE${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Ensure a counters document exists and is initialized to the highest existing course number.
   * This prepares an atomic counter for generating sequential course IDs.
   * Checks ALL courses (including soft-deleted) to ensure no ID reuse.
   * TENANT-SCOPED: Separate counter for each tenant
   */
  private static async ensureCounterInitialized(tenantId: string): Promise<void> {
    try {
      const coll = mongoose.connection.collection('counters');
      const counterId = `courseid_${tenantId}`;

      const existing = await coll.findOne({ _id: counterId } as any);
      if (existing && typeof existing.seq === 'number') return;

      // Determine current max course number from ALL courses (including deleted) FOR THIS TENANT
      const allCourses = await Course.find({ 
        courseId: { $regex: /^COURSE\d{4}$/ },
        tenantId
        // No status filter - check ALL courses to prevent ID reuse
      })
        .select('courseId')
        .sort({ courseId: -1 })
        .limit(1)
        .lean();

      let maxCourseNumber = 0;
      if (allCourses.length > 0) {
        const lastCourseId = allCourses[0].courseId;
        if (lastCourseId && lastCourseId.startsWith('COURSE')) {
          const numberPart = lastCourseId.replace('COURSE', '');
          const courseNumber = parseInt(numberPart, 10);
          if (!isNaN(courseNumber)) {
            maxCourseNumber = courseNumber;
          }
        }
      }

      await coll.findOneAndUpdate(
        { _id: counterId } as any,
        { $setOnInsert: { seq: maxCourseNumber, tenantId } },
        { upsert: true }
      );
      console.log(`🔧 Initialized courseid counter to ${maxCourseNumber} for tenant ${tenantId}`);
    } catch (error) {
      console.error('❌ Error initializing courseid counter:', error);
    }
  }

  /**
   * Atomically increment and return the next course ID.
   * This ensures sequential IDs even under high concurrency.
   * TENANT-SCOPED: Uses tenant-specific counter
   */
  private static async getNextSequenceAtomic(tenantId: string): Promise<string> {
    try {
      // Ensure the counters collection has been initialized
      await this.ensureCounterInitialized(tenantId);

      const coll = mongoose.connection.collection('counters');
      const counterId = `courseid_${tenantId}`;
      
      // Atomically increment and return the new seq value
      const res = await coll.findOneAndUpdate(
        { _id: counterId } as any,
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true }
      );

      const seq = res && res.seq ? res.seq : (res && res.value && res.value.seq ? res.value.seq : null);
      if (typeof seq !== 'number') {
        throw new Error('Failed to obtain atomic sequence for courseid');
      }

      const nextCourseId = `COURSE${String(seq).padStart(4, '0')}`;
      console.log(`🔢 Atomic next course ID: ${nextCourseId} for tenant ${tenantId}`);
      return nextCourseId;
    } catch (error) {
      console.error('❌ Error getting atomic next sequence:', error);
      return `COURSE${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Assign a course ID to a newly published course
   * This permanently claims the next available ID in the sequence
   * Used for: new course creation, draft-to-course conversion
   * TENANT-SCOPED: Generates ID for current tenant
   */
  static async assignCourseIdToPublishedCourse(): Promise<string> {
    try {
      // Get current tenant context
      const tenantContext = getTenantContext();
      if (!tenantContext?.tenantId) {
        throw new Error('Tenant context required for course ID assignment');
      }

      // Use atomic counter to get next course ID (prevents race conditions)
      const nextCourseId = await this.getNextSequenceAtomic(tenantContext.tenantId);
      
      // Extra safety: ensure it truly doesn't exist (very unlikely with atomic counter)
      const existingCourse = await Course.findOne({ courseId: nextCourseId });
      if (existingCourse) {
        console.warn(`⚠️ Atomic course ID ${nextCourseId} already exists, falling back to safe finder`);
        return await this.findNextSafeCourseId(nextCourseId);
      }

      console.log(`✅ Atomically assigned course ID: ${nextCourseId} to published course`);
      return nextCourseId;
    } catch (error) {
      console.error('❌ Error assigning course ID to published course:', error);
      return `COURSE${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Convert a draft to a course with proper sequential ID assignment
   * This ensures the draft gets the next sequential course ID
   * Example: if highest course ID is COURSE0010, draft becomes COURSE0011
   * TENANT-SCOPED: Uses tenant-specific counter
   */
  static async convertDraftToCourse(draftId: string): Promise<string> {
    try {
      console.log(`🔄 Converting draft ${draftId} to course...`);
      
      // Get current tenant context
      const tenantContext = getTenantContext();
      if (!tenantContext?.tenantId) {
        throw new Error('Tenant context required for draft conversion');
      }
      
      // Get the next sequential course ID atomically
      const nextCourseId = await this.getNextSequenceAtomic(tenantContext.tenantId);
      
      // Verify the draft exists
      const draft = await Course.findById(draftId);
      if (!draft) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }
      
      // Ensure it's actually a draft
      if (draft.status !== 'Draft') {
        console.warn(`⚠️ Course ${draftId} is not a draft (status: ${draft.status}), but proceeding with ID assignment`);
      }
      
      // Update the draft to become a course with the new sequential ID
      const updatedCourse = await Course.findByIdAndUpdate(
        draftId,
        {
          courseId: nextCourseId,
          status: 'Active', // Change from Draft to Active
          // Keep all other fields unchanged
        },
        { new: true, runValidators: true }
      );
      
      if (!updatedCourse) {
        throw new Error(`Failed to update draft ${draftId} to course`);
      }
      
      console.log(`✅ Successfully converted draft to course with ID: ${nextCourseId}`);
      
      // Update remaining draft previews
      await this.updateDraftPreviews();
      
      return nextCourseId;
    } catch (error) {
      console.error(`❌ Error converting draft ${draftId} to course:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a course (set isDeleted: true, preserve courseId)
   * This ensures the courseId is never reused
   */
  static async softDeleteCourse(courseId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Soft deleting course with ID: ${courseId}`);
      
      const result = await Course.findOneAndUpdate(
        { courseId: courseId },
        {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'Cancelled' // Optional: update status to reflect deletion
        },
        { new: true }
      );
      
      if (!result) {
        console.error(`❌ Course with ID ${courseId} not found for deletion`);
        return false;
      }
      
      console.log(`✅ Successfully soft deleted course: ${courseId}`);
      
      // Update draft previews (they should show the next available ID)
      await this.updateDraftPreviews();
      
      return true;
    } catch (error) {
      console.error(`❌ Error soft deleting course ${courseId}:`, error);
      return false;
    }
  }

  /**
   * Find the next safe course ID if there's a collision
   * Checks ALL courses (including soft-deleted) to ensure no reuse
   * TENANT-SCOPED: Only checks within current tenant
   */
  private static async findNextSafeCourseId(startingId: string): Promise<string> {
    // Get current tenant context
    const tenantContext = getTenantContext();
    if (!tenantContext?.tenantId) {
      throw new Error('Tenant context required for course ID lookup');
    }

    const numberPart = startingId.replace('COURSE', '');
    let courseNumber = parseInt(numberPart, 10);
    
    while (true) {
      courseNumber++;
      const testId = `COURSE${String(courseNumber).padStart(4, '0')}`;
      
      // Check against ALL courses (including soft-deleted) to prevent reuse
      // BUT only within this tenant
      const existingCourse = await Course.findOne({ 
        courseId: testId,
        tenantId: tenantContext.tenantId
        // No status filter - check ALL courses
      });
      
      if (!existingCourse) {
        console.log(`✅ Found safe course ID: ${testId} for tenant ${tenantContext.tenantId}`);
        return testId;
      }
    }
  }

  /**
   * Update all drafts to show the current next available course ID
   * This is called after a new course is published to update draft previews
   */
  static async updateDraftPreviews(): Promise<void> {
    try {
      const Draft = await import('@/models/dashboard/Draft').then(m => m.default);
      const nextCourseId = await this.getNextAvailableCourseId();
      
      // Update all drafts to show the current next available ID
      const result = await Draft.updateMany(
        {}, // All drafts
        { $set: { courseId: nextCourseId } }
      );
      
      console.log(`📝 Updated ${result.modifiedCount} drafts to show preview ID: ${nextCourseId}`);
    } catch (error) {
      console.error('❌ Error updating draft previews:', error);
    }
  }

  /**
   * Initialize a new draft with the preview course ID
   */
  static async initializeDraftWithPreview(): Promise<string> {
    const previewId = await this.getNextAvailableCourseId();
    console.log(`📝 New draft initialized with preview ID: ${previewId}`);
    return previewId;
  }
}