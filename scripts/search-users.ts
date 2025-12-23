/**
 * Script to list all users in the database
 */

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import UserModel from '@/models/User';

async function searchUsers() {
  console.log('📋 SEARCHING FOR USERS\n');

  try {
    // Check auth database first
    await dbConnect('uniqbrio-admin');
    const authUsers = await UserModel.countDocuments();
    console.log(`Users in auth database (uniqbrio-admin): ${authUsers}`);
    
    // Switch to dashboard database
    await mongoose.disconnect();
    await dbConnect('uniqbrio');
    
    // Search for users with similar patterns
    const searchPatterns = [
      { pattern: 'sugumarbala', label: 'sugumarbala' },
      { pattern: 'bala', label: 'bala' },
      { pattern: 'suguma', label: 'suguma' },
      { pattern: '99', label: '99' }
    ];

    console.log('🔍 Searching for similar email addresses...\n');

    for (const { pattern, label } of searchPatterns) {
      const users = await UserModel.find({ 
        email: { $regex: pattern, $options: 'i' } 
      }).select('email name userId academyId verified registrationComplete createdAt').limit(10).lean();

      if (users.length > 0) {
        console.log(`📧 Found ${users.length} user(s) containing "${label}":\n`);
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email}`);
          console.log(`   Name: ${user.name}`);
          console.log(`   Academy ID: ${user.academyId || 'N/A'}`);
          console.log(`   User ID: ${user.userId || 'N/A'}`);
          console.log(`   Status: ${user.registrationComplete ? 'Complete' : 'Incomplete'}\n`);
        });
      }
    }

    // Get total count from dashboard
    const totalUsers = await UserModel.countDocuments();
    console.log('='.repeat(80));
    console.log(`\nTotal users in dashboard database: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    // List all users
    console.log('='.repeat(80));
    console.log('ALL USERS:');
    console.log('='.repeat(80));
    
    const allUsers = await UserModel.find({})
      .select('email name userId academyId verified registrationComplete role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    allUsers.forEach((user, index) => {
      console.log(`\n${(index + 1).toString().padStart(3)}. ${user.email}`);
      console.log(`     Name:         ${user.name}`);
      console.log(`     Academy ID:   ${user.academyId || 'N/A'}`);
      console.log(`     User ID:      ${user.userId || 'N/A'}`);
      console.log(`     Role:         ${user.role || 'N/A'}`);
      console.log(`     Verified:     ${user.verified ? 'Yes' : 'No'}`);
      console.log(`     Registration: ${user.registrationComplete ? 'Complete' : 'Incomplete'}`);
      console.log(`     Created:      ${user.createdAt}`);
    });

  } catch (error: any) {
    console.error('\n💥 ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

searchUsers()
  .then(() => {
    console.log('\n✅ Search completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Search failed:', error);
    process.exit(1);
  });
