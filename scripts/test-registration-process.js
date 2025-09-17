// Test script to check registration API behavior and database operations

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function testRegistrationProcess() {
  try {
    console.log('🧪 Testing Registration Process...\n');

    // 1. Check current database state
    console.log('📊 Current Database State:');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        registrationComplete: true
      }
    });
    
    console.log('Users:');
    users.forEach(user => {
      console.log(`  ${user.email}: userId=${user.userId}, regComplete=${user.registrationComplete}`);
    });

    const academies = await prisma.academy.findMany({
      select: {
        id: true,
        academyId: true,
        name: true,
        email: true
      }
    });
    
    console.log('\nAcademies:');
    academies.forEach(academy => {
      console.log(`  ${academy.academyId}: ${academy.name} (${academy.email})`);
    });

    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        userId: true,
        academyId: true,
        businessInfo: true
      }
    });
    
    console.log('\nRegistrations:');
    if (registrations.length === 0) {
      console.log('  ❌ No registration records found!');
    } else {
      registrations.forEach(reg => {
        console.log(`  ${reg.userId} -> ${reg.academyId}: ${reg.businessInfo?.businessName || 'N/A'}`);
      });
    }

    // 2. Test ID generation logic
    console.log('\n🔢 Testing ID Generation:');
    
    const lastAcademy = await prisma.academy.findFirst({
      orderBy: { academyId: 'desc' },
      select: { academyId: true }
    });
    
    const lastUser = await prisma.user.findFirst({
      orderBy: { userId: 'desc' },
      select: { userId: true }
    });
    
    console.log(`  Last Academy ID: ${lastAcademy?.academyId || 'None'}`);
    console.log(`  Last User ID: ${lastUser?.userId || 'None'}`);

    // 3. Test if we can create a registration record manually
    console.log('\n🔧 Testing Manual Registration Creation:');
    
    const testRegistration = {
      userId: 'TEST001',
      academyId: 'TEST001',
      businessInfo: { businessName: 'Test Academy' },
      adminInfo: { firstName: 'Test', lastName: 'User' },
      preferences: {}
    };

    try {
      const newReg = await prisma.registration.create({
        data: testRegistration
      });
      console.log('  ✅ Manual registration creation successful:', newReg.id);
      
      // Clean up test data
      await prisma.registration.delete({
        where: { id: newReg.id }
      });
      console.log('  🧹 Test registration cleaned up');
      
    } catch (regError) {
      console.log('  ❌ Manual registration failed:', regError.message);
    }

    console.log('\n🎯 Analysis Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRegistrationProcess();