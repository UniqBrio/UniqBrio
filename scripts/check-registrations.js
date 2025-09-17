const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRegistrations() {
  try {
    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        userId: true,
        academyId: true,
        businessInfo: true
      }
    });

    console.log('All registrations:');
    registrations.forEach(reg => {
      console.log(`  ID: ${reg.id}`);
      console.log(`  UserId: ${reg.userId}`);
      console.log(`  AcademyId: ${reg.academyId}`);
      console.log(`  BusinessName: ${reg.businessInfo?.businessName || 'N/A'}`);
      console.log('  ---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrations();