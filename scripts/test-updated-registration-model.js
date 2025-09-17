// Test script to verify updated Registration model

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdatedRegistrationModel() {
  try {
    console.log('🧪 Testing updated Registration model...\n');

    // Try to create a test registration to see what fields are available
    const testData = {
      academyId: 'AC000999',
      userId: 'AD000999',
      academyName: 'Test Academy Name',
      businessInfo: { test: 'data' },
      adminInfo: { test: 'data' }
    };

    console.log('📝 Attempting to create test registration with new fields...');
    
    // This will show us the actual field names expected by Prisma
    const registration = await prisma.registration.create({
      data: testData
    });
    
    console.log('✅ Success! New Registration model fields are working');
    console.log(`Registration ID: ${registration.id}`);
    
    // Clean up
    await prisma.registration.delete({
      where: { id: registration.id }
    });
    
    console.log('🗑️  Test record cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('academyName')) {
      console.log('💡 The academyName field is not recognized by Prisma client');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUpdatedRegistrationModel();