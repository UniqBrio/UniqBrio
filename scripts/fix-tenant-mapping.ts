/**
 * Script: Fix Tenant Mapping - Map Each User to Their Own Academy
 * 
 * This correctly maps tenantId = academyId for each user
 */

import mongoose from 'mongoose';
import { dbConnect, closeConnections } from '@/lib/mongodb';

async function fixTenantMapping() {
  console.log('==========================================');
  console.log('Fix Tenant Mapping');
  console.log('==========================================\n');

  try {
    await dbConnect('uniqbrio');
    await dbConnect('uniqbrio-admin');
    
    const dashboardDb = mongoose.connection.useDb('uniqbrio');
    const authDb = mongoose.connection.useDb('uniqbrio-admin');

    // Step 1: Get all users with their academyId
    console.log('📊 Step 1: Getting all users and their academyIds...\n');
    
    const authUsers = await authDb.collection('User').find({}).toArray();
    const dashboardUsers = await dashboardDb.collection('users').find({}).toArray();
    
    console.log('Users from Auth DB:');
    authUsers.forEach(user => {
      console.log(`  - ${user.email}: academyId=${user.academyId || 'NONE'}, tenantId=${user.tenantId || 'NONE'}`);
    });

    console.log('\nUsers from Dashboard DB:');
    dashboardUsers.forEach(user => {
      console.log(`  - ${user.email}: tenantId=${user.tenantId || 'NONE'}`);
    });

    // Step 2: Create email to academyId mapping
    console.log('\n📝 Step 2: Creating email to academyId mapping...\n');
    
    const emailToAcademyId = new Map<string, string>();
    
    authUsers.forEach(user => {
      if (user.email && user.academyId) {
        emailToAcademyId.set(user.email.toLowerCase(), user.academyId);
        console.log(`  Mapping: ${user.email} → ${user.academyId}`);
      }
    });

    if (emailToAcademyId.size === 0) {
      console.log('\n⚠️  No users with academyId found!');
      console.log('All users will keep tenantId="default"');
      return;
    }

    // Step 3: Fix Auth Database Users
    console.log('\n🔧 Step 3: Fixing Auth Database Users...\n');
    
    for (const user of authUsers) {
      if (user.academyId && user.tenantId !== user.academyId) {
        await authDb.collection('User').updateOne(
          { _id: user._id },
          { $set: { tenantId: user.academyId } }
        );
        console.log(`  ✅ Updated ${user.email}: tenantId → ${user.academyId}`);
      }
    }

    // Step 4: Fix Dashboard Database Users
    console.log('\n🔧 Step 4: Fixing Dashboard Database Users...\n');
    
    for (const user of dashboardUsers) {
      if (user.email) {
        const academyId = emailToAcademyId.get(user.email.toLowerCase());
        if (academyId && user.tenantId !== academyId) {
          await dashboardDb.collection('users').updateOne(
            { _id: user._id },
            { $set: { tenantId: academyId } }
          );
          console.log(`  ✅ Updated ${user.email}: tenantId → ${academyId}`);
        }
      }
    }

    // Step 5: Update related documents
    console.log('\n🔧 Step 5: Updating related documents...\n');
    
    // For each collection, update documents based on related user email or ID
    const collections = await dashboardDb.db!.listCollections().toArray();
    
    let totalUpdated = 0;
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName === 'users') continue; // Already handled
      
      const collection = dashboardDb.collection(collName);
      
      // Try to find documents with user reference
      const sampleDoc = await collection.findOne({});
      if (!sampleDoc) continue;
      
      // Check for common user reference fields
      const userFields = ['email', 'userEmail', 'userId', 'studentId', 'instructorId'];
      const foundField = userFields.find(field => sampleDoc[field]);
      
      if (foundField && foundField === 'email') {
        // Update based on email mapping
        for (const [email, academyId] of Array.from(emailToAcademyId.entries())) {
          const result = await collection.updateMany(
            { [foundField]: email, tenantId: { $ne: academyId } },
            { $set: { tenantId: academyId } }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`  ${collName}: ${result.modifiedCount} docs updated for ${email} → ${academyId}`);
            totalUpdated += result.modifiedCount;
          }
        }
      }
    }

    // Step 6: Set default tenant for documents without specific mapping
    console.log('\n🔧 Step 6: Setting default tenant for unmapped documents...\n');
    
    const defaultAcademyId = authUsers.find(u => u.academyId)?.academyId || 'default';
    console.log(`Using default academyId: ${defaultAcademyId}`);
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = dashboardDb.collection(collName);
      
      // Update documents that still have wrong tenantId
      const result = await collection.updateMany(
        { tenantId: { $nin: Array.from(emailToAcademyId.values()) } },
        { $set: { tenantId: defaultAcademyId } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`  ${collName}: ${result.modifiedCount} docs set to default ${defaultAcademyId}`);
        totalUpdated += result.modifiedCount;
      }
    }

    console.log('\n✅ Tenant mapping fixed!');
    console.log(`Total documents updated: ${totalUpdated}`);
    
    // Verify
    console.log('\n📊 Verification:\n');
    const updatedAuthUsers = await authDb.collection('User').find({}).toArray();
    updatedAuthUsers.forEach(user => {
      const match = user.academyId === user.tenantId ? '✅' : '❌';
      console.log(`  ${match} ${user.email}: academyId=${user.academyId}, tenantId=${user.tenantId}`);
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
  fixTenantMapping()
    .then(() => {
      console.log('\n✅ Script execution complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export default fixTenantMapping;
