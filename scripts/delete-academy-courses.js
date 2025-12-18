/**
 * Migration Script: Delete courses for specific academy
 * 
 * This script deletes all courses belonging to academy AC000002
 * 
 * Run with: node scripts/delete-academy-courses.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'uniqbrio';
const TARGET_TENANT_ID = 'AC000002';

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function deleteAcademyCourses() {
  try {
    console.log('Connecting to MongoDB...');
    const connectionOptions = {
      dbName: DATABASE_NAME
    };
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log(`Connected to MongoDB database: ${DATABASE_NAME}`);

    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    // Find courses for the target academy
    const coursesToDelete = await coursesCollection.find({
      $or: [
        { tenantId: TARGET_TENANT_ID },
        { academyId: TARGET_TENANT_ID }
      ]
    }).toArray();

    console.log(`\nFound ${coursesToDelete.length} courses for academy ${TARGET_TENANT_ID}`);

    if (coursesToDelete.length === 0) {
      console.log('No courses found to delete.');
      await mongoose.disconnect();
      return;
    }

    // Display courses that will be deleted
    console.log('\nCourses to be deleted:');
    coursesToDelete.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title || 'Untitled'} (ID: ${course._id}, Code: ${course.code || 'N/A'})`);
    });

    // Confirmation prompt
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`\n⚠️  Are you sure you want to delete ${coursesToDelete.length} courses? (yes/no): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Deletion cancelled.');
      await mongoose.disconnect();
      return;
    }

    // Perform deletion
    console.log('\n🗑️  Deleting courses...');
    const result = await coursesCollection.deleteMany({
      $or: [
        { tenantId: TARGET_TENANT_ID },
        { academyId: TARGET_TENANT_ID }
      ]
    });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} courses for academy ${TARGET_TENANT_ID}`);

    // Log summary
    console.log('\n📊 Summary:');
    console.log(`   Target Academy: ${TARGET_TENANT_ID}`);
    console.log(`   Courses Found: ${coursesToDelete.length}`);
    console.log(`   Courses Deleted: ${result.deletedCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
deleteAcademyCourses();
