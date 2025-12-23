/**
 * Script to validate a token from URL
 * Usage: npx tsx scripts/validate-token.ts <token_from_url>
 */

import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '@/lib/mongodb';
import UserModel from '@/models/User';

const tokenFromUrl = process.argv[2];

if (!tokenFromUrl) {
  console.error('❌ Please provide the token from the URL');
  console.log('Usage: npx tsx scripts/validate-token.ts <token_from_url>');
  console.log('\nExample:');
  console.log('npx tsx scripts/validate-token.ts 6a99614890e747567b2532ee7970950c1152239dc48c0313d7651a851dd894bf');
  process.exit(1);
}

async function validateToken() {
  try {
    await dbConnect('uniqbrio');
    console.log('✅ Connected to database\n');
    
    console.log('🔍 Looking for user with this token...');
    console.log('Token from URL:', tokenFromUrl);
    console.log('Token length:', tokenFromUrl.length);
    console.log();
    
    const user = await UserModel.findOne({ verificationToken: tokenFromUrl }).lean();
    
    if (!user) {
      console.log('❌ NO USER FOUND WITH THIS TOKEN\n');
      
      // Let's check if there's a similar token
      console.log('🔍 Checking for users with verification tokens...');
      const usersWithTokens = await UserModel.find({ 
        verificationToken: { $exists: true, $ne: null },
        verified: false 
      }).select('email name verificationToken verificationTokenExpiry').lean();
      
      if (usersWithTokens.length === 0) {
        console.log('No unverified users with tokens found in database');
      } else {
        console.log(`Found ${usersWithTokens.length} unverified user(s) with tokens:\n`);
        usersWithTokens.forEach((u, i) => {
          console.log(`${i + 1}. ${u.email}`);
          console.log(`   Token: ${u.verificationToken?.substring(0, 20)}...`);
          console.log(`   Expires: ${u.verificationTokenExpiry}`);
          
          // Check if tokens match
          if (u.verificationToken === tokenFromUrl) {
            console.log('   ✅ EXACT MATCH!');
          } else if (u.verificationToken && tokenFromUrl.startsWith(u.verificationToken.substring(0, 10))) {
            console.log('   ⚠️  Partial match (first 10 chars)');
          }
          console.log();
        });
      }
      
      return;
    }

    console.log('✅ USER FOUND!\n');
    console.log('='.repeat(60));
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Verified:', user.verified ? 'Yes' : 'No');
    console.log('Token Expiry:', user.verificationTokenExpiry);
    console.log('='.repeat(60));
    
    if (user.verificationTokenExpiry) {
      const now = new Date();
      const expiry = new Date(user.verificationTokenExpiry);
      const isExpired = expiry < now;
      
      console.log();
      if (isExpired) {
        console.log('❌ TOKEN HAS EXPIRED');
        console.log(`   Expired on: ${expiry.toLocaleString()}`);
        console.log(`   Current time: ${now.toLocaleString()}`);
        console.log('\n💡 Solution: Run this to resend verification:');
        console.log(`   npx tsx scripts/manage-verification.ts ${user.email} resend`);
      } else {
        console.log('✅ TOKEN IS VALID AND NOT EXPIRED');
        const timeLeft = expiry.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        console.log(`   Expires in: ${hoursLeft}h ${minutesLeft}m`);
        console.log('\n💡 This token should work! Try clicking the verification link again.');
        console.log('   URL: ' + (process.env.NEXT_PUBLIC_APP_URL || 'https://app.uniqbrio.com') + '/verify-email?token=' + tokenFromUrl);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

validateToken();
