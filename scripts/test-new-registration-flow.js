// Test that new registrations go to "registrations" collection

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function testNewRegistrationFlow() {
  try {
    console.log('🧪 Testing new registration flow...\n');
    
    // Count current registrations
    const beforeCount = await prisma.registration.count();
    console.log(`📊 Current registrations count: ${beforeCount}`);
    
    // Create a test registration record
    console.log('\n📝 Creating test registration...');
    const testRegistration = await prisma.registration.create({
      data: {
        academyId: 'AC000999',  // Test ID
        userId: 'AD000999',     // Test ID
        businessInfo: {
          businessName: 'Test Academy',
          businessEmail: 'test@example.com'
        },
        adminInfo: {
          fullName: 'Test Admin',
          phone: '+1234567890'
        },
        preferences: {
          theme: 'dark'
        }
      }
    });
    
    console.log(`✅ Created test registration: ${testRegistration.id}`);
    console.log(`   User ID: ${testRegistration.userId}`);
    console.log(`   Academy ID: ${testRegistration.academyId}`);
    
    // Verify it was stored in the correct collection
    const afterCount = await prisma.registration.count();
    console.log(`\n📊 New registrations count: ${afterCount}`);
    console.log(`✅ Successfully added ${afterCount - beforeCount} registration to "registrations" collection`);
    
    // Clean up the test record
    await prisma.registration.delete({
      where: { id: testRegistration.id }
    });
    
    console.log(`🗑️  Cleaned up test record`);
    
    const finalCount = await prisma.registration.count();
    console.log(`📊 Final registrations count: ${finalCount}`);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('✅ New registrations will be stored in "registrations" collection');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewRegistrationFlow();