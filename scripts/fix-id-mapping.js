// Fix the User ID to Academy ID mapping inconsistency

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function fixIdMapping() {
  try {
    console.log('🔧 Fixing User ID to Academy ID mapping inconsistency...\n');

    // The problem: AD000003 (uniqbrio@gmail.com) should have AC000003, not AC000004
    // But AC000003 is currently assigned to "Harmony" (shaziafarheen75@gmail.com)
    // And shaziafarheen75@gmail.com should have AD000001 -> AC000001

    console.log('📊 Current problematic state:');
    console.log('  shaziafarheen75@gmail.com: AD000001 -> AC000001 ✅ (but also has AC000003 ❌)');
    console.log('  shaziafarheen74@gmail.com: AD000002 -> AC000002 ✅');
    console.log('  uniqbrio@gmail.com: AD000003 -> AC000004 ❌ (should be AC000003)');

    // Step 1: Fix the duplicate academy issue
    // shaziafarheen75@gmail.com appears to have both AC000001 and AC000003
    // Let's check which academies exist
    
    const academies = await prisma.academy.findMany({
      select: { id: true, academyId: true, name: true, email: true },
      orderBy: { academyId: 'asc' }
    });

    console.log('\n🏫 Current Academies:');
    academies.forEach(academy => {
      console.log(`  ${academy.academyId}: ${academy.name} (${academy.email})`);
    });

    // Find the academy that should be AC000003 but is currently AC000004
    const wrongAcademy = academies.find(a => a.academyId === 'AC000004');
    
    if (wrongAcademy) {
      console.log(`\n🔄 Updating Academy ${wrongAcademy.academyId} to AC000003...`);
      
      // First, delete the incorrect AC000003 (duplicate for shaziafarheen75@gmail.com)
      const duplicateAcademy = academies.find(a => a.academyId === 'AC000003');
      if (duplicateAcademy) {
        console.log(`🗑️ Removing duplicate Academy AC000003 (${duplicateAcademy.name})`);
        await prisma.academy.delete({
          where: { id: duplicateAcademy.id }
        });
      }
      
      // Update AC000004 to AC000003
      await prisma.academy.update({
        where: { id: wrongAcademy.id },
        data: { academyId: 'AC000003' }
      });
      
      console.log(`✅ Academy updated: AC000004 -> AC000003`);
      
      // Update the user's academyId reference
      await prisma.user.update({
        where: { email: 'uniqbrio@gmail.com' },
        data: { academyId: 'AC000003' }
      });
      
      console.log(`✅ User updated: uniqbrio@gmail.com now references AC000003`);
      
      // Update the registration record
      await prisma.registration.updateMany({
        where: { userId: 'AD000003' },
        data: { academyId: 'AC000003' }
      });
      
      console.log(`✅ Registration record updated`);
    }

    // Verify the fix
    console.log('\n📊 Verification - Updated mapping:');
    
    const updatedUsers = await prisma.user.findMany({
      select: { userId: true, academyId: true, email: true },
      orderBy: { userId: 'asc' }
    });

    updatedUsers.forEach(user => {
      const userNum = user.userId?.match(/AD(\d+)$/)?.[1] || 'NULL';
      const academyNum = user.academyId?.match(/AC(\d+)$/)?.[1] || 'NULL';
      const isMatched = userNum === academyNum ? '✅' : '❌';
      
      console.log(`  ${isMatched} ${user.userId || 'NULL'} -> ${user.academyId || 'NULL'} (${user.email})`);
    });

    console.log('\n🎉 ID mapping fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixIdMapping();