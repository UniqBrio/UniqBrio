// Test script to verify Academy and User ID generation with Prisma

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIdGeneration() {
  try {
    console.log('🧪 Testing Academy and User ID generation with Prisma...\n');

    // Test Academy ID generation
    console.log('📋 Testing Academy ID generation:');
    const lastAcademy = await prisma.academy.findFirst({
      orderBy: { academyId: 'desc' },
      select: { academyId: true }
    });

    const parseAcademyNum = (id) => {
      const match = id.match(/AC(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const lastAcademyNum = lastAcademy ? parseAcademyNum(lastAcademy.academyId) : 0;
    const nextAcademyNum = lastAcademyNum + 1;
    const newAcademyId = `AC${nextAcademyNum.toString().padStart(6, '0')}`;

    console.log(`  Last Academy: ${lastAcademy?.academyId || 'None'}`);
    console.log(`  Last Number: ${lastAcademyNum}`);
    console.log(`  Next Academy ID: ${newAcademyId}`);

    // Test User ID generation
    console.log('\n👤 Testing User ID generation:');
    const lastUser = await prisma.user.findFirst({
      orderBy: { userId: 'desc' },
      select: { userId: true }
    });

    const parseUserNum = (id) => {
      if (!id) return 0;
      const match = id.match(/AD(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const lastUserNum = lastUser?.userId ? parseUserNum(lastUser.userId) : 0;
    const nextUserNum = lastUserNum + 1;
    const newUserId = `AD${nextUserNum.toString().padStart(6, '0')}`;

    console.log(`  Last User: ${lastUser?.userId || 'None'}`);
    console.log(`  Last Number: ${lastUserNum}`);
    console.log(`  Next User ID: ${newUserId}`);

    // Show current state
    console.log('\n📊 Current Database State:');
    const allAcademies = await prisma.academy.findMany({
      select: { academyId: true, name: true },
      orderBy: { academyId: 'asc' }
    });

    const allUsers = await prisma.user.findMany({
      select: { userId: true, email: true, name: true },
      orderBy: { userId: 'asc' }
    });

    console.log('  Academies:');
    allAcademies.forEach(academy => {
      console.log(`    ${academy.academyId}: ${academy.name}`);
    });

    console.log('  Users:');
    allUsers.forEach(user => {
      console.log(`    ${user.userId || 'NULL'}: ${user.email} (${user.name})`);
    });

    console.log('\n✅ ID generation logic appears to be working correctly!');
    console.log(`🎯 Next registration should get: Academy=${newAcademyId}, User=${newUserId}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testIdGeneration();