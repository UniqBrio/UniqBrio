// Script to fix the existing incomplete user registration

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function fixIncompleteUserRegistration() {
  try {
    console.log('🔧 Fixing incomplete user registration...\n');

    // Find the user with missing userId
    const incompleteUser = await prisma.user.findUnique({
      where: { email: 'uniqbrio@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        userId: true,
        academyId: true,
        registrationComplete: true
      }
    });

    if (!incompleteUser) {
      console.log('❌ User uniqbrio@gmail.com not found');
      return;
    }

    console.log('📊 Current user state:', incompleteUser);

    if (incompleteUser.userId && incompleteUser.registrationComplete) {
      console.log('✅ User registration is already complete');
      return;
    }

    // Get the next available User ID
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

    console.log(`🆔 Assigning User ID: ${newUserId}`);

    // Get the next available Academy ID
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

    console.log(`🏫 Creating Academy ID: ${newAcademyId}`);

    // Create the Academy record (since it doesn't exist)
    const newAcademy = await prisma.academy.create({
      data: {
        academyId: newAcademyId,
        name: 'Dance Academy', // From the logs we saw earlier
        email: 'uniqbrio@gmail.com',
        city: 'Bangalore',
        country: 'India',
        industryType: 'Dance & Arts',
        studentSize: '50-100',
        staffCount: '5-10',
        preferredLanguage: 'en'
      }
    });

    console.log('✅ Academy created:', newAcademy.academyId);

    // Update the user record
    const updatedUser = await prisma.user.update({
      where: { id: incompleteUser.id },
      data: {
        userId: newUserId,
        academyId: newAcademyId,
        registrationComplete: true,
        verified: true
      }
    });

    console.log('✅ User updated:', {
      email: updatedUser.email,
      userId: updatedUser.userId,
      academyId: updatedUser.academyId,
      registrationComplete: updatedUser.registrationComplete
    });

    // Create the Registration record that was missing
    const registrationRecord = await prisma.registration.create({
      data: {
        userId: newUserId,
        academyId: newAcademyId,
        businessInfo: {
          businessName: 'Dance Academy',
          email: 'uniqbrio@gmail.com',
          city: 'Bangalore',
          country: 'India',
          industryType: 'Dance & Arts',
          studentSize: '50-100',
          staffCount: '5-10',
          website: 'https://dancestudio.com',
          preferredLanguage: 'en'
        },
        adminInfo: {
          firstName: 'Savitha',
          lastName: 'Admin',
          phone: '9000000990'
        },
        preferences: {}
      }
    });

    console.log('✅ Registration record created:', registrationRecord.id);
    console.log('\n🎉 User registration fix completed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixIncompleteUserRegistration();