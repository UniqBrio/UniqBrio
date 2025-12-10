/**
 * Check for users with null userId and optionally clean them up
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

async function checkNullUserIds() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'uniqbrio',
    });
    console.log('✅ Connected to MongoDB (database: uniqbrio)');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('User');

    // Count users with null userId
    console.log('\n📊 Analyzing users with null userId...');
    const nullUserIdCount = await usersCollection.countDocuments({ userId: null });
    console.log(`Found ${nullUserIdCount} user(s) with userId: null`);

    if (nullUserIdCount > 0) {
      const nullUsers = await usersCollection.find(
        { userId: null },
        { 
          projection: { 
            _id: 1,
            email: 1, 
            createdAt: 1, 
            registrationComplete: 1,
            googleId: 1,
            verificationToken: 1
          } 
        }
      ).toArray();
      
      console.log('\n👥 Users with null userId:');
      nullUsers.forEach((user, idx) => {
        console.log(`\n  ${idx + 1}. Email: ${user.email}`);
        console.log(`     _id: ${user._id}`);
        console.log(`     Created: ${user.createdAt}`);
        console.log(`     Registration Complete: ${user.registrationComplete}`);
        console.log(`     Google ID: ${user.googleId || 'N/A'}`);
        console.log(`     Has Verification Token: ${!!user.verificationToken}`);
      });

      // Check for the specific email
      const specificUser = nullUsers.find(u => u.email === 'shaziafarheen75@gmail.com');
      if (specificUser) {
        console.log('\n⚠️  Found user with email shaziafarheen75@gmail.com and null userId!');
        console.log('   This is likely causing your duplicate key error.');
        console.log('   Options:');
        console.log('   1. Delete this incomplete user and try signup again');
        console.log('   2. Complete the registration for this user');
      }
    } else {
      console.log('✅ No users with null userId found');
    }

    // Check total user count
    const totalUsers = await usersCollection.countDocuments({});
    console.log(`\n📊 Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
checkNullUserIds()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
