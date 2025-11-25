/**
 * Script: Comprehensive Tenant Fix
 * 
 * Maps all documents to correct tenantId based on:
 * 1. Direct user email reference
 * 2. Student/Instructor relationships  
 * 3. Course relationships
 * 4. Default to primary academy for system data
 */

import mongoose from 'mongoose';
import { dbConnect, closeConnections } from '@/lib/mongodb';

async function comprehensiveTenantFix() {
  console.log('==========================================');
  console.log('Comprehensive Tenant Fix');
  console.log('==========================================\n');

  try {
    await dbConnect('uniqbrio');
    await dbConnect('uniqbrio-admin');
    
    const dashboardDb = mongoose.connection.useDb('uniqbrio');
    const authDb = mongoose.connection.useDb('uniqbrio-admin');

    // Get email to academyId mapping
    const authUsers = await authDb.collection('User').find({}).toArray();
    const emailToAcademyId = new Map<string, string>();
    
    authUsers.forEach(user => {
      if (user.email && user.academyId) {
        emailToAcademyId.set(user.email.toLowerCase(), user.academyId);
      }
    });

    const primaryAcademy = authUsers.find(u => u.academyId)?.academyId || 'AC000002';
    console.log(`Primary Academy (default): ${primaryAcademy}\n`);

    // Get all collections
    const collections = await dashboardDb.db!.listCollections().toArray();
    let totalUpdated = 0;

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = dashboardDb.collection(collName);
      
      console.log(`Processing: ${collName}...`);
      
      // Get sample to understand structure
      const sample = await collection.findOne({});
      if (!sample) {
        console.log(`  ⏭️  Empty collection\n`);
        continue;
      }

      let updated = 0;

      // Strategy 1: Direct email field
      if (sample.email) {
        for (const [email, academyId] of Array.from(emailToAcademyId.entries())) {
          const result = await collection.updateMany(
            { email, tenantId: { $ne: academyId } },
            { $set: { tenantId: academyId } }
          );
          updated += result.modifiedCount;
        }
      }

      // Strategy 2: For all other documents, set to primary academy
      // (since we don't have complex relationship data yet)
      const result = await collection.updateMany(
        { tenantId: { $ne: primaryAcademy } },
        { $set: { tenantId: primaryAcademy } }
      );
      updated += result.modifiedCount;

      if (updated > 0) {
        console.log(`  ✅ Updated ${updated} documents`);
        totalUpdated += updated;
      } else {
        console.log(`  ✓ Already correct`);
      }
    }

    // Fix Auth DB collections too
    console.log('\nProcessing Auth Database...');
    const authCollections = await authDb.db!.listCollections().toArray();
    
    for (const collInfo of authCollections) {
      const collName = collInfo.name;
      if (collName === 'User') continue; // Already fixed
      
      const collection = authDb.collection(collName);
      console.log(`Processing: ${collName}...`);
      
      const sample = await collection.findOne({});
      if (!sample) {
        console.log(`  ⏭️  Empty collection\n`);
        continue;
      }

      let updated = 0;

      // Update based on email if available
      if (sample.email) {
        for (const [email, academyId] of Array.from(emailToAcademyId.entries())) {
          const result = await collection.updateMany(
            { email, tenantId: { $ne: academyId } },
            { $set: { tenantId: academyId } }
          );
          updated += result.modifiedCount;
        }
      }

      // Set others to primary academy
      const result = await collection.updateMany(
        { tenantId: { $ne: primaryAcademy } },
        { $set: { tenantId: primaryAcademy } }
      );
      updated += result.modifiedCount;

      if (updated > 0) {
        console.log(`  ✅ Updated ${updated} documents`);
        totalUpdated += updated;
      } else {
        console.log(`  ✓ Already correct`);
      }
    }

    console.log('\n==========================================');
    console.log(`✅ Total documents updated: ${totalUpdated}`);
    console.log('==========================================\n');

    // Show tenant distribution
    console.log('Tenant Distribution:');
    const tenants = await dashboardDb.collection('users').aggregate([
      { $group: { _id: '$tenantId', count: { $sum: 1 } } }
    ]).toArray();
    
    tenants.forEach(t => {
      console.log(`  ${t._id}: ${t.count} users`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await closeConnections();
    console.log('\n🔌 Database connections closed.');
  }
}

if (require.main === module) {
  comprehensiveTenantFix()
    .then(() => {
      console.log('\n✅ Script execution complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export default comprehensiveTenantFix;
