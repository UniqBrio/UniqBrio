/**
 * Script to check verification token status
 * Usage: npx tsx scripts/check-verification-token.ts <email_or_token>
 */

import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import UserModel from '@/models/User';

const searchParam = process.argv[2];

if (!searchParam) {
  console.error('❌ Please provide an email address or token');
  console.log('Usage: npx tsx scripts/check-verification-token.ts <email_or_token>');
  process.exit(1);
}

async function checkVerificationToken() {
  console.log('🔍 CHECKING VERIFICATION TOKEN STATUS');
  console.log(`🔎 Searching for: ${searchParam}\n`);

  try {
    await dbConnect('uniqbrio');
    
    // Check if it's an email or token
    let user;
    if (searchParam.includes('@')) {
      user = await UserModel.findOne({ email: searchParam.toLowerCase().trim() }).lean();
    } else {
      user = await UserModel.findOne({ verificationToken: searchParam }).lean();
    }
    
    if (!user) {
      console.log('❌ No user found with this email/token');
      console.log('\n💡 Possible reasons:');
      console.log('   1. User does not exist');
      console.log('   2. Token has already been used (cleared after verification)');
      console.log('   3. Invalid token');
      return;
    }

    console.log('✅ USER FOUND');
    console.log('='.repeat(60));
    console.log('Basic Information:');
    console.log(`   Name:                 ${user.name}`);
    console.log(`   Email:                ${user.email}`);
    console.log(`   Phone:                ${user.phone || 'N/A'}`);
    console.log('\nVerification Status:');
    console.log(`   Verified:             ${user.verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Verification Token:   ${user.verificationToken ? '🔑 ' + user.verificationToken.substring(0, 16) + '...' : '❌ No token (already verified or cleared)'}`);
    console.log('\nAccount Status:');
    console.log(`   Registration Complete: ${user.registrationComplete ? 'Yes' : 'No'}`);
    console.log(`   User ID:              ${user.userId || 'Not assigned yet'}`);
    console.log(`   Academy ID:           ${user.academyId || 'Not assigned yet'}`);
    console.log('\nTimestamps:');
    console.log(`   Created At:           ${new Date(user.createdAt).toLocaleString()}`);
    console.log(`   Last Updated:         ${new Date(user.updatedAt).toLocaleString()}`);
    
    console.log('\n' + '='.repeat(60));
    
    if (user.verified) {
      console.log('\n✅ This user is already verified!');
      console.log('   They can log in at: ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/login');
    } else if (!user.verificationToken) {
      console.log('\n⚠️  User is NOT verified but has NO verification token!');
      console.log('   This might be an issue. The user may need to:');
      console.log('   1. Request a new verification email');
      console.log('   2. Sign up again');
      console.log('   3. Contact support');
    } else {
      console.log('\n📧 User needs to verify their email');
      console.log('   Verification link: ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/verify-email?token=' + user.verificationToken);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkVerificationToken();
