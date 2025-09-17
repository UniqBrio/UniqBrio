// Clean up duplicate registrations before testing new logic

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function cleanupDuplicates() {
  try {
    console.log('🧹 Cleaning up duplicate registrations...\n');

    // First check what duplicates exist
    const registrations = await prisma.registration.findMany({
      select: { 
        id: true,
        userId: true, 
        academyId: true, 
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 Current registrations:');
    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.id} | ${reg.userId} -> ${reg.academyId} | ${reg.createdAt}`);
    });

    // Find duplicates by userId
    const userIds = registrations.map(r => r.userId);
    const duplicateUserIds = userIds.filter((id, index) => userIds.indexOf(id) !== index);
    
    if (duplicateUserIds.length > 0) {
      console.log(`\n🔍 Found duplicate registrations for: ${duplicateUserIds.join(', ')}`);
      
      // Keep only the latest registration for each userId
      for (const userId of [...new Set(duplicateUserIds)]) {
        const userRegistrations = registrations.filter(r => r.userId === userId);
        if (userRegistrations.length > 1) {
          // Sort by creation date, keep the latest
          userRegistrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const toKeep = userRegistrations[0];
          const toDelete = userRegistrations.slice(1);
          
          console.log(`📌 Keeping: ${toKeep.id} (${toKeep.createdAt})`);
          for (const reg of toDelete) {
            console.log(`🗑️ Deleting: ${reg.id} (${reg.createdAt})`);
            await prisma.registration.delete({ where: { id: reg.id } });
          }
        }
      }
    } else {
      console.log('\n✅ No duplicate registrations found');
    }

    // Also fix the uniqbrio@gmail.com user data
    console.log('\n🔧 Fixing uniqbrio@gmail.com user data...');
    
    // Update user to use correct Academy ID (should be AC000003, not AC000004)
    const userUpdate = await prisma.user.update({
      where: { email: 'uniqbrio@gmail.com' },
      data: { 
        academyId: 'AC000003',
        // Reset registration complete to false so they can re-register properly
        registrationComplete: false
      }
    });

    console.log(`✅ Updated user: ${userUpdate.email} -> ${userUpdate.academyId}`);

    // Delete the incorrect AC000004 academy if it exists
    const academyToDelete = await prisma.academy.findFirst({
      where: { academyId: 'AC000004' }
    });
    
    if (academyToDelete) {
      await prisma.academy.delete({ where: { id: academyToDelete.id } });
      console.log('🗑️ Deleted incorrect Academy AC000004');
    }

    console.log('\n🎉 Cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicates();