/**
 * Database Index Configuration
 * Define indexes for all models to optimize query performance
 * Run this once during deployment or database initialization
 */

import mongoose from 'mongoose'
import { dbConnect } from './mongodb'

export async function ensureIndexes() {
  await dbConnect()
  
  const db = mongoose.connection.db
  if (!db) {
    console.warn('⚠️ Database connection not established')
    return
  }

  console.log('🔍 Creating database indexes for optimal performance...')

  try {
    // Staff Instructor indexes
    await db.collection('instructors').createIndexes([
      { key: { id: 1 }, unique: true, sparse: true },
      { key: { externalId: 1 }, unique: true, sparse: true },
      { key: { status: 1 } },
      { key: { email: 1 } },
      { key: { role: 1 } },
      { key: { department: 1 } },
      { key: { deleted_data: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Staff NonInstructor indexes
    await db.collection('noninstructors').createIndexes([
      { key: { id: 1 }, unique: true, sparse: true },
      { key: { externalId: 1 }, unique: true, sparse: true },
      { key: { status: 1 } },
      { key: { email: 1 } },
      { key: { role: 1 } },
      { key: { department: 1 } },
      { key: { deleted_data: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Course indexes
    await db.collection('courses').createIndexes([
      { key: { courseId: 1 }, unique: true, sparse: true },
      { key: { customId: 1 }, sparse: true },
      { key: { status: 1 } },
      { key: { instructor: 1 } },
      { key: { type: 1 } },
      { key: { name: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Student indexes
    await db.collection('students').createIndexes([
      { key: { studentId: 1 }, unique: true, sparse: true },
      { key: { email: 1 } },
      { key: { status: 1 } },
      { key: { cohort: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Schedule indexes
    await db.collection('schedules').createIndexes([
      { key: { courseId: 1 } },
      { key: { instructorId: 1 } },
      { key: { cohortId: 1 } },
      { key: { date: 1 } },
      { key: { status: 1 } },
      { key: { startTime: 1 } },
      { key: { date: 1, startTime: 1 } }, // Compound index for sorting
      { key: { createdAt: -1 } },
    ])

    // Task indexes
    await db.collection('tasks').createIndexes([
      { key: { status: 1 } },
      { key: { priority: 1 } },
      { key: { targetDate: 1 } },
      { key: { isCompleted: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Leave Request indexes (Instructor)
    await db.collection('instructorleaverequests').createIndexes([
      { key: { personId: 1 } },
      { key: { status: 1 } },
      { key: { startDate: 1 } },
      { key: { endDate: 1 } },
      { key: { leaveType: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Leave Request indexes (NonInstructor)
    await db.collection('noninstructorleaverequests').createIndexes([
      { key: { personId: 1 } },
      { key: { status: 1 } },
      { key: { startDate: 1 } },
      { key: { endDate: 1 } },
      { key: { leaveType: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Attendance indexes
    await db.collection('instructorattendances').createIndexes([
      { key: { instructorId: 1 } },
      { key: { date: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ])

    await db.collection('noninstructorattendances').createIndexes([
      { key: { nonInstructorId: 1 } },
      { key: { date: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Cohort indexes
    await db.collection('cohorts').createIndexes([
      { key: { cohortId: 1 }, unique: true, sparse: true },
      { key: { name: 1 } },
      { key: { status: 1 } },
      { key: { instructor: 1 } },
      { key: { createdAt: -1 } },
    ])

    // Draft indexes
    await db.collection('drafts').createIndexes([
      { key: { instructor: 1 } },
      { key: { type: 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
    ])

    await db.collection('taskdrafts').createIndexes([
      { key: { type: 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
    ])

    console.log('✅ All database indexes created successfully')
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
  }
}

// Export a function to check if indexes exist
export async function checkIndexes() {
  await dbConnect()
  
  const db = mongoose.connection.db
  if (!db) return

  const collections = ['instructors', 'noninstructors', 'courses', 'students', 'schedules', 'tasks']
  
  for (const collectionName of collections) {
    try {
      const indexes = await db.collection(collectionName).indexes()
      console.log(`📊 ${collectionName} indexes:`, indexes.length)
    } catch (error) {
      console.log(`⚠️ Collection ${collectionName} not found or error checking indexes`)
    }
  }
}
