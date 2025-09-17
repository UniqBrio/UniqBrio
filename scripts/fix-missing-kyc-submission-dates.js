// Fix missing kycSubmissionDate for existing KYC submissions

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function fixMissingKycSubmissionDates() {
  try {
    console.log('🔧 Fixing missing kycSubmissionDate for users who submitted KYC...\n');

    // Find users who have KYC submissions but no kycSubmissionDate
    const usersWithoutDate = await prisma.user.findMany({
      where: {
        AND: [
          { 
            kycStatus: { 
              in: ['pending', 'approved', 'rejected'] 
            }
          }, // Has some KYC status
          { 
            kycSubmissionDate: null 
          }   // But no submission date
        ]
      },
      select: {
        id: true,
        userId: true,
        email: true,
        kycStatus: true,
        kycSubmissionDate: true
      }
    });

    console.log(`📊 Found ${usersWithoutDate.length} users with missing kycSubmissionDate:`);
    
    for (const user of usersWithoutDate) {
      console.log(`  - ${user.email} (${user.userId}): status=${user.kycStatus}, date=${user.kycSubmissionDate}`);
    }

    if (usersWithoutDate.length === 0) {
      console.log('✅ No users found with missing kycSubmissionDate');
      return;
    }

    console.log('\n🔍 Looking for corresponding KYC submissions...');

    // For each user without date, find their KYC submission and use its createdAt date
    for (const user of usersWithoutDate) {
      const kycSubmission = await prisma.kycSubmission.findFirst({
        where: { 
          OR: [
            { userId: user.userId },
            // Fallback: find by user email if userId match fails
            { user: { email: user.email } }
          ]
        },
        select: {
          id: true,
          userId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' } // Get the first submission
      });

      if (kycSubmission) {
        console.log(`📅 Found KYC submission for ${user.email}:`);
        console.log(`   Submission ID: ${kycSubmission.id}`);
        console.log(`   Created At: ${kycSubmission.createdAt}`);
        
        // Update the user's kycSubmissionDate
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            kycSubmissionDate: kycSubmission.createdAt
          }
        });

        console.log(`✅ Updated ${user.email} kycSubmissionDate to ${updatedUser.kycSubmissionDate}`);
      } else {
        console.log(`⚠️  No KYC submission found for ${user.email} - might be a data inconsistency`);
      }
    }

    // Verify the fix
    console.log('\n📊 Verification - Users after fix:');
    const allUsers = await prisma.user.findMany({
      where: { 
        kycStatus: { 
          in: ['pending', 'approved', 'rejected'] 
        }
      },
      select: {
        userId: true,
        email: true,
        kycStatus: true,
        kycSubmissionDate: true
      },
      orderBy: { kycSubmissionDate: 'desc' }
    });

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.userId})`);
      console.log(`   Status: ${user.kycStatus}`);
      console.log(`   Submission Date: ${user.kycSubmissionDate || 'NULL'}`);
      console.log('');
    });

    console.log('🎉 kycSubmissionDate fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingKycSubmissionDates();