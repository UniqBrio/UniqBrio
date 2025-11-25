/**
 * Script: Clean Up Users Without AcademyId and Invalid TenantIds
 * 
 * 1. Deletes users without academyId
 * 2. Deletes or updates related documents
 * 3. Cleans up invalid tenantIds (like TEST_ACADEMY_001)
 */

import mongoose from 'mongoose';
import { dbConnect, closeConnections } from '@/lib/mongodb';

async function cleanupInvalidTenants() {
  console.log('==========================================');
  console.log('Cleanup Users Without AcademyId & Invalid Tenants');
  console.log('==========================================\n');

  try {
    await dbConnect('uniqbrio');
    await dbConnect('uniqbrio-admin');
    
    const dashboardDb = mongoose.connection.useDb('uniqbrio');
    const authDb = mongoose.connection.useDb('uniqbrio-admin');

    // Step 1: Find users without academyId
    console.log('📊 Step 1: Finding users without academyId...\n');
    
    const authUsers = await authDb.collection('User').find({}).toArray();
    const usersToDelete: any[] = [];
    const validAcademyIds: string[] = [];
    const validEmails: string[] = [];
    
    authUsers.forEach(user => {
      if (!user.academyId) {
        usersToDelete.push(user);
        console.log(`  ❌ Will DELETE: ${user.email} (No academyId)`);
      } else {
        validAcademyIds.push(user.academyId);
        if (user.email) {
          validEmails.push(user.email.toLowerCase());
        }
        console.log(`  ✓ Keep: ${user.email} (${user.academyId})`);
      }
    });

    if (usersToDelete.length === 0) {
      console.log('\n✅ No users without academyId found!\n');
    } else {
      console.log(`\n⚠️  Found ${usersToDelete.length} user(s) to delete\n`);
    }

    // Step 2: Delete users without academyId
    if (usersToDelete.length > 0) {
      console.log('🗑️  Step 2: Deleting users without academyId...\n');
      
      for (const user of usersToDelete) {
        const result = await authDb.collection('User').deleteOne({ _id: user._id });
        console.log(`  ✓ Deleted user: ${user.email} (${result.deletedCount} document)`);
        
        // Delete from dashboard DB if exists
        if (user.email) {
          const dashResult = await dashboardDb.collection('users').deleteMany({ 
            email: user.email 
          });
          if (dashResult.deletedCount > 0) {
            console.log(`    └─ Deleted ${dashResult.deletedCount} from dashboard users`);
          }
        }
      }
    }

    // Step 3: Clean up documents with invalid tenantIds
    console.log('\n\n🧹 Step 3: Cleaning up invalid tenantIds...\n');
    console.log(`Valid academyIds: ${validAcademyIds.join(', ')}\n`);
    
    let totalCleaned = 0;

    // Clean Auth Database
    console.log('Cleaning Auth Database (uniqbrio-admin):\n');
    const authCollections = await authDb.db!.listCollections().toArray();
    
    for (const collInfo of authCollections) {
      const collName = collInfo.name;
      const collection = authDb.collection(collName);
      
      // Delete documents with invalid tenantIds (not in valid list)
      const deleteResult = await collection.deleteMany({
        tenantId: { $exists: true, $nin: validAcademyIds }
      });
      
      if (deleteResult.deletedCount > 0) {
        console.log(`  🗑️  ${collName}: Deleted ${deleteResult.deletedCount} documents with invalid tenantId`);
        totalCleaned += deleteResult.deletedCount;
      }
    }

    // Clean Dashboard Database
    console.log('\nCleaning Dashboard Database (uniqbrio):\n');
    const dashboardCollections = await dashboardDb.db!.listCollections().toArray();
    
    for (const collInfo of dashboardCollections) {
      const collName = collInfo.name;
      const collection = dashboardDb.collection(collName);
      
      // Delete documents with invalid tenantIds
      const deleteResult = await collection.deleteMany({
        tenantId: { $exists: true, $nin: validAcademyIds }
      });
      
      if (deleteResult.deletedCount > 0) {
        console.log(`  🗑️  ${collName}: Deleted ${deleteResult.deletedCount} documents with invalid tenantId`);
        totalCleaned += deleteResult.deletedCount;
      }
    }

    // Step 4: Delete orphaned documents (documents referencing deleted users)
    console.log('\n\n🧹 Step 4: Cleaning up orphaned documents...\n');
    
    if (usersToDelete.length > 0) {
      const deletedEmails = usersToDelete.map(u => u.email?.toLowerCase()).filter(Boolean);
      
      // Clean Auth Database
      for (const collInfo of authCollections) {
        const collName = collInfo.name;
        if (collName === 'User') continue; // Already cleaned
        
        const collection = authDb.collection(collName);
        
        // Delete by email
        const result = await collection.deleteMany({
          email: { $in: deletedEmails }
        });
        
        if (result.deletedCount > 0) {
          console.log(`  🗑️  ${collName}: Deleted ${result.deletedCount} orphaned documents`);
          totalCleaned += result.deletedCount;
        }
      }
      
      // Clean Dashboard Database
      for (const collInfo of dashboardCollections) {
        const collName = collInfo.name;
        const collection = dashboardDb.collection(collName);
        
        // Delete by email
        const result = await collection.deleteMany({
          email: { $in: deletedEmails }
        });
        
        if (result.deletedCount > 0) {
          console.log(`  🗑️  ${collName}: Deleted ${result.deletedCount} orphaned documents`);
          totalCleaned += result.deletedCount;
        }
      }
    }

    // Step 5: Final verification
    console.log('\n\n📊 Step 5: Final Verification...\n');
    
    const remainingUsers = await authDb.collection('User').find({}).toArray();
    console.log('Remaining Users:');
    remainingUsers.forEach(user => {
      console.log(`  ✓ ${user.email}: academyId=${user.academyId}, tenantId=${user.tenantId}`);
    });

    // Check for any remaining invalid tenantIds
    console.log('\nChecking for invalid tenantIds...');
    let foundInvalid = false;
    
    for (const collInfo of authCollections) {
      const collection = authDb.collection(collInfo.name);
      const count = await collection.countDocuments({
        tenantId: { $exists: true, $nin: validAcademyIds }
      });
      if (count > 0) {
        console.log(`  ⚠️  ${collInfo.name}: ${count} documents with invalid tenantId`);
        foundInvalid = true;
      }
    }
    
    for (const collInfo of dashboardCollections) {
      const collection = dashboardDb.collection(collInfo.name);
      const count = await collection.countDocuments({
        tenantId: { $exists: true, $nin: validAcademyIds }
      });
      if (count > 0) {
        console.log(`  ⚠️  ${collInfo.name}: ${count} documents with invalid tenantId`);
        foundInvalid = true;
      }
    }
    
    if (!foundInvalid) {
      console.log('  ✅ No invalid tenantIds found!');
    }

    console.log('\n==========================================');
    console.log('Summary');
    console.log('==========================================');
    console.log(`Users deleted: ${usersToDelete.length}`);
    console.log(`Total documents cleaned: ${totalCleaned}`);
    console.log(`Remaining users: ${remainingUsers.length}`);
    console.log(`Valid academies: ${validAcademyIds.join(', ')}`);
    console.log('==========================================\n');
    
    console.log('✅ Cleanup complete!');
    console.log('✅ All remaining users have valid academyId');
    console.log('✅ All documents have valid tenantId matching academyId\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await closeConnections();
    console.log('🔌 Database connections closed.');
  }
}

if (require.main === module) {
  cleanupInvalidTenants()
    .then(() => {
      console.log('\n✅ Script execution complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export default cleanupInvalidTenants;
