// Normalize old registration data by extracting from nested objects

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function normalizeOldRegistrations() {
  try {
    console.log('🔧 Normalizing old registration data...\n');

    // Find registrations with NULL flat fields but populated nested objects
    const registrationsToFix = await prisma.registration.findMany({
      where: {
        OR: [
          { academyName: null },
          { academyName: "" },
        ]
      }
    });

    console.log(`📊 Found ${registrationsToFix.length} registrations to normalize:`);
    
    for (const reg of registrationsToFix) {
      console.log(`\n🔄 Processing ${reg.userId} (${reg.academyId}):`);
      
      // Extract data from nested objects
      const businessInfo = reg.businessInfo || {};
      const adminInfo = reg.adminInfo || {};
      
      console.log(`   Business Info: ${JSON.stringify(businessInfo, null, 2)}`);
      
      // Prepare normalized data
      const normalizedData = {
        academyName: businessInfo.businessName || "",
        legalEntityName: businessInfo.legalEntityName || "",
        academyEmail: businessInfo.businessEmail || adminInfo.email || "",
        academyPhone: businessInfo.phoneNumber || adminInfo.phone || "",
        industryType: businessInfo.industryType || "",
        servicesOffered: businessInfo.servicesOffered || [],
        studentSize: businessInfo.studentSize || "",
        staffCount: businessInfo.staffCount || "",
        country: businessInfo.country || "",
        state: businessInfo.state || "",
        city: businessInfo.city || "",
        address: businessInfo.address || "",
        website: businessInfo.website || "",
        preferredLanguage: businessInfo.preferredLanguage || "",
      };

      console.log(`   Extracted data:`);
      console.log(`   - Academy Name: "${normalizedData.academyName}"`);
      console.log(`   - Legal Entity: "${normalizedData.legalEntityName}"`);
      console.log(`   - Industry: "${normalizedData.industryType}"`);
      console.log(`   - Services: ${JSON.stringify(normalizedData.servicesOffered)}`);
      console.log(`   - Student Size: "${normalizedData.studentSize}"`);
      console.log(`   - Staff Count: "${normalizedData.staffCount}"`);
      console.log(`   - Location: ${normalizedData.city}, ${normalizedData.state}, ${normalizedData.country}`);

      // Update the registration
      const updated = await prisma.registration.update({
        where: { id: reg.id },
        data: normalizedData
      });

      console.log(`   ✅ Updated registration for ${reg.userId}`);
    }

    // Verify the fix
    console.log('\n📊 Verification - All registrations after normalization:');
    const allRegistrations = await prisma.registration.findMany({
      select: {
        userId: true,
        academyId: true,
        academyName: true,
        industryType: true,
        servicesOffered: true,
        studentSize: true,
        staffCount: true,
        country: true,
        state: true,
        city: true
      },
      orderBy: { userId: 'asc' }
    });

    allRegistrations.forEach((reg, index) => {
      console.log(`\n${index + 1}. ${reg.userId} -> ${reg.academyId}`);
      console.log(`   Academy: ${reg.academyName}`);
      console.log(`   Industry: ${reg.industryType}`);
      console.log(`   Services: ${JSON.stringify(reg.servicesOffered)}`);
      console.log(`   Size: ${reg.studentSize} | Staff: ${reg.staffCount}`);
      console.log(`   Location: ${reg.city}, ${reg.state}, ${reg.country}`);
    });

    console.log('\n🎉 Registration data normalization completed!');

  } catch (error) {
    console.error('❌ Normalization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the normalization
normalizeOldRegistrations();