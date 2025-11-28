// Migration script to fix duplicate key issue on courses collection
// This script drops the old global unique index on courseId and ensures
// the correct compound index (tenantId + courseId) is in place

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrateCourseIndexes() {
  const dbUri = process.env.MONGODB_URI;
  
  if (!dbUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Make sure .env.local or .env file exists with MONGODB_URI');
    process.exit(1);
  }
  
  console.log('Using MongoDB URI:', dbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUri, { dbName: 'uniqbrio' });
    console.log('Connected to MongoDB (database: uniqbrio)');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const coursesCollection = db.collection('courses');
    
    // List current indexes
    console.log('\nCurrent indexes on courses collection:');
    const currentIndexes = await coursesCollection.indexes();
    currentIndexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });

    // Check for and drop the problematic global courseId index
    const globalCourseIdIndex = currentIndexes.find(
      (idx: any) => idx.name === 'courseId_1' && idx.unique === true
    );

    if (globalCourseIdIndex) {
      console.log('\n⚠️  Found problematic global unique index: courseId_1');
      console.log('Dropping index...');
      await coursesCollection.dropIndex('courseId_1');
      console.log('✅ Dropped courseId_1 index successfully');
    } else {
      console.log('\n✅ No global courseId_1 unique index found (already migrated or never existed)');
    }

    // Ensure the correct compound index exists
    console.log('\nEnsuring correct compound index (tenantId + courseId)...');
    try {
      await coursesCollection.createIndex(
        { tenantId: 1, courseId: 1 },
        { unique: true, sparse: true, name: 'tenantId_1_courseId_1' }
      );
      console.log('✅ Compound index tenantId_1_courseId_1 created/verified');
    } catch (indexError: any) {
      if (indexError.code === 85 || indexError.code === 86) {
        // Index already exists with different options, or name conflict
        console.log('ℹ️  Compound index already exists');
      } else {
        throw indexError;
      }
    }

    // List final indexes
    console.log('\nFinal indexes on courses collection:');
    const finalIndexes = await coursesCollection.indexes();
    finalIndexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('Each academy can now have their own COURSE0001, COURSE0002, etc.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run if executed directly
migrateCourseIndexes();
