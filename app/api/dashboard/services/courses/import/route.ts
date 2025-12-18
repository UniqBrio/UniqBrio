import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Course } from "@/models/dashboard";
import Draft from "@/models/dashboard/Draft";
import mongoose from "mongoose";
import { getUserSession } from "@/lib/tenant/api-helpers";
import { runWithTenantContext } from "@/lib/tenant/tenant-context";

// Helper function to parse CSV
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

// Helper function to validate required fields
function validateCourseData(courseData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['name', 'instructor', 'description', 'level', 'type', 'courseCategory', 'maxStudents', 'price'];
  
  requiredFields.forEach(field => {
    if (!courseData[field] || courseData[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });

  // Validate specific field formats
  if (courseData.maxStudents && isNaN(Number(courseData.maxStudents))) {
    errors.push('maxStudents must be a valid number');
  }
  
  if (courseData.price && isNaN(Number(courseData.price))) {
    errors.push('price must be a valid number');
  }

  if (courseData.level && !['Beginner', 'Intermediate', 'Advanced'].includes(courseData.level)) {
    errors.push('level must be Beginner, Intermediate, or Advanced');
  }

  if (courseData.type && !['Online', 'Offline', 'Hybrid'].includes(courseData.type)) {
    errors.push('type must be Online, Offline, or Hybrid');
  }

  return { isValid: errors.length === 0, errors };
}

// Helper function to generate unique course ID
async function generateCourseId(): Promise<string> {
  const count = await Course.countDocuments();
  return `COURSE-${String(count + 1).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
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
    await dbConnect("uniqbrio");

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const saveAsDraft = formData.get('saveAsDraft') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file content
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return NextResponse.json({ error: 'File must contain at least a header row and one data row' }, { status: 400 });
    }

    // Extract headers and skip instruction row if present
    const headers = rows[0];
    let dataRows = rows.slice(1);
    
    // Skip instruction row if it starts with "INSTRUCTIONS"
    if (dataRows[0] && dataRows[0][0]?.includes('INSTRUCTIONS')) {
      dataRows = dataRows.slice(1);
    }

    if (dataRows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process each data row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + (rows[0][0]?.includes('INSTRUCTIONS') ? 3 : 2); // Adjust for header and possible instruction row

      try {
        // Map CSV data to course object
        const courseData: any = {};
        
        headers.forEach((header, index) => {
          const value = row[index]?.replace(/^"|"$/g, '').trim(); // Remove quotes and trim
          
          if (header && value) {
            // Handle nested fields
            if (header.includes('_')) {
              const [parent, child] = header.split('_');
              if (!courseData[parent]) courseData[parent] = {};
              
              // Convert numeric fields
              if (['totalWeeks', 'totalSessions', 'sessionDuration'].includes(child) && value) {
                courseData[parent][child] = Number(value);
              } else if (['startDate', 'endDate'].includes(child) && value) {
                courseData[parent][child] = new Date(value);
              } else {
                courseData[parent][child] = value;
              }
            } else {
              // Handle direct fields
              if (['maxStudents', 'price'].includes(header) && value) {
                courseData[header] = Number(value);
              } else if (header === 'tags' && value) {
                courseData[header] = value.split(',').map(tag => tag.trim());
              } else {
                courseData[header] = value;
              }
            }
          }
        });

        // Validate course data first
        const validation = validateCourseData(courseData);
        if (!validation.isValid) {
          results.errors.push(`Row ${rowNumber}: ${validation.errors.join(', ')}`);
          results.skipped++;
          continue;
        }

        // Set default values for optional fields
        courseData.createdAt = new Date();
        courseData.updatedAt = new Date();
        
        if (saveAsDraft) {
          // Save to Draft collection instead of Course collection
          console.log(`Saving course ${courseData.name} as draft`);
          
          // Generate unique course ID for future use
          courseData.courseId = await generateCourseId();
          courseData.status = 'Draft';
          
          // Create draft in database
          await Draft.create({ ...courseData, tenantId: session.tenantId });
          
          console.log(`Draft saved successfully`);
        } else {
          // Save as active course to Course collection
          console.log(`Saving course ${courseData.name} as active course`);
          
          // Generate unique course ID
          courseData.courseId = await generateCourseId();
          
          // Ensure status is valid or default to 'Active'
          if (!courseData.status || !['Active', 'Inactive', 'Completed', 'Cancelled', 'Upcoming', 'In Progress'].includes(courseData.status)) {
            courseData.status = 'Active';
          }

          // Create course in database
          await Course.create({ ...courseData, tenantId: session.tenantId });
          
          console.log(`Course saved successfully`);
        }
        
        results.imported++;

      } catch (error: any) {
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.length > 0 ? results.errors : undefined,
      message: saveAsDraft 
        ? `${results.imported} courses imported as drafts. Check the Drafts section to review and publish them.`
        : `${results.imported} courses imported and activated.`
    });

  } catch (error: any) {
    console.error('Course import error:', error);
    return NextResponse.json(
      { error: 'Import failed: ' + error.message },
      { status: 500 }
    );
  }
    }
  );
}