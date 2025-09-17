// Check current registrations collection data and recent user registrations

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function checkRegistrationsData() {
  try {
    console.log('📊 Checking Registrations Collection Data...\n');

    // Check registrations collection
    const registrations = await prisma.registration.findMany({
      select: { 
        id: true,
        userId: true, 
        academyId: true, 
        businessInfo: true,
        adminInfo: true,
        preferences: true,
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📋 Found ${registrations.length} registration records:`);
    registrations.forEach((reg, index) => {
      console.log(`\n${index + 1}. Registration ID: ${reg.id}`);
      console.log(`   User ID: ${reg.userId || 'NULL'}`);
      console.log(`   Academy ID: ${reg.academyId || 'NULL'}`);
      console.log(`   Business Info: ${reg.businessInfo ? 'Present' : 'NULL'}`);
      console.log(`   Admin Info: ${reg.adminInfo ? 'Present' : 'NULL'}`);
      console.log(`   Created: ${reg.createdAt}`);
    });

    // Check recent users
    console.log('\n👥 Recent Users:');
    const users = await prisma.user.findMany({
      select: { 
        userId: true,
        academyId: true,
        name: true,
        email: true,
        registrationComplete: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   User ID: ${user.userId || 'NULL'}`);
      console.log(`   Academy ID: ${user.academyId || 'NULL'}`);
      console.log(`   Name: ${user.name || 'NULL'}`);
      console.log(`   Registration Complete: ${user.registrationComplete}`);
      console.log(`   Updated: ${user.updatedAt}`);
    });

    // Check academies
    console.log('\n🏫 Recent Academies:');
    const academies = await prisma.academy.findMany({
      select: { 
        academyId: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    academies.forEach((academy, index) => {
      console.log(`\n${index + 1}. ${academy.academyId || 'NULL'}`);
      console.log(`   Name: ${academy.name || 'NULL'}`);
      console.log(`   Email: ${academy.email || 'NULL'}`);
      console.log(`   Created: ${academy.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRegistrationsData();