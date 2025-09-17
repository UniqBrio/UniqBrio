// Check registration data structure differences

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function checkRegistrationStructure() {
  try {
    console.log('🔍 Checking registration data structure differences...\n');

    // Get all registrations
    const registrations = await prisma.registration.findMany({
      orderBy: { userId: 'asc' }
    });

    console.log(`📊 Found ${registrations.length} registrations:`);
    
    registrations.forEach((reg, index) => {
      console.log(`\n${index + 1}. User: ${reg.userId} | Academy: ${reg.academyId}`);
      console.log(`   Academy Name: ${reg.academyName || 'NULL'}`);
      console.log(`   Legal Entity: ${reg.legalEntityName || 'NULL'}`);
      console.log(`   Industry: ${reg.industryType || 'NULL'}`);
      console.log(`   Services: ${JSON.stringify(reg.servicesOffered) || 'NULL'}`);
      console.log(`   Student Size: ${reg.studentSize || 'NULL'}`);
      console.log(`   Staff Count: ${reg.staffCount || 'NULL'}`);
      console.log(`   Country: ${reg.country || 'NULL'}`);
      console.log(`   State: ${reg.state || 'NULL'}`);
      console.log(`   City: ${reg.city || 'NULL'}`);
      console.log(`   Address: ${reg.address || 'NULL'}`);
      console.log(`   Website: ${reg.website || 'NULL'}`);
      console.log(`   Language: ${reg.preferredLanguage || 'NULL'}`);
      
      // Check nested objects
      console.log(`   Business Info Keys: ${reg.businessInfo ? Object.keys(reg.businessInfo).join(', ') : 'NULL'}`);
      console.log(`   Admin Info Keys: ${reg.adminInfo ? Object.keys(reg.adminInfo).join(', ') : 'NULL'}`);
      console.log(`   Preferences Keys: ${reg.preferences ? Object.keys(reg.preferences).join(', ') : 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRegistrationStructure();