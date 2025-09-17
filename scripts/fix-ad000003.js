// Fix specific user AD000003 missing kycSubmissionDate

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function fixAD000003() {
  try {
    console.log('🔧 Fixing missing kycSubmissionDate for AD000003 (uniqbrio@gmail.com)...\n');

    // Find the KYC submission for AD000003
    const kycSubmission = await prisma.kycSubmission.findFirst({
      where: { 
        userId: 'AD000003'
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' } // Get the first submission
    });

    if (!kycSubmission) {
      console.log('❌ No KYC submission found for AD000003');
      return;
    }

    console.log('📅 Found KYC submission:');
    console.log(`   Submission ID: ${kycSubmission.id}`);
    console.log(`   User ID: ${kycSubmission.userId}`);
    console.log(`   Created At: ${kycSubmission.createdAt}`);

    // Update the user's kycSubmissionDate
    const updatedUser = await prisma.user.update({
      where: { userId: 'AD000003' },
      data: {
        kycSubmissionDate: kycSubmission.createdAt,
        kycStatus: 'pending' // Reset status to pending since they just submitted
      },
      select: {
        userId: true,
        email: true,
        kycStatus: true,
        kycSubmissionDate: true
      }
    });

    console.log('\n✅ Updated user:');
    console.log(`   User: ${updatedUser.email} (${updatedUser.userId})`);
    console.log(`   KYC Status: ${updatedUser.kycStatus}`);
    console.log(`   KYC Submission Date: ${updatedUser.kycSubmissionDate}`);

    console.log('\n🎉 Fix completed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAD000003();