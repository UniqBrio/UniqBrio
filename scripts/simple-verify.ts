/**
 * Simple script to manually verify a user
 * Usage: npx tsx scripts/simple-verify.ts <email>
 */

import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '@/lib/mongodb';
import UserModel from '@/models/User';

const email = process.argv[2];

if (!email || !email.includes('@')) {
  console.error('❌ Please provide a valid email address');
  console.log('Usage: npx tsx scripts/simple-verify.ts <email>');
  process.exit(1);
}

async function simpleVerify() {
  try {
    await dbConnect('uniqbrio');
    console.log('✅ Connected to database');
    
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('\n📊 CURRENT STATUS:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Verified:', user.verified ? '✅ YES' : '❌ NO');
    
    if (user.verified) {
      console.log('\n✅ User is already verified!');
      return;
    }

    // Verify the user
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: { verified: true },
        $unset: { verificationToken: "", verificationTokenExpiry: "" }
      }
    );

    console.log('\n✅ USER VERIFIED SUCCESSFULLY!');
    console.log('The user can now log in at:');
    console.log((process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/login');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

simpleVerify();
