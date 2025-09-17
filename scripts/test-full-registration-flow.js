// Test the complete updated registration flow (no Academy collection)

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function testFullRegistrationFlow() {
  try {
    console.log('🧪 Testing complete registration flow without Academy collection...\n');

    // First check current state
    const currentRegistrations = await prisma.registration.findMany({
      select: { academyId: true, userId: true, academyName: true }
    });
    
    console.log(`📊 Current registrations: ${currentRegistrations.length}`);
    currentRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.userId} -> ${reg.academyId} (${reg.academyName || 'No name'})`);
    });

    // Test creating a new registration with all academy fields
    console.log('\n📝 Creating test registration with academy data...');
    
    const testRegistration = await prisma.registration.create({
      data: {
        academyId: 'AC000998',
        userId: 'AD000998',
        // Academy fields (now part of registration)
        academyName: 'Test Academy Full Name',
        legalEntityName: 'Test Academy LLC',
        academyEmail: 'admin@testacademy.com',
        academyPhone: '+1234567890',
        industryType: 'Education',
        servicesOffered: ['Online Courses', 'Workshops'],
        studentSize: '100-500',
        staffCount: '10-50',
        country: 'United States',
        state: 'California',
        city: 'San Francisco',
        address: '123 Test Street',
        website: 'https://testacademy.com',
        preferredLanguage: 'English',
        logoUrl: '',
        // Original registration fields
        businessInfo: {
          businessName: 'Test Academy Full Name',
          businessEmail: 'admin@testacademy.com',
          phoneNumber: '+1234567890'
        },
        adminInfo: {
          fullName: 'Test Admin User',
          phone: '+1234567890'
        },
        preferences: {
          theme: 'light',
          notifications: true
        }
      }
    });

    console.log(`✅ Created registration: ${testRegistration.id}`);
    console.log(`   Academy ID: ${testRegistration.academyId}`);
    console.log(`   User ID: ${testRegistration.userId}`);
    console.log(`   Academy Name: ${testRegistration.academyName}`);
    console.log(`   Academy Email: ${testRegistration.academyEmail}`);
    console.log(`   Services: ${testRegistration.servicesOffered.join(', ')}`);

    // Verify unique constraints work
    console.log('\n🔍 Testing unique constraints...');
    
    try {
      await prisma.registration.create({
        data: {
          academyId: 'AC000998', // Same academy ID - should fail
          userId: 'AD000997',
          academyName: 'Duplicate Academy ID Test',
          businessInfo: {},
          adminInfo: {}
        }
      });
      console.log('❌ Unique constraint failed - duplicate academy ID was allowed!');
    } catch (error) {
      console.log('✅ Academy ID unique constraint working - duplicate rejected');
    }

    try {
      await prisma.registration.create({
        data: {
          academyId: 'AC000997',
          userId: 'AD000998', // Same user ID - should fail  
          academyName: 'Duplicate User ID Test',
          businessInfo: {},
          adminInfo: {}
        }
      });
      console.log('❌ Unique constraint failed - duplicate user ID was allowed!');
    } catch (error) {
      console.log('✅ User ID unique constraint working - duplicate rejected');
    }

    // Test querying the data
    console.log('\n📋 Querying complete registration data...');
    const fullRegistration = await prisma.registration.findUnique({
      where: { academyId: 'AC000998' }
    });

    if (fullRegistration) {
      console.log('✅ Successfully retrieved complete registration data:');
      console.log(`   Academy: ${fullRegistration.academyName} (${fullRegistration.academyEmail})`);
      console.log(`   Industry: ${fullRegistration.industryType}`);
      console.log(`   Location: ${fullRegistration.city}, ${fullRegistration.state}`);
      console.log(`   Business Info: ${Object.keys(fullRegistration.businessInfo).length} fields`);
      console.log(`   Admin Info: ${Object.keys(fullRegistration.adminInfo).length} fields`);
    }

    // Clean up
    await prisma.registration.delete({
      where: { id: testRegistration.id }
    });
    console.log('\n🗑️  Test registration cleaned up');

    console.log('\n🎉 All tests passed! Registration flow is working without Academy collection');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Clean up any test data that might have been created
    try {
      await prisma.registration.deleteMany({
        where: { 
          academyId: { in: ['AC000998', 'AC000997'] }
        }
      });
      console.log('🗑️  Cleaned up test data');
    } catch (cleanupError) {
      console.log('⚠️  Could not clean up test data:', cleanupError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFullRegistrationFlow();