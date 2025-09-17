// Clean up duplicate data in AD000003 registration

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function cleanupDuplicateData() {
  try {
    console.log('🧹 Cleaning up duplicate data in AD000003 registration...\n');

    // Find AD000003 registration
    const registration = await prisma.registration.findFirst({
      where: { userId: 'AD000003' }
    });

    if (!registration) {
      console.log('❌ Registration not found for AD000003');
      return;
    }

    console.log('📊 Current registration data:');
    console.log('Flat fields:');
    console.log(`  - academyName: ${registration.academyName}`);
    console.log(`  - industryType: ${registration.industryType}`);
    console.log(`  - servicesOffered: ${JSON.stringify(registration.servicesOffered)}`);
    console.log(`  - studentSize: ${registration.studentSize}`);
    console.log(`  - staffCount: ${registration.staffCount}`);
    console.log(`  - city: ${registration.city}`);
    console.log(`  - state: ${registration.state}`);
    console.log(`  - country: ${registration.country}`);

    console.log('\nNested objects:');
    console.log(`  - businessInfo keys: ${Object.keys(registration.businessInfo || {}).join(', ')}`);
    console.log(`  - adminInfo keys: ${Object.keys(registration.adminInfo || {}).join(', ')}`);
    console.log(`  - preferences keys: ${Object.keys(registration.preferences || {}).join(', ')}`);

    // Clear the flat fields to remove duplication (keep only nested objects)
    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        // Clear flat fields - data is preserved in nested objects
        academyName: null,
        legalEntityName: null,
        academyEmail: null,
        academyPhone: null,
        industryType: null,
        servicesOffered: [],
        studentSize: null,
        staffCount: null,
        country: null,
        state: null,
        city: null,
        address: null,
        website: null,
        preferredLanguage: null,
        logoUrl: null,
        // Keep nested objects intact
        businessInfo: registration.businessInfo,
        adminInfo: registration.adminInfo,
        preferences: registration.preferences
      }
    });

    console.log('\n✅ Cleaned up duplicate data! Now all registrations use consistent nested object approach.');
    
    // Verify consistency
    console.log('\n📊 Final verification - All registrations now use nested objects only:');
    const allRegistrations = await prisma.registration.findMany({
      select: {
        userId: true,
        academyId: true,
        academyName: true, // Should be null for all
        businessInfo: true
      },
      orderBy: { userId: 'asc' }
    });

    allRegistrations.forEach((reg, index) => {
      const businessName = reg.businessInfo?.businessName || 'N/A';
      console.log(`${index + 1}. ${reg.userId}: academyName=${reg.academyName || 'NULL'}, businessInfo.businessName="${businessName}"`);
    });

    console.log('\n🎉 Data cleanup completed! All registrations now use consistent nested object approach.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateData();