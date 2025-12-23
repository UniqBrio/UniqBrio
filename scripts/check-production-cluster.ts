/**
 * Script to check production cluster for user
 */

import mongoose from 'mongoose';

const PROD_URI = 'mongodb+srv://uniqbrio:uniqbrio25@uniqbriocluster.pvl6zgz.mongodb.net/?retryWrites=true&w=majority&appName=UniqBrioCluster';
const USER_EMAIL = 'sugumarbala99@gmail.com';

async function checkProductionCluster() {
  console.log('🔍 CHECKING PRODUCTION CLUSTER');
  console.log('📧 Email:', USER_EMAIL);
  console.log('🌐 Cluster: UniqBrioCluster\n');

  try {
    // Connect to production cluster
    await mongoose.connect(PROD_URI, { dbName: 'uniqbrio' });
    console.log('✅ Connected to production cluster\n');

    // Define inline user schema
    const UserSchema = new mongoose.Schema({
      email: String,
      name: String,
      userId: String,
      academyId: String,
      role: String,
      verified: Boolean,
      registrationComplete: Boolean,
      createdAt: Date,
    });

    const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

    // Search for the user
    const user = await UserModel.findOne({ email: USER_EMAIL }).lean();

    if (!user) {
      console.log('❌ User not found in production cluster');
      
      // List all users to help identify
      console.log('\n📋 Listing all users in production cluster:\n');
      const allUsers = await UserModel.find({})
        .select('email name academyId userId verified registrationComplete')
        .sort({ createdAt: -1 })
        .lean();

      if (allUsers.length === 0) {
        console.log('   No users found in production cluster');
      } else {
        allUsers.forEach((u: any, i: number) => {
          console.log(`${(i + 1).toString().padStart(3)}. ${u.email}`);
          console.log(`     Name:       ${u.name}`);
          console.log(`     Academy ID: ${u.academyId || 'N/A'}`);
          console.log(`     Status:     ${u.registrationComplete ? 'Complete' : 'Incomplete'}\n`);
        });
      }
    } else {
      console.log('✅ USER FOUND IN PRODUCTION CLUSTER');
      console.log('='.repeat(60));
      console.log('Basic Information:');
      console.log(`   Name:                 ${user.name}`);
      console.log(`   Email:                ${user.email}`);
      console.log('\nIDs:');
      console.log(`   User ID:              ${user.userId || 'N/A'}`);
      console.log(`   Academy ID:           ${user.academyId || 'N/A'}`);
      console.log(`   Tenant ID:            ${user.academyId || 'N/A'} (same as Academy ID)`);
      console.log('\nAccount Status:');
      console.log(`   Role:                 ${user.role || 'N/A'}`);
      console.log(`   Verified:             ${user.verified ? 'Yes' : 'No'}`);
      console.log(`   Registration Complete: ${user.registrationComplete ? 'Yes' : 'No'}`);
      console.log('='.repeat(60));
    }

  } catch (error: any) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from production cluster');
  }
}

checkProductionCluster()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
