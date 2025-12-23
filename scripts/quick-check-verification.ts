/**
 * Quick diagnostic - paste the email address from signup
 */

import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import UserModel from '@/models/User';

// Change this to the email that signed up
const EMAIL_TO_CHECK = 'shyamsivu2003@gmail.com'; // CHANGE THIS

async function quickCheck() {
  try {
    await dbConnect('uniqbrio');
    
    const user = await UserModel.findOne({ email: EMAIL_TO_CHECK.toLowerCase().trim() }).lean();
    
    if (!user) {
      console.log('❌ No user found with email:', EMAIL_TO_CHECK);
      console.log('   User may not have signed up yet, or used a different email');
      return;
    }

    console.log('\n📊 USER STATUS:');
    console.log('='.repeat(60));
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Verified:', user.verified ? '✅ YES' : '❌ NO');
    console.log('Has Token:', user.verificationToken ? '✅ YES' : '❌ NO');
    
    if (user.verificationToken) {
      console.log('\n📬 VERIFICATION DETAILS:');
      console.log('Token (first 10 chars):', user.verificationToken.substring(0, 10) + '...');
      console.log('Token Expiry:', user.verificationTokenExpiry || 'No expiry set (old format)');
      
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.verificationToken}`;
      console.log('\n🔗 Verification Link:');
      console.log(verifyUrl);
    }
    
    console.log('\n📅 Account Created:', new Date(user.createdAt).toLocaleString());
    console.log('='.repeat(60));
    
    if (user.verified) {
      console.log('\n✅ User is verified! They can login now.');
    } else if (!user.verificationToken) {
      console.log('\n⚠️  User has NO verification token!');
      console.log('   Possible reasons:');
      console.log('   1. Token was used and cleared');
      console.log('   2. Token generation failed during signup');
      console.log('\n   SOLUTION: Run this to resend:');
      console.log('   npx tsx scripts/manage-verification.ts ' + EMAIL_TO_CHECK + ' resend');
    } else {
      console.log('\n📧 User needs to click verification link in email');
      console.log('   Or manually verify with:');
      console.log('   npx tsx scripts/manage-verification.ts ' + EMAIL_TO_CHECK + ' verify');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

quickCheck();
