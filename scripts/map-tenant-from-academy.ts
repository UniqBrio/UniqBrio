/**
 * Script: Map TenantId from AcademyId for All Collections
 * 
 * This ensures tenantId = academyId for each user across ALL collections
 * in both uniqbrio-admin and uniqbrio databases
 */

import mongoose from 'mongoose';
import { dbConnect, closeConnections } from '@/lib/mongodb';

async function mapTenantFromAcademy() {
  console.log('==========================================');
  console.log('Map TenantId from AcademyId - All Collections');
  console.log('==========================================\n');

  try {
    await dbConnect('uniqbrio');
    await dbConnect('uniqbrio-admin');
    
    const dashboardDb = mongoose.connection.useDb('uniqbrio');
    const authDb = mongoose.connection.useDb('uniqbrio-admin');

    // Step 1: Get user to academyId mapping
    console.log('📊 Step 1: Building user to academyId mapping...\n');
    
    const authUsers = await authDb.collection('User').find({}).toArray();
    
    // Email to academyId mapping
    const emailToAcademyMap = new Map<string, string>();
    const userIdToAcademyMap = new Map<string, string>();
    
    console.log('Users with academyId:');
    authUsers.forEach(user => {
      if (user.academyId) {
        if (user.email) {
          emailToAcademyMap.set(user.email.toLowerCase(), user.academyId);
        }
        if (user.userId) {
          userIdToAcademyMap.set(user.userId, user.academyId);
        }
        console.log(`  ✓ ${user.email}: ${user.academyId}`);
      } else {
        console.log(`  ⚠️  ${user.email}: NO ACADEMY ID - will be deleted`);
      }
    });

    if (emailToAcademyMap.size === 0) {
      console.log('\n❌ No users with academyId found! Cannot proceed.');
      return;
    }

    let totalUpdated = 0;

    // Step 2: Fix Auth Database (uniqbrio-admin)
    console.log('\n\n📝 Step 2: Fixing Auth Database (uniqbrio-admin)...\n');
    
    const authCollections = await authDb.db!.listCollections().toArray();
    
    for (const collInfo of authCollections) {
      const collName = collInfo.name;
      const collection = authDb.collection(collName);
      
      console.log(`\n🔹 ${collName}:`);
      
      const docs = await collection.find({}).toArray();
      if (docs.length === 0) {
        console.log('   Empty collection - skipped');
        continue;
      }

      let collectionUpdated = 0;

      // Check each document for user reference fields
      for (const doc of docs) {
        let correctAcademyId: string | null = null;

        // Try to find academyId by different fields
        if (doc.email) {
          correctAcademyId = emailToAcademyMap.get(doc.email.toLowerCase()) || null;
        }
        if (!correctAcademyId && doc.userId) {
          correctAcademyId = userIdToAcademyMap.get(doc.userId) || null;
        }
        if (!correctAcademyId && doc.academyId) {
          correctAcademyId = doc.academyId; // Use existing academyId
        }

        // Update if we found the correct academyId and it's different
        if (correctAcademyId && doc.tenantId !== correctAcademyId) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { tenantId: correctAcademyId } }
          );
          collectionUpdated++;
          console.log(`   ✓ Updated doc (email: ${doc.email || 'N/A'}): ${doc.tenantId} → ${correctAcademyId}`);
        }
      }

      if (collectionUpdated > 0) {
        console.log(`   ✅ Total updated: ${collectionUpdated}`);
        totalUpdated += collectionUpdated;
      } else {
        console.log('   ✓ All documents already have correct tenantId');
      }
    }

    // Step 3: Fix Dashboard Database (uniqbrio)
    console.log('\n\n📝 Step 3: Fixing Dashboard Database (uniqbrio)...\n');
    
    const dashboardCollections = await dashboardDb.db!.listCollections().toArray();
    
    for (const collInfo of dashboardCollections) {
      const collName = collInfo.name;
      const collection = dashboardDb.collection(collName);
      
      console.log(`\n🔹 ${collName}:`);
      
      const docs = await collection.find({}).toArray();
      if (docs.length === 0) {
        console.log('   Empty collection - skipped');
        continue;
      }

      let collectionUpdated = 0;

      // Check each document for user reference fields
      for (const doc of docs) {
        let correctAcademyId: string | null = null;

        // Try to find academyId by different fields
        if (doc.email) {
          correctAcademyId = emailToAcademyMap.get(doc.email.toLowerCase()) || null;
        }
        if (!correctAcademyId && doc.userId) {
          correctAcademyId = userIdToAcademyMap.get(doc.userId) || null;
        }
        if (!correctAcademyId && doc.studentId) {
          correctAcademyId = userIdToAcademyMap.get(doc.studentId) || null;
        }
        if (!correctAcademyId && doc.instructorId) {
          correctAcademyId = userIdToAcademyMap.get(doc.instructorId) || null;
        }

        // If still not found, check if document has any email-like field
        if (!correctAcademyId) {
          for (const [key, value] of Object.entries(doc)) {
            if (typeof value === 'string' && value.includes('@')) {
              const mapped = emailToAcademyMap.get(value.toLowerCase());
              if (mapped) {
                correctAcademyId = mapped;
                break;
              }
            }
          }
        }

        // Update if we found the correct academyId and it's different
        if (correctAcademyId && doc.tenantId !== correctAcademyId) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { tenantId: correctAcademyId } }
          );
          collectionUpdated++;
          
          const identifier = doc.email || doc.name || doc.studentId || doc._id.toString().substring(0, 8);
          console.log(`   ✓ Updated (${identifier}): ${doc.tenantId} → ${correctAcademyId}`);
        }
      }

      if (collectionUpdated > 0) {
        console.log(`   ✅ Total updated: ${collectionUpdated}`);
        totalUpdated += collectionUpdated;
      } else {
        console.log('   ✓ All documents already have correct tenantId');
      }
    }

    // Step 4: Summary
    console.log('\n\n==========================================');
    console.log('Summary');
    console.log('==========================================');
    console.log(`Total documents updated: ${totalUpdated}`);
    console.log('\nTenant Distribution:');
    
    for (const [email, academyId] of Array.from(emailToAcademyMap.entries())) {
      const authCount = await authDb.collection('User').countDocuments({ tenantId: academyId });
      const dashboardCount = await dashboardDb.collection('users').countDocuments({ tenantId: academyId });
      console.log(`  ${academyId} (${email}):`);
      console.log(`    - Auth DB: ${authCount} user(s)`);
      console.log(`    - Dashboard DB: ${dashboardCount} user(s)`);
    }
    
    console.log('\n✅ All documents now have tenantId = academyId');
    console.log('\n⚠️  NEXT STEP: Delete users without academyId from database');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await closeConnections();
    console.log('\n🔌 Database connections closed.');
  }
}

if (require.main === module) {
  mapTenantFromAcademy()
    .then(() => {
      console.log('\n✅ Script execution complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export default mapTenantFromAcademy;
