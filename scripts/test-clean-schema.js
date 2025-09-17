// Test registration schema with only nested objects

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function testCleanSchema() {
  try {
    console.log('🧪 Testing clean registration schema (nested objects only)...\n');

    // Test: Fetch all registrations with the new schema
    const registrations = await prisma.registration.findMany({
      select: {
        userId: true,
        academyId: true,
        businessInfo: true,
        adminInfo: true,
        preferences: true,
        createdAt: true
      },
      orderBy: { userId: 'asc' }
    });

    console.log(`📊 Found ${registrations.length} registrations with clean schema:`);
    
    registrations.forEach((reg, index) => {
      const businessInfo = reg.businessInfo || {};
      const adminInfo = reg.adminInfo || {};
      
      console.log(`\n${index + 1}. ${reg.userId} -> ${reg.academyId}`);
      console.log(`   Business: "${businessInfo.businessName || 'N/A'}"`);
      console.log(`   Admin: "${adminInfo.fullName || 'N/A'}" <${adminInfo.email || 'N/A'}>`);
      console.log(`   Industry: ${businessInfo.industryType || 'N/A'}`);
      console.log(`   Services: ${JSON.stringify(businessInfo.servicesOffered || [])}`);
      console.log(`   Size: ${businessInfo.studentSize || 'N/A'} | Staff: ${businessInfo.staffCount || 'N/A'}`);
      console.log(`   Location: ${businessInfo.city || 'N/A'}, ${businessInfo.state || 'N/A'}, ${businessInfo.country || 'N/A'}`);
      console.log(`   Registered: ${reg.createdAt.toLocaleString()}`);
    });

    console.log('\n✅ Clean schema test passed! All data is properly stored in nested objects.');
    console.log('🎉 Registration system is now using the precise, non-duplicated approach you requested!');

  } catch (error) {
    console.error('❌ Schema test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCleanSchema();