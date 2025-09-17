// Check the current state of registrations collection and identify issues

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function checkRegistrations() {
  try {
    console.log('📊 Checking Registrations Collection...\n');

    // Get all registrations
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${registrations.length} registration records:`);
    
    registrations.forEach((reg, index) => {
      console.log(`\n🔗 Registration #${index + 1}:`);
      console.log(`  ID: ${reg.id}`);
      console.log(`  User ID: ${reg.userId || 'NULL ❌'}`);
      console.log(`  Academy ID: ${reg.academyId || 'NULL ❌'}`);
      console.log(`  Created: ${reg.createdAt}`);
      console.log(`  Updated: ${reg.updatedAt}`);
      
      // Check if business info exists
      if (reg.businessInfo) {
        const businessInfo = reg.businessInfo;
        console.log(`  Business Info: ✅`);
        console.log(`    - Business Name: ${businessInfo.businessName || 'NULL'}`);
        console.log(`    - Email: ${businessInfo.email || 'NULL'}`);
        console.log(`    - City: ${businessInfo.city || 'NULL'}`);
      } else {
        console.log(`  Business Info: ❌ NULL`);
      }
      
      // Check if admin info exists
      if (reg.adminInfo) {
        const adminInfo = reg.adminInfo;
        console.log(`  Admin Info: ✅`);
        console.log(`    - First Name: ${adminInfo.firstName || 'NULL'}`);
        console.log(`    - Last Name: ${adminInfo.lastName || 'NULL'}`);
        console.log(`    - Phone: ${adminInfo.phone || 'NULL'}`);
      } else {
        console.log(`  Admin Info: ❌ NULL`);
      }
    });

    // Check corresponding users
    console.log('\n👥 Checking corresponding Users...\n');
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5 // Last 5 users
    });

    users.forEach((user, index) => {
      console.log(`\n👤 User #${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  User ID: ${user.userId || 'NULL ❌'}`);
      console.log(`  Academy ID: ${user.academyId || 'NULL ❌'}`);
      console.log(`  Name: ${user.name || 'NULL ❌'}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phone || 'NULL'}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Registration Complete: ${user.registrationComplete ? '✅' : '❌'}`);
      console.log(`  Verified: ${user.verified ? '✅' : '❌'}`);
      console.log(`  Created: ${user.createdAt}`);
    });

    // Check corresponding academies
    console.log('\n🏫 Checking corresponding Academies...\n');
    
    const academies = await prisma.academy.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5 // Last 5 academies
    });

    academies.forEach((academy, index) => {
      console.log(`\n🏫 Academy #${index + 1}:`);
      console.log(`  ID: ${academy.id}`);
      console.log(`  Academy ID: ${academy.academyId || 'NULL ❌'}`);
      console.log(`  Name: ${academy.name || 'NULL ❌'}`);
      console.log(`  Email: ${academy.email || 'NULL'}`);
      console.log(`  City: ${academy.city || 'NULL'}`);
      console.log(`  Created: ${academy.createdAt}`);
    });

    // Summary of issues
    console.log('\n🔍 ISSUE ANALYSIS:\n');
    
    const issuesFound = [];
    
    // Check for missing userIds in registrations
    const missingUserIds = registrations.filter(r => !r.userId);
    if (missingUserIds.length > 0) {
      issuesFound.push(`❌ ${missingUserIds.length} registration(s) missing userId`);
    }
    
    // Check for missing academyIds in registrations
    const missingAcademyIds = registrations.filter(r => !r.academyId);
    if (missingAcademyIds.length > 0) {
      issuesFound.push(`❌ ${missingAcademyIds.length} registration(s) missing academyId`);
    }
    
    // Check for users with missing names
    const missingNames = users.filter(u => !u.name || u.name.trim() === '');
    if (missingNames.length > 0) {
      issuesFound.push(`❌ ${missingNames.length} user(s) missing name`);
    }
    
    // Check for users marked as registrationComplete but missing data
    const incompleteButMarked = users.filter(u => 
      u.registrationComplete && (!u.userId || !u.academyId || !u.name || u.name.trim() === '')
    );
    if (incompleteButMarked.length > 0) {
      issuesFound.push(`❌ ${incompleteButMarked.length} user(s) marked as registrationComplete but missing data`);
    }
    
    if (issuesFound.length > 0) {
      issuesFound.forEach(issue => console.log(issue));
    } else {
      console.log('✅ No major issues found');
    }

  } catch (error) {
    console.error('❌ Error checking registrations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrations();