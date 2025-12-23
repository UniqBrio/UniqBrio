/**
 * Script to delete a user account
 * Usage: npx tsx scripts/delete-user.ts <email>
 */

import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '@/lib/mongodb';
import UserModel from '@/models/User';

const email = process.argv[2];

if (!email || !email.includes('@')) {
  console.error('❌ Please provide a valid email address');
  console.log('Usage: npx tsx scripts/delete-user.ts <email>');
  process.exit(1);
}

async function deleteUser() {
  try {
    await dbConnect('uniqbrio');
    console.log('✅ Connected to database');
    
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('\n📊 USER TO BE DELETED:');
    console.log('='.repeat(60));
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Verified:', user.verified ? 'Yes' : 'No');
    console.log('Created:', new Date(user.createdAt).toLocaleString());
    console.log('='.repeat(60));
    
    // Delete the user
    await UserModel.deleteOne({ _id: user._id });

    console.log('\n✅ USER DELETED SUCCESSFULLY!');
    console.log('The user can now sign up again with a fresh account.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteUser();
