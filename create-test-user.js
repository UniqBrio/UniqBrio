// Create test user with old registration date to test KYC blocking
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('=== CREATING KYC BLOCKING TEST USER ===\n');

    // Set registration date to September 2, 2025 (16 days ago from September 18, 2025)
    const testRegistrationDate = new Date('2025-09-02T10:00:00.000Z');
    console.log('Test registration date:', testRegistrationDate.toISOString());
    
    const daysSinceRegistration = Math.floor((new Date().getTime() - testRegistrationDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log('Days since registration:', daysSinceRegistration);

    // Hash password for test user
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        userId: 'TEST001',
        academyId: 'AC_TEST001',
        name: 'Test User KYC Blocked',
        email: 'test-kyc-blocked@example.com',
        phone: '+1234567890',
        password: hashedPassword,
        role: 'super_admin',
        verified: true,
        registrationComplete: true,
        kycStatus: 'pending',
        createdAt: testRegistrationDate,
        updatedAt: testRegistrationDate
      }
    });

    // Create corresponding registration record
    const testRegistration = await prisma.registration.create({
      data: {
        userId: 'TEST001',
        academyId: 'AC_TEST001',
        businessInfo: {
          businessName: 'Test Academy for KYC Blocking',
          businessType: 'Educational Institution',
          establishedYear: 2023,
          description: 'Test academy for KYC blocking functionality'
        },
        adminInfo: {
          name: 'Test User KYC Blocked',
          email: 'test-kyc-blocked@example.com',
          phone: '+1234567890',
          role: 'Owner/Administrator'
        },
        preferences: {
          notifications: true,
          theme: 'light'
        },
        createdAt: testRegistrationDate,
        updatedAt: testRegistrationDate
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Password: TestPass123!');
    console.log('🏢 Academy:', testRegistration.businessInfo.businessName);
    console.log('📅 Registration Date:', testUser.createdAt.toISOString());
    console.log('📊 KYC Status:', testUser.kycStatus);
    console.log('⏳ Days since registration:', daysSinceRegistration);

    console.log('\n=== TESTING INSTRUCTIONS ===');
    console.log('1. Login with credentials:');
    console.log('   Email: test-kyc-blocked@example.com');
    console.log('   Password: TestPass123!');
    console.log('');
    console.log('2. Expected behavior:');
    console.log('   - After login, you should be redirected to /kyc-blocked');
    console.log('   - The blocked page should show with KYC upload option');
    console.log('   - Trying to access /dashboard should redirect back to /kyc-blocked');
    console.log('');
    console.log('3. Test URLs:');
    console.log('   - http://localhost:3000/login (login with test credentials)');
    console.log('   - http://localhost:3000/dashboard (should redirect to kyc-blocked)');
    console.log('   - http://localhost:3000/kyc-blocked (should show blocked page)');

    console.log('\n=== TO CLEANUP TEST DATA ===');
    console.log('Run: node cleanup-test-user.js');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Test user already exists. Updating existing user...');
      
      try {
        const updatedUser = await prisma.user.update({
          where: { email: 'test-kyc-blocked@example.com' },
          data: {
            createdAt: testRegistrationDate,
            kycStatus: 'pending',
            registrationComplete: true
          }
        });
        console.log('✅ Existing test user updated with old registration date');
        console.log('📧 Email:', updatedUser.email);
        console.log('🔑 Password: TestPass123! (if unchanged)');
        console.log('📅 Registration Date:', updatedUser.createdAt.toISOString());
      } catch (updateError) {
        console.error('Failed to update existing user:', updateError);
      }
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();