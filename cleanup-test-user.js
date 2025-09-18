// Cleanup test user and related data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestUser() {
  try {
    console.log('=== CLEANING UP TEST DATA ===\n');

    const testEmail = 'test-kyc-blocked@example.com';
    const testUserId = 'TEST001';
    const testAcademyId = 'AC_TEST001';

    // Delete test user
    const deletedUser = await prisma.user.deleteMany({
      where: { email: testEmail }
    });

    // Delete test registration
    const deletedRegistration = await prisma.registration.deleteMany({
      where: { userId: testUserId }
    });

    // Delete any KYC submissions for test user
    const deletedKyc = await prisma.kycSubmission.deleteMany({
      where: { userId: testUserId }
    });

    console.log(`✅ Deleted ${deletedUser.count} test user(s)`);
    console.log(`✅ Deleted ${deletedRegistration.count} test registration(s)`);
    console.log(`✅ Deleted ${deletedKyc.count} test KYC submission(s)`);

    console.log('\n🧹 Test data cleanup complete!');

  } catch (error) {
    console.error('Error cleaning up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUser();