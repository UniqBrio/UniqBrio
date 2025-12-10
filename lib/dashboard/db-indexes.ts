/**
 * Database Index Configuration
 * Define indexes for all models to optimize query performance
 * Run this once during deployment or database initialization
 */

import mongoose from 'mongoose'
import { dbConnect } from '@/lib/mongodb'

export async function ensureIndexes() {
  await dbConnect()
  
  const db = mongoose.connection.db
  if (!db) {
    console.warn('⚠️ Database connection not established')
    return
  }

  console.log('🔍 Creating database indexes for optimal performance...')

  try {
    // Staff Instructor indexes - tenant-aware for multi-tenancy
    await db.collection('instructors').createIndexes([
      { key: { tenantId: 1, externalId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, instructorId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, email: 1 } },
      { key: { tenantId: 1, role: 1 } },
      { key: { tenantId: 1, department: 1 } },
      { key: { tenantId: 1, deleted_data: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Staff NonInstructor indexes - tenant-aware for multi-tenancy
    await db.collection('noninstructors').createIndexes([
      { key: { tenantId: 1, externalId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, email: 1 } },
      { key: { tenantId: 1, role: 1 } },
      { key: { tenantId: 1, department: 1 } },
      { key: { tenantId: 1, deleted_data: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Course indexes - tenant-aware for multi-tenancy
    await db.collection('courses').createIndexes([
      { key: { tenantId: 1, courseId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, customId: 1 }, sparse: true },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, instructor: 1 } },
      { key: { tenantId: 1, type: 1 } },
      { key: { tenantId: 1, name: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
      { key: { courseId: 1 } }, // Non-unique for cross-tenant queries
    ])

    // Student indexes - tenant-aware for multi-tenancy
    await db.collection('students').createIndexes([
      { key: { tenantId: 1, studentId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, email: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, cohort: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
      { key: { studentId: 1 } }, // Non-unique for cross-tenant queries
    ])

    // Schedule indexes - tenant-aware for multi-tenancy
    await db.collection('schedules').createIndexes([
      { key: { tenantId: 1, sessionId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, courseId: 1 } },
      { key: { tenantId: 1, instructorId: 1 } },
      { key: { tenantId: 1, cohortId: 1 } },
      { key: { tenantId: 1, date: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, startTime: 1 } },
      { key: { tenantId: 1, date: 1, startTime: 1 } }, // Compound index for sorting
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Task indexes - tenant-aware for multi-tenancy
    await db.collection('tasks').createIndexes([
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, priority: 1 } },
      { key: { tenantId: 1, targetDate: 1 } },
      { key: { tenantId: 1, isCompleted: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Leave Request indexes (Instructor) - tenant-aware for multi-tenancy
    await db.collection('instructorleaverequests').createIndexes([
      { key: { tenantId: 1, personId: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, startDate: 1 } },
      { key: { tenantId: 1, endDate: 1 } },
      { key: { tenantId: 1, leaveType: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Leave Request indexes (NonInstructor) - tenant-aware for multi-tenancy
    await db.collection('noninstructorleaverequests').createIndexes([
      { key: { tenantId: 1, personId: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, startDate: 1 } },
      { key: { tenantId: 1, endDate: 1 } },
      { key: { tenantId: 1, leaveType: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Attendance indexes (Instructor) - tenant-aware for multi-tenancy
    await db.collection('instructorattendances').createIndexes([
      { key: { tenantId: 1, instructorId: 1, date: 1 }, unique: true },
      { key: { tenantId: 1, instructorId: 1 } },
      { key: { tenantId: 1, date: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Attendance indexes (NonInstructor) - tenant-aware for multi-tenancy
    await db.collection('noninstructorattendances').createIndexes([
      { key: { tenantId: 1, instructorId: 1, date: 1 }, unique: true },
      { key: { tenantId: 1, instructorId: 1 } },
      { key: { tenantId: 1, date: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Cohort indexes - tenant-aware for multi-tenancy
    await db.collection('cohorts').createIndexes([
      { key: { tenantId: 1, cohortId: 1 }, unique: true }, // Unique per tenant, not globally
      { key: { tenantId: 1, name: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, instructor: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
      { key: { cohortId: 1 } }, // Non-unique for cross-tenant queries
    ])

    // Draft indexes - tenant-aware for multi-tenancy
    await db.collection('drafts').createIndexes([
      { key: { tenantId: 1, courseId: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, instructor: 1 } },
      { key: { tenantId: 1, type: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
      { key: { tenantId: 1, updatedAt: -1 } },
    ])

    // Task Draft indexes - tenant-aware for multi-tenancy
    await db.collection('taskdrafts').createIndexes([
      { key: { tenantId: 1, type: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
      { key: { tenantId: 1, updatedAt: -1 } },
    ])

    // Payment Record indexes - tenant-aware for multi-tenancy
    await db.collection('paymentrecords').createIndexes([
      { key: { tenantId: 1, invoiceNumber: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, receiptNumber: 1 }, unique: true, sparse: true },
      { key: { tenantId: 1, studentId: 1 } },
      { key: { tenantId: 1, courseId: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, dueDate: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Student Attendance indexes - tenant-aware for multi-tenancy  
    await db.collection('studentattendances').createIndexes([
      { key: { tenantId: 1, studentId: 1, date: 1 }, unique: true },
      { key: { tenantId: 1, studentId: 1 } },
      { key: { tenantId: 1, courseId: 1 } },
      { key: { tenantId: 1, cohortId: 1 } },
      { key: { tenantId: 1, date: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Student Leave Request indexes - tenant-aware for multi-tenancy
    await db.collection('studentleaverequests').createIndexes([
      { key: { tenantId: 1, studentId: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, startDate: 1 } },
      { key: { tenantId: 1, endDate: 1 } },
      { key: { tenantId: 1, leaveType: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Enrollment indexes - tenant-aware for multi-tenancy
    await db.collection('enrollments').createIndexes([
      { key: { tenantId: 1, studentId: 1, courseId: 1 }, unique: true },
      { key: { tenantId: 1, studentId: 1 } },
      { key: { tenantId: 1, courseId: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, enrollmentDate: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Event indexes - tenant-aware for multi-tenancy
    await db.collection('events').createIndexes([
      { key: { tenantId: 1, eventId: 1 }, unique: true },
      { key: { tenantId: 1, type: 1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, eventDate: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Help Ticket indexes - tenant-aware for multi-tenancy
    await db.collection('helptickets').createIndexes([
      { key: { tenantId: 1, ticketId: 1 }, unique: true },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, priority: 1 } },
      { key: { tenantId: 1, category: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
    ])

    // Notification indexes - tenant-aware for multi-tenancy
    await db.collection('notifications').createIndexes([
      { key: { tenantId: 1, userId: 1 } },
      { key: { tenantId: 1, type: 1 } },
      { key: { tenantId: 1, read: 1 } },
      { key: { tenantId: 1, createdAt: -1 } },
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
