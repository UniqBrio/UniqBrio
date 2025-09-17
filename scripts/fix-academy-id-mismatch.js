// Script to fix Academy ID mismatch for existing registrations
// The issue: user uniqbrio@gmail.com has userId AD000003 but academyId AC000001 (should be AC000003)

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAcademyIdMismatch() {
  try {
    console.log('🔧 Starting fix for Academy ID mismatches...');

    // Find the problematic user
    const user = await prisma.user.findUnique({
      where: { email: 'uniqbrio@gmail.com' },
      select: {
        id: true,
        userId: true,
        academyId: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      console.log('❌ User uniqbrio@gmail.com not found');
      return;
    }

    console.log('📊 Current user data:', user);

    // Check if userId and academyId numbers match
    const userIdNum = user.userId?.match(/AD(\d+)$/)?.[1];
    const academyIdNum = user.academyId?.match(/AC(\d+)$/)?.[1];

    if (userIdNum !== academyIdNum) {
      console.log(`🚨 Mismatch detected: userId ${user.userId} vs academyId ${user.academyId}`);
      
      const correctAcademyId = `AC${userIdNum?.padStart(6, '0')}`;
      console.log(`✅ Correct Academy ID should be: ${correctAcademyId}`);

      // Check if the academy exists with the wrong ID
      const wrongAcademy = await prisma.academy.findFirst({
        where: { academyId: user.academyId }
      });

      if (wrongAcademy) {
        console.log('🔄 Updating Academy ID from', user.academyId, 'to', correctAcademyId);
        
        // Update the academy record
        await prisma.academy.update({
          where: { id: wrongAcademy.id },
          data: { academyId: correctAcademyId }
        });
        console.log('✅ Academy record updated');

        // Update the user's academyId reference
        await prisma.user.update({
          where: { id: user.id },
          data: { academyId: correctAcademyId }
        });
        console.log('✅ User academyId reference updated');

        // Update the registration record
        const registration = await prisma.registration.findFirst({
          where: { 
            userId: user.userId,
            academyId: user.academyId  // old academyId
          }
        });

        if (registration) {
          await prisma.registration.update({
            where: { id: registration.id },
            data: { academyId: correctAcademyId }
          });
          console.log('✅ Registration record updated');
        }

        console.log('🎉 Academy ID mismatch fixed successfully!');
      } else {
        console.log('⚠️ No academy found with the wrong ID. Creating new academy with correct ID...');
        // This would require more complex logic to migrate data
      }
    } else {
      console.log('✅ No mismatch detected. IDs are consistent.');
    }

    // Verify the fix
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'uniqbrio@gmail.com' },
      select: {
        userId: true,
        academyId: true,
        email: true
      }
    });

    console.log('📊 Updated user data:', updatedUser);

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAcademyIdMismatch();