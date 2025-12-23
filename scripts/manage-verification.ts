/**
 * Script to manually verify a user or resend verification email
 * Usage: npx tsx scripts/manage-verification.ts <email> <action>
 * Actions: verify, resend, check
 */

import dotenv from 'dotenv';
dotenv.config();

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import UserModel from '@/models/User';
import { generateToken } from '@/lib/auth';
import { generateVerificationEmail, sendEmail } from '@/lib/email';

const email = process.argv[2];
const action = process.argv[3] || 'check';

if (!email || !email.includes('@')) {
  console.error('❌ Please provide a valid email address');
  console.log('Usage: npx tsx scripts/manage-verification.ts <email> <action>');
  console.log('Actions: verify, resend, check');
  process.exit(1);
}

async function manageVerification() {
  console.log('🔧 VERIFICATION MANAGEMENT');
  console.log(`📧 Email: ${email}`);
  console.log(`⚙️  Action: ${action}\n`);

  try {
    await dbConnect('uniqbrio');
    
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('✅ USER FOUND');
    console.log('='.repeat(60));
    console.log(`   Name:                 ${user.name}`);
    console.log(`   Email:                ${user.email}`);
    console.log(`   Verified:             ${user.verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Has Token:            ${user.verificationToken ? '✅ Yes' : '❌ No'}`);
    console.log(`   Token Expiry:         ${user.verificationTokenExpiry ? new Date(user.verificationTokenExpiry).toLocaleString() : 'N/A'}`);
    console.log('='.repeat(60));
    console.log();

    switch (action.toLowerCase()) {
      case 'verify':
        if (user.verified) {
          console.log('✅ User is already verified!');
        } else {
          await UserModel.updateOne(
            { _id: user._id },
            {
              $set: { verified: true },
              $unset: { verificationToken: "", verificationTokenExpiry: "" }
            }
          );
          console.log('✅ User manually verified successfully!');
          console.log('   The user can now log in at: ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/login');
        }
        break;

      case 'resend':
        if (user.verified) {
          console.log('✅ User is already verified! No need to resend verification email.');
        } else {
          const newToken = generateToken();
          const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          
          await UserModel.updateOne(
            { _id: user._id },
            {
              $set: { 
                verificationToken: newToken,
                verificationTokenExpiry: newExpiry
              }
            }
          );

          const emailData = generateVerificationEmail(user.email, newToken, user.name);
          await sendEmail(emailData);
          
          console.log('✅ New verification email sent successfully!');
          console.log('   Token expires at:', newExpiry.toLocaleString());
          console.log('   Verification link: ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/verify-email?token=' + newToken);
        }
        break;

      case 'check':
      default:
        if (user.verified) {
          console.log('✅ User is verified and can log in');
        } else if (!user.verificationToken) {
          console.log('⚠️  User is NOT verified and has NO token');
          console.log('   Run: npx tsx scripts/manage-verification.ts ' + email + ' resend');
        } else if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
          console.log('⚠️  User is NOT verified and token has EXPIRED');
          console.log('   Run: npx tsx scripts/manage-verification.ts ' + email + ' resend');
        } else {
          console.log('📧 User needs to verify email');
          console.log('   Verification link: ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/verify-email?token=' + user.verificationToken);
          console.log('   Or manually verify: npx tsx scripts/manage-verification.ts ' + email + ' verify');
        }
        break;
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

manageVerification();
