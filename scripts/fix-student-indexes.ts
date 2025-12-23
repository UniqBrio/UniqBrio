import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

async function fixStudentIndexes() {
  try {
    await dbConnect('uniqbrio');
    
    const collection = mongoose.connection.collection('students');
    
    // Get all current indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes on students collection:');
    indexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), idx.unique ? '(unique)' : '');
    });

    // Look for problematic indexes
    const problematicIndexes = indexes.filter((idx: any) => {
      const key = idx.key || {};
      const keys = Object.keys(key);
      
      // Check if there's a tenantId-only unique index
      const isTenantIdOnly = keys.length === 1 && key.tenantId === 1 && idx.unique;
      
      // Check if there's an email-only or studentId-only unique index (without tenantId)
      const isEmailOnly = keys.length === 1 && key.email === 1 && idx.unique;
      const isStudentIdOnly = keys.length === 1 && key.studentId === 1 && idx.unique;
      
      return isTenantIdOnly || isEmailOnly || isStudentIdOnly;
    });

    if (problematicIndexes.length > 0) {
      console.log('\n⚠️  Found problematic indexes:');
      problematicIndexes.forEach((idx: any) => {
        console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
      });

      console.log('\n🔧 Dropping problematic indexes...');
      for (const idx of problematicIndexes) {
        try {
          await collection.dropIndex(idx.name);
          console.log(`  ✅ Dropped: ${idx.name}`);
        } catch (err: any) {
          console.error(`  ❌ Failed to drop ${idx.name}:`, err.message);
        }
      }
    } else {
      console.log('\n✅ No problematic indexes found.');
    }

    // Ensure correct indexes exist
    console.log('\n🔧 Ensuring correct indexes...');
    
    try {
      await collection.createIndex(
        { tenantId: 1, email: 1 },
        { unique: true, name: 'tenantId_1_email_1' }
      );
      console.log('  ✅ Created/verified: tenantId_1_email_1');
    } catch (err: any) {
      if (err.code === 85) {
        console.log('  ℹ️  tenantId_1_email_1 already exists');
      } else {
        console.error('  ❌ Failed to create tenantId_1_email_1:', err.message);
      }
    }

    try {
      await collection.createIndex(
        { tenantId: 1, studentId: 1 },
        { unique: true, name: 'tenantId_1_studentId_1' }
      );
      console.log('  ✅ Created/verified: tenantId_1_studentId_1');
    } catch (err: any) {
      if (err.code === 85) {
        console.log('  ℹ️  tenantId_1_studentId_1 already exists');
      } else {
        console.error('  ❌ Failed to create tenantId_1_studentId_1:', err.message);
      }
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes on students collection:');
    finalIndexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), idx.unique ? '(unique)' : '');
    });

    console.log('\n✅ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing student indexes:', error);
    process.exit(1);
  }
}

fixStudentIndexes();
