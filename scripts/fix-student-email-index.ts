/**
 * Migration Script: Fix Student Email Index for Multi-Tenancy
 * 
 * This script removes the global unique index on email and ensures
 * only the compound (tenantId, email) unique index exists.
 * 
 * Run with: tsx --env-file=.env scripts/fix-student-email-index.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dbConnect } from '@/lib/mongodb';

dotenv.config();

async function fixStudentEmailIndex() {
  try {
    console.log('🔧 Starting Student Email Index Migration...\n');

    // Connect to MongoDB
    await dbConnect('uniqbrio');
    console.log('✅ Connected to MongoDB\n');

    const Student = mongoose.connection.collection('students');

    // Get current indexes
    console.log('📋 Current indexes:');
    const indexes = await Student.indexes();
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    console.log('');

    // Check for problematic global email index
    const emailIndexExists = indexes.some((idx: any) => 
      idx.key.email === 1 && !idx.key.tenantId
    );

    if (emailIndexExists) {
      console.log('⚠️  Found global unique email index (this causes the issue)');
      console.log('🗑️  Dropping global email index...');
      
      try {
        await Student.dropIndex('email_1');
        console.log('✅ Successfully dropped global email index\n');
      } catch (err: any) {
        if (err.codeName === 'IndexNotFound') {
          console.log('ℹ️  Index already removed\n');
        } else {
          throw err;
        }
      }
    } else {
      console.log('✅ No problematic global email index found\n');
    }

    // Ensure compound index exists
    console.log('🔍 Checking for compound (tenantId, email) unique index...');
    const compoundIndexExists = indexes.some((idx: any) => 
      idx.key.tenantId === 1 && idx.key.email === 1 && idx.unique === true
    );

    if (!compoundIndexExists) {
      console.log('📝 Creating compound (tenantId, email) unique index...');
      await Student.createIndex(
        { tenantId: 1, email: 1 },
        { unique: true, name: 'tenantId_1_email_1' }
      );
      console.log('✅ Compound index created\n');
    } else {
      console.log('✅ Compound index already exists\n');
    }

    // Check for studentId index
    console.log('🔍 Checking for compound (tenantId, studentId) unique index...');
    const studentIdIndexExists = indexes.some((idx: any) => 
      idx.key.tenantId === 1 && idx.key.studentId === 1 && idx.unique === true
    );

    if (!studentIdIndexExists) {
      console.log('📝 Creating compound (tenantId, studentId) unique index...');
      await Student.createIndex(
        { tenantId: 1, studentId: 1 },
        { unique: true, name: 'tenantId_1_studentId_1' }
      );
      console.log('✅ Compound index created\n');
    } else {
      console.log('✅ Compound index already exists\n');
    }

    // Show final indexes
    console.log('📋 Final indexes:');
    const finalIndexes = await Student.indexes();
    finalIndexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Students can now have the same email across different academies/tenants.');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
fixStudentEmailIndex()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
