/**
 * Centralized ID Generation Utilities for Multi-Tenant System
 * Each academy (tenant) has independent sequential IDs starting from 0001
 */

import { Course } from "@/models/dashboard";
import { Cohort } from "@/models/dashboard";
import Instructor from "@/models/dashboard/staff/Instructor";
import NonInstructor from "@/models/dashboard/staff/NonInstructor";
import Schedule from "@/models/dashboard/Schedule";
import Event from "@/models/dashboard/events/Event";
import HelpTicket from "@/models/dashboard/HelpTicket";

/**
 * Generic sequential ID generator with gap-filling algorithm
 * Ensures tenant-scoped unique IDs starting from 0001
 */
async function generateSequentialId<T>(
  Model: any,
  prefix: string,
  idField: string,
  tenantId: string,
  maxAttempts: number = 5
): Promise<string> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Get all existing IDs for this tenant with the pattern PREFIX####
    const regexPattern = new RegExp(`^${prefix}\\d{4}$`);
    
    console.log(`🔍 Searching for existing ${prefix} IDs for tenant: ${tenantId}`);
    
    const existing = await Model.find(
      { 
        [idField]: { $regex: regexPattern },
        tenantId 
      },
      { [idField]: 1, _id: 0 }
    ).lean();

    console.log(`📋 Found ${existing.length} existing ${prefix} IDs:`, existing.map((doc: any) => doc[idField]).join(', '));

    // Extract numbers from existing IDs
    const numbers: number[] = [];
    for (const doc of existing) {
      const id = (doc as any)[idField];
      if (id && typeof id === 'string') {
        const numStr = id.substring(prefix.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > 0) {
          numbers.push(num);
        }
      }
    }

    // Sort numbers to find gaps
    numbers.sort((a, b) => a - b);

    // Find the first gap or use next sequential number
    let candidateNum = 1;
    for (const num of numbers) {
      if (num === candidateNum) {
        candidateNum++;
      } else if (num > candidateNum) {
        break; // Found a gap
      }
    }

    const candidateId = `${prefix}${String(candidateNum).padStart(4, '0')}`;
    
    console.log(`🎯 Candidate ID: ${candidateId}`);

    // Check for collision with explicit query
    const collision = await Model.findOne({ 
      [idField]: candidateId,
      tenantId 
    }).lean();

    if (!collision) {
      console.log(`✅ Generated ${candidateId} for tenant ${tenantId}`);
      return candidateId;
    }

    attempts++;
    console.warn(`⚠️ ID collision on ${candidateId}, retrying (attempt ${attempts}/${maxAttempts})`, collision);
  }

  // Fallback to timestamp-based ID if max attempts exceeded
  const fallbackId = `${prefix}${Date.now().toString().slice(-4)}`;
  console.error(`❌ Failed to generate sequential ID after ${maxAttempts} attempts, using fallback: ${fallbackId}`);
  return fallbackId;
}

/**
 * Generate next available Course ID for a tenant
 * Format: COURSE0001, COURSE0002, etc.
 */
export async function generateCourseId(tenantId: string): Promise<string> {
  return generateSequentialId(Course, 'COURSE', 'courseId', tenantId);
}

/**
 * Generate next available Cohort ID for a tenant
 * Format: Based on course name prefix + sequential number
 * Example: PIAN0001 for Piano course
 */
export async function generateCohortId(
  tenantId: string,
  courseName?: string
): Promise<string> {
  // Generate prefix from course name (first 4 letters uppercase)
  let prefix = 'COHO'; // Default prefix
  if (courseName) {
    prefix = courseName
      .replace(/\s/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(4, 'X');
  }

  return generateSequentialId(Cohort, prefix, 'cohortId', tenantId);
}

/**
 * Generate next available Instructor ID for a tenant
 * Format: INS0001, INS0002, etc.
 */
export async function generateInstructorId(tenantId: string): Promise<string> {
  return generateSequentialId(Instructor, 'INS', 'instructorId', tenantId);
}

/**
 * Generate next available Non-Instructor (Staff) ID for a tenant
 * Format: STAFF0001, STAFF0002, etc.
 */
export async function generateNonInstructorId(tenantId: string): Promise<string> {
  return generateSequentialId(NonInstructor, 'STAFF', 'externalId', tenantId);
}

/**
 * Generate next available Schedule Session ID for a tenant
 * Format: SES0001, SES0002, etc.
 */
export async function generateSessionId(tenantId: string): Promise<string> {
  return generateSequentialId(Schedule, 'SES', 'sessionId', tenantId);
}

/**
 * Generate next available Event ID for a tenant
 * Format: EVT0001, EVT0002, etc.
 */
export async function generateEventId(tenantId: string): Promise<string> {
  return generateSequentialId(Event, 'EVT', 'eventId', tenantId);
}

/**
 * Generate next available Help Ticket ID for a tenant
 * Format: TKT0001, TKT0002, etc.
 */
export async function generateTicketId(tenantId: string): Promise<string> {
  return generateSequentialId(HelpTicket, 'TKT', 'ticketId', tenantId, 10);
}

/**
 * Generate next available Student ID for a tenant
 * Format: STU0001, STU0002, etc.
 * Note: This is implemented separately in the student route but included here for completeness
 */
export async function generateStudentId(tenantId: string): Promise<string> {
  const Student = (await import('@/models/dashboard/student/Student')).default;
  return generateSequentialId(Student, 'STU', 'studentId', tenantId);
}
