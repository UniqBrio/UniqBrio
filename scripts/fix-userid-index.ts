/**
 * Script to fix userId index - drop old index and recreate with sparse option
 * This allows multiple users with userId: null (users who haven't completed registration yet)
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

async function fixUserIdIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'uniqbrio', // Specify the correct database name
    });
    console.log('✅ Connected to MongoDB (database: uniqbrio)');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('User');

    console.log('\n📋 Checking existing indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Check for ALL userId indexes (there might be multiple)
    const userIdIndexes = indexes.filter(idx => idx.key.userId === 1);
    
    console.log(`\n🔍 Found ${userIdIndexes.length} userId index(es):`);
    userIdIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: sparse=${idx.sparse || false}, unique=${idx.unique || false}`);
    });

    // Check if we have a good sparse unique index
    const goodIndex = userIdIndexes.find(idx => idx.sparse && idx.unique);
    const badIndexes = userIdIndexes.filter(idx => !idx.sparse && idx.unique);

    if (goodIndex && badIndexes.length === 0) {
      console.log('\n✅ All userId indexes are properly configured (sparse + unique)');
      console.log('No fix needed!');
      await mongoose.disconnect();
      return;
    }

    // Drop all bad (non-sparse) indexes
    for (const badIndex of badIndexes) {
      console.log(`\n⚠️  Index "${badIndex.name}" is NOT sparse - this causes the duplicate key error!`);
      console.log(`🗑️  Dropping index "${badIndex.name}"...`);
      await usersCollection.dropIndex(badIndex.name);
      console.log('✅ Index dropped');
    }

    // If we don't have a good index, create one
    if (!goodIndex) {
      console.log('\n🔨 Creating new sparse unique index on userId...');
      await usersCollection.createIndex(
        { userId: 1 },
        { 
          unique: true, 
          sparse: true,
          name: 'userId_1'
        }
      );
      console.log('✅ New sparse index created successfully');
    } else {
      console.log(`\n✅ Good sparse index "${goodIndex.name}" already exists - using it`);
    }

    // Verify the new index
    console.log('\n🔍 Verifying new index...');
    const newIndexes = await usersCollection.indexes();
    const newUserIdIndex = newIndexes.find(idx => 
      idx.key.userId === 1 || idx.name === 'User_userId_key'
    );
    
    if (newUserIdIndex && newUserIdIndex.sparse) {
      console.log('✅ Verification successful - index is now sparse!');
      console.log('Index details:', JSON.stringify(newUserIdIndex, null, 2));
    } else {
      console.log('❌ Verification failed - index may not be sparse');
    }

    // Show users with null userId
    console.log('\n👥 Checking users with null userId...');
    const nullUserIdCount = await usersCollection.countDocuments({ userId: null });
    console.log(`Found ${nullUserIdCount} user(s) with userId: null`);

    if (nullUserIdCount > 0) {
      const nullUsers = await usersCollection.find(
        { userId: null },
        { projection: { email: 1, createdAt: 1, registrationComplete: 1 } }
      ).toArray();
      
      console.log('\nUsers with null userId:');
      nullUsers.forEach((user, idx) => {
        console.log(`  ${idx + 1}. Email: ${user.email}, Created: ${user.createdAt}, Registration Complete: ${user.registrationComplete}`);
      });
    }

    console.log('\n✅ Index fix completed successfully!');
    console.log('You can now create new users with userId: null during signup');

  } catch (error) {
    console.error('❌ Error fixing userId index:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixUserIdIndex()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
