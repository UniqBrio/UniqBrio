/**
 * Script to check all databases in Cluster0 for a user
 */

import mongoose from 'mongoose';

const CLUSTER0_URI = 'mongodb+srv://course:course1@cluster0.1gqwk5m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const USER_EMAIL = 'sugumarbala99@gmail.com';

async function checkAllDatabases() {
  console.log('🔍 CHECKING ALL DATABASES IN CLUSTER0');
  console.log('📧 Email:', USER_EMAIL);
  console.log('🌐 Cluster: Cluster0\n');

  try {
    // Connect to cluster without specifying database
    await mongoose.connect(CLUSTER0_URI);
    console.log('✅ Connected to Cluster0\n');

    // Get admin database to list all databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();

    console.log(`📚 Found ${databases.length} databases:\n`);
    databases.forEach((db: any) => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    console.log('\n' + '='.repeat(70));

    // Define user schema
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

    // Check each database for the user
    for (const database of databases) {
      if (database.name === 'admin' || database.name === 'local') {
        continue; // Skip system databases
      }

      console.log(`\n🔍 Checking database: ${database.name}`);
      
      await mongoose.disconnect();
      await mongoose.connect(CLUSTER0_URI, { dbName: database.name });

      // Clear any existing models
      if (mongoose.models.User) {
        delete mongoose.models.User;
      }

      const UserModel = mongoose.model('User', UserSchema);

      try {
        const user = await UserModel.findOne({ email: USER_EMAIL }).lean();

        if (user) {
          console.log('✅ USER FOUND!');
          console.log('='.repeat(70));
          console.log('Database:', database.name);
          console.log('Basic Information:');
          console.log(`   Name:                 ${user.name}`);
          console.log(`   Email:                ${user.email}`);
          console.log('\nIDs:');
          console.log(`   User ID:              ${user.userId || 'N/A'}`);
          console.log(`   Academy ID:           ${user.academyId || 'N/A'}`);
          console.log(`   Tenant ID:            ${user.academyId || 'N/A'}`);
          console.log('\nAccount Status:');
          console.log(`   Role:                 ${user.role || 'N/A'}`);
          console.log(`   Verified:             ${user.verified ? 'Yes' : 'No'}`);
          console.log(`   Registration Complete: ${user.registrationComplete ? 'Yes' : 'No'}`);
          console.log('='.repeat(70));
        } else {
          // Count total users in this database
          const userCount = await UserModel.countDocuments();
          console.log(`   ❌ User not found (${userCount} total users in this database)`);
        }
      } catch (error: any) {
        console.log(`   ⚠️ Error checking: ${error.message}`);
      }
    }

  } catch (error: any) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from cluster');
  }
}

checkAllDatabases()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
