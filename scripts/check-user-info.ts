/**
 * Script to check user information and tenant ID
 */

import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import UserModel from '@/models/User';
import RegistrationModel from '@/models/Registration';
import KycSubmissionModel from '@/models/KycSubmission';

const USER_EMAIL = 'frozen9612345@gmail.com';

async function checkUserInfo() {
  console.log('🔍 CHECKING USER INFORMATION');
  console.log(`📧 Email: ${USER_EMAIL}\n`);

  try {
    // Connect to dashboard database (where users actually are)
    await dbConnect('uniqbrio');
    
    const user = await UserModel.findOne({ email: USER_EMAIL }).lean();
    
    if (!user) {
      console.log('❌ User not found with email:', USER_EMAIL);
      return;
    }

    console.log('✅ USER FOUND');
    console.log('='.repeat(60));
    console.log('Basic Information:');
    console.log(`   Name:                 ${user.name}`);
    console.log(`   Email:                ${user.email}`);
    console.log(`   Phone:                ${user.phone || 'N/A'}`);
    console.log('\nIDs:');
    console.log(`   User ID:              ${user.userId || 'N/A'}`);
    console.log(`   Academy ID:           ${user.academyId || 'N/A'}`);
    console.log(`   Tenant ID:            ${user.academyId || 'N/A'} (same as Academy ID)`);
    console.log('\nAccount Status:');
    console.log(`   Role:                 ${user.role || 'N/A'}`);
    console.log(`   Verified:             ${user.verified ? 'Yes' : 'No'}`);
    console.log(`   Registration Complete: ${user.registrationComplete ? 'Yes' : 'No'}`);
    console.log(`   KYC Status:           ${user.kycStatus || 'N/A'}`);
    console.log(`   Plan:                 ${user.planChoosed || 'N/A'}`);
    console.log('\nTimestamps:');
    console.log(`   Created At:           ${user.createdAt}`);
    console.log(`   Last Login:           ${user.lastLoginAt || 'Never'}`);

    // Check for registration data
    if (user.academyId) {
      console.log('\n' + '='.repeat(60));
      console.log('REGISTRATION DATA');
      const registration = await RegistrationModel.findOne({ academyId: user.academyId }).lean();
      if (registration) {
        console.log('✅ Registration found');
        console.log(`   Business Name:        ${registration.businessInfo?.businessName || 'N/A'}`);
        console.log(`   Business Type:        ${registration.businessInfo?.businessType || 'N/A'}`);
        console.log(`   Admin Name:           ${registration.adminInfo?.name || 'N/A'}`);
        console.log(`   Admin Email:          ${registration.adminInfo?.email || 'N/A'}`);
      } else {
        console.log('❌ No registration data found');
      }

      // Check for KYC data
      console.log('\n' + '='.repeat(60));
      console.log('KYC DATA');
      const kyc = await KycSubmissionModel.findOne({ academyId: user.academyId }).lean();
      if (kyc) {
        console.log('✅ KYC submission found');
        console.log(`   Status:               ${(kyc as any).status || 'N/A'}`);
        console.log(`   Submitted At:         ${kyc.createdAt}`);
      } else {
        console.log('❌ No KYC submission found');
      }
    }

    // Now check dashboard database for record counts
    console.log('\n' + '='.repeat(60));
    console.log('DASHBOARD DATA SUMMARY');
    
    if (user.academyId) {
      await mongoose.disconnect();
      await dbConnect('uniqbrio');

      const tenantId = user.academyId;

      // Import models dynamically
      const models = [
        { name: 'Courses', collection: 'courses' },
        { name: 'Cohorts', collection: 'cohorts' },
        { name: 'Students', collection: 'students' },
        { name: 'Instructors', collection: 'instructors' },
        { name: 'Enrollments', collection: 'enrollments' },
        { name: 'Schedules', collection: 'schedules' },
        { name: 'Payments', collection: 'payments' },
        { name: 'Payment Transactions', collection: 'paymenttransactions' },
      ];

      console.log('\nRecord counts by tenantId:');
      const db = mongoose.connection.db;
      
      for (const { name, collection } of models) {
        try {
          const count = db ? await db.collection(collection).countDocuments({ tenantId }) : 0;
          if (count > 0) {
            console.log(`   ${name.padEnd(25)}: ${count} records`);
          }
        } catch (error) {
          // Collection might not exist
        }
      }
    } else {
      console.log('⚠️  No tenantId found - cannot check dashboard records');
    }

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  WARNING: Deleting this user will remove ALL data associated with:');
    console.log(`   - Tenant ID: ${user.academyId || 'N/A'}`);
    console.log(`   - Academy ID: ${user.academyId || 'N/A'}`);
    console.log(`   - User ID: ${user.userId || 'N/A'}`);
    console.log('   - All related courses, students, instructors, payments, etc.');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

checkUserInfo()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
