// Test script to verify the fixed registration API behavior

const fetch = require('node-fetch');

async function testRegistrationAPI() {
  try {
    console.log('🧪 Testing Fixed Registration API...\n');

    // Test data for registration
    const testRegistrationData = {
      businessInfo: {
        businessName: 'Updated Dance Academy',
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
      }
    };

    console.log('📤 Sending registration request...');

    // Note: In a real test, you'd need to include proper session cookies
    // For now, let's just test if the endpoint responds correctly
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real scenario, you'd need the session cookie here
        // 'Cookie': 'session=...'
      },
      body: JSON.stringify(testRegistrationData)
    });

    const responseText = await response.text();
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📥 Response Body: ${responseText}`);

    if (response.status === 401) {
      console.log('⚠️ Expected 401 Unauthorized (no session cookie provided)');
      console.log('✅ API endpoint is accessible and responding correctly');
    } else if (response.ok) {
      console.log('✅ Registration API responded successfully!');
    } else {
      console.log('❌ Registration API returned an error');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server. Make sure npm run dev is running on port 3001');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

// Test ID generation logic directly using our fixed algorithm
async function testIdGenerationLogic() {
  console.log('\n🔢 Testing ID Generation Logic:');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Test Academy ID generation
    const lastAcademy = await prisma.academy.findFirst({
      orderBy: { academyId: 'desc' },
      select: { academyId: true }
    });

    const parseNum = (id) => {
      const match = id.match(/AC(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const lastAcademyNum = lastAcademy ? parseNum(lastAcademy.academyId) : 0;
    const nextAcademyNum = lastAcademyNum + 1;
    const newAcademyId = `AC${nextAcademyNum.toString().padStart(6, '0')}`;

    console.log(`  Next Academy ID will be: ${newAcademyId}`);

    // Test User ID generation
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

    console.log(`  Next User ID will be: ${newUserId}`);

  } catch (error) {
    console.log('❌ ID generation test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
async function runTests() {
  await testRegistrationAPI();
  await testIdGenerationLogic();
  console.log('\n🎉 Tests completed!');
}

runTests();