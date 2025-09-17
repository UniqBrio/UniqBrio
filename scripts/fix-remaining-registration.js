// Fix the remaining registration record with wrong Academy ID

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function fixRemainingRegistration() {
  try {
    console.log('🔧 Fixing remaining registration record...\n');

    // The registration still has AC000004 but should have AC000003
    const wrongRegistration = await prisma.registration.findFirst({
      where: { academyId: 'AC000004' }
    });

    if (wrongRegistration) {
      console.log(`📋 Found wrong registration: ${wrongRegistration.id} with Academy ID ${wrongRegistration.academyId}`);
      
      // Delete this incorrect registration
      await prisma.registration.delete({
        where: { id: wrongRegistration.id }
      });
      
      console.log('🗑️ Deleted incorrect registration record');
    } else {
      console.log('✅ No incorrect registration found');
    }

    // Verify current state
    const registrations = await prisma.registration.findMany({
      select: { id: true, userId: true, academyId: true }
    });

    console.log(`\n📊 Current registrations: ${registrations.length} records`);
    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.userId} -> ${reg.academyId}`);
    });

    // Check user state
    const user = await prisma.user.findUnique({
      where: { email: 'uniqbrio@gmail.com' },
      select: { userId: true, academyId: true, registrationComplete: true, name: true }
    });

    console.log(`\n👤 User uniqbrio@gmail.com:`);
    console.log(`   User ID: ${user?.userId}`);
    console.log(`   Academy ID: ${user?.academyId}`);
    console.log(`   Name: ${user?.name || 'NULL'}`);
    console.log(`   Registration Complete: ${user?.registrationComplete}`);

    console.log('\n🎉 Fix completed! User is ready for fresh registration.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRemainingRegistration();