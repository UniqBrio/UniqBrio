// Check User ID to Academy ID mapping

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIdMapping() {
  try {
    console.log('📊 Current User ID to Academy ID Mapping:\n');

    const users = await prisma.user.findMany({
      select: {
        userId: true,
        academyId: true,
        email: true,
        name: true
      },
      orderBy: { userId: 'asc' }
    });

    console.log('Users:');
    users.forEach(user => {
      const userNum = user.userId?.match(/AD(\d+)$/)?.[1] || 'NULL';
      const academyNum = user.academyId?.match(/AC(\d+)$/)?.[1] || 'NULL';
      const isMatched = userNum === academyNum ? '✅' : '❌';
      
      console.log(`  ${isMatched} ${user.userId || 'NULL'} -> ${user.academyId || 'NULL'} (${user.email})`);
      console.log(`      User#: ${userNum}, Academy#: ${academyNum}`);
    });

    console.log('\nAcademies:');
    const academies = await prisma.academy.findMany({
      select: {
        academyId: true,
        name: true,
        email: true
      },
      orderBy: { academyId: 'asc' }
    });

    academies.forEach(academy => {
      console.log(`  ${academy.academyId}: ${academy.name} (${academy.email})`);
    });

    console.log('\n🔍 Analysis:');
    const mismatchedUsers = users.filter(user => {
      if (!user.userId || !user.academyId) return true;
      const userNum = user.userId.match(/AD(\d+)$/)?.[1];
      const academyNum = user.academyId.match(/AC(\d+)$/)?.[1];
      return userNum !== academyNum;
    });

    if (mismatchedUsers.length > 0) {
      console.log('❌ Found mismatched User ID to Academy ID mappings:');
      mismatchedUsers.forEach(user => {
        console.log(`  - ${user.email}: ${user.userId} should map to AC${user.userId?.match(/AD(\d+)$/)?.[1]?.padStart(6, '0')} but has ${user.academyId}`);
      });
    } else {
      console.log('✅ All User IDs properly match their Academy IDs');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIdMapping();