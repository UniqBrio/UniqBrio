// Quick check of KYC status for all users

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function checkKycStatus() {
  try {
    console.log('🔍 Checking KYC status for all users...\n');

    // Get all users and their KYC info
    const allUsers = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        kycStatus: true,
        kycSubmissionDate: true,
        registrationComplete: true
      },
      orderBy: { userId: 'asc' }
    });

    console.log(`📊 Found ${allUsers.length} total users:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.userId})`);
      console.log(`   Registration: ${user.registrationComplete ? 'Complete' : 'Incomplete'}`);
      console.log(`   KYC Status: ${user.kycStatus}`);
      console.log(`   KYC Submission Date: ${user.kycSubmissionDate || 'NULL'}`);
      console.log('');
    });

    // Also check KYC submissions
    console.log('🔍 Checking KYC submissions...\n');
    const kycSubmissions = await prisma.kycSubmission.findMany({
      select: {
        id: true,
        userId: true,
        academyId: true,
        createdAt: true,
        location: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${kycSubmissions.length} KYC submissions:`);
    kycSubmissions.forEach((submission, index) => {
      console.log(`${index + 1}. Submission ID: ${submission.id}`);
      console.log(`   User ID: ${submission.userId}`);
      console.log(`   Academy ID: ${submission.academyId}`);
      console.log(`   Location: ${submission.location}`);
      console.log(`   Created At: ${submission.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkKycStatus();