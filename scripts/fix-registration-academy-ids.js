// Script to update Registration records to match the fixed Academy IDs

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRegistrationAcademyIds() {
  try {
    console.log('🔧 Fixing Registration records to match updated Academy IDs...');

    // Find registration record for uniqbrio@gmail.com
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { userId: 'AD000003' },
          { academyId: 'AC000001' }
        ]
      }
    });

    console.log(`📊 Found ${registrations.length} registration records to check`);

    for (const reg of registrations) {
      console.log(`🔍 Checking registration: userId=${reg.userId}, academyId=${reg.academyId}`);
      
      // If this is the user AD000003 but has wrong academyId
      if (reg.userId === 'AD000003' && reg.academyId === 'AC000001') {
        console.log('🔄 Updating Registration academyId from AC000001 to AC000003');
        
        await prisma.registration.update({
          where: { id: reg.id },
          data: { academyId: 'AC000003' }
        });
        
        console.log('✅ Registration record updated');
      }
    }

    console.log('🎉 Registration records fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRegistrationAcademyIds();