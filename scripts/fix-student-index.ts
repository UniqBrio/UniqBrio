/**
 * Migration script to fix duplicate Student ID errors across tenants
 * 
 * Problem: MongoDB has an old global unique index on `studentId` which prevents
 * different tenants from having the same student ID (e.g., STU0001).
 * 
 * Solution: Drop the global `studentId_1` index so the compound index 
 * `tenantId_1_studentId_1` can enforce per-tenant uniqueness.
 * 
 * Run with: npx tsx scripts/fix-student-index.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function fixStudentIndex() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  console.log('Using MongoDB URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName: 'uniqbrio' });
    console.log('✅ Connected to MongoDB (database: uniqbrio)');

    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ Database connection not established');
      process.exit(1);
    }

    const collection = db.collection('students');
    
    // List current indexes
    console.log('\n Current indexes on students collection:');
    const indexes = await collection.indexes();
    indexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
    });

    // Check for problematic indexes
    const globalStudentIdIndex = indexes.find(idx => 
      idx.name === 'studentId_1' && 
      idx.key && 
      'studentId' in idx.key && 
      !('tenantId' in idx.key)
    );

    const globalEmailIndex = indexes.find(idx => 
      idx.name === 'email_1' && 
      idx.key && 
      'email' in idx.key && 
      !('tenantId' in idx.key)
    );

    if (globalStudentIdIndex) {
      console.log('\n⚠️  Found global studentId_1 index - this prevents multi-tenant student IDs');
      console.log('🗑️  Dropping studentId_1 index...');
      
      try {
        await collection.dropIndex('studentId_1');
        console.log('✅ Successfully dropped studentId_1 index');
      } catch (err: any) {
        if (err.code === 27) {
          console.log('ℹ️  Index studentId_1 does not exist (already dropped)');
        } else {
          throw err;
        }
      }
    } else {
      console.log('\n✅ No global studentId_1 index found - already clean!');
    }

    if (globalEmailIndex) {
      console.log('\n⚠️  Found global email_1 index - this prevents multi-tenant emails');
      console.log('🗑️  Dropping email_1 index...');
      
      try {
        await collection.dropIndex('email_1');
        console.log('✅ Successfully dropped email_1 index');
      } catch (err: any) {
        if (err.code === 27) {
          console.log('ℹ️  Index email_1 does not exist (already dropped)');
        } else {
          throw err;
        }
      }
    } else {
      console.log('✅ No global email_1 index found - already clean!');
    }

    // Verify the correct indexes exist
    console.log('\n🔍 Verifying tenant-scoped indexes...');
    const updatedIndexes = await collection.indexes();
    
    const tenantStudentIndex = updatedIndexes.find(idx => 
      idx.key && 
      'tenantId' in idx.key && 
      'studentId' in idx.key
    );

    const tenantEmailIndex = updatedIndexes.find(idx => 
      idx.key && 
      'tenantId' in idx.key && 
      'email' in idx.key
    );

    if (tenantStudentIndex) {
      console.log(`✅ Tenant-scoped student ID index exists: ${tenantStudentIndex.name}`);
    } else {
      console.log('⚠️  Tenant-scoped student ID index not found - will be created on next app start');
    }

    if (tenantEmailIndex) {
      console.log(`✅ Tenant-scoped email index exists: ${tenantEmailIndex.name}`);
    } else {
      console.log('⚠️  Tenant-scoped email index not found - will be created on next app start');
    }

    // Show final index state
    console.log('\n Final indexes on students collection:');
    updatedIndexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nEach tenant can now have their own STU0001, STU0002, etc.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixStudentIndex();
